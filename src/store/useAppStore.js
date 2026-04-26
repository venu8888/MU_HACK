import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, upsertMessage, bulkUpsert, deleteExpired } from '../lib/db';
import { generateMessageId } from '../lib/hash';
import { BloomFilter } from '../lib/bloom';
import { WebRTCManager } from '../lib/webrtc';
import { io } from 'socket.io-client';
import { startBleScanning, stopBleScanning, isBleAvailable } from '../lib/ble';

export const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ── Globals for Non-Serializable State ──────────────────────────
let _bloom = null;
const getBloom = async () => {
  if (_bloom) return _bloom;
  const messages = await db.messages.toArray();
  _bloom = new BloomFilter();
  messages.forEach(m => _bloom.add(String(m.id)));
  return _bloom;
};

// Peer connection manager singleton — initialized on demand
// from the NearbySync page.
let _webrtc = null;
let _socket = null;

// ─────────────────────────────────────────────────────────────────
export const useAppStore = create(
  persist(
    (set, get) => ({
      sessionId: `moe${Math.random().toString(36).substr(2, 15)}`,
      syncLogs: [],
      
      // ── WebRTC State ──
      webrtcStatus: 'disconnected', 
      activePeerCount: 0,
      webrtcError: null,
      
      // ── Discovery State ──
      nearbyPeers: [],
      blePeers: [],       // Devices found via Bluetooth
      bleScanning: false,
      bleAvailable: false,
      bridgeConnected: false,
      assignedIp: null,
      bridgeIp: null,

      // ── Sync stats ──
      lastSyncTime:     null,
      totalSent:        0,
      totalReceived:    0,
      
      // ── QR Return Sync Flow ──
      returnSyncActive: false,
      triggerReturnSync: () => set({ returnSyncActive: true }),
      clearReturnSync: () => set({ returnSyncActive: false }),

      // ── Core Actions ─────────────────────────────────────────────
      
      addLog: (message, type = 'info') => {
        const log = {
          id: Date.now() + Math.random(),
          timestamp: new Date().toLocaleTimeString(),
          message,
          type
        };
        set(state => ({ syncLogs: [log, ...state.syncLogs].slice(0, 50) }));
      },

      addMessage: async (data) => {
        const { sessionId, addLog, forceBroadcast } = get();
        const id = await generateMessageId(data.content, data.type || 'alert');
        
        const message = {
          id,
          origin: sessionId,
          timestamp: Date.now(),
          type: data.type || 'alert',
          content: data.content,
          ttl: data.ttl || DEFAULT_TTL,
          hop_count: 0,
          source: 'local'
        };

        const result = await upsertMessage(message);
        const bloom = await getBloom();
        bloom.add(id);

        addLog(result === 'duplicate' ? `Duplicate suppressed` : `Created: ${message.content.slice(0, 20)}...`, 'success');
        
        // GOSSIP: Send to all connected peers
        if (_webrtc) _webrtc.send({ messages: [message] });
        
        // Also broadcast to local tabs
        await forceBroadcast();
      },

      syncMessages: async (incomingMessages, incomingSource = 'relayed') => {
        const { addLog, activePeerCount } = get();
        const now = Date.now();
        const bloom = await getBloom();

        const valid = incomingMessages.filter(m => (m.timestamp + m.ttl) > now && m.hop_count < 10);
        if (valid.length === 0) return;

        const { imported, updated, duplicates } = await bulkUpsert(valid.map(m => ({
          ...m,
          hop_count: (m.hop_count || 0) + 1,
          source: incomingSource
        })));

        valid.forEach(m => bloom.add(String(m.id)));

        const totalNew = imported + updated;
        if (totalNew > 0) {
          set(s => ({ lastSyncTime: now, totalReceived: s.totalReceived + imported }));
          addLog(`Mesh Sync: ${totalNew} new packets received.`, 'success');
          
          // GOSSIP RELAY: If we found new info, forward it to all OTHER connected peers
          if (_webrtc && activePeerCount > 0) {
             _webrtc.send({ messages: valid });
          }
        }
      },

      // ── WebRTC Actions ───────────────────────────────────────────

      initWebRTC: () => {
        if (_webrtc) return; // Keep existing
        const { sessionId, addLog, bridgeIp } = get();
        _webrtc = new WebRTCManager(sessionId, bridgeIp);
        
        _webrtc.on('connectionStateChange', ({ state, peerCount }) => {
          set({ 
            webrtcStatus: peerCount > 0 ? 'connected' : state,
            activePeerCount: peerCount 
          });
        });

        _webrtc.on('peerConnected', ({ id, count }) => {
          set({ activePeerCount: count, webrtcStatus: 'connected' });
          addLog(`Device ${id.slice(0,8)} linked to mesh. Total: ${count}`, 'success');
        });

        _webrtc.on('peerDisconnected', ({ id, count }) => {
          set({ activePeerCount: count, webrtcStatus: count > 0 ? 'connected' : 'disconnected' });
          addLog(`Device left mesh. Total: ${count}`, 'info');
        });

        _webrtc.on('data', async (data) => {
          if (data.messages) await get().syncMessages(data.messages, 'p2p-mesh');
        });
      },

      hostWebRTC: async () => {
        get().initWebRTC();
        try {
          return await _webrtc.createOffer();
        } catch (err) {
          get().addLog(`Host failed: ${err.message}`, 'error');
        }
      },

      joinWebRTC: async (offer) => {
        get().initWebRTC();
        try {
          return await _webrtc.createAnswer(offer);
        } catch (err) {
          get().addLog(`Join failed: ${err.message}`, 'error');
        }
      },

      processWebRTCAnswer: async (answer) => {
        if (!_webrtc) return;
        await _webrtc.processAnswer(answer);
      },

      // ── Bridge Discovery ─────────────────────────────────────────

      connectToBridge: () => {
        if (_socket) return;
        const { sessionId, addLog } = get();
        _socket = io(window.location.origin);

        _socket.on('connect', () => {
          set({ bridgeConnected: true });
          _socket.emit('join', sessionId);
          addLog('PulseMesh Bridge: Online', 'success');
        });

        _socket.on('assigned_ip', (ip) => set({ assignedIp: ip }));
        _socket.on('bridge_ip', (ip) => {
          set({ bridgeIp: ip });
          addLog(`Bridge identified network IP: ${ip}`, 'info');
        });
        
        _socket.on('peers_update', (peers) => {
          set({ nearbyPeers: peers.filter(p => p !== sessionId) });
        });

        _socket.on('signal', async ({ from, signal }) => {
          const { initWebRTC, sessionId } = get();
          initWebRTC();
          if (signal.type === 'offer') {
            const answer = await _webrtc.createAnswer(signal.data);
            _socket.emit('signal', { to: from, from: sessionId, signal: { type: 'answer', data: answer } });
          } else if (signal.type === 'answer') {
            await _webrtc.processAnswer(signal.data);
          }
        });

        _socket.on('disconnect', () => set({ bridgeConnected: false, nearbyPeers: [] }));
      },

      autoSyncWithPeer: async (peerId) => {
        get().initWebRTC();
        const offer = await _webrtc.createOffer();
        _socket.emit('signal', { to: peerId, from: get().sessionId, signal: { type: 'offer', data: offer } });
      },

      // ── Misc ─────────────────────────────────────────────────────

      forceBroadcast: async () => {
        const { sessionId } = get();
        const messages = await db.messages.toArray();
        localStorage.setItem('pulsemesh_sync_channel', JSON.stringify({
          origin: sessionId,
          timestamp: Date.now(),
          messages: messages.slice(-10) // Only last 10 to keep it light
        }));
      },

      cleanExpired: async () => {
        await deleteExpired();
      },

      // ── BLE Discovery ─────────────────────────────────────────────

      startBleDiscovery: async () => {
        const { addLog, autoSyncWithPeer } = get();
        const available = await isBleAvailable();
        
        if (available === 'disabled') {
          addLog('Bluetooth is turned OFF. Please enable it in your phone settings.', 'error');
          return;
        }

        set({ bleAvailable: available === true });

        if (!available) {
          addLog(`BLE Error: ${available === false ? 'Initialization failed' : available}`, 'error');
          return;
        }

        set({ bleScanning: true, blePeers: [] });
        addLog('BLE Scan started — looking for nearby mesh nodes...', 'info');

        await startBleScanning((peer) => {
          set(state => {
            const existing = state.blePeers.find(p => p.deviceId === peer.deviceId);
            if (existing) return {}; // Already known
            addLog(`BLE Node found: ${peer.name} (Signal: ${peer.rssi} dBm)`, 'success');
            return { blePeers: [...state.blePeers, peer] };
          });
        });
      },

      stopBleDiscovery: async () => {
        await stopBleScanning();
        set({ bleScanning: false });
        get().addLog('BLE scan stopped.', 'info');
      },
    }),
    { name: 'pulsemesh-storage', partialize: (state) => ({ sessionId: state.sessionId }) }
  )
);
