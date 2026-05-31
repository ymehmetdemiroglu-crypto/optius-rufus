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
    <div className="space-y-8 select-none py-2 text-brand-dark font-sans">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="display-heading text-3xl md:text-4xl text-brand-dark">
            Competitor Intent Benchmark
          </h2>
          <p className="text-sm font-bold uppercase tracking-wider text-brand-dark/70 mt-1">
            Compare your Rufus recommendation score against top niche competitors
          </p>
        </div>
      </div>

      {/* Grid Comparison View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Niche Dominance Index */}
        <div className="brutalist-card p-6 bg-white relative flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[6px] bg-brand-blue" />
          
          <h4 className="text-[10px] text-brand-dark/50 font-black uppercase tracking-widest mb-2 mt-2">
            NICHE DOMINANCE INDEX
          </h4>
          
          <div>
            <div className="text-4xl font-display font-black text-brand-dark uppercase">#1 Rank</div>
            <div className="text-xs text-brand-blue font-black uppercase tracking-wider mt-1.5">Leading Nootropic Magnesium Niche</div>
          </div>

          <p className="text-xs text-brand-dark/80 mt-4 leading-relaxed font-bold">
            Your ASIN currently ranks at the top of the vector mapping domain after applying the Liposomal bio-availability re-engineering frameworks.
          </p>
          
          <div className="mt-4 pt-4 border-t-2 border-brand-dark/10 flex items-center gap-2 text-[10px] text-brand-blue font-black uppercase tracking-wider">
            <TrendingUp className="h-4 w-4" />
            <span>EXCEEDS NICHE MEAN BY +26%</span>
          </div>
        </div>

        {/* Competitor list bar graph comparison */}
        <div className="lg:col-span-2 brutalist-card p-6 bg-white space-y-4 relative">
          <div className="absolute top-0 left-0 w-full h-[6px] bg-brand-gold" />
          <h4 className="text-[10px] text-brand-dark/50 font-black uppercase tracking-widest mt-2">
            RUFUS COMPATIBILITY COMPARISON
          </h4>

          <div className="space-y-4">
            {competitors.map((comp) => (
              <div key={comp.asin} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-black px-2 py-0.5 border-2 border-brand-dark text-[10px] ${
                      comp.isClient ? 'bg-brand-gold text-brand-dark' : 'bg-brand-dark text-white'
                    }`}>
                      {comp.asin}
                    </span>
                    <span className="font-bold text-brand-dark">{comp.brand}</span>
                    {comp.isClient && <span className="text-[9px] font-black text-brand-blue uppercase tracking-wider">(Your Brand)</span>}
                  </div>
                  <span className="font-black text-brand-dark">{comp.score} / 100</span>
                </div>
                
                {/* Visual score bar */}
                <div className="h-4 w-full bg-brand-bg border-[3px] border-brand-dark rounded-none overflow-hidden relative">
                  <div 
                    className={`h-full rounded-none border-r-[3px] border-brand-dark transition-all duration-1000 ${
                      comp.isClient 
                        ? 'bg-brand-gold shadow-brutal-sm'
                        : comp.score >= 80 
                          ? 'bg-brand-blue' 
                          : comp.score >= 50 
                            ? 'bg-brand-bg' 
                            : 'bg-brand-red'
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
      <div className="brutalist-card p-0 bg-white overflow-hidden">
        <div className="p-4 border-b-[3px] border-brand-dark bg-brand-bg flex justify-between items-center">
          <span className="text-xs font-black text-brand-dark uppercase tracking-widest">Niche Competitors breakdown</span>
          <span className="text-[10px] text-brand-dark/65 font-black uppercase flex items-center gap-1 font-mono">
            <Info className="h-3.5 w-3.5 text-brand-blue" />
            Scores reflect Rufus recommendation probability
          </span>
        </div>

        <div className="divide-y-[3px] divide-brand-dark">
          {competitors.map((comp) => (
            <div key={comp.asin} className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-brand-bg/20 transition-colors ${
              comp.isClient ? 'bg-brand-gold/5' : ''
            }`}>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-display font-black text-sm text-brand-dark leading-snug uppercase tracking-wide">{comp.title}</h4>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-brand-dark/60 font-bold uppercase tracking-wider font-mono">
                  <span>ASIN: {comp.asin}</span>
                  <span>•</span>
                  <span>Brand: {comp.brand}</span>
                  <span>•</span>
                  <span>Price: ${comp.price}</span>
                </div>
              </div>

              {/* Offset score stats */}
              <div className="flex items-center gap-8 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-brand-dark/10 pt-3 md:pt-0">
                <div className="text-right">
                  <div className="text-[9px] text-brand-dark/50 font-black uppercase tracking-wider">Rufus Score</div>
                  <div className="text-lg font-display font-black text-brand-dark">{comp.score}</div>
                </div>

                <div className="w-24 text-right">
                  {comp.gapOffset === 0 ? (
                    <span className="text-brand-blue text-xs font-black flex items-center justify-end gap-1 uppercase tracking-wider">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Leader
                    </span>
                  ) : (
                    <span className="text-brand-red text-xs font-black flex items-center justify-end gap-1 uppercase tracking-wider">
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
