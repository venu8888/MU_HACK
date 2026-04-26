import React, { useEffect, useRef } from 'react';
import { 
  Shield, Radio, Camera, Zap, RefreshCw, 
  Terminal, Database, Wifi, Info, Bluetooth, BluetoothSearching,
  Cpu, Activity, Target
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useMessageCount } from '../hooks/useMessages';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import SimpleScanner from '../components/sync/SimpleScanner';
import QRExchange from './QRExchange';
import { Capacitor } from '@capacitor/core';

export default function NearbySync() {
  const isNative = Capacitor.isNativePlatform();
  const { 
    syncLogs, webrtcStatus, activePeerCount,
    hostWebRTC, joinWebRTC, processWebRTCAnswer,
    nearbyPeers, autoSyncWithPeer, bridgeConnected,
    blePeers, bleScanning, bleAvailable,
    startBleDiscovery, stopBleDiscovery
  } = useAppStore();
  const messageCount = useMessageCount();
  const [showScanner, setShowScanner] = React.useState(false);
  const [showOfferQR, setShowOfferQR] = React.useState(null);
  const [showAnswerQR, setShowAnswerQR] = React.useState(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [syncLogs]);

  const handleHost = async () => {
    const offer = await hostWebRTC();
    setShowOfferQR(offer);
  };

  const handleScan = () => {
    setShowScanner(true);
  };

  const onScanOffer = async (offerBase64) => {
    setShowScanner(false);
    const answer = await joinWebRTC(offerBase64);
    setShowAnswerQR(answer);
  };

  const onScanAnswer = async (answerBase64) => {
    setShowScanner(false);
    await processWebRTCAnswer(answerBase64);
    setShowOfferQR(null);
  };

  return (
    <div className="space-y-12">
      <div className="border-b border-white/5 pb-8">
        <div className="flex items-center gap-2 text-brand mb-2">
          <Radio size={14} className="animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Mesh_Radar_Console</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase">NODE_RADAR</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          
          {/* ── Status HUD ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10 divide-x divide-white/10">
             <div className="p-6 bg-bg flex flex-col items-center justify-center gap-2 border-b md:border-b-0 border-white/10">
                <Target size={24} className={activePeerCount > 0 ? "text-brand animate-pulse" : "text-white/10"} />
                <span className="text-3xl font-black text-white">{activePeerCount}</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">ACTIVE_LINKS</span>
             </div>
             <div className="p-6 bg-bg flex flex-col items-center justify-center gap-2 border-b md:border-b-0 border-white/10">
                <Database size={24} className="text-white/20" />
                <span className="text-3xl font-black text-white">{messageCount}</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">LOCAL_PKTS</span>
             </div>
             <div className="p-6 bg-bg flex flex-col items-center justify-center gap-2">
                <Activity size={24} className={bridgeConnected ? "text-brand" : "text-white/10"} />
                <span className="text-3xl font-black text-white">{bridgeConnected ? '1' : '0'}</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">BRIDGE_UP</span>
             </div>
          </div>

          {/* ── BLE Bluetooth Radar ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
               <div className="flex items-center gap-2 text-white/40">
                  <Bluetooth size={14} className={bleScanning ? "text-brand animate-pulse" : ""} />
                  <span className="text-[10px] font-black uppercase tracking-widest">RF_SCANNER_BLE</span>
               </div>
               <button 
                  onClick={bleScanning ? stopBleDiscovery : startBleDiscovery}
                  className={`text-[9px] font-black px-3 py-1 border transition-all ${bleScanning ? 'bg-red-500 border-red-500 text-white' : 'border-white/20 text-white hover:border-brand hover:text-brand'}`}
               >
                  {bleScanning ? 'TERM_SCAN' : 'INIT_SCAN'}
               </button>
            </div>
            
            <div className="min-h-[160px] border border-white/5 bg-black/20 flex flex-col p-px gap-px">
               {!bleScanning && blePeers.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-[10px] font-mono text-white/10 uppercase tracking-[0.2em]">Scanner_Idle — No_Nodes_Detected</p>
                  </div>
               )}
               {blePeers.map(peer => (
                  <div key={peer.deviceId} className="flex items-center justify-between bg-bg p-4 border border-white/5 hover:border-brand/40 transition-all group">
                    <div className="flex items-center gap-4">
                       <div className={`w-1.5 h-1.5 rounded-full ${peer.rssi > -60 ? 'bg-brand' : 'bg-amber-500'}`} />
                       <div>
                          <div className="text-xs font-black text-white uppercase tracking-tight">{peer.name || 'UNKNOWN_NODE'}</div>
                          <div className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">
                             RSSI: {peer.rssi}DBM // {peer.deviceId.slice(0,12)}
                          </div>
                       </div>
                    </div>
                    <button 
                       onClick={() => autoSyncWithPeer(peer.deviceId)}
                       className="opacity-0 group-hover:opacity-100 bg-white text-black px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                       FORCE_SYNC
                    </button>
                  </div>
               ))}
            </div>
          </div>

          {/* ── Event Log ── */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-white/40 border-b border-white/5 pb-2">
                <Terminal size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">PROTOCOL_LOG_STREAM</span>
             </div>
             <div className="h-64 overflow-y-auto bg-black/40 border border-white/5 p-6 font-mono text-[9px] space-y-1">
                {syncLogs.length === 0 && <div className="text-white/5 uppercase tracking-[0.3em]">Listening_for_mesh_broadcasts...</div>}
                {syncLogs.map(log => (
                  <div key={log.id} className="flex gap-4 border-b border-white/5 pb-1 opacity-60">
                    <span className="text-white/20 shrink-0">[{log.timestamp}]</span>
                    <span className={log.type === 'success' ? 'text-brand' : log.type === 'error' ? 'text-red-500' : 'text-white'}>
                      {log.message.toUpperCase()}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
             </div>
          </div>
        </div>

        {/* ── Sidebar Actions ── */}
        <div className="lg:col-span-4 space-y-12">
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-brand" /> MESH_INITIATION
              </label>
              <div className="flex flex-col gap-px bg-white/5 border border-white/5">
                 <button 
                    onClick={handleHost}
                    className="p-8 text-left bg-bg hover:bg-white/5 transition-all group flex items-center justify-between"
                 >
                    <div>
                       <div className="text-sm font-black text-white uppercase tracking-widest mb-1">BEACON_MODE</div>
                       <div className="text-[10px] font-mono text-white/40 uppercase">Open_Relay_Channel</div>
                    </div>
                    <Radio className="text-white/20 group-hover:text-brand transition-colors" />
                 </button>
                 <button 
                    onClick={handleScan}
                    className="p-8 text-left bg-bg hover:bg-white/5 transition-all group flex items-center justify-between"
                 >
                    <div>
                       <div className="text-sm font-black text-white uppercase tracking-widest mb-1">CAPTURE_MODE</div>
                       <div className="text-[10px] font-mono text-white/40 uppercase">Target_Nearby_Node</div>
                    </div>
                    <Camera className="text-white/20 group-hover:text-brand transition-colors" />
                 </button>
              </div>
           </div>

           <div className="p-8 border border-white/10 bg-black/40 space-y-6">
              <div className="flex items-center gap-2 text-white/40">
                <Info size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">TOPOLOGY_MAP</span>
              </div>
              <div className="flex items-center justify-between py-4">
                 <div className="w-6 h-6 border-2 border-brand bg-brand animate-pulse" />
                 <div className="flex-1 h-px bg-white/10 mx-2" />
                 <div className="w-6 h-6 border-2 border-white/20" />
                 <div className="flex-1 h-px bg-white/10 mx-2" />
                 <div className="w-6 h-6 border-2 border-white/20" />
              </div>
              <p className="text-[9px] font-mono text-white/20 uppercase tracking-tighter italic">
                Data propagates via Gossip protocol across established links. 100% Peer-to-peer.
              </p>
           </div>
        </div>
      </div>

      {showScanner && (
        <div className="fixed inset-0 z-[200] bg-black p-8 flex flex-col items-center justify-center">
           <button onClick={() => setShowScanner(false)} className="absolute top-12 right-12 text-white/40 hover:text-white"><X size={48} /></button>
           <div className="w-full max-w-lg space-y-8">
              <div className="text-center">
                 <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">INIT_SCAN</h3>
                 <div className="h-1 w-12 bg-brand mx-auto" />
              </div>
              <div className="aspect-square bg-white relative">
                 <SimpleScanner onScan={(val) => {
                    if (showOfferQR) onScanAnswer(val);
                    else onScanOffer(val);
                 }} />
                 {/* Crosshair Overlay */}
                 <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none flex items-center justify-center">
                    <div className="w-full h-full border border-brand/40 relative">
                       <div className="absolute top-1/2 left-0 w-full h-px bg-brand/20" />
                       <div className="absolute top-0 left-1/2 w-px h-full bg-brand/20" />
                    </div>
                 </div>
              </div>
              <button onClick={() => setShowScanner(false)} className="w-full py-4 border border-white/20 text-white font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">ABORT_SCAN</button>
           </div>
        </div>
      )}
    </div>
  );
}
