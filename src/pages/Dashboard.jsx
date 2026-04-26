import { Link } from 'react-router-dom';
import {
  LayoutDashboard, AlertTriangle, Map, Heart, Newspaper,
  Signal, Plus, RefreshCw, Activity,
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
  const messages = useMessages(); // reactive — IndexedDB-backed

  const alertCount   = messages.filter(p => p.type === 'alert').length;
  const routeCount   = messages.filter(p => p.type === 'safe_route').length;
  const medicalCount = messages.filter(p => p.type === 'medical').length;
  const newsCount    = messages.filter(p => p.type === 'news').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Message Feed"
        subtitle="Delay-tolerant peer-to-peer network overview"
        icon={LayoutDashboard}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => forceBroadcast(null, true)}
              className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all flex items-center gap-1.5"
              title="Force Sync Broadcast"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline text-xs font-medium">Force Sync</span>
            </button>
            <Link to="/create">
              <Button icon={Plus} size="sm">New Message</Button>
            </Link>
          </div>
        }
      />

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard icon={AlertTriangle} label="Alerts"  value={alertCount}   subtext="Critical active" color="red"   />
        <StatsCard icon={Map}           label="Routes"  value={routeCount}   subtext="Safe passages"   color="green" />
        <StatsCard icon={Heart}         label="Medical" value={medicalCount} subtext="Aid stations"    color="cyan"  />
        <StatsCard icon={Newspaper}     label="Updates" value={newsCount}    subtext="Community info"  color="amber" />
      </div>

      {/* ── Feed ── */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Signal size={15} className="text-blue-400" />
            <span className="text-sm font-semibold text-slate-200">Active Propagating Messages</span>
          </div>
          <span className="text-xs text-slate-500">{messages.length} active</span>
        </CardHeader>
        <CardBody className="bg-slate-900/50 p-3 sm:p-4 rounded-b-xl border-t border-slate-700/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {messages.length === 0 ? (
              <div className="col-span-1 md:col-span-2 text-center py-12 flex flex-col items-center justify-center">
                <Activity size={32} className="text-slate-600 mb-3" />
                <h3 className="text-slate-300 font-medium mb-1">No Active Messages</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  The local network is quiet. Create a message to broadcast, or sync with a nearby peer.
                </p>
              </div>
            ) : (
              messages.map(packet => <PacketCard key={packet.id} packet={packet} />)
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
