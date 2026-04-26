export default function Badge({ children, color = 'blue', className = '', dot = false }) {
  const colors = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    red: 'bg-red-500/15 text-red-400 border-red-500/25',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    violet: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    slate: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  };

  const dotColors = {
    blue: 'bg-blue-400',
    red: 'bg-red-400',
    green: 'bg-emerald-400',
    amber: 'bg-amber-400',
    cyan: 'bg-cyan-400',
    violet: 'bg-violet-400',
    slate: 'bg-slate-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[color]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />}
      {children}
    </span>
  );
}
