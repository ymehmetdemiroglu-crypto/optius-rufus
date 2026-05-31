import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  ArrowRight, 
  Zap, 
  Target, 
  ShieldAlert, 
  Lock, 
  HelpCircle, 
  CheckCircle2, 
  Flame, 
  TrendingUp, 
  ArrowUpRight 
} from 'lucide-react';

export default function Landing() {
  const [asin, setAsin] = useState('');
  const [marketplace, setMarketplace] = useState('US');
  const navigate = useNavigate();

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asin || asin.length !== 10) return;
    navigate(`/analyzer?asin=${asin.toUpperCase()}&marketplace=${marketplace}`);
  };

  const handleQuickDemo = () => {
    navigate('/analyzer?demo=true');
  };

  return (
    <div className="relative py-12 md:py-16 space-y-24 select-none max-w-6xl mx-auto overflow-x-hidden">
      
      {/* Dynamic Background Glowing Atmosphere */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-brand-violet/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-brand-cyan/5 rounded-full blur-3xl -z-10" />

      {/* SECTION 1: HERO HOOK (Hormozi style) */}
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-brand-orange/20 bg-brand-orange/5 rounded-full animate-float">
          <Flame className="h-4 w-4 text-brand-orange animate-pulse" />
          <span className="text-[10px] md:text-xs text-brand-orange font-black uppercase tracking-widest">
            THE NEW AMAZON ALGORITHM IS LIVE
          </span>
        </div>

        <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight leading-[1.1] text-white">
          Amazon's New AI is Stealing <br />
          <span className="bg-gradient-to-r from-brand-orange via-brand-violet to-brand-cyan bg-clip-text text-transparent">
            60% of Your Warmest Traffic.
          </span>
        </h1>
        
        <p className="font-sans text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
          Helium 10 keyword stuffing is dead. Amazon <strong className="text-white">Rufus</strong> uses semantic intelligence to steer high-intent buyers to listings that answer their exact needs. If your listing isn't COSMO-optimized, you are invisible.
        </p>

        {/* Lead Magnet Free Scan Console */}
        <div className="max-w-xl mx-auto p-2.5 glass-card border-brand-bg-border shadow-2xl relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-orange to-brand-violet rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 -z-10" />
          
          <form onSubmit={handleScan} className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="flex items-center gap-2 px-4 py-3 flex-1 w-full bg-slate-950/60 rounded-xl border border-white/5">
              <Search className="h-5 w-5 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="ENTER ASIN (e.g. B0C8XYZ123)"
                value={asin}
                onChange={(e) => setAsin(e.target.value.slice(0, 10))}
                className="bg-transparent border-none outline-none font-mono text-sm w-full text-slate-100 placeholder-slate-500 uppercase tracking-widest font-bold"
                required
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <select
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value)}
                className="bg-slate-950/60 border border-white/5 rounded-xl px-3 py-3 text-sm font-black text-slate-350 outline-none"
              >
                <option value="US">US</option>
                <option value="UK">UK</option>
                <option value="DE">DE</option>
                <option value="CA">CA</option>
              </select>

              <button
                type="submit"
                className="btn-premium flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-black text-white shadow-glow-orange shrink-0 uppercase tracking-wide"
              >
                <span>SCAN FREE</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleQuickDemo}
            className="btn-secondary-glow flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-brand-violet-glow"
          >
            <span>Scan Mock Supplement (1-Second Demo)</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* SECTION 2: THE PROBLEM (Three Punchy Truths) */}
      <div className="space-y-10 border-t border-brand-bg-border pt-16">
        <div className="text-center space-y-2">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
            Why Your Current Listing is Bleeding Cash Right Now
          </h2>
          <p className="text-xs text-slate-450 uppercase font-bold tracking-wider">The three hard truths Helium 10 won't tell you</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border-brand-bg-border space-y-4">
            <div className="h-10 w-10 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h3 className="font-display font-bold text-base text-white">1. Keyword stuffing is dead</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Amazon's AI does not match keywords anymore. It reads **semantic embeddings**. If your title is a collection of comma-separated search words, Rufus flags it as spam and hides it.
            </p>
          </div>

          <div className="glass-card p-6 border-brand-bg-border space-y-4">
            <div className="h-10 w-10 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange rounded-xl flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="font-display font-bold text-base text-white">2. Rufus talks to your buyers</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              When customers ask Rufus *"is this serum safe for sensitive acne skin,"* Rufus scans your listing for cellular-level answers. If you only write general marketing fluff, Rufus recommends your competitor.
            </p>
          </div>

          <div className="glass-card p-6 border-brand-bg-border space-y-4">
            <div className="h-10 w-10 bg-brand-violet/10 border border-brand-violet/20 text-brand-violet rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-display font-bold text-base text-white">3. COSMO defines relationship connections</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              COSMO connects products to daily routines. If your sleep aid listing doesn't specify *when* and *how* it integrates into a night-time routine, COSMO locks you out of search clusters.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: THE GRAND SLAM VALUE OFFER (Alex Hormozi style value stack) */}
      <div className="bg-gradient-to-br from-[#151B26]/80 to-brand-bg-card/30 p-8 md:p-12 rounded-3xl border border-brand-bg-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-orange/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-violet/5 rounded-full blur-3xl -z-10" />
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          <div className="lg:col-span-3 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-violet/15 border border-brand-violet/20 text-brand-violet text-[10px] font-black uppercase tracking-widest rounded-full">
              THE NO-BRAINER OFFER
            </div>
            
            <h3 className="font-display font-extrabold text-3xl md:text-4xl text-white tracking-tight leading-tight">
              Get the Grand Slam Optimization Bundle <br />
              <span className="bg-gradient-to-r from-brand-orange to-brand-violet bg-clip-text text-transparent">
                For Just $99/Month
              </span>
            </h3>
            
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-medium">
              Stop losing 60% of your warm traffic to optimized competitors. Lock in our complete AI-native engine to rewrite, audit, and audit your entire health and beauty product catalog.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 font-bold select-none">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-brand-cyan shrink-0" />
                <span>7-Agent AI Listing Rewrite Engine ($499 Value)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-brand-cyan shrink-0" />
                <span>24-Dimension COSMO Intent Gap Audit ($299 Value)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-brand-cyan shrink-0" />
                <span>Interactive Rufus Chat Simulator ($199 Value)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-brand-cyan shrink-0" />
                <span>Competitor Intent Defensibility Benchmark ($299 Value)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-brand-cyan shrink-0" />
                <span>SP-API 1-Click Publisher ($199 Value)</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 glass-card p-6 border-brand-bg-border bg-slate-950/80 rounded-2xl flex flex-col justify-between text-center relative border-2 border-brand-orange/30 shadow-glow-orange min-h-[300px]">
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-brand-orange/20 text-brand-orange text-[8px] font-black uppercase tracking-wider rounded">
              POPULAR CHOICES
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">TOTAL VALUE: $1,495</div>
              <div className="text-4xl font-black text-white">$99 <span className="text-xs text-slate-450 font-normal">/ month</span></div>
              <p className="text-[10px] text-slate-400">Includes 100 ASIN Scans & 1-Click Publishing</p>
            </div>

            <div className="space-y-3 mt-6">
              <button 
                onClick={handleQuickDemo}
                className="btn-premium w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black text-white shadow-glow-orange uppercase tracking-wider"
              >
                <span>GET STARTED NOW</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="text-[9px] text-slate-500 flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" />
                <span>Secure Checkout. Cancel anytime.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: IRONCLAD GUARANTEE */}
      <div className="glass-card p-8 border border-red-500/20 bg-red-500/5 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6 select-none max-w-4xl mx-auto">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl" />
        <div className="h-16 w-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
          <Zap className="h-8 w-8 animate-pulse" />
        </div>
        
        <div className="space-y-2 flex-1 text-center md:text-left">
          <h3 className="font-display font-extrabold text-xl text-white tracking-tight">
            Our Double-Your-Score or Pay-Nothing Guarantee
          </h3>
          <p className="text-xs text-slate-350 leading-relaxed font-medium">
            If your listing’s calculated Rufus Compatibility Score does not increase by at least <strong className="text-white">20 points</strong> or your organic recommendation index does not double in 14 days, send us an email. We will refund every penny. No questions asked. <strong className="text-red-400">And you keep all optimized listing copies.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
