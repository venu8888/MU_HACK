import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode, Maximize2, X, AlertTriangle, History,
  Database, CheckSquare, Square, Smartphone, Share2,
  ArrowLeftRight, Globe, Info, Wifi
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAppStore } from '../store/useAppStore';
import { useMessages } from '../hooks/useMessages';
import { compressPackets } from '../lib/qr';
import { buildSyncQRUrl, buildDropQRUrl, getLocalIP } from '../lib/sync';

export default function QRExchange() {
  const { sessionId } = useAppStore();
  const messages = useMessages();
  const [history, setHistory] = useState([]);

  const addLog = useCallback((msg, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHistory(prev => [{ time, msg, type }, ...prev].slice(0, 15));
  }, []);

  // --- QR Mode ---
  const [mode, setMode] = useState('personal'); // 'personal' | 'public'
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [qrValue, setQrValue] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [bundleStats, setBundleStats] = useState({ count: 0, size: 0 });
  const [localIP, setLocalIP] = useState('detecting...');

  // Detect local IP on mount
  useEffect(() => {
    getLocalIP().then(ip => {
      setLocalIP(ip);
      addLog(`Local IP detected: ${ip}`, 'info');
    });
  }, [addLog]);

  const toggleSelection = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < 10) next.add(id);
    setSelectedIds(next);
  };

  // --- Generate QR ---
  useEffect(() => {
    async function generate() {
      const priorityScore = { alert: 4, safe_route: 3, medical: 2, news: 1 };
      const sorted = [...messages].sort((a, b) => {
        const pA = priorityScore[a.type] || 0;
        const pB = priorityScore[b.type] || 0;
        return pA !== pB ? pB - pA : b.timestamp - a.timestamp;
      });

      if (mode === 'personal') {
        // Personal QR: just encode session ID + local IP
        // The other device connects to us and we exchange Bloom filters
        const url = buildSyncQRUrl(sessionId, localIP);
        setQrValue(url);
        setBundleStats({ count: messages.length, size: url.length });
        if (localIP !== 'detecting...') {
          addLog(`Personal sync QR ready — ${messages.length} alerts available`, 'success');
        }
        return;
      }

      // Public Drop: encode compressed alerts in the URL
      let filtered = selectedIds.size > 0
        ? sorted.filter(m => selectedIds.has(m.id)).slice(0, 10)
        : sorted.slice(0, 5); // Default to top 5 for size reasons

      if (filtered.length === 0) {
        setQrValue('');
        setBundleStats({ count: 0, size: 0 });
        return;
      }

      try {
        let compressed = compressPackets(filtered);

        // Keep trimming until it fits in a scannable QR (<2KB)
        while (compressed.length > 1800 && filtered.length > 1) {
          filtered.pop();
          compressed = compressPackets(filtered);
        }

        const maxHop = Math.max(...filtered.map(m => m.hopCount ?? 0));
        const url = buildDropQRUrl(compressed, maxHop);
        setQrValue(url);
        setBundleStats({ count: filtered.length, size: url.length });
        addLog(`Public drop QR: ${filtered.length} alerts encoded (${url.length}b)`, 'success');
      } catch (err) {
        addLog(`QR generation failed: ${err.message}`, 'error');
      }
    }

    generate();
  }, [mode, messages, selectedIds, sessionId, localIP, addLog]);

  // --- Fullscreen view ---
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 gap-6">
        <Button
          variant="ghost"
          icon={X}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          onClick={() => setFullscreen(false)}
        >
          Close
        </Button>

        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold text-white tracking-wide">
            {mode === 'personal' ? '🔗 Personal Sync QR' : '📡 Public Drop QR'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'personal'
              ? 'Scan with camera to sync alerts with this device'
              : 'Scan with any camera to import these alerts'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-2xl">
          {qrValue ? (
            <QRCodeSVG
              value={qrValue}
              size={Math.min(window.innerWidth - 80, window.innerHeight - 280, 480)}
              level="M"
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-slate-500 text-sm">
              No alerts to encode
            </div>
          )}
        </div>

        <div className="text-center space-y-2 max-w-xs">
          {mode === 'personal' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
              <Wifi className="inline mr-1" size={12} />
              Both devices must be on the <strong>same Wi-Fi or hotspot</strong>
            </div>
          )}
          {mode === 'public' && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-300">
              <Globe className="inline mr-1" size={12} />
              Any phone camera can scan this — no app needed to scan, but app needed to open
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl relative">
      <PageHeader
        title="QR Packet Drop"
        subtitle="Air-gapped mesh transmission via QR codes"
        icon={QrCode}
      />

      {/* Mode Toggle */}
      <div className="flex bg-slate-900/50 p-1 rounded-xl w-full max-w-md mx-auto border border-slate-800/60">
        <button
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            mode === 'personal'
              ? 'bg-blue-500/20 text-blue-400 shadow-sm border border-blue-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setMode('personal')}
        >
          <ArrowLeftRight size={14} />
          Personal Sync
        </button>
        <button
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            mode === 'public'
              ? 'bg-purple-500/20 text-purple-400 shadow-sm border border-purple-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setMode('public')}
        >
          <Globe size={14} />
          Public Drop
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* MAIN QR PANEL */}
        <div className="lg:col-span-2 space-y-4">

          {/* QR Display */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {mode === 'personal'
                  ? <><ArrowLeftRight size={16} className="text-blue-400" /><span className="font-semibold text-slate-200">Personal Sync QR</span></>
                  : <><Globe size={16} className="text-purple-400" /><span className="font-semibold text-slate-200">Public Drop QR</span></>
                }
              </div>
              <Button size="sm" variant="ghost" icon={Maximize2} onClick={() => setFullscreen(true)}>
                Fullscreen
              </Button>
            </CardHeader>
            <CardBody className="flex flex-col items-center py-8 gap-6">
              {qrValue ? (
                <>
                  <div
                    className="bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.15)] cursor-pointer group relative"
                    onClick={() => setFullscreen(true)}
                  >
                    <QRCodeSVG value={qrValue} size={220} level="M" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                      <Maximize2 className="text-white" size={28} />
                    </div>
                  </div>

                  {/* Instructions */}
                  {mode === 'personal' ? (
                    <div className="max-w-sm w-full space-y-3">
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                        <h4 className="text-blue-400 font-semibold text-sm mb-2 flex items-center gap-2">
                          <Smartphone size={14} />
                          How to use Personal Sync
                        </h4>
                        <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                          <li>Open camera on the <strong className="text-white">other phone</strong></li>
                          <li>Point it at this QR code</li>
                          <li>Tap the link to open PulseMesh</li>
                          <li>Both devices will <strong className="text-white">automatically exchange</strong> missing alerts</li>
                        </ol>
                      </div>
                      <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                        <Wifi size={14} className="text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-400">
                          Both phones must be on the <strong>same Wi-Fi or hotspot</strong> (IP: <span className="font-mono">{localIP}</span>)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-sm w-full space-y-3">
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                        <h4 className="text-purple-400 font-semibold text-sm mb-2 flex items-center gap-2">
                          <Globe size={14} />
                          How to use Public Drop
                        </h4>
                        <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                          <li>Open camera on <strong className="text-white">any phone</strong></li>
                          <li>Point it at this QR code</li>
                          <li>PulseMesh opens and <strong className="text-white">auto-imports</strong> the alerts</li>
                          <li>Works <strong className="text-white">globally</strong> — no Wi-Fi needed</li>
                        </ol>
                      </div>
                      <div className="flex items-start gap-2 bg-slate-500/5 border border-slate-700 rounded-xl p-3">
                        <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-500">
                          No in-app camera scanner needed. Your phone's native camera handles it.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-slate-500 py-12">
                  <Database size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No messages to encode</p>
                  <p className="text-xs mt-1">Create some alerts first, then come back here.</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Message Selection (Public mode only) */}
          {mode === 'public' && (
            <Card>
              <CardHeader className="flex justify-between items-center">
                <span className="font-semibold text-slate-200">Select Alerts to Broadcast (Max 10)</span>
                {selectedIds.size === 0 && <span className="text-xs text-slate-500">Auto-picking top priority</span>}
              </CardHeader>
              <CardBody className="p-0">
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
                  {messages.length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-500">No active messages to share</div>
                  )}
                  {messages.map(m => (
                    <div
                      key={m.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-slate-800/50 ${selectedIds.has(m.id) ? 'bg-slate-800/80' : ''}`}
                      onClick={() => toggleSelection(m.id)}
                    >
                      {selectedIds.has(m.id)
                        ? <CheckSquare className="text-purple-400 shrink-0" size={16} />
                        : <Square className="text-slate-500 shrink-0" size={16} />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">
                          {m.type.toUpperCase()}: {m.content}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{m.hopCount ?? 0} hops</span>
                          <span>·</span>
                          <span>TTL: {Math.max(0, Math.floor(((m.timestamp + m.ttl) - Date.now()) / 60000))} min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* SIDE PANEL */}
        <div className="space-y-4">
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardBody className="p-4">
              <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">Bundle Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mode</span>
                  <Badge color={mode === 'personal' ? 'blue' : 'purple'}>
                    {mode === 'personal' ? 'Peer Sync' : 'Public Drop'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Alerts</span>
                  <span className="text-slate-200 font-mono">{bundleStats.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">QR Size</span>
                  <span className="text-slate-200 font-mono">{bundleStats.size}b</span>
                </div>
                {mode === 'personal' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Your IP</span>
                    <span className="text-emerald-400 font-mono text-[11px]">{localIP}</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Operations Log */}
          <Card>
            <CardHeader className="py-3 px-4 border-b border-slate-800 flex items-center gap-2">
              <History size={16} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-300">Operations Log</span>
            </CardHeader>
            <CardBody className="p-0">
              <div className="h-72 overflow-y-auto p-4 space-y-3 font-mono text-[10px]">
                {history.length === 0 ? (
                  <div className="text-slate-600 text-center py-4">No recent activity</div>
                ) : (
                  history.map((h, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-slate-600 shrink-0">[{h.time}]</span>
                      <span className={
                        h.type === 'error' ? 'text-red-400' :
                        h.type === 'success' ? 'text-emerald-400' :
                        'text-blue-300'
                      }>
                        {h.msg}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
