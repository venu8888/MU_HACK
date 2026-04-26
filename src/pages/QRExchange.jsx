import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode, ScanLine, Maximize2, X, AlertTriangle,
  CheckCircle2, Download, History, Database, CheckSquare, Square
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAppStore } from '../store/useAppStore';
import { useMessages }  from '../hooks/useMessages';
import { compressPackets, decompressPackets, splitPayload, parseScannedChunk } from '../lib/qr';

// --- Scanner Component ---
function CameraScanner({ onScan, onError }) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  
  const requestPermission = async () => {
    setIsRequesting(true);
    setErrorMsg('');
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissionGranted(true);
    } catch (err) {
      setErrorMsg(`Camera permission denied. Please allow access in your browser settings. (${err.message})`);
      onError?.(err);
    }
    setIsRequesting(false);
  };

  useEffect(() => {
    let html5QrCode;
    
    if (permissionGranted) {
      const startScanner = async () => {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length) {
            html5QrCode = new Html5Qrcode("qr-reader");
            
            await html5QrCode.start(
              { facingMode: "environment" },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText) => onScan(decodedText),
              (err) => { /* Ignore frequent decode frame errors */ }
            );
          } else {
            setErrorMsg('No cameras found on device.');
          }
        } catch (err) {
          setErrorMsg(`Scanner initialization failed. (${err.message})`);
          onError?.(err);
        }
      };
      
      startScanner();
    }
    
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [permissionGranted, onScan, onError]);

  if (errorMsg) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center text-red-400">
        <AlertTriangle className="mx-auto mb-3" size={32} />
        <p className="text-sm font-semibold">{errorMsg}</p>
        <p className="text-xs text-red-400/70 mt-2">Check browser site settings and allow camera access.</p>
        <Button variant="outline" className="mt-4 border-red-500/30 text-red-400 hover:bg-red-500/20" onClick={requestPermission}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!permissionGranted) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center text-slate-300">
        <ScanLine className="mx-auto mb-4 text-emerald-400" size={48} />
        <h3 className="text-lg font-bold text-white mb-2">Camera Access Required</h3>
        <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
          We need access to your camera to scan QR packet bundles from other devices.
        </p>
        <Button 
          variant="primary" 
          onClick={requestPermission} 
          loading={isRequesting}
          className="w-full max-w-xs"
        >
          Allow Camera Access
        </Button>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-slate-800 w-full max-w-sm mx-auto aspect-square flex items-center justify-center">
      <div id="qr-reader" className="w-full h-full" />
      <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/30 m-8 rounded-xl flex items-center justify-center">
        <div className="w-full h-0.5 bg-emerald-500/50 absolute top-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-scan" />
      </div>
    </div>
  );
}


