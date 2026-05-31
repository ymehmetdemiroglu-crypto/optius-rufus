import { useState } from 'react';
import { 
  BarChart3, 
  HelpCircle, 
  Sparkles, 
  TrendingUp, 
  Search, 
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react';

interface CompetitorData {
  asin: string;
  brand: string;
  title: string;
  price: number;
  score: number;
  gapOffset: number;
  isClient?: boolean;
}

const mockCompetitors: CompetitorData[] = [
  {
    asin: 'B0C8XYZ123',
    brand: 'NootroCell Labs',
    title: 'Liposomal Magnesium L-Threonate Complex - 2000mg Maximum Absorption',
    price: 34.99,
    score: 92,
    gapOffset: 0,
    isClient: true,
  },
  {
    asin: 'B0C7UVW999',
    brand: 'MagEnhanced Science',
    title: 'Magnesium L-Threonate Cognition Capsules - Ultra Absorbency Supplement',
    price: 38.50,
    score: 88,
    gapOffset: -4,
  },
  {
    asin: 'B0B9PQR555',
    brand: 'Pure Encapsulations',
    title: 'Magnesium L-Threonate - Cognitive Health and Sleep Support Formula',
    price: 45.00,
    score: 72,
    gapOffset: -20,
  },
  {
    asin: 'B0A8DEF222',
    brand: 'Nature Made',
    title: 'Magnesium Supplement Capsules - 250mg Standard Daily Serving',
    price: 14.99,
    score: 42,
    gapOffset: -50,
  }
];

export default function Competitors() {
  const [competitors, setCompetitors] = useState<CompetitorData[]>(mockCompetitors);

  return (
    <div className="space-y-8 select-none">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-3xl text-white tracking-tight">
            Competitor Intent Benchmark
          </h2>
          <p className="text-sm text-slate-400">
            Compare your Rufus recommendation score against top niche competitors
          </p>
        </div>
      </div>

      {/* Grid Comparison View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Niche Dominance Index */}
        <div className="glass-card p-6 border-brand-bg-border relative flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 rounded-full blur-2xl" />
          
          <h4 className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mb-2">
            NICHE DOMINANCE INDEX
          </h4>
          
          <div>
            <div className="text-4xl font-black text-white">#1 Rank</div>
            <div className="text-xs text-brand-cyan font-semibold mt-1">Leading Nootropic Magnesium Niche</div>
          </div>

          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            Your ASIN currently ranks at the top of the vector mapping domain after applying the Liposomal bio-availability re-engineering frameworks.
          </p>
          
          <div className="mt-4 pt-4 border-t border-brand-bg-border flex items-center gap-2 text-[10px] text-emerald-500 font-bold">
            <TrendingUp className="h-4 w-4" />
            <span>EXCEEDS NICHE MEAN BY +26%</span>
          </div>
        </div>

        {/* Competitor list bar graph comparison */}
        <div className="md:col-span-2 glass-card p-6 border-brand-bg-border space-y-4">
          <h4 className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
            RUFUS COMPATIBILITY COMPARISON
          </h4>

          <div className="space-y-4">
            {competitors.map((comp) => (
              <div key={comp.asin} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      comp.isClient ? 'bg-brand-orange/20 text-brand-orange' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {comp.asin}
                    </span>
                    <span className="font-semibold text-slate-200">{comp.brand}</span>
                    {comp.isClient && <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-wider">(Your Brand)</span>}
                  </div>
                  <span className="font-bold text-slate-300">{comp.score} / 100</span>
                </div>
                
                {/* Visual score bar */}
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      comp.isClient 
                        ? 'bg-gradient-to-r from-brand-orange to-brand-cyan shadow-glow-orange'
                        : comp.score >= 80 
                          ? 'bg-brand-violet' 
                          : comp.score >= 50 
                            ? 'bg-slate-700' 
                            : 'bg-red-500/80'
                    }`}
                    style={{ width: `${comp.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed comparison list */}
      <div className="glass-card border-brand-bg-border overflow-hidden">
        <div className="p-4 border-b border-brand-bg-border bg-slate-950/40 flex justify-between items-center">
          <span className="text-xs font-bold text-white uppercase tracking-widest">Niche Competitors breakdown</span>
          <span className="text-[10px] text-slate-550 font-semibold flex items-center gap-1">
            <Info className="h-3 w-3" />
            Scores reflect Rufus recommendation probability
          </span>
        </div>

        <div className="divide-y divide-brand-bg-border">
          {competitors.map((comp) => (
            <div key={comp.asin} className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/2 transition-colors ${
              comp.isClient ? 'bg-brand-orange/5' : ''
            }`}>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-display font-bold text-sm text-slate-200 leading-snug">{comp.title}</h4>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-slate-450 font-semibold uppercase tracking-wider">
                  <span>ASIN: {comp.asin}</span>
                  <span>•</span>
                  <span>Brand: {comp.brand}</span>
                  <span>•</span>
                  <span>Price: ${comp.price}</span>
                </div>
              </div>

              {/* Offset score stats */}
              <div className="flex items-center gap-8 shrink-0">
                <div className="text-right">
                  <div className="text-[9px] text-slate-550 uppercase font-bold tracking-wider">Rufus Score</div>
                  <div className="text-lg font-black text-white">{comp.score}</div>
                </div>

                <div className="w-24 text-right">
                  {comp.gapOffset === 0 ? (
                    <span className="text-emerald-500 text-xs font-extrabold flex items-center justify-end gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Leader
                    </span>
                  ) : (
                    <span className="text-red-500 text-xs font-semibold flex items-center justify-end gap-1">
                      <TrendingDown className="h-3.5 w-3.5" />
                      {comp.gapOffset} pts
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
