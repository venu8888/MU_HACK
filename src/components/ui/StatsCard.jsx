import Card from '../ui/Card';

export default function StatsCard({ icon: Icon, label, value, subtext, color = 'blue', trend }) {
  const colorMap = {
    blue: { bg: 'from-blue-500/15 to-blue-600/5', border: 'border-blue-500/20', icon: 'text-blue-400', glow: 'shadow-blue-500/10' },
    red: { bg: 'from-red-500/15 to-red-600/5', border: 'border-red-500/20', icon: 'text-red-400', glow: 'shadow-red-500/10' },
    green: { bg: 'from-emerald-500/15 to-emerald-600/5', border: 'border-emerald-500/20', icon: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
    cyan: { bg: 'from-cyan-500/15 to-cyan-600/5', border: 'border-cyan-500/20', icon: 'text-cyan-400', glow: 'shadow-cyan-500/10' },
    amber: { bg: 'from-amber-500/15 to-amber-600/5', border: 'border-amber-500/20', icon: 'text-amber-400', glow: 'shadow-amber-500/10' },
    violet: { bg: 'from-violet-500/15 to-violet-600/5', border: 'border-violet-500/20', icon: 'text-violet-400', glow: 'shadow-violet-500/10' },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <Card hover className="animate-slide-up">
      <div className={`p-4 bg-gradient-to-br ${c.bg} rounded-2xl`}>
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.bg} border ${c.border} flex items-center justify-center shadow-lg ${c.glow}`}>
            <Icon size={18} className={c.icon} />
          </div>
          {trend && (
            <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight">{value}</div>
          <div className="text-xs text-slate-500 mt-0.5 font-medium">{label}</div>
          {subtext && (
            <div className="text-[10px] text-slate-600 mt-1">{subtext}</div>
          )}
        </div>
      </div>
    </Card>
  );
}
