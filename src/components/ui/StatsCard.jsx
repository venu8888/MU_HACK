export default function StatsCard({ label, value, subtext, color = 'blue' }) {
  const colorMap = {
    blue: 'text-white',
    red: 'text-red-500',
    green: 'text-brand',
    cyan: 'text-cyan-500',
    amber: 'text-amber-500',
    violet: 'text-violet-500',
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="p-6 bg-bg flex flex-col justify-between h-32 group hover:bg-white/5 transition-colors cursor-default">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">
          {label}
        </div>
        <div className={`text-4xl font-black tracking-tighter ${c}`}>
          {value}
        </div>
      </div>
      <div>
        <div className="h-0.5 w-8 bg-white/10 group-hover:bg-brand group-hover:w-full transition-all duration-500 mb-2" />
        <div className="text-[9px] font-mono uppercase text-white/20 tracking-widest">
          {subtext}
        </div>
      </div>
    </div>
  );
}
