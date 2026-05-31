import { useState } from 'react';
import { X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { trpc } from '../../providers/trpc';
import type { PipelineProspect } from '../../types/prospect';

interface TriggerScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: PipelineProspect | null;
}

const marketplaces = [
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'CA', label: 'Canada' },
];

export default function TriggerScrapeModal({ isOpen, onClose, prospect }: TriggerScrapeModalProps) {
  const [asin, setAsin] = useState('');
  const [marketplace, setMarketplace] = useState('US');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const triggerMutation = trpc.scraper?.trigger?.useMutation({
    onSuccess: () => {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setAsin('');
        onClose();
      }, 1500);
    },
    onError: (err) => {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to trigger scrape');
    },
  });

  if (!isOpen || !prospect) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asin) return;

    setStatus('loading');
    setErrorMsg('');
    triggerMutation?.mutate({
      prospectId: prospect.id,
      asin: asin.toUpperCase(),
      marketplace,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border-[3px] border-black">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-black hover:text-brutal-red transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="font-sans text-xl font-black uppercase tracking-tight text-black">
              Trigger Scrape
            </h3>
            <p className="font-mono text-xs uppercase tracking-widest text-black/60">
              Prospect: <span className="text-black font-bold">{prospect.name}</span>
              {prospect.company && ` · ${prospect.company}`}
            </p>
          </div>

          {status === 'success' ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="h-12 w-12 text-brutal-blue" />
              <p className="text-sm font-bold text-black uppercase tracking-wider">
                Scrape Triggered Successfully
              </p>
            </div>
          ) : status === 'error' ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <AlertTriangle className="h-12 w-12 text-brutal-red" />
              <p className="text-sm font-bold text-black uppercase tracking-wider">Scrape Failed</p>
              <p className="text-xs text-black/60 text-center font-mono">{errorMsg}</p>
              <button
                onClick={() => setStatus('idle')}
                className="bg-white text-black border-[3px] border-black px-4 py-2 font-bold text-xs uppercase hover:bg-black hover:text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-black/60 mb-1.5">
                  ASIN
                </label>
                <input
                  required
                  type="text"
                  value={asin}
                  onChange={(e) => setAsin(e.target.value.toUpperCase())}
                  className="w-full bg-white border-[3px] border-black px-4 py-2.5 text-sm text-black placeholder-black/40 outline-none focus:border-brutal-blue transition-colors font-mono uppercase"
                  placeholder="B0C8XYZ123"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-black/60 mb-1.5">
                  Marketplace
                </label>
                <select
                  value={marketplace}
                  onChange={(e) => setMarketplace(e.target.value)}
                  className="w-full bg-white border-[3px] border-black px-4 py-2.5 text-sm text-black outline-none focus:border-brutal-blue transition-colors appearance-none font-mono"
                >
                  {marketplaces.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-brutal-blue text-white border-[3px] border-black w-full flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm uppercase hover:bg-black transition-colors disabled:opacity-60"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Triggering...</span>
                  </>
                ) : (
                  <span>Trigger Scrape</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
