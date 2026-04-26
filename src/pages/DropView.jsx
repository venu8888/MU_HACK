import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Download, AlertTriangle, CheckCircle2, ChevronLeft, Database } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import PacketCard from '../components/packets/PacketCard';
import { useAppStore } from '../store/useAppStore';
import { decompressPackets } from '../lib/qr';

export default function DropView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { syncMessages } = useAppStore();
  
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [importState, setImportState] = useState('pending'); // pending | success
  
  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (!dataParam) {
      setError('No data found in URL. Invalid or missing drop link.');
      return;
    }

    try {
      // The data is automatically decoded by useSearchParams, but let's be safe
      const decompressed = decompressPackets(dataParam);
      
      if (!decompressed || !Array.isArray(decompressed) || decompressed.length === 0) {
        setError('Invalid or empty QR data format.');
        return;
      }

      // Validate TTL
      const now = Date.now();
      const validMessages = [];
      let expiredCount = 0;

      decompressed.forEach(m => {
        const remainingTTL = (m.timestamp + m.ttl) - now;
        if (remainingTTL > 0) {
          validMessages.push(m);
        } else {
          expiredCount++;
        }
      });

      if (validMessages.length === 0) {
        setError('All messages in this drop have expired.');
        return;
      }

      if (expiredCount > 0) {
        setWarning(`${expiredCount} message(s) were expired and ignored.`);
      }

      setMessages(validMessages);
    } catch (err) {
      console.error(err);
      setError('Invalid or expired QR data.');
    }
  }, [searchParams]);

  const handleImport = async () => {
    try {
      await syncMessages(messages, 'qr');
      setImportState('success');
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    }
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 space-y-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center text-red-400">
          <AlertTriangle className="mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold mb-2">Drop Unavailable</h2>
          <p className="text-sm font-medium mb-6">{error}</p>
          <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/20 w-full" onClick={() => navigate('/')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 relative">
      <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => navigate('/')} className="mb-2 -ml-2 text-slate-400 hover:text-slate-200">
        Back to App
      </Button>
      
      <PageHeader
        title="Public Drop"
        subtitle="Temporary storage node accessed via QR"
        icon={Database}
      />

      {warning && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-medium text-amber-400">{warning}</p>
        </div>
      )}

      {importState === 'success' ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5 animate-fade-in text-center py-12">
          <CardBody className="flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="text-emerald-400" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-100 mb-2">Import Successful</h3>
            <p className="text-slate-400 mb-8">✔ {messages.length} messages imported to your local device.</p>
            <Button variant="primary" onClick={() => navigate('/')}>
              View in Dashboard
            </Button>
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">Payload Contents</span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md">{messages.length} Messages</span>
            </CardHeader>
            <CardBody className="p-0 bg-slate-900/40">
              <div className="divide-y divide-slate-800/60 max-h-[60vh] overflow-y-auto p-4 space-y-4">
                {messages.map((packet, i) => (
                  <PacketCard key={packet.id || i} packet={packet} compact={false} />
                ))}
              </div>
            </CardBody>
          </Card>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex justify-center z-50">
            <div className="w-full max-w-2xl">
              <Button 
                variant="success" 
                size="lg" 
                className="w-full text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse-slow" 
                icon={Download}
                onClick={handleImport}
              >
                Import to My Device
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
