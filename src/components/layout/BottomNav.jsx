import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Radio, QrCode, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'STAT' },
  { to: '/create', icon: AlertTriangle, label: 'INJT' },
  { to: '/sync', icon: Radio, label: 'RADR' },
  { to: '/qr', icon: QrCode, label: 'SYNC' },
  { to: '/settings', icon: Settings, label: 'CFG' },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[150] bg-black border-t border-white/10 safe-area-bottom h-16">
      <div className="flex items-center justify-around h-full">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all ${
                isActive ? 'text-brand' : 'text-white/20'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute top-0 w-8 h-0.5 bg-brand" />}
                <Icon size={18} />
                <span className="text-[9px] font-black uppercase tracking-widest font-mono">
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