export default function QRExchange() {
  const { syncMessages } = useAppStore();
  const messages = useMessages(); // reactive IndexedDB-backed list
  const [mode, setMode] = useState('generate'); // 'generate' | 'scan' | 'fullscreen'
  const [history, setHistory] = useState([]);

  const addLog = useCallback((msg, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit' });
    setHistory(prev => [{ time, msg, type }, ...prev].slice(0, 10)); // keep last 10
  }, []);

  // --- Generator State ---
  const [bundleMode, setBundleMode] = useState('personal'); // 'personal' | 'public'
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [qrChunks, setQrChunks] = useState([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [bundleStats, setBundleStats] = useState({ count: 0, size: 0 });

  const toggleSelection = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= 10) return; // Max 10 messages
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Generate QR Chunks
  useEffect(() => {
    async function generate() {
      let filtered = [];
      const priorityScore = { alert: 4, safe_route: 3, medical: 2, news: 1 };
      
      const sorted = [...messages].sort((a, b) => {
        const pA = priorityScore[a.type] || 0;
        const pB = priorityScore[b.type] || 0;
        if (pA !== pB) return pB - pA;
        return b.timestamp - a.timestamp;
      });

      if (selectedIds.size > 0) {
        filtered = sorted.filter(m => selectedIds.has(m.id)).slice(0, 10);
      } else {
        filtered = sorted.slice(0, 10); // Auto-pick top 10
      }

      if (filtered.length === 0) {
        setQrChunks([]);
        setBundleStats({ count: 0, size: 0 });
        return;
      }

      try {
        let finalFiltered = filtered;
        let compressed = compressPackets(finalFiltered);
        
        // SAFE LIMIT truncation (approx 2KB)
        const SAFE_LIMIT = 2000;
        while (compressed.length > SAFE_LIMIT && finalFiltered.length > 1) {
          finalFiltered.pop(); // Remove least priority/oldest
          compressed = compressPackets(finalFiltered);
        }

        if (bundleMode === 'personal') {
          const chunks = splitPayload(compressed);
          setQrChunks(chunks);
          setCurrentChunkIndex(0);
          setBundleStats({ count: finalFiltered.length, size: compressed.length });
          addLog(`Generated personal bundle: ${chunks.length} parts (${finalFiltered.length} msgs)`, 'success');
        } else {
          // Public Drop QR
          const baseURL = window.location.origin;
          const url = `${baseURL}/drop?data=${encodeURIComponent(compressed)}`;
          setQrChunks([url]);
          setCurrentChunkIndex(0);
          setBundleStats({ count: finalFiltered.length, size: url.length });
          addLog(`Generated public drop URL (${finalFiltered.length} msgs)`, 'success');
        }
      } catch (err) {
        addLog(`Failed to generate QR: ${err.message}`, 'error');
      }
    }
    generate();
  }, [bundleMode, addLog, messages, selectedIds]);

  // Auto-Rotate Effect
  useEffect(() => {
    if (!isAutoRotate || qrChunks.length <= 1 || (mode !== 'generate' && mode !== 'fullscreen')) return;
    const interval = setInterval(() => {
      setCurrentChunkIndex(prev => (prev + 1) % qrChunks.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isAutoRotate, qrChunks.length, mode]);


  // --- Scanner State ---
  const [scannedChunks, setScannedChunks] = useState([]);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [importModal, setImportModal] = useState(null); // { newPackets: [], duplicates: Y }
  
  const lastScannedRef = useRef('');

  const handleScan = useCallback((decodedText) => {
    if (decodedText === lastScannedRef.current) return; // Prevent rapid duplicate fires
    lastScannedRef.current = decodedText;
    setTimeout(() => { lastScannedRef.current = ''; }, 1000);

    const result = parseScannedChunk(decodedText, scannedChunks);
    
    if (!result.isPulseMesh) {
      addLog('Invalid QR format. Not a PulseMesh bundle.', 'error');
      return;
    }

    if (result.error) {
      addLog(result.error, 'error');
      return;
    }

    setScannedChunks(result.chunks);
    const collected = result.chunks.filter(c => c !== null).length;
    setScanProgress({ current: collected, total: result.total });

    // Vibrate on successful part scan
    if (navigator.vibrate) navigator.vibrate(50);

    if (result.isComplete && result.fullPayload) {
      addLog(`All ${result.total} parts scanned. Decrypting...`);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Success vibration
      
      try {
        const decompressed = decompressPackets(result.fullPayload);
        analyzeImport(decompressed);
      } catch (err) {
        addLog(`Decryption failed: ${err.message}`, 'error');
        resetScanner();
      }
    }
  }, [scannedChunks, addLog]);

  const analyzeImport = (scannedPackets) => {
    const existingIds = new Set(messages.map(p => p.id));
    
    const newPackets = scannedPackets.filter(p => !existingIds.has(p.id));
    const duplicates = scannedPackets.length - newPackets.length;
    
    setImportModal({
      total: scannedPackets.length,
      newPackets,
      duplicates,
      scannedPackets
    });
  };

  const handleImport = async () => {
    if (!importModal) return;
    try {
      await syncMessages(importModal.scannedPackets, 'qr');
      addLog(`Successfully processed ${importModal.total} messages from QR.`, 'success');
      setImportModal(null);
      resetScanner();
      setMode('generate');
    } catch (err) {
      addLog(`Import error: ${err.message}`, 'error');
    }
  };

  const resetScanner = () => {
    setScannedChunks([]);
    setScanProgress({ current: 0, total: 0 });
    setImportModal(null);
  };

  // --- RENDERERS ---

  if (mode === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
        <Button 
          variant="ghost" 
          icon={X} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          onClick={() => setMode('generate')}
        >
          Close
        </Button>
        <h2 className="text-3xl font-bold text-slate-200 mb-8 tracking-wider uppercase">
          {bundleMode === 'public' ? 'Public Drop URL' : 'PulseMesh Data Transfer'}
        </h2>
        <div className="bg-white p-8 rounded-3xl">
          {qrChunks.length > 0 && (
             <QRCodeSVG 
               value={qrChunks[currentChunkIndex]} 
               size={Math.min(window.innerWidth - 80, window.innerHeight - 300, 600)} 
               level="M" 
             />
          )}
        </div>
        {qrChunks.length > 1 && (
          <div className="mt-8 text-center">
            <Badge color="blue" className="text-xl px-4 py-2">
              Scan Part {currentChunkIndex + 1} of {qrChunks.length}
            </Badge>
            <p className="text-slate-500 mt-4 max-w-sm text-center">
              This is a multi-part transmission. Keep your camera focused as the code rotates automatically.
            </p>
          </div>
        )}
        {bundleMode === 'public' && (
          <p className="text-slate-400 mt-8 text-center max-w-md">
            Scan this with any camera app to import the data packet. No app required.
          </p>
        )}
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

      <div className="flex bg-slate-900/50 p-1 rounded-xl w-full max-w-md mx-auto border border-slate-800/60 mb-6">
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            mode === 'generate' ? 'bg-blue-500/20 text-blue-400 shadow-sm border border-blue-500/20' : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => setMode('generate')}
        >
          Generate Bundle
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            mode === 'scan' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => { setMode('scan'); resetScanner(); }}
        >
          Scan Camera
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAIN PANEL (Gen or Scan) */}
        <div className="lg:col-span-2 space-y-4 animate-fade-in">
          
          {mode === 'generate' && (
            <Card>
              <CardHeader className="flex justify-between items-center">
                <span className="font-semibold text-slate-200">Transmission Display</span>
                <select 
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                  value={bundleMode}
                  onChange={(e) => setBundleMode(e.target.value)}
                >
                  <option value="personal">Share Nearby (Scan inside app)</option>
                  <option value="public">Create Public Drop (Scan with any camera)</option>
                </select>
              </CardHeader>
              <CardBody className="flex flex-col items-center py-8">
                
                {qrChunks.length > 0 ? (
                  <>
                    <div className="bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.15)] relative group cursor-pointer" onClick={() => setMode('fullscreen')}>
                      <QRCodeSVG value={qrChunks[currentChunkIndex]} size={240} level="M" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <Maximize2 className="text-white drop-shadow-md" size={32} />
                      </div>
                    </div>

                    {bundleMode === 'public' && window.location.origin.includes('localhost') && (
                      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-sm w-full flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-[11px] text-amber-400 font-medium leading-tight">
                          ⚠ This QR uses a <span className="font-bold text-amber-300">localhost</span> URL and will not work on other devices. Use your local IP (e.g., 192.168.x.x) instead.
                        </p>
                      </div>
                    )}

                    {qrChunks.length > 1 ? (
                      <div className="w-full max-w-sm mt-8 space-y-4">
                        <div className="flex items-center justify-between">
                          <Button size="sm" variant="outline" onClick={() => { setIsAutoRotate(false); setCurrentChunkIndex(p => (p - 1 + qrChunks.length) % qrChunks.length); }}>Prev</Button>
                          <Badge color="blue" dot={isAutoRotate}>Part {currentChunkIndex + 1} of {qrChunks.length}</Badge>
                          <Button size="sm" variant="outline" onClick={() => { setIsAutoRotate(false); setCurrentChunkIndex(p => (p + 1) % qrChunks.length); }}>Next</Button>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <input type="checkbox" id="autorotate" checked={isAutoRotate} onChange={(e) => setIsAutoRotate(e.target.checked)} className="accent-blue-500" />
                          <label htmlFor="autorotate" className="text-xs text-slate-400">Auto-rotate codes (3s)</label>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6">
                        <Badge color={bundleMode === 'public' ? 'purple' : 'slate'}>
                          {bundleMode === 'public' ? 'Universal URL Drop' : 'Single Part Bundle'}
                        </Badge>
                      </div>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      className="mt-6 w-full max-w-sm border border-slate-800 hover:border-slate-700" 
                      icon={Maximize2}
                      onClick={() => setMode('fullscreen')}
                    >
                      Fullscreen Public Notice Mode
                    </Button>
                  </>
                ) : (
                  <div className="text-center text-slate-500 py-12">
                    <Database size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No messages selected or available.</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {mode === 'generate' && (
            <Card>
              <CardHeader className="flex justify-between items-center">
                <span className="font-semibold text-slate-200">Message Selection (Max 10)</span>
                {selectedIds.size === 0 && <span className="text-xs text-slate-500">Auto-picking top priority</span>}
              </CardHeader>
              <CardBody className="p-0">
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
                  {messages.length === 0 && <div className="p-4 text-center text-sm text-slate-500">No active messages to share</div>}
                  {messages.map(m => (
                    <div 
                      key={m.id} 
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-slate-800/50 ${selectedIds.has(m.id) ? 'bg-slate-800/80' : ''}`}
                      onClick={() => toggleSelection(m.id)}
                    >
                      {selectedIds.has(m.id) ? (
                        <CheckSquare className="text-blue-400" size={18} />
                      ) : (
                        <Square className="text-slate-500" size={18} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">{m.type.toUpperCase()}: {m.content}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">TTL: {Math.max(0, Math.floor(((m.timestamp + m.ttl) - Date.now()) / 60000))} mins</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {mode === 'scan' && (
            <Card>
              <CardHeader><span className="font-semibold text-slate-200">Scanner Lens</span></CardHeader>
              <CardBody className="py-6">
                
                {importModal ? (
                  <div className="text-center space-y-6 max-w-sm mx-auto py-8 animate-slide-up">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="text-emerald-400" size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-100 mb-1">Bundle Decrypted</h3>
                      <p className="text-sm text-slate-400">Found {importModal.total} packets in payload</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">{importModal.newPackets.length}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">New/Updates</div>
                      </div>
                      <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-slate-500">{importModal.duplicates}</div>
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider">Duplicates</div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" className="flex-1" onClick={resetScanner}>Cancel</Button>
                      <Button variant="success" className="flex-1" onClick={handleImport} disabled={importModal.newPackets.length === 0}>
                        {importModal.newPackets.length > 0 ? 'Import Packets' : 'No Action Needed'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <CameraScanner onScan={handleScan} />
                    
                    {scanProgress.total > 0 && (
                      <div className="max-w-sm mx-auto space-y-2 animate-fade-in">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-emerald-400">Multipart Payload</span>
                          <span className="text-slate-400">{scanProgress.current} / {scanProgress.total} parts collected</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-center text-slate-500">Keep scanning as the source QR code rotates.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* SIDE PANEL (Stats & Logs) */}
        <div className="space-y-4">
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardBody className="p-4">
              <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">Bundle Specs</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Packets</span>
                  <span className="text-slate-200 font-mono">{bundleStats.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payload Size</span>
                  <span className="text-slate-200 font-mono">{bundleStats.size}b</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data Chunks</span>
                  <span className="text-slate-200 font-mono">{qrChunks.length}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4 border-b border-slate-800 flex items-center gap-2">
              <History size={16} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-300">Operations Log</span>
            </CardHeader>
            <CardBody className="p-0">
              <div className="h-64 overflow-y-auto p-4 space-y-3 font-mono text-[10px]">
                {history.length === 0 ? (
                  <div className="text-slate-600 text-center py-4">No recent activity</div>
                ) : (
                  history.map((h, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-slate-600 shrink-0">[{h.time}]</span>
                      <span className={h.type === 'error' ? 'text-red-400' : h.type === 'success' ? 'text-emerald-400' : 'text-blue-300'}>
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
