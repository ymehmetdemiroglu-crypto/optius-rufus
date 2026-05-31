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
    <div className="space-y-8 select-none max-w-4xl mx-auto">
      {/* Header HUD */}
      <div>
        <h2 className="font-display font-extrabold text-3xl text-white tracking-tight">
          Integrations & API Settings
        </h2>
        <p className="text-sm text-slate-400">
          Configure Selling Partner API scopes, webhook credentials, and developer options
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Amazon Authorization Panel */}
        <div className="md:col-span-2 glass-card p-6 border-brand-bg-border relative space-y-6">
          <div className="flex items-center justify-between border-b border-brand-bg-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Amazon Selling Partner API (SP-API)
                </h3>
                <p className="text-xs text-slate-500">Retrieve and sync product listing attributes securely</p>
              </div>
            </div>

            {isConnected ? (
              <span className="px-2.5 py-0.5 bg-brand-cyan/10 border border-brand-cyan/20 text-[9px] font-bold text-brand-cyan uppercase tracking-wider rounded">
                CONNECTED ACTIVE
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-500 uppercase tracking-wider rounded">
                DISCONNECTED
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                LWA CLIENT APPLICATION ID (VITE_AMAZON_CLIENT_ID)
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={isConnected}
                className="w-full text-xs text-slate-350 bg-slate-950/60 p-3 rounded-lg border border-white/5 outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                MARKETPLACE DEFAULTS
              </label>
              <div className="flex gap-2">
                {['US', 'UK', 'DE', 'CA'].map((m) => (
                  <span key={m} className="px-3 py-1 bg-slate-900 border border-white/5 text-[10px] font-bold text-slate-400 rounded">
                    {m} MARKETPLACE
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-brand-bg-border flex items-center justify-between">
            <div className="text-[11px] text-slate-500 leading-relaxed flex items-center gap-1.5 max-w-sm">
              <AlertCircle className="h-4 w-4 text-brand-orange shrink-0" />
              <span>SP-API OAuth refresh tokens are stored in the database using secure AES-256 standards.</span>
            </div>
            
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-glow-orange transition-all ${
                isConnected 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20' 
                  : 'btn-premium text-white'
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
        <div className="glass-card p-6 border-brand-bg-border relative flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-violet/5 rounded-full blur-2xl" />
          
          <div>
            <div className="flex items-center gap-2 text-brand-violet text-xs font-bold mb-3">
              <Key className="h-4 w-4" />
              <span className="uppercase tracking-wider">DEVELOPER API KEYS</span>
            </div>
            <h4 className="font-display font-bold text-sm text-slate-200">Webhook Syncing Token</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Use this key to query embedding scores or push optimized listing JSON directly via curl.
            </p>

            <div className="mt-4 p-3 bg-slate-950/60 border border-white/5 rounded-lg select-all">
              <code className="text-[10px] text-slate-400 font-mono break-all">{apiKey}</code>
            </div>
          </div>

          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 border border-white/5 hover:border-brand-violet/20 hover:bg-slate-800 text-[10px] uppercase font-bold tracking-wider rounded-xl text-slate-400 hover:text-slate-200 transition-all"
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
      <div className="glass-card p-6 border-brand-bg-border relative space-y-6">
        <div className="flex items-center justify-between border-b border-brand-bg-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-violet/10 rounded-lg text-brand-violet">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">
                Paddle Subscription Billing
              </h3>
              <p className="text-xs text-slate-500">Manage payment profiles, renewal cycles, and invoices</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-xs text-slate-400">Current Plan Model</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">PRO PLATINUM</span>
              <span className="text-xs font-bold text-brand-violet">$99 / month</span>
            </div>
          </div>

          <div className="space-y-1 text-left sm:text-right">
            <div className="text-xs text-slate-500">Billing Period Renew Cycle</div>
            <div className="text-xs text-slate-350 font-bold">
              Next Invoice: June 30, 2026 (Paddle Reference: sub_998ab12e)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
