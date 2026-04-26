import { Shield, Database, Menu, Activity, Radio, WifiOff, RefreshCw, Terminal } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useEffect, useState } from 'react';

export default function StatusBar() {
  const { messages, lastSyncTime, totalReceived, toggleSidebar } = useAppStore();
  const isMobile = useIsMobile();
  const [syncAgo, setSyncAgo] = useState('0s');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

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

  useEffect(() => {
    if (!lastSyncTime) return;
    const updateTime = () => {
      const seconds = Math.floor((Date.now() - lastSyncTime) / 1000);
      setSyncAgo(`${seconds}s`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  return (
    <div className="bg-black border-b border-white/10 px-4 h-10 flex items-center justify-between text-[9px] font-mono uppercase tracking-widest z-[100]">
      <div className="flex items-center gap-6">
        {isMobile && (
          <button onClick={toggleSidebar} className="text-brand mr-2">
            <Menu size={16} />
          </button>
        )}
        
        <div className="flex items-center gap-2">
          <div className={`status-dot ${isOnline ? 'bg-brand' : 'bg-red-500'}`} />
          <span className={isOnline ? 'text-brand' : 'text-red-500'}>
            {isOnline ? 'LINK_ESTABLISHED' : 'LINK_BROKEN'}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4 text-white/40">
          <div className="flex items-center gap-1.5">
            <Terminal size={10} />
            <span>SESSION_ID: 0x{Math.random().toString(16).slice(2, 6).toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity size={10} />
            <span>LAST_SYNC: {syncAgo}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Database size={10} className="text-white/40" />
          <span className="text-white/60">PKTS_RCVD:</span>
          <span className="text-brand font-black">{totalReceived || 0}</span>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 bg-brand text-black font-black">
          <Shield size={10} />
          <span>MESH_CORE_V1.2</span>
        </div>
      </div>
    </div>
  );
}
