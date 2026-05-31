import { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Sparkles, 
  HelpCircle, 
  CreditCard, 
  RefreshCw, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export default function Settings() {
  const [clientId, setClientId] = useState('amzn1.application-oa2-client.abc123xyz789');
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [apiKey, setApiKey] = useState('or_live_772a8c3d9efd234a982cb123e4499ff');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(!isConnected);
    }, 1500);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setIsRegenerating(false);
      setApiKey(`or_live_${Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)}`);
    }, 1000);
  };

  return (
    <div className="space-y-8 select-none max-w-4xl mx-auto py-2 text-brand-dark font-sans">
      {/* Header HUD */}
      <div>
        <h2 className="display-heading text-3xl md:text-4xl text-brand-dark">
          Integrations & API Settings
        </h2>
        <p className="text-sm font-bold uppercase tracking-wider text-brand-dark/70 mt-1">
          Configure Selling Partner API scopes, webhook credentials, and developer options
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Amazon Authorization Panel */}
        <div className="lg:col-span-2 brutalist-card p-6 bg-white relative space-y-6">
          <div className="absolute top-0 left-0 w-full h-[6px] bg-brand-gold" />
          <div className="flex items-center justify-between border-b-[2px] border-brand-dark pb-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-bg border-[3px] border-brand-dark text-brand-dark shrink-0">
                <ShieldCheck className="h-6 w-6 text-brand-blue stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-display font-black text-base text-brand-dark uppercase tracking-wide">
                  Amazon Selling Partner API (SP-API)
                </h3>
                <p className="text-xs text-brand-dark/60 font-bold uppercase tracking-wide">Retrieve and sync product listing attributes securely</p>
              </div>
            </div>

            {isConnected ? (
              <span className="px-2.5 py-1 bg-white border-2 border-brand-dark text-[9px] font-black text-brand-blue uppercase tracking-wider shadow-brutal-sm font-mono">
                CONNECTED ACTIVE
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-brand-dark text-white border-2 border-brand-dark text-[9px] font-black uppercase tracking-wider shadow-brutal-sm font-mono">
                DISCONNECTED
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-brand-dark/60 font-black uppercase tracking-widest font-mono">
                LWA CLIENT APPLICATION ID (VITE_AMAZON_CLIENT_ID)
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={isConnected}
                className="brutalist-input font-mono font-bold text-xs uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-brand-dark/60 font-black uppercase tracking-widest font-mono">
                MARKETPLACE DEFAULTS
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {['US', 'UK', 'DE', 'CA'].map((m) => (
                  <span key={m} className="px-3 py-1 bg-brand-bg border-2 border-brand-dark text-[10px] font-black text-brand-dark uppercase tracking-wider font-mono">
                    {m} MARKETPLACE
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t-[2px] border-brand-dark/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-[11px] text-brand-dark/70 font-bold leading-relaxed flex items-center gap-1.5 max-w-sm">
              <AlertCircle className="h-4.5 w-4.5 text-brand-gold shrink-0 stroke-[2.5]" />
              <span>SP-API OAuth refresh tokens are stored in the database using secure AES-256 standards.</span>
            </div>
            
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase shadow-brutal transition-all border-[3px] border-brand-dark ${
                isConnected 
                  ? 'bg-brand-red text-white hover:bg-brand-red/90' 
                  : 'bg-brand-gold text-brand-dark hover:bg-brand-gold/90'
              }`}
            >
              {isConnecting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : isConnected ? (
                <span>DISCONNECT SP-API</span>
              ) : (
                <span>AUTHORIZE ACCESS</span>
              )}
            </button>
          </div>
        </div>

        {/* Developers Credentials Token Frame */}
        <div className="brutalist-card p-6 bg-white relative flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[6px] bg-brand-blue" />
          
          <div className="mt-2">
            <div className="flex items-center gap-2 text-brand-blue text-xs font-black mb-3">
              <Key className="h-4.5 w-4.5 stroke-[2.5]" />
              <span className="uppercase tracking-wider font-mono">DEVELOPER API KEYS</span>
            </div>
            <h4 className="font-display font-black text-sm text-brand-dark uppercase">Webhook Syncing Token</h4>
            <p className="text-[11px] text-brand-dark/65 font-bold uppercase mt-1 leading-relaxed">
              Use this key to query embedding scores or push optimized listing JSON directly via curl.
            </p>

            <div className="mt-4 p-3 bg-brand-bg border-2 border-brand-dark select-all">
              <code className="text-[10px] text-brand-dark font-mono font-bold break-all">{apiKey}</code>
            </div>
          </div>

          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-[3px] border-brand-dark hover:bg-brand-gold text-[10px] uppercase font-black tracking-wider shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            {isRegenerating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span>REGENERATE CLIENT KEY</span>
            )}
          </button>
        </div>
      </div>

      {/* Subscription Active Billing Status */}
      <div className="brutalist-card p-6 bg-white relative space-y-6">
        <div className="absolute top-0 left-0 w-full h-[6px] bg-brand-dark" />
        <div className="flex items-center justify-between border-b-[2px] border-brand-dark pb-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-bg border-[3px] border-brand-dark text-brand-dark shrink-0">
              <CreditCard className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-brand-dark uppercase tracking-wide">
                Paddle Subscription Billing
              </h3>
              <p className="text-xs text-brand-dark/60 font-bold uppercase">Manage payment profiles, renewal cycles, and invoices</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-[10px] text-brand-dark/50 font-black uppercase tracking-wider font-mono">Current Plan Model</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-black text-brand-dark uppercase tracking-wide">PRO PLATINUM</span>
              <span className="text-xs font-black text-brand-blue uppercase tracking-wider font-mono">$99 / month</span>
            </div>
          </div>

          <div className="space-y-1 text-left sm:text-right">
            <div className="text-[10px] text-brand-dark/50 font-black uppercase tracking-wider font-mono">Billing Period Renew Cycle</div>
            <div className="text-xs text-brand-dark font-black uppercase tracking-wide leading-relaxed">
              Next Invoice: June 30, 2026 <span className="font-mono text-brand-blue">(Paddle Ref: sub_998ab12e)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
