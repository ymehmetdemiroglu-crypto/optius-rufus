import { useState } from 'react';
import { Terminal, Send, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import type { JSX } from 'react';

export default function WebhookSimulator(): JSX.Element {
  const [email, setEmail] = useState('test-seller@nexgenoptimusprime.com');
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Doe');
  const [company, setCompany] = useState('NexGen Premium');
  const [expectedRevenue, setExpectedRevenue] = useState('$1,200,000 / year');
  const [asin, setAsin] = useState('B0C2D8H69B');
  const [bodyText, setBodyText] = useState('I am interested in getting our listing audited. Our ASIN is B0C2D8H69B. Let me know what you find!');
  
  const [isLoading, setIsLoading] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [result, setResult] = useState<{ success: boolean; slug?: string; prospectId?: number; auditTriggered?: boolean; error?: string } | null>(null);

  const addLog = (msg: string) => {
    setLogMessages((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSimulate = async () => {
    setIsLoading(true);
    setResult(null);
    setLogMessages([]);
    addLog("Initializing simulated Apollo Outreach Webhook event...");

    const payload = {
      event_type: "email_replied",
      email_message: {
        subject: "Re: Optimization Audit Inquiry",
        body_text: bodyText,
        sender_email: email,
      },
      contact: {
        email,
        first_name: firstName,
        last_name: lastName,
        organization_name: company,
        custom_fields: {
          expected_revenue: expectedRevenue,
          asin: asin || undefined,
        }
      }
    };

    try {
      addLog(`Posting simulated email reply event to HTTP webhook endpoint...`);
      const response = await fetch('/api/webhooks/apollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      setResult(data);
      addLog("✔ Webhook dispatched successfully!");
      addLog(`Prospect ID: ${data.prospectId}`);
      addLog(`Prospect Slug: ${data.slug}`);
      addLog(`Background Audit Queue Triggered: ${data.auditTriggered ? "YES" : "NO"}`);
      addLog(`Personalized Link Generated: /p/${data.slug}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setResult({ success: false, error: msg });
      addLog(`❌ Simulation failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="col-span-12 grid grid-cols-12 gap-8">
      {/* Simulation Form */}
      <div className="col-span-12 lg:col-span-5 space-y-6">
        <div className="brutalist-card bg-white border-[3px] border-brand-dark p-6 shadow-brutal-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-brand-dark pb-3">
            <Terminal size={18} className="text-brand-dark" />
            <h2 className="font-display font-black text-lg uppercase">Apollo Webhook Simulator</h2>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border-[2px] border-brand-dark bg-[#faf6f0] focus:bg-white focus:outline-none rounded-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border-[2px] border-brand-dark bg-[#faf6f0] focus:bg-white focus:outline-none rounded-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border-[2px] border-brand-dark bg-[#faf6f0] focus:bg-white focus:outline-none rounded-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Company / Store Name</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 border-[2px] border-brand-dark bg-[#faf6f0] focus:bg-white focus:outline-none rounded-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">ASIN</label>
                <input
                  type="text"
                  value={asin}
                  onChange={(e) => setAsin(e.target.value)}
                  placeholder="Optional (B0XXXXXX)"
                  className="w-full px-3 py-2 border-[2px] border-brand-dark bg-[#faf6f0] focus:bg-white focus:outline-none rounded-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Expected Revenue</label>
                <input
                  type="text"
                  value={expectedRevenue}
                  onChange={(e) => setExpectedRevenue(e.target.value)}
                  className="w-full px-3 py-2 border-[2px] border-brand-dark bg-[#faf6f0] focus:bg-white focus:outline-none rounded-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Apollo Email Body (Contains ASIN)</label>
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border-[2px] border-brand-dark bg-[#faf6f0] focus:bg-white focus:outline-none rounded-none resize-none"
              />
              <p className="text-[9px] text-gray-400 mt-1">If the ASIN field is blank, the scraper will search this text using regex.</p>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isLoading}
              className="w-full bg-brand-gold text-brand-dark border-[2px] border-brand-dark font-display font-black text-sm uppercase py-3 shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <span>Simulating...</span>
              ) : (
                <>
                  <Send size={14} /> Dispatch Simulated Webhook
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Terminal Output */}
      <div className="col-span-12 lg:col-span-7 space-y-6">
        <div className="brutalist-card bg-brand-dark text-white border-[3px] border-brand-dark p-6 shadow-brutal-sm min-h-[400px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <span className="font-mono text-xs text-white/50 uppercase tracking-widest">Simulation Output Logs</span>
              <span className="w-2.5 h-2.5 rounded-full bg-brand-gold animate-ping" />
            </div>

            {/* Terminal rows */}
            <div className="font-mono text-[11px] leading-relaxed space-y-2 max-h-[300px] overflow-y-auto bg-black/30 p-4 border border-white/10">
              {logMessages.length === 0 ? (
                <div className="text-white/40">Simulation idle. Press 'Dispatch' to trigger a reply webhook event.</div>
              ) : (
                logMessages.map((log, i) => (
                  <div key={i} className="terminal-line text-terminal-green">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Results Summary Box */}
          {result && (
            <div className="mt-6 border border-white/20 bg-white/5 p-4 space-y-4">
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <h3 className="font-display uppercase text-sm font-bold tracking-wide">
                    {result.success ? "Simulated Prospect Configured" : "Simulation Failed"}
                  </h3>
                  <p className="font-mono text-[10px] text-white/70">
                    {result.success 
                      ? "The reply webhook registered successfully. The background analysis job has been enqueued."
                      : result.error
                    }
                  </p>
                </div>
              </div>

              {result.success && result.slug && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-3">
                  <div className="font-mono text-[10px] text-white/60">
                    Expected Revenue Tier: <span className="text-brand-gold font-bold">{classifyRevenueTier(expectedRevenue)}</span>
                  </div>
                  <a
                    href={`/p/${result.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 bg-white text-brand-dark px-3 py-1.5 border border-white hover:bg-brand-gold transition-colors font-mono text-[10px] font-bold uppercase"
                  >
                    Open Live Landing Page <ArrowRight size={10} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function classifyRevenueTier(revenue: string): string {
  const cleanNum = parseFloat(revenue.replace(/[^0-9.]/g, ""));
  if (isNaN(cleanNum)) {
    const lower = revenue.toLowerCase();
    if (lower.includes("1m") || lower.includes("million") || lower.includes("enterprise")) return "Class A (Enterprise)";
    if (lower.includes("100k") || lower.includes("growth")) return "Class B (Growth)";
    return "Class C (Starter)";
  }
  if (cleanNum >= 1000000) return "Class A (Enterprise)";
  if (cleanNum >= 100000) return "Class B (Growth)";
  if (cleanNum >= 8000) return "Class B (Growth)";
  return "Class C (Starter)";
}
