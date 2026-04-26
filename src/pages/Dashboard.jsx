import { Link } from 'react-router-dom';
import {
  LayoutDashboard, AlertTriangle, Map, Heart, Newspaper,
  Signal, Plus, RefreshCw, Activity,
  Database, Zap, ArrowUpRight
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatsCard  from '../components/ui/StatsCard';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import PacketCard from '../components/packets/PacketCard';
import Button     from '../components/ui/Button';
import { useAppStore } from '../store/useAppStore';
import { useMessages }  from '../hooks/useMessages';

export default function Dashboard() {
  const { forceBroadcast }  = useAppStore();
  const messages = useMessages();

  const alertCount   = messages.filter(p => p.type === 'alert').length;
  const routeCount   = messages.filter(p => p.type === 'safe_route').length;
  const medicalCount = messages.filter(p => p.type === 'medical').length;
  const newsCount    = messages.filter(p => p.type === 'news').length;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 text-brand mb-2">
            <Zap size={14} className="animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Node_System_01</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
            OVERVIEW
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-2 max-w-md">
            P2P Data Propagation active across local mesh interface. 
            No external server required.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => forceBroadcast(null, true)}
            className="group flex flex-col items-end"
          >
            <span className="text-[8px] font-mono text-white/20 uppercase">Force_Relay</span>
            <div className="flex items-center gap-2 text-white group-hover:text-brand transition-colors">
              <span className="text-sm font-black uppercase tracking-widest">SYNC</span>
              <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
            </div>
          </button>
          <Link to="/create">
            <button className="bg-brand text-black px-6 py-4 font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-colors">
              <Plus size={18} />
              NEW_MSG
            </button>
          </Link>
        </div>
      </div>

      {/* ── Grid Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-white/10 divide-x divide-white/10">
        <StatsCard label="ALERT_LVL" value={alertCount}   subtext="Active Threats" color="red"   />
        <StatsCard label="SAFE_ROUTES" value={routeCount}   subtext="Mapped Paths"   color="green" />
        <StatsCard label="MED_FACIL" value={medicalCount} subtext="Aid Active"    color="cyan"  />
        <StatsCard label="NEWS_FEED" value={newsCount}    subtext="Verified"  color="amber" />
      </div>

      {/* ── Active Feed ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-3">
            <Database size={16} className="text-brand" />
            <h2 className="text-lg font-black uppercase tracking-tighter text-white">DATAPACK_STREAM</h2>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-white/40">
            <span>COUNT: {messages.length}</span>
            <span>BANDWIDTH: 100%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 border border-white/5">
          {messages.length === 0 ? (
            <div className="col-span-1 md:col-span-2 text-center py-32 bg-bg flex flex-col items-center justify-center">
              <Activity size={48} className="text-white/5 mb-6" />
              <h3 className="text-white/20 font-black uppercase tracking-[0.3em] text-sm">No_Data_Detected</h3>
              <p className="text-white/10 text-[10px] uppercase tracking-widest mt-2">
                Scan nearby node to begin propagation
              </p>
            </div>
          ) : (
            messages.map(packet => (
              <div key={packet.id} className="bg-bg">
                <PacketCard packet={packet} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
