import { Outlet } from 'react-router-dom';
import StatusBar from './StatusBar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useIsMobile } from '../../hooks/useMediaQuery';

export default function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden border-[12px] border-black">
      <StatusBar />
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && <Sidebar />}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 bg-bg">
          {/* Header Marquee Simulation */}
          <div className="border-b border-white/5 py-2 px-8 overflow-hidden whitespace-nowrap text-[10px] font-mono text-brand/60 uppercase tracking-[0.3em]">
            <span className="inline-block animate-flicker">
              PulseMesh Core — No Connection Required — P2P Mesh Network — Secure Node Active — 
              PulseMesh Core — No Connection Required — P2P Mesh Network — Secure Node Active — 
            </span>
          </div>
          <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      {isMobile && <BottomNav />}
    </div>
  );
}
