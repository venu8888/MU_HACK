import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Radio, 
  QrCode, 
  ShieldCheck, 
  Settings,
  Zap,
  X,
  Cpu
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useAppStore } from '../../store/useAppStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'SYSTEM_STATUS' },
  { to: '/create', icon: AlertTriangle, label: 'BROADCAST_SIGNAL' },
  { to: '/sync', icon: Radio, label: 'MESH_NODES' },
  { to: '/qr', icon: QrCode, label: 'OPTICAL_SYNC' },
  { to: '/privacy', icon: ShieldCheck, label: 'SEC_PROTOCOL' },
  { to: '/settings', icon: Settings, label: 'SYS_CONFIG' },
];

export default function Sidebar() {
  const isMobile = useIsMobile();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  // Desktop sidebar only for this minimalistic view
  if (isMobile) {
    return (
      <>
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/90 z-40"
            onClick={toggleSidebar}
          />
        )}
        <aside className={`fixed top-0 left-0 h-full w-full bg-black z-50 transform transition-transform duration-500 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="p-8 flex flex-col h-full">
            <div className="flex justify-between items-center mb-12">
              <div className="text-brand flex items-center gap-2">
                <Cpu size={24} />
                <span className="font-black text-xl tracking-tighter">P_MESH</span>
              </div>
              <button onClick={toggleSidebar} className="text-white"><X size={32} /></button>
            </div>
            <nav className="flex-1 space-y-6">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={toggleSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-4 text-2xl font-black transition-all ${isActive ? 'text-brand' : 'text-white/20'}`
                  }
                >
                  <span className="text-xs opacity-50 font-mono">0{navItems.findIndex(i => i.to === to) + 1}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>
      </>
    );
  }

  return (
    <aside className="w-64 h-full border-r border-white/5 bg-bg flex flex-col shrink-0 relative overflow-hidden">
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="text-brand">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-white">PULSEMESH</h1>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-brand animate-pulse" />
              <span className="text-[8px] font-mono text-brand/60 uppercase tracking-[0.2em]">Local_Encrypted_Link</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        {navItems.map(({ to, icon: Icon, label }, idx) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group flex items-center justify-between px-4 py-3 transition-all border ${isActive ? 'border-brand/40 bg-brand/5 text-brand' : 'border-transparent text-white/40 hover:text-white'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <Icon size={14} className={isActive ? 'text-brand' : 'opacity-40'} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                </div>
                <span className="text-[8px] font-mono opacity-20">[{idx < 9 ? `0${idx + 1}` : idx + 1}]</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5 bg-black/40">
        <div className="space-y-4">
          <div className="flex justify-between items-center text-[9px] font-mono text-white/30 uppercase tracking-widest">
            <span>Terminal_ID</span>
            <span className="text-brand/60">0x{Math.random().toString(16).slice(2, 6).toUpperCase()}</span>
          </div>
          <div className="h-1 bg-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-brand w-2/3 animate-pulse" />
          </div>
          <p className="text-[8px] font-mono text-white/20 leading-tight uppercase tracking-tight">
            Caution: Air-gapped environment. Peer-to-peer relay protocols active.
          </p>
        </div>
      </div>
    </aside>
  );
}
