export default function Badge({ children, color = 'blue', className = '', dot = false }) {
  const colors = {
    blue: 'bg-white/5 text-white border-white/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    green: 'bg-brand/10 text-brand border-brand/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    slate: 'bg-white/5 text-white/40 border-white/10',
  };

  const dotColors = {
    blue: 'bg-white',
    red: 'bg-red-500',
    green: 'bg-brand',
    amber: 'bg-amber-500',
    cyan: 'bg-cyan-500',
    violet: 'bg-violet-500',
    slate: 'bg-white/40',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter border ${colors[color]} ${className}`}>
      {dot && <span className={`w-1 h-1 ${dotColors[color]}`} />}
      {children}
    </span>
  );
}
