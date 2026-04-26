import React, { useEffect, useRef } from 'react';
import { 
  Shield, Radio, Camera, Zap, RefreshCw, 
  Terminal, Database, Wifi, Info, Bluetooth, BluetoothSearching
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <Shield className="text-emerald-400 w-8 h-8" />
          Tactical Mesh Console
        </h1>
        <p className="text-slate-500 mt-2">Serverless P2P Gossip Protocol Management</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* ── Status HUD ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardBody className="py-4 text-center">
                <Wifi size={24} className={activePeerCount > 0 ? "mx-auto text-emerald-400 animate-pulse" : "mx-auto text-slate-600"} />
                <div className="text-2xl font-black text-white mt-2">{activePeerCount}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Active Mesh Links</div>
              </CardBody>
            </Card>
            
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardBody className="py-4 text-center">
                <Database size={24} className="mx-auto text-blue-400" />
                <div className="text-2xl font-black text-white mt-2">{messageCount}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Local Packets</div>
              </CardBody>
            </Card>

            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardBody className="py-4 text-center">
                <Zap size={24} className={bridgeConnected ? "mx-auto text-amber-400" : "mx-auto text-slate-600"} />
                <div className="text-2xl font-black text-white mt-2">{bridgeConnected ? 'Online' : 'Offline'}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Bridge Status</div>
              </CardBody>
            </Card>
          </div>

          {/* ── BLE Bluetooth Radar ── */}
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {bleScanning 
                  ? <BluetoothSearching className="w-5 h-5 text-purple-400 animate-pulse" />
                  : <Bluetooth className="w-5 h-5 text-purple-400" />
                }
                <h3 className="font-bold text-purple-400">Bluetooth Radar</h3>
                {bleScanning && (
                  <span className="text-[10px] uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    Scanning...
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                onClick={bleScanning ? stopBleDiscovery : startBleDiscovery}
              >
                {bleScanning ? 'Stop' : 'Start Scan'}
              </Button>
            </CardHeader>
            <CardBody>
              {!bleScanning && blePeers.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4 italic">
                  {!isNative 
                    ? 'Bluetooth not available in browser. Install as Android app for BLE discovery.' 
                    : bleAvailable === false 
                      ? 'Bluetooth permissions required. Tap Start Scan to allow.'
                      : 'Start scan to detect nearby mesh nodes automatically.'}
                </p>
              )}
              {blePeers.length > 0 && (
                <div className="space-y-2">
                  {blePeers.map(peer => (
                    <div key={peer.deviceId} className="flex items-center justify-between bg-purple-500/5 border border-purple-500/20 p-3 rounded-xl">
                      <div>
                        <div className="text-sm font-semibold text-slate-200">{peer.name}</div>
                        <div className="text-[10px] text-purple-400 font-mono">
                          Signal: {peer.rssi} dBm · {peer.rssi > -60 ? '🟢 Close' : peer.rssi > -80 ? '🟡 Medium' : '🔴 Far'}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-500/30 text-purple-400"
                        icon={RefreshCw}
                        onClick={() => autoSyncWithPeer(peer.deviceId)}
                      >
                        Sync
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* ── Mesh Actions ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="hover:border-emerald-500/40 transition-colors">
              <CardHeader>
                <h3 className="font-bold text-emerald-400 flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  Beacon Mode
                </h3>
              </CardHeader>
              <CardBody>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500" onClick={handleHost}>
                  Open Sync Channel
                </Button>
              </CardBody>
            </Card>

            <Card className="hover:border-blue-500/40 transition-colors">
              <CardHeader>
                <h3 className="font-bold text-blue-400 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Intercept Mode
                </h3>
              </CardHeader>
              <CardBody>
                <Button className="w-full bg-blue-600 hover:bg-blue-500" onClick={handleScan}>
                  Scan Nearby Device
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* ── Discovery (Auto) ── */}
          {nearbyPeers.length > 0 && (
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardHeader className="pb-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400">Automatic Discovery Active</span>
              </CardHeader>
              <CardBody className="space-y-2">
                {nearbyPeers.map(id => (
                  <div key={id} className="flex items-center justify-between bg-slate-900/80 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-xs font-mono text-slate-300">Peer: {id.slice(0, 12)}...</span>
                    <Button size="sm" variant="primary" icon={RefreshCw} onClick={() => autoSyncWithPeer(id)}>Sync</Button>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {/* ── Event Log ── */}
          <Card className="bg-black/40 border-slate-800">
            <CardHeader className="flex items-center justify-between border-b border-slate-800/50 pb-2">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mesh Event Log</span>
              </div>
            </CardHeader>
            <CardBody className="h-64 overflow-y-auto font-mono text-[11px] p-4 space-y-1">
              {syncLogs.length === 0 && <div className="text-slate-600 italic">No mesh activity detected...</div>}
              {syncLogs.map(log => (
                <div key={log.id} className="flex gap-3">
                  <span className="text-slate-600">[{log.timestamp}]</span>
                  <span className={log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-rose-400' : 'text-slate-300'}>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </CardBody>
          </Card>
        </div>

        {/* ── Sidebar: QR Overlay / Helpers ── */}
        <div className="space-y-6">
          {showOfferQR && (
            <Card className="border-emerald-500/40 bg-emerald-500/5 animate-in zoom-in-95">
              <CardHeader className="text-center">
                <h3 className="font-bold text-emerald-400">Pending Offer</h3>
                <p className="text-[10px] text-slate-500">Scan this with the "Join" device</p>
              </CardHeader>
              <CardBody className="flex flex-col items-center gap-4">
                <QRExchange initialPayload={showOfferQR} />
                <Button variant="outline" size="sm" onClick={() => setShowScanner(true)}>Scan Answer Back</Button>
              </CardBody>
            </Card>
          )}

          {showAnswerQR && (
            <Card className="border-blue-500/40 bg-blue-500/5 animate-in zoom-in-95">
              <CardHeader className="text-center">
                <h3 className="font-bold text-blue-400">Handshake Answer</h3>
                <p className="text-[10px] text-slate-500">Show this to the "Host" device</p>
              </CardHeader>
              <CardBody className="flex flex-col items-center">
                <QRExchange initialPayload={showAnswerQR} />
              </CardBody>
            </Card>
          )}

          {showScanner && (
            <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
              <div className="max-w-sm w-full space-y-4">
                <h3 className="text-xl font-bold text-white text-center">Scan P2P Handshake</h3>
                <div className="aspect-square bg-slate-900 rounded-2xl overflow-hidden border-2 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                  <SimpleScanner onScan={(val) => {
                    if (showOfferQR) onScanAnswer(val);
                    else onScanOffer(val);
                  }} />
                </div>
                <Button className="w-full" variant="outline" onClick={() => setShowScanner(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold uppercase text-slate-400">Mesh Topology</span>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-white border border-slate-700">A</div>
                <div className="flex-1 h-[1px] bg-emerald-500/30 dashed-border"></div>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]">B</div>
                <div className="flex-1 h-[1px] bg-blue-500/30 dashed-border"></div>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-white border border-slate-700">C</div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed italic text-center">
                Gossip data propagates automatically across links.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
