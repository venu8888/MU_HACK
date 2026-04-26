import { Clock, ArrowRightLeft, Radio, Eye, Database } from 'lucide-react';
import { PACKET_CONFIG, PRIORITY_CONFIG } from '../../utils/constants';
import { timeAgo, ttlRemaining } from '../../utils/time';
import Badge from '../ui/Badge';

export default function PacketCard({ packet, compact = false }) {
  const config = PACKET_CONFIG[packet.type] || PACKET_CONFIG.news;
  const pType = packet.type === 'alert' ? 'critical' : packet.type === 'safe_route' ? 'high' : packet.type === 'medical' ? 'high' : 'medium';
  const priority = PRIORITY_CONFIG[pType] || PRIORITY_CONFIG.medium;
  const expiresAt = packet.timestamp + packet.ttl;

  return (
    <div className={`p-4 border border-white/5 hover:border-brand/40 transition-all group relative bg-bg`}>
      {/* Type Marker */}
      <div className={`absolute top-0 left-0 w-1 h-full ${
        packet.type === 'alert' ? 'bg-red-500' : 
        packet.type === 'safe_route' ? 'bg-brand' : 
        packet.type === 'medical' ? 'bg-cyan-500' : 
        'bg-amber-500'
      } opacity-40 group-hover:opacity-100`} />

      <div className="flex flex-col gap-3">
        {/* Header Metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/40 uppercase">[{packet.id.slice(0,8)}]</span>
            <Badge color={packet.type === 'alert' ? 'red' : packet.type === 'safe_route' ? 'green' : packet.type === 'medical' ? 'cyan' : 'amber'}>
              {packet.type}
            </Badge>
          </div>
          <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">
            {timeAgo(packet.timestamp)}
          </span>
        </div>

        {/* Core Content */}
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white uppercase tracking-tight">
            {packet.title || config.label}
          </h3>
          <p className="text-xs text-white/60 font-medium leading-relaxed italic">
            "{packet.content}"
          </p>
        </div>

        {/* Technical Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-4 text-[9px] font-mono text-white/30">
            <div className="flex items-center gap-1">
              <ArrowRightLeft size={10} />
              <span>HPS:{packet.hopCount ?? 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye size={10} />
              <span>VIS:{packet.seen_count || 1}</span>
            </div>
            <div className="flex items-center gap-1">
              <Radio size={10} />
              <span>SRC:{packet.source?.slice(0,6).toUpperCase()}</span>
            </div>
          </div>
          <div className="text-[9px] font-mono text-brand/60 font-black">
            TTL_{ttlRemaining(expiresAt).replace(' left', '')}
          </div>
        </div>
      </div>
    </div>
  );
}
