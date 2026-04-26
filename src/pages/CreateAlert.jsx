import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Map, Heart, Newspaper, Send, ArrowRight, Terminal } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card, { CardBody } from '../components/ui/Card';
import Button     from '../components/ui/Button';
import { useAppStore, DEFAULT_TTL } from '../store/useAppStore';

const ALERT_TYPES = [
  { value: 'alert',      label: 'EMERGENCY',   icon: AlertTriangle, color: 'red',   desc: 'CRITICAL_THREAT' },
  { value: 'safe_route', label: 'PASSAGE',         icon: Map,           color: 'green', desc: 'VERIFIED_SAFE'    },
  { value: 'medical',    label: 'AID_REQ',        icon: Heart,         color: 'cyan',  desc: 'MEDICAL_SUPPORT'   },
  { value: 'news',       label: 'INFO_LOG',   icon: Newspaper,     color: 'amber', desc: 'GENERAL_UPDATE'        },
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
      await addMessage({ type, content, ttl: DEFAULT_TTL });
      setSuccess(true);
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      console.error('[CreateAlert] Failed to create message:', err);
    } finally {
      setSending(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="p-8 border-4 border-brand text-brand font-black text-4xl uppercase tracking-tighter animate-pulse">
          SIGNAL_SENT
        </div>
        <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] mt-8 animate-flicker">
          Propagating to mesh interfaces...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-3xl">
      <div className="border-b border-white/5 pb-8">
        <div className="flex items-center gap-2 text-brand mb-2">
          <Send size={14} />
          <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Broadcast_Terminal</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase">INJECT_DATA</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-brand" /> SELECT_PACKET_TYPE
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5 border border-white/5">
            {ALERT_TYPES.map(({ value, label, icon: Icon, color, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`p-6 text-left transition-all bg-bg flex items-center justify-between group ${
                  type === value ? 'border-l-4 border-brand bg-white/5' : 'border-l-4 border-transparent opacity-40 hover:opacity-100 hover:bg-white/5'
                }`}
              >
                <div>
                   <div className="text-xs font-black text-white uppercase tracking-widest mb-1">{label}</div>
                   <div className="text-[10px] font-mono text-white/40 uppercase">{desc}</div>
                </div>
                <Icon size={24} className={type === value ? 'text-brand' : 'text-white/20'} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-brand" /> INPUT_PAYLOAD
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
            className="w-full p-8 bg-black border border-white/10 text-white font-black text-2xl md:text-4xl placeholder:text-white/5 focus:outline-none focus:border-brand transition-all uppercase tracking-tighter"
          />
          <div className="flex justify-between items-center text-[9px] font-mono text-white/20 uppercase tracking-widest">
            <span>Len: {content.length}</span>
            <span>Encoding: UTF-8</span>
          </div>
        </div>

        <div className="p-6 border border-white/10 bg-black/40">
           <div className="flex items-center gap-2 text-white/40 mb-4">
              <Terminal size={12} />
              <span className="text-[10px] font-black uppercase tracking-widest">ENCRYPTION_PREVIEW</span>
           </div>
           <div className="font-mono text-[9px] text-white/20 leading-relaxed uppercase space-y-1">
              <div>HASH: SHA256_LOCAL_INIT</div>
              <div>RELAY: HOP_COUNT_ZERO</div>
              <div>TTL: {DEFAULT_TTL / 3600000}HR_MAX_LIFE</div>
              <div className="text-brand/40 italic">PAYLOAD: {content || '...NULL'}</div>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="flex-1 bg-brand text-black py-6 font-black text-xl uppercase tracking-tighter flex items-center justify-center gap-4 hover:bg-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {sending ? 'PROCESSING...' : 'SEND_BROADCAST'}
            <ArrowRight size={28} />
          </button>
          <button 
            type="button"
            onClick={() => navigate('/')}
            className="px-12 py-6 border border-white/10 text-white/40 font-black text-xl uppercase tracking-tighter hover:text-white hover:border-white transition-all"
          >
            EXIT
          </button>
        </div>
      </form>
    </div>
  );
}
