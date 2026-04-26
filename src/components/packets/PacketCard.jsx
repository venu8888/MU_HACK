import { Clock, ArrowRightLeft, Radio, Eye } from 'lucide-react';
import { PACKET_CONFIG, PRIORITY_CONFIG } from '../../utils/constants';
import { timeAgo, ttlRemaining } from '../../utils/time';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

export default function PacketCard({ packet, compact = false }) {
  const config = PACKET_CONFIG[packet.type] || PACKET_CONFIG.news;
  // Default priority based on type if missing
  const pType = packet.type === 'alert' ? 'critical' : packet.type === 'safe_route' ? 'high' : packet.type === 'medical' ? 'high' : 'medium';
  const priority = PRIORITY_CONFIG[pType] || PRIORITY_CONFIG.medium;
  const Icon = config.icon;

  const expiresAt = packet.timestamp + packet.ttl;

  if (compact) {
    return (
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/40 transition-all duration-200 animate-slide-up">
        <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
          <Icon size={14} className={config.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-slate-200 truncate">{packet.title || config.shortLabel}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot} shrink-0`} />
          </div>
          <p className="text-xs text-slate-500 truncate">{packet.content}</p>
        </div>
        <span className="text-[10px] text-slate-600 shrink-0">{timeAgo(packet.timestamp)}</span>
      </div>
    );
  }

  return (
    <Card hover className="animate-slide-up overflow-hidden">
      {/* Priority accent bar */}
      <div className="h-0.5" style={{ background: config.accentColor }} />
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center`}>
              <Icon size={16} className={config.color} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">{config.label}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge color={packet.type === 'alert' ? 'red' : packet.type === 'safe_route' ? 'green' : packet.type === 'medical' ? 'cyan' : 'amber'}>
                  {config.shortLabel}
                </Badge>
                <Badge color={pType === 'critical' ? 'red' : pType === 'high' ? 'amber' : 'slate'} dot>
                  {priority.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          {packet.content}
        </p>

        {/* Footer metadata */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-700/30 gap-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-500">
              <Clock size={12} />
              <span className="text-[11px]">{timeAgo(packet.timestamp)}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500" title="Hop count from origin">
              <ArrowRightLeft size={12} />
              <span className={`text-[11px] font-mono font-semibold ${
                (packet.hopCount ?? packet.hop_count ?? 0) === 0 
                  ? 'text-emerald-400' 
                  : (packet.hopCount ?? packet.hop_count ?? 0) <= 2 
                    ? 'text-amber-400' 
                    : 'text-red-400'
              }`}>
                {packet.hopCount ?? packet.hop_count ?? 0} hop{(packet.hopCount ?? packet.hop_count ?? 0) !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 capitalize">
              <Radio size={12} />
              <span className="text-[11px]">{packet.source}</span>
            </div>
            <div className="flex items-center gap-1 text-blue-400/80" title="Seen from different peers">
              <Eye size={12} />
              <span className="text-[11px] font-mono">{packet.seen_count || 1}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">
              TTL: {ttlRemaining(expiresAt)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
