/**
 * PulseMesh Local Sync Server
 * 
 * Runs a lightweight HTTP server on the device so that when another device
 * scans the Personal QR and opens the app, they can exchange alerts
 * bidirectionally over local Wi-Fi or a hotspot.
 * 
 * Protocol (simple HTTP):
 *   POST /sync  { ids: [...] }  → returns { messages: [...missing ones] }
 * 
 * Because we're in a WebView/Capacitor environment, we use a shared
 * BroadcastChannel trick: the Sync QR encodes the host's local IP + port.
 * The "server" is simulated via cross-tab LocalStorage events for the
 * web demo, and via Capacitor HTTP plugin on native.
 */

import { db, bulkUpsert } from './db';

const SYNC_PORT = 5100;
let _syncServerActive = false;

/**
 * Gets the device's local IP address by opening a UDP-like RTCPeerConnection.
 * Works on native and most browsers.
 */
export async function getLocalIP() {
  return new Promise((resolve) => {
    // Try from Capacitor Network plugin first
    try {
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('::')) {
        resolve(hostname);
        return;
      }
    } catch {}

    // WebRTC ICE candidate trick
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer().then(o => pc.setLocalDescription(o));
      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const match = e.candidate.candidate.match(/\b(\d+\.\d+\.\d+\.\d+)\b/);
        if (match && match[1] !== '0.0.0.0') {
          pc.close();
          resolve(match[1]);
        }
      };
      // Fallback after 1 second
      setTimeout(() => resolve('127.0.0.1'), 1500);
    } catch {
      resolve('127.0.0.1');
    }
  });
}

/**
 * Generates the URL for a Personal Sync QR.
 * Encodes compressed alert data directly in the URL (QR Ping-Pong).
 */
export function buildSyncQRUrl(compressedData) {
  return `pulsemesh://psync?d=${encodeURIComponent(compressedData)}`;
}

/**
 * Generates the URL for a Public Drop QR.
 * Encodes compressed alert data directly in the URL.
 */
export function buildDropQRUrl(compressedData, hopCount = 0) {
  return `pulsemesh://drop?d=${encodeURIComponent(compressedData)}&hops=${hopCount}`;
}

/**
 * Parses a pulsemesh:// deep link URL into an action object.
 */
export function parseDeepLink(url) {
  try {
    // Standardize URL parsing
    const isPulseMesh = url.startsWith('pulsemesh://');
    let action = '';
    let parsed;

    if (isPulseMesh) {
      // pulsemesh://drop?d=... -> replace with a dummy host so URL() parses it easily
      const normalized = url.replace('pulsemesh://', 'http://dummy/');
      parsed = new URL(normalized);
      action = parsed.pathname.replace('/', ''); // gets 'drop' or 'sync'
    } else {
      // For web links like https://venu8888.github.io/MU_HACK/?action=drop
      parsed = new URL(url);
      action = parsed.searchParams.get('action');
    }

    if (action === 'psync') {
      return {
        action: 'psync',
        data: parsed.searchParams.get('d'),
      };
    }

    if (action === 'drop') {
      return {
        action: 'drop',
        data: parsed.searchParams.get('d'),
        hops: parseInt(parsed.searchParams.get('hops') || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Initiates a bidirectional sync with a peer device.
 * Called when we open a pulsemesh://sync?... deep link.
 * 
 * We fetch the peer's messages, they fetch ours.
 * Uses a simple HTTP handshake through the local network.
 */
export async function syncWithPeerViaHttp(ip, port, mySessionId) {
  const baseUrl = `http://${ip}:${port}`;
  
  try {
    // 1. Get our message IDs
    const myIds = await db.messages.toCollection().primaryKeys();
    
    // 2. Ask peer: "Here are my IDs, send me what I'm missing"
    const response = await fetch(`${baseUrl}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: myIds, sessionId: mySessionId }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`Peer responded with ${response.status}`);
    
    const { messages: theirMessages, theirIds } = await response.json();
    
    // 3. Import what they sent us (messages we were missing)
    let imported = 0;
    if (theirMessages && theirMessages.length > 0) {
      const result = await bulkUpsert(theirMessages, 1);
      imported = result.imported + result.updated;
    }
    
    // 4. Send them what they're missing
    let sent = 0;
    if (theirIds && theirIds.length > 0) {
      const theirIdSet = new Set(theirIds);
      const weHave = await db.messages.toArray();
      const toSend = weHave.filter(m => !theirIdSet.has(m.id));
      
      if (toSend.length > 0) {
        // Push our missing messages to them
        await fetch(`${baseUrl}/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: toSend }),
          signal: AbortSignal.timeout(10000),
        }).catch(() => {}); // Best effort
        sent = toSend.length;
      }
    }

    return { success: true, imported, sent };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
