import { useState } from 'react';
import { trpc } from '../providers/trpc';
import { Zap, Shield, ArrowRight, CheckCircle2, Loader2, AlertCircle, Compass, Layers, CheckSquare, Send } from 'lucide-react';

export default function InvitationOnly() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    asin: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const bookMutation = trpc.booking?.create?.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setLoading(false);
    },
    onError: (err) => {
      console.error('Booking failed:', err);
      setLoading(false);
      alert('Booking failed. Please try again or contact hello@optimusrufus.com');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.asin) return;
    setLoading(true);

    bookMutation.mutate({
      prospectId: 5, // Default mock prospect id
      name: form.name,
      email: form.email,
      company: `${form.company} (ASIN: ${form.asin.toUpperCase()})`,
      notes: `Requested listing audit for ASIN: ${form.asin.toUpperCase()}`,
    });
  };

  const inputClass =
    'w-full bg-[#f5f0e8] border-[3px] border-brand-dark px-4 py-3 text-sm text-brand-dark placeholder-gray-500 outline-none focus:border-brand-blue transition-colors font-mono';

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark selection:bg-brand-gold selection:text-brand-dark select-none font-sans relative overflow-x-hidden pb-24">
      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Navigation Header */}
      <header className="bg-brand-dark text-white border-b-[3px] border-brand-dark px-6 py-5 flex items-center justify-between shadow-brutal-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-brand-gold border-[2px] border-white flex items-center justify-center font-display font-black text-lg text-brand-dark">Ω</div>
          <div>
            <h1 className="font-display uppercase font-black text-lg tracking-wide">OPTIMUS RUFUS</h1>
            <p className="font-mono text-[9px] text-white/50 tracking-widest uppercase">AI-Native Amazon Listing Optimization</p>
          </div>
        </div>
        <a 
          href="/p/mock-prospect" 
          className="bg-brand-gold text-brand-dark font-mono text-[10px] font-black uppercase tracking-wider px-4 py-2 border-2 border-brand-dark shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer transition-all"
        >
          View Live Demo Autopsy
        </a>
      </header>

      {/* Main Section */}
      <main className="max-w-5xl mx-auto px-6 mt-16 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brutal-red text-white border-[3px] border-brand-dark px-4 py-1.5 font-mono text-xs uppercase tracking-widest font-black shadow-brutal-sm">
            <AlertCircle className="h-4 w-4" />
            <span>ATTENTION AMAZON FBA BRANDS DOING $100K+/MO</span>
          </div>
          <h2 className="display-heading text-4xl sm:text-5xl md:text-7xl text-brand-dark leading-[1.02]">
            Amazon's AI (Rufus) is Stealing Your Sales.
            <br />
            <span className="text-brutal-red">Here is Exactly How We Stop It.</span>
          </h2>
          <p className="text-lg md:text-xl font-medium text-brand-dark/80 max-w-3xl mx-auto leading-relaxed">
            Amazon COSMO daily logs customer search-to-purchase sessions. If your listing has semantic gaps, Rufus actively hedges and recommends your competitors — even if you rank #1 organically.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <a 
              href="/p/mock-prospect"
              className="brutalist-btn bg-brand-gold text-brand-dark text-base md:text-lg flex items-center gap-2"
            >
              <span>RUN FREE DEMO AUTOPSY REPORT</span>
              <ArrowRight className="h-5 w-5" />
            </a>
            <a 
              href="#audit-form"
              className="brutalist-btn bg-white text-brand-dark text-base md:text-lg border-brand-dark border-[3px]"
            >
              <span>REQUEST 15-MIN DIAGNOSTIC CALL</span>
            </a>
          </div>
        </div>

        {/* 2x2 Grid explaining EXACTLY what we do */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-blue font-black">
              HOW WE DOMINATE AI SEARCH
            </p>
            <h3 className="display-heading text-2xl md:text-4xl text-brand-dark">
              Our 4-Agent Answer Engine Optimization (AEO) Stack
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pillar 1 */}
            <div className="brutalist-card bg-white p-6 md:p-8 space-y-4 shadow-brutal">
              <div className="flex items-center gap-2 text-brand-blue font-black font-display text-lg uppercase border-b-2 border-brand-dark pb-2">
                <Layers className="h-5 w-5" />
                <span>COSMO Intent Graph Ingestion</span>
              </div>
              <p className="text-xs text-brand-dark/70 font-medium leading-relaxed">
                We rewrite your listing copy (Title, Bullets, A+ Content) to populate structured attributes (<span className="font-mono text-xs bg-brand-bg px-1">used_for_function</span>, <span className="font-mono text-xs bg-brand-bg px-1">capable_of</span>, <span className="font-mono text-xs bg-brand-bg px-1">used_for_audience</span>). This forces COSMO to build a direct node connection between buyer queries and your ASIN.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="brutalist-card bg-white p-6 md:p-8 space-y-4 shadow-brutal">
              <div className="flex items-center gap-2 text-brand-gold font-black font-display text-lg uppercase border-b-2 border-brand-dark pb-2">
                <CheckSquare className="h-5 w-5" />
                <span>Q&A Seeding (RAG Ground Truth)</span>
              </div>
              <p className="text-xs text-brand-dark/70 font-medium leading-relaxed">
                Rufus reads listing Q&A as its primary retrieval "ground truth". Research shows **listings with 15+ answered Q&As are recommended 3.2× more often**. We mine your category concerns, write specific answers, and seed them legitimately.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="brutalist-card bg-white p-6 md:p-8 space-y-4 shadow-brutal">
              <div className="flex items-center gap-2 text-purple-600 font-black font-display text-lg uppercase border-b-2 border-brand-dark pb-2">
                <Send className="h-5 w-5" />
                <span>A10 External Traffic Attributions</span>
              </div>
              <p className="text-xs text-brand-dark/70 font-medium leading-relaxed">
                Under the new A10 algorithm, PPC sales carry 35% less weight. We set up Google and TikTok campaigns redirecting high-intent traffic through **Amazon Attribution links** — the single highest-weighted ranking signal on Amazon today.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="brutalist-card bg-white p-6 md:p-8 space-y-4 shadow-brutal">
              <div className="flex items-center gap-2 text-green-600 font-black font-display text-lg uppercase border-b-2 border-brand-dark pb-2">
                <Compass className="h-5 w-5" />
                <span>Page 2 Organic Conquesting PPC</span>
              </div>
              <p className="text-xs text-brand-dark/70 font-medium leading-relaxed">
                We generate intent-grouped manual campaigns using automated negative keyword exclusions (excluding form mismatches). Our bid logic boosts bids by **15% on Page 2 keywords** to launch you onto Page 1, feeding the organic data logs Rufus feeds on.
              </p>
            </div>
          </div>
        </div>

        {/* Grand Slam Offer */}
        <div id="audit-form" className="border-[3px] border-brand-dark bg-white shadow-brutal p-8 md:p-12 space-y-8">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-gold font-black bg-brand-dark text-white px-2 py-0.5 inline-block">
              THE GRAND SLAM OFFER
            </p>
            <h3 className="display-heading text-3xl md:text-5xl text-brand-dark">
              Get Your Listing Autopsy & AEO Roadmap
            </h3>
            <p className="text-sm font-mono text-brand-dark/70">
              Claim a custom 1-on-1 diagnostic run. 100% free. No obligation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7 space-y-6 font-mono text-xs font-bold leading-relaxed text-brand-dark/80">
              <p className="text-sm font-sans font-medium text-brand-dark">
                During this 15-minute diagnostic call, we will walk you through:
              </p>
              <ul className="space-y-3">
                <li className="flex gap-2 items-start">
                  <span className="text-green-600 shrink-0">✓</span>
                  <span><strong>Your 24-Point Semantic Gap Audit</strong>: We identify exactly which intent nodes your listing is missing, rendering you invisible to Rufus.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-green-600 shrink-0">✓</span>
                  <span><strong>15-Point Q&A Seeding Checklist</strong>: Clear templates for category-focused Q&As to unlock the 3.2× recommendation multiplier.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-green-600 shrink-0">✓</span>
                  <span><strong>Page 2 Conquesting PPC Template</strong>: An exportable bulk-sheet configuration with 15% rank booster logic.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-green-600 shrink-0">✓</span>
                  <span><strong>Attribution Tracking Strategy</strong>: Exact landing page flows to route external traffic carrying A10 organic weights.</span>
                </li>
              </ul>
              <div className="border border-dashed border-brand-dark/30 p-3 bg-brand-bg text-[10px] text-brand-dark/60 leading-normal">
                ⚠️ **scarcity warning**: We only take 5 audits per week to preserve human copywriting review time. Currently only 2 slots remaining.
              </div>
            </div>

            <div className="md:col-span-5 border-[3px] border-brand-dark p-6 bg-brand-bg shadow-brutal-sm">
              {submitted ? (
                <div className="text-center space-y-4 py-8">
                  <div className="inline-flex h-12 w-12 items-center justify-center bg-green-100 border-2 border-green-400 text-green-700">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="font-display font-black text-lg uppercase">Audit Request Sent!</h4>
                  <p className="text-xs text-brand-dark/70 font-medium">Check your inbox. We will reach out within the hour to schedule.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-gray-500 mb-1">Your Name</label>
                    <input 
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      className={inputClass}
                      placeholder="Alex Hormozi"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-gray-500 mb-1">Work Email</label>
                    <input 
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                      className={inputClass}
                      placeholder="alex@acme.com"
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-[10px] uppercase font-bold text-gray-500 mb-1">Company Name</label>
                      <input 
                        type="text"
                        value={form.company}
                        onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))}
                        className={inputClass}
                        placeholder="Acme Supplements"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase font-bold text-gray-500 mb-1">Target ASIN</label>
                      <input 
                        required
                        type="text"
                        value={form.asin}
                        onChange={(e) => setForm(f => ({ ...f, asin: e.target.value }))}
                        className="w-full bg-[#f5f0e8] border-[3px] border-brand-dark px-4 py-3 text-base text-brand-dark placeholder-gray-500 outline-none focus:border-brand-blue transition-colors font-mono uppercase"
                        placeholder="B0XXXXXX"
                        maxLength={10}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="brutalist-btn-danger w-full text-xs font-bold py-4 uppercase flex items-center justify-center gap-2 cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <span>Request Free Listing Autopsy →</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Bold Guarantee */}
          <div className="border-[3px] border-brand-dark bg-brand-gold p-5 md:p-6 flex items-start gap-4 shadow-brutal">
            <div className="h-12 w-12 bg-brand-dark border-[3px] border-brand-dark text-brand-gold flex items-center justify-center shrink-0">
              <Shield className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-black text-base uppercase tracking-wide text-brand-dark">
                The Triple-Value Risk Reversal Guarantee
              </h4>
              <p className="text-xs font-bold text-brand-dark/95 leading-relaxed font-mono">
                If we don't find at least $5,000/year in hidden leaks during our 15-minute call, we will send you $100 cash on the spot for wasting your time. If we optimize your listing and your Rufus SOV doesn't improve, we refund every single cent. No risk. No friction.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
