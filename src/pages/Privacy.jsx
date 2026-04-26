import { ShieldCheck, EyeOff, Shield, Database, Lock } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function Privacy() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Privacy Architecture"
        subtitle="Zero-Trust, No-Identity Delay Tolerant Network"
        icon={ShieldCheck}
      />

      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardBody className="p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <EyeOff size={24} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-400 mb-2">100% Anonymous by Design</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              PulseMesh X Secure operates on a strict zero-identity model. There are no accounts, no usernames, no device fingerprints, and no crypto keys. 
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge color="green">No Accounts</Badge>
              <Badge color="green">No Tracking</Badge>
              <Badge color="green">Local Only</Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Database size={16} className="text-blue-400" />
            <span className="font-semibold text-slate-200">Local Storage Only</span>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-slate-400 leading-relaxed">
              All messages are stored entirely in your device's local storage. Nothing is ever sent to a central server, because there is no central server. 
              Data only moves when you explicitly sync with another device via local proximity or QR code.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <Shield size={16} className="text-violet-400" />
            <span className="font-semibold text-slate-200">Plausible Deniability</span>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-slate-400 leading-relaxed">
              Because all messages are re-broadcasted collectively, it is impossible to determine the original author of any message based on the data payload.
            </p>
          </CardBody>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex items-center gap-2">
            <Lock size={16} className="text-amber-400" />
            <span className="font-semibold text-slate-200">Absolute Expiry (TTL)</span>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every message has a strict Time-To-Live (TTL). Once a message expires, it is automatically and permanently deleted from the local database of every device it reached. Expiry timestamps cannot be reset by relays.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
