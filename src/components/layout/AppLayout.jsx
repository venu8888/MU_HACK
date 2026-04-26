import { Outlet } from 'react-router-dom';
import StatusBar from './StatusBar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useIsMobile } from '../../hooks/useMediaQuery';

export default function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      <StatusBar />
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && <Sidebar />}
        {isMobile && <Sidebar />}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
