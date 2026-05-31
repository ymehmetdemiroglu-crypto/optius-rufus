import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Brain, Search, Cpu, ArrowRight, Zap, Target } from 'lucide-react';

export default function Landing() {
  const [asin, setAsin] = useState('');
  const [marketplace, setMarketplace] = useState('US');
  const navigate = useNavigate();

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asin || asin.length !== 10) return;
    
    // Navigate to analyzer workspace carrying ASIN and marketplace params
    navigate(`/analyzer?asin=${asin.toUpperCase()}&marketplace=${marketplace}`);
  };

  const handleQuickDemo = () => {
    navigate('/analyzer?demo=true');
  };

  return (
    <div className="relative py-12 md:py-20 overflow-hidden select-none">
      {/* Decorative Neon Blurs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-violet/5 rounded-full blur-3xl" />

      {/* Hero Header */}
      <div className="text-center max-w-4xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-brand-orange/20 bg-brand-orange/5 rounded-full mb-6">
          <Sparkles className="h-4 w-4 text-brand-orange animate-pulse" />
          <span className="text-xs text-brand-orange font-semibold uppercase tracking-wider">
            Amazon COSMO & Rufus Optimization Engine
          </span>
        </div>

        <h1 className="font-display font-extrabold text-5xl md:text-6xl tracking-tight leading-[1.1] mb-6">
          Amazon's AI shopping assistant <br />
          <span className="bg-gradient-to-r from-brand-orange via-brand-violet to-brand-cyan bg-clip-text text-transparent">
            doesn't recommend your product.
          </span>
        </h1>
        
        <p className="font-sans text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Rufus uses semantic meaning, not keyword stuffing. We re-engineer your supplements & beauty listings for Amazon's new knowledge graph in under 5 minutes.
        </p>

        {/* Lead Magnet ASIN Console */}
        <div className="max-w-xl mx-auto p-2 glass-card border-brand-bg-border shadow-2xl relative mb-12">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-orange to-brand-violet rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 -z-10" />
          
          <form onSubmit={handleScan} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-3 flex-1 w-full bg-slate-950/60 rounded-xl border border-white/5">
              <Search className="h-5 w-5 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Enter ASIN (e.g. B0C8XYZ123)"
                value={asin}
                onChange={(e) => setAsin(e.target.value.slice(0, 10))}
                className="bg-transparent border-none outline-none font-mono text-sm w-full text-slate-100 placeholder-slate-500 uppercase tracking-widest"
                required
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value)}
                className="bg-slate-950/60 border border-white/5 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 outline-none"
              >
                <option value="US">US</option>
                <option value="UK">UK</option>
                <option value="DE">DE</option>
                <option value="CA">CA</option>
              </select>

              <button
                type="submit"
                className="btn-premium flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white shadow-glow-orange shrink-0"
              >
                <span>SCAN ASIN</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleQuickDemo}
            className="btn-secondary-glow flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-brand-violet hover:text-brand-violet-glow"
          >
            <Cpu className="h-4 w-4" />
            <span>Test with Demo ASIN (Instantly)</span>
          </button>
        </div>
      </div>

      {/* High-Converting Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20">
        <div className="glass-card p-6 border-brand-bg-border relative">
          <div className="absolute top-4 right-4 p-2 bg-brand-orange/5 rounded-lg text-brand-orange">
            <Zap className="h-5 w-5" />
          </div>
          <div className="font-display text-4xl font-black text-white mb-2">+4.2%</div>
          <div className="font-display font-semibold text-sm text-slate-300 mb-1">Median CVR Lift</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Observed conversion rate increase over 90 days after semantic alignment refresh.
          </p>
        </div>

        <div className="glass-card p-6 border-brand-bg-border relative">
          <div className="absolute top-4 right-4 p-2 bg-brand-cyan/5 rounded-lg text-brand-cyan">
            <Target className="h-5 w-5" />
          </div>
          <div className="font-display text-4xl font-black text-white mb-2">60%</div>
          <div className="font-display font-semibold text-sm text-slate-300 mb-1">Higher Purchase Intent</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Rufus conversation buyers demonstrate dramatically higher conversion rates than regular search.
          </p>
        </div>

        <div className="glass-card p-6 border-brand-bg-border relative">
          <div className="absolute top-4 right-4 p-2 bg-brand-violet/5 rounded-lg text-brand-violet">
            <Brain className="h-5 w-5" />
          </div>
          <div className="font-display text-4xl font-black text-white mb-2">24</div>
          <div className="font-display font-semibold text-sm text-slate-300 mb-1">COSMO Intent Profiles</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Deep-dive evaluation of intent dimensions including absorption speed, purity proof, and routines.
          </p>
        </div>
      </div>
    </div>
  );
}
