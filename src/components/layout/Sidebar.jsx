import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Radio, 
  QrCode, 
  ShieldCheck, 
  Settings,
  Zap,
  X
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useAppStore } from '../../store/useAppStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/create', icon: AlertTriangle, label: 'Create Alert' },
  { to: '/sync', icon: Radio, label: 'Nearby Sync' },
  { to: '/qr', icon: QrCode, label: 'QR Drops' },
  { to: '/privacy', icon: ShieldCheck, label: 'Privacy' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const isMobile = useIsMobile();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  // Mobile overlay sidebar
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
            onClick={toggleSidebar}
          />
        )}
        
        {/* Slide-out panel */}
        <aside className={`fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-slate-700/50 z-50 transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold gradient-text">PulseMesh X</h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Secure Mesh</p>
              </div>
            </div>
            <button 
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={18} className="text-slate-500" />
            </button>
          </div>
          
          <nav className="p-3 space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={toggleSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside className="w-64 h-full border-r border-slate-700/50 bg-slate-900/60 backdrop-blur-xl flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold gradient-text tracking-tight">PulseMesh X</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Secure Mesh Network</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
              ${isActive 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 nav-active' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`
            }
          >
            <Icon size={18} className="shrink-0 transition-transform group-hover:scale-110" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="glass-card px-3 py-3 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
            <span className="text-xs font-medium text-emerald-400">Mesh Active</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            All data is encrypted and stored locally on your device.
          </p>
        </div>
      </div>
    </aside>
  );
}
