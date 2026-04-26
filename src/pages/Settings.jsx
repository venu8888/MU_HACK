import { useState } from 'react';
import { Settings as SettingsIcon, Database, RotateCcw, Zap } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAppStore } from '../store/useAppStore';
import { useMessageCount } from '../hooks/useMessages';

function SettingRow({ icon: Icon, title, description, children, iconColor = 'text-slate-400' }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-700/20 last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center shrink-0">
          <Icon size={15} className={iconColor} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-200">{title}</div>
          {description && <div className="text-xs text-slate-500 mt-0.5">{description}</div>}
        </div>
      </div>
      <div className="shrink-0 ml-3">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { demoMode, toggleDemoMode, clearAll } = useAppStore();
  const messageCount = useMessageCount();
  const [clearing, setClearing] = useState(false);

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await clearAll();          // clears IndexedDB + resets store stats
      localStorage.removeItem('pulsemesh-storage');
      window.location.reload();
    } catch (err) {
      console.error('[Settings] clearAll failed:', err);
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Settings"
        subtitle="Configure your mesh node behavior"
        icon={SettingsIcon}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-slate-200">Data & Storage</span>
          </div>
        </CardHeader>
        <CardBody className="space-y-0">
          <SettingRow
            icon={Zap}
            title="Demo Mode"
            description="Reduce message TTL to 2 minutes for faster demonstration of expiry."
            iconColor="text-emerald-400"
          >
            <button
              className={`w-12 h-6 rounded-full transition-colors relative ${demoMode ? 'bg-emerald-500' : 'bg-slate-700'}`}
              onClick={toggleDemoMode}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${demoMode ? 'left-7' : 'left-1'}`} />
            </button>
          </SettingRow>

          <SettingRow
            icon={RotateCcw}
            title="Reset Device Data"
            description={`Permanently delete all ${messageCount} stored messages from IndexedDB and reload`}
            iconColor="text-red-400"
          >
            <Button size="sm" variant="danger" onClick={handleClearAll} loading={clearing}>
              Reset Device
            </Button>
          </SettingRow>
        </CardBody>
      </Card>

      {/* Storage info */}
      <Card className="bg-slate-800/30 border-slate-700/30">
        <CardBody>
          <div className="space-y-2 text-xs text-slate-500 font-mono">
            <div className="flex justify-between">
              <span>Storage backend</span>
              <span className="text-cyan-400">IndexedDB (Dexie v4)</span>
            </div>
            <div className="flex justify-between">
              <span>Deduplication</span>
              <span className="text-blue-400">SHA-256 content hash</span>
            </div>
            <div className="flex justify-between">
              <span>Sync filter</span>
              <span className="text-violet-400">Bloom (4096-bit, k=7)</span>
            </div>
            <div className="flex justify-between">
              <span>Messages stored</span>
              <span className="text-slate-300">{messageCount} / 200</span>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-slate-800/30 border-slate-700/30">
        <CardBody>
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-sm font-bold gradient-text">PulseMesh X Secure</span>
            </div>
            <p className="text-xs text-slate-500">v3.0.0-MVP · IndexedDB · SHA-256 · Bloom Filter · Offline SW</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
