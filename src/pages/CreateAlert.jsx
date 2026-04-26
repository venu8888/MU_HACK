import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Map, Heart, Newspaper, Send } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card, { CardBody } from '../components/ui/Card';
import Button     from '../components/ui/Button';
import { useAppStore, DEFAULT_TTL } from '../store/useAppStore';

const ALERT_TYPES = [
  { value: 'alert',      label: 'Emergency Alert',   icon: AlertTriangle, color: 'red',   desc: 'Critical safety warning' },
  { value: 'safe_route', label: 'Safe Route',         icon: Map,           color: 'green', desc: 'Verified safe passage'    },
  { value: 'medical',    label: 'Medical Aid',        icon: Heart,         color: 'cyan',  desc: 'Health resources & aid'   },
  { value: 'news',       label: 'Community Update',   icon: Newspaper,     color: 'amber', desc: 'Local news & info'        },
];

export default function CreateAlert() {
  const navigate = useNavigate();
  const { addMessage } = useAppStore();

  const [type,    setType]    = useState('alert');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      // addMessage is now async — awaiting ensures SHA-256 + Dexie write complete
      await addMessage({ type, content, ttl: DEFAULT_TTL });
      setSuccess(true);
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      console.error('[CreateAlert] Failed to create message:', err);
    } finally {
      setSending(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4 animate-pulse-glow">
          <Send size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Message Broadcasted</h2>
        <p className="text-sm text-slate-500">Stored in IndexedDB · propagating to nearby peers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Broadcast Message"
        subtitle="Create a delay-tolerant alert that propagates to nearby devices"
        icon={AlertTriangle}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Message Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALERT_TYPES.map(({ value, label, icon: Icon, color, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 group
                  ${type === value
                    ? `bg-${color === 'green' ? 'emerald' : color}-500/10 border-${color === 'green' ? 'emerald' : color}-500/30 ring-1 ring-${color === 'green' ? 'emerald' : color}-500/20`
                    : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600/60'
                  }`}
              >
                <Icon size={18} className={`mb-2 ${type === value ? `text-${color === 'green' ? 'emerald' : color}-400` : 'text-slate-500 group-hover:text-slate-400'}`} />
                <div className="text-xs font-semibold text-slate-200">{label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Message Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Describe the situation, location details, actions needed..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200
              placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40
              transition-all duration-200 text-sm resize-none leading-relaxed"
          />
          <p className="text-xs text-slate-600">{content.length} characters</p>
        </div>

        {/* Preview */}
        <Card className="bg-slate-800/30">
          <CardBody>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Payload Preview</div>
            <div className="space-y-1.5 text-xs font-mono text-slate-400">
              <div><span className="text-slate-600">type:</span> {type}</div>
              <div><span className="text-slate-600">id:</span> SHA-256(type‖content)</div>
              <div><span className="text-slate-600">source:</span> local</div>
              <div><span className="text-slate-600">hop_count:</span> 0</div>
              <div><span className="text-slate-600">ttl:</span> 24h</div>
              <div><span className="text-slate-600">content:</span> {content.slice(0, 80) || '(empty)'}{content.length > 80 ? '…' : ''}</div>
            </div>
          </CardBody>
        </Card>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            loading={sending}
            disabled={!content.trim()}
            icon={Send}
            className="flex-1 sm:flex-none"
          >
            Broadcast to Network
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
