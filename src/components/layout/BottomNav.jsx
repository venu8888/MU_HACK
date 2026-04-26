import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Radio, QrCode, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/create', icon: AlertTriangle, label: 'Alert' },
  { to: '/sync', icon: Radio, label: 'Sync' },
  { to: '/qr', icon: QrCode, label: 'QR' },
  { to: '/settings', icon: Settings, label: 'More' },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-xl transition-all duration-200
              ${isActive 
                ? 'text-blue-400 nav-active-bottom' 
                : 'text-slate-500 active:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-lg transition-all duration-200 ${isActive ? 'bg-blue-500/10' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
