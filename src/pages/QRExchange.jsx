import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode, Maximize2, X, AlertTriangle, History,
  Database, CheckSquare, Square, Smartphone, Share2,
  ArrowLeftRight, Globe, Info, Wifi, Cpu, Layers, Terminal
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAppStore } from '../store/useAppStore';
import { useMessages } from '../hooks/useMessages';
import { compressPackets } from '../lib/qr';
import { buildSyncQRUrl, buildDropQRUrl } from '../lib/sync';

export default function QRExchange() {
  const { sessionId, returnSyncActive, clearReturnSync } = useAppStore();
  const messages = useMessages();
  const [history, setHistory] = useState([]);

  const addLog = useCallback((msg, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHistory(prev => [{ time, msg, type }, ...prev].slice(0, 15));
  }, []);

  const [mode, setMode] = useState('personal'); 
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [qrValue, setQrValue] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [bundleStats, setBundleStats] = useState({ count: 0, size: 0 });

  useEffect(() => {
    if (returnSyncActive) {
      setMode('personal');
      setFullscreen(true);
    }
  }, [returnSyncActive]);

  const toggleSelection = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < 10) next.add(id);
    setSelectedIds(next);
  };

  useEffect(() => {
    async function generate() {
      const priorityScore = { alert: 4, safe_route: 3, medical: 2, news: 1 };
      const sorted = [...messages].sort((a, b) => {
        const pA = priorityScore[a.type] || 0;
        const pB = priorityScore[b.type] || 0;
        return pA !== pB ? pB - pA : b.timestamp - a.timestamp;
      });

      let filtered = selectedIds.size > 0
        ? sorted.filter(m => selectedIds.has(m.id)).slice(0, 10)
        : sorted.slice(0, 5);

      if (filtered.length === 0) {
        setQrValue('');
        setBundleStats({ count: 0, size: 0 });
        return;
      }

      try {
        let compressed = compressPackets(filtered);
        while (compressed.length > 1800 && filtered.length > 1) {
          filtered.pop();
          compressed = compressPackets(filtered);
        }

        let url;
        if (mode === 'personal') {
          url = returnSyncActive ? buildDropQRUrl(compressed, 0) : buildSyncQRUrl(compressed);
        } else {
          const maxHop = Math.max(...filtered.map(m => m.hopCount ?? 0));
          url = buildDropQRUrl(compressed, maxHop);
        }

        setQrValue(url);
        setBundleStats({ count: filtered.length, size: url.length });
        if (!returnSyncActive) {
          addLog(`${mode === 'personal' ? 'Personal sync' : 'Public drop'} QR ready (${url.length}b)`, 'success');
        }
      } catch (err) {
        addLog(`QR generation failed: ${err.message}`, 'error');
      }
    }

    generate();
  }, [mode, messages, selectedIds, sessionId, addLog, returnSyncActive]);

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-8">
        <button 
          onClick={() => { setFullscreen(false); if (returnSyncActive) clearReturnSync(); }}
          className="absolute top-12 right-12 text-white/40 hover:text-white"
        >
          <X size={48} />
        </button>

        <div className="text-center mb-12">
          {returnSyncActive ? (
            <div className="space-y-4">
              <div className="inline-block px-4 py-1 bg-brand text-black font-black text-xs uppercase tracking-widest">
                STEP_02: RESPONSE_REQUIRED
              </div>
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase">SCAN_BACK</h2>
              <p className="text-white/40 text-xs uppercase tracking-widest max-w-xs mx-auto">
                Exchange initiated. Hold your screen for the other node to complete the handshake.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
                {mode === 'personal' ? 'PERS_SYNC' : 'PUB_DROP'}
              </h2>
              <div className="h-1 w-12 bg-brand mx-auto" />
            </div>
          )}
        </div>

        <div className="bg-white p-8 group relative transition-transform duration-500 hover:scale-105">
           {/* Crosshair corners */}
           <div className="absolute -top-4 -left-4 w-12 h-12 border-t-4 border-l-4 border-brand" />
           <div className="absolute -top-4 -right-4 w-12 h-12 border-t-4 border-right-4 border-brand" />
           <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-4 border-l-4 border-brand" />
           <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-4 border-right-4 border-brand" />

          {qrValue ? (
            <QRCodeSVG value={qrValue} size={window.innerWidth > 600 ? 500 : 300} level="M" />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-black font-black uppercase text-xs">NO_DATA</div>
          )}
        </div>

        <div className="mt-12 text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] animate-flicker">
          Transmitting Packet_ID_{Math.random().toString(16).slice(2,10).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="border-b border-white/5 pb-8">
        <div className="flex items-center gap-2 text-brand mb-2">
          <Layers size={14} />
          <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Optical_Interface</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase">SYNC_CORE</h1>
      </div>

      <div className="flex bg-black border border-white/10 p-1 w-full max-w-sm mx-auto">
        <button
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === 'personal' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
          }`}
          onClick={() => setMode('personal')}
        >
          PERS_SYNC
        </button>
        <button
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === 'public' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
          }`}
          onClick={() => setMode('public')}
        >
          PUB_DROP
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="p-8 border border-white/10 bg-black/40 flex flex-col items-center gap-8">
            {qrValue ? (
              <>
                <div className="bg-white p-4 cursor-pointer relative group" onClick={() => setFullscreen(true)}>
                  <QRCodeSVG value={qrValue} size={280} level="M" />
                  <div className="absolute inset-0 bg-brand/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-black font-black text-xs uppercase tracking-widest">EXPAND_FULL</span>
                  </div>
                </div>
                <div className="w-full space-y-4">
                  <div className="border-l-2 border-brand pl-4 py-2">
                    <h4 className="text-white font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Terminal size={14} /> Protocol_Instructions
                    </h4>
                    <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-tighter">
                      1. Target node scans this interface<br/>
                      2. Data packets propagate via deep link<br/>
                      3. Return handshake required for full PERS_SYNC
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-white/20 uppercase tracking-[0.3em] font-black italic">
                WAITING_FOR_DATA_INPUT...
              </div>
            )}
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-2 text-white/40 border-b border-white/5 pb-2">
                <CheckSquare size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">DATA_PACKET_SELECTOR</span>
             </div>
             <div className="grid grid-cols-1 gap-px bg-white/5 border border-white/5 max-h-96 overflow-y-auto">
                {messages.map(m => (
                  <div
                    key={m.id}
                    className={`flex items-center gap-4 p-4 cursor-pointer transition-all bg-bg ${selectedIds.has(m.id) ? 'bg-white/5' : 'hover:bg-white/5 opacity-60'}`}
                    onClick={() => toggleSelection(m.id)}
                  >
                    <div className={`w-3 h-3 border ${selectedIds.has(m.id) ? 'bg-brand border-brand' : 'border-white/20'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-black text-white uppercase truncate tracking-tight">
                        {m.type}: {m.content}
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
           <div className="p-6 border border-white/10 bg-black/40 space-y-6">
              <div className="flex items-center gap-2 text-white/40">
                <Cpu size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">SYNC_METRICS</span>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] text-white/20 uppercase">Packet_Count</span>
                    <span className="text-2xl font-black text-white">{bundleStats.count}</span>
                 </div>
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] text-white/20 uppercase">Data_Payload</span>
                    <span className="text-2xl font-black text-brand">{bundleStats.size}B</span>
                 </div>
                 <div className="h-px bg-white/5" />
                 <div className="flex items-center gap-2 text-[9px] text-white/30 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
                    Secure_Tunnel_Active
                 </div>
              </div>
           </div>

           <div className="p-6 border border-white/10 bg-black/40 space-y-4">
              <div className="flex items-center gap-2 text-white/40">
                <History size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">OP_LOG_STREAM</span>
              </div>
              <div className="h-64 overflow-y-auto space-y-2 font-mono text-[9px]">
                {history.map((h, i) => (
                  <div key={i} className="flex gap-2 border-b border-white/5 pb-1">
                    <span className="text-white/20 shrink-0">[{h.time}]</span>
                    <span className={h.type === 'success' ? 'text-brand' : 'text-white/60 uppercase'}>
                      {h.msg}
                    </span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
