import { Shield, Database, Menu, Activity, Radio, WifiOff, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useEffect, useState } from 'react';

export default function StatusBar() {
  const { messages, lastSyncTime, totalReceived, toggleSidebar } = useAppStore();
  const isMobile = useIsMobile();
  const [syncAgo, setSyncAgo] = useState('Never');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  // ── Track browser online/offline status ──────────────────────────────────
  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ── Listen for SW update events ──────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkForWaiting = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.waiting) setShowUpdateBanner(true);
    };

    // Check on mount in case SW already waiting
    checkForWaiting();

    // Also listen for future update discoveries
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return;
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowUpdateBanner(true);
          }
        });
      });
    });
  }, []);

  const handleApplyUpdate = async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdateBanner(false);
  };

  // ── Live "last sync" ticker ───────────────────────────────────────────────
  useEffect(() => {
    if (!lastSyncTime) return;
    const updateTime = () => {
      const seconds = Math.floor((Date.now() - lastSyncTime) / 1000);
      setSyncAgo(`${seconds}s ago`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  return (
    <>
      {/* ── Offline warning banner ── */}
      {!isOnline && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-center gap-2 text-amber-400 text-xs font-medium animate-fade-in">
          <WifiOff size={12} />
          <span>Offline mode — app running from local cache. Mesh sync still active.</span>
        </div>
      )}

      {/* ── SW update available banner ── */}
      {showUpdateBanner && (
        <div className="bg-blue-500/15 border-b border-blue-500/30 px-4 py-1.5 flex items-center justify-center gap-3 text-blue-300 text-xs font-medium animate-fade-in">
          <RefreshCw size={12} className="animate-spin" />
          <span>New version available</span>
          <button
            onClick={handleApplyUpdate}
            className="px-2 py-0.5 rounded bg-blue-500/30 border border-blue-500/40 hover:bg-blue-500/50 transition-colors font-semibold"
          >
            Update Now
          </button>
        </div>
      )}

      {/* ── Main header ── */}
      <header className="h-14 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-4 z-50 sticky top-0">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu size={20} className="text-slate-400" />
            </button>
          )}

          {/* Network / Offline Status indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-500 ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {isOnline ? (
              <Radio size={13} className="animate-pulse" />
            ) : (
              <WifiOff size={13} />
            )}
            <span className="hidden sm:inline">
              {isOnline ? '📡 Local Network Active' : '📵 Offline — Mesh Only'}
            </span>
            <span className="sm:hidden">{isOnline ? 'Active' : 'Offline'}</span>
          </div>

          {/* Device URL / Copy Button */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/60 text-slate-300 border border-slate-700/40">
            <span className="opacity-60">{window.location.origin}</span>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.origin)}
              className="hover:text-emerald-400 transition-colors ml-1 border-l border-slate-700 pl-2"
              title="Copy Device URL"
            >
              Copy
            </button>
          </div>

          {/* Sync Info */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/60 text-slate-300 border border-slate-700/40">
            <Activity size={13} className="text-blue-400" />
            <span>Last sync: {lastSyncTime ? syncAgo : 'Never'}</span>
          </div>
        </div>

        {/* Center - Brand (desktop only) */}
        {!isMobile && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              <span className="gradient-text">PulseMesh</span>
              <span className="text-slate-500 ml-1">X</span>
            </span>
          </div>
        )}

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Messages Received */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40" title="Total messages received from sync">
            <Database size={13} className="text-cyan-400" />
            <span className="text-xs font-medium text-slate-300">
              <span className="hidden sm:inline">Messages received: </span>
              <span className="font-mono">{totalReceived || 0}</span>
            </span>
          </div>

          {/* SW / Offline badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
            isOnline
              ? 'bg-blue-500/10 border-blue-500/20'
              : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <Shield size={13} className={isOnline ? 'text-blue-400' : 'text-amber-400'} />
            <span className={`text-xs font-medium ${isOnline ? 'text-blue-400' : 'text-amber-400'}`}>
              {isOnline ? 'Offline P2P' : 'Cached'}
            </span>
          </div>
        </div>
      </header>
    </>
  );
}
