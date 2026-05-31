import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  ArrowUpRight, 
  Zap, 
  Filter, 
  Plus, 
  AlertTriangle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

interface MockListing {
  asin: string;
  title: string;
  brand: string;
  category: string;
  score: number;
  originalScore: number;
  status: 'optimized' | 'pending' | 'needs_attention';
  lastScanned: string;
}

const initialListings: MockListing[] = [
  {
    asin: 'B0C8XYZ123',
    title: 'Liposomal Magnesium L-Threonate Complex - 2000mg Maximum Absorption',
    brand: 'NootroCell Labs',
    category: 'Health & Supplements',
    score: 92,
    originalScore: 58,
    status: 'optimized',
    lastScanned: '2026-05-30',
  },
  {
    asin: 'B0D9ABC456',
    title: 'Vitamin C Brightening Facial Serum with Ferulic Acid & PDRN - 30ml',
    brand: 'K-Glow Science',
    category: 'Beauty & Personal Care',
    score: 42,
    originalScore: 42,
    status: 'needs_attention',
    lastScanned: '2026-05-28',
  },
  {
    asin: 'B0E5DEF789',
    title: 'Organic Vegan Pea Protein Powder - Vanilla Bean Keto Blend',
    brand: 'NootroCell Labs',
    category: 'Health & Supplements',
    score: 65,
    originalScore: 52,
    status: 'pending',
    lastScanned: '2026-05-29',
  }
];

export default function Dashboard() {
  const [listings, setListings] = useState<MockListing[]>(initialListings);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'optimized' | 'pending' | 'needs_attention'>('all');
  const navigate = useNavigate();

  const handleCreate = () => {
    navigate('/analyzer');
  };

  const filteredListings = listings.filter((item) => {
    const matchesSearch = item.asin.toLowerCase().includes(search.toLowerCase()) || 
                          item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.brand.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || item.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 select-none py-2 text-brand-dark font-sans">
      {/* HUD Header Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="display-heading text-3xl md:text-4xl text-brand-dark">
            Seller Catalog Console
          </h2>
          <p className="text-sm font-bold uppercase tracking-wider text-brand-dark/70 mt-1">
            Monitor and manage your ASIN portfolio optimization index
          </p>
        </div>

        <button 
          onClick={handleCreate}
          className="brutalist-btn flex items-center justify-center gap-2 px-5 py-3 text-sm font-black uppercase shadow-brutal hover:-translate-x-[2px] hover:-translate-y-[2px]"
        >
          <Plus className="h-4 w-4" />
          <span>New ASIN Analysis</span>
        </button>
      </div>

      {/* Quick Statistics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="brutalist-card p-5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[6px] bg-brand-gold" />
          <div className="text-brand-dark/60 text-[10px] font-black uppercase tracking-widest mt-2">PORTFOLIO ASINS</div>
          <div className="text-4xl font-display font-black text-brand-dark mt-2">3</div>
        </div>

        <div className="brutalist-card p-5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[6px] bg-brand-blue" />
          <div className="text-brand-dark/60 text-[10px] font-black uppercase tracking-widest mt-2">AVERAGE RUFUS SCORE</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-display font-black text-brand-dark">66.3</span>
            <span className="text-xs text-brand-blue font-bold flex items-center gap-0.5 font-mono">
              <TrendingUp className="h-3.5 w-3.5" />
              +15.6
            </span>
          </div>
        </div>

        <div className="brutalist-card p-5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[6px] bg-brand-blue/30" />
          <div className="text-brand-dark/60 text-[10px] font-black uppercase tracking-widest mt-2">OPTIMIZED PRODUCTS</div>
          <div className="text-4xl font-display font-black text-brand-dark mt-2">1</div>
        </div>

        <div className="brutalist-card p-5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[6px] bg-brand-red" />
          <div className="text-brand-dark/60 text-[10px] font-black uppercase tracking-widest mt-2">NEEDS ATTENTION</div>
          <div className="text-4xl font-display font-black text-brand-dark mt-2">1</div>
        </div>
      </div>

      {/* Catalog Grid Filters */}
      <div className="brutalist-card p-4 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:max-w-md bg-brand-bg border-[3px] border-brand-dark px-4 py-2.5 rounded-none">
          <Search className="h-4 w-4 text-brand-dark/70 shrink-0" />
          <input
            type="text"
            placeholder="Search ASIN, Brand, or Title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full text-brand-dark font-mono font-bold uppercase placeholder-brand-dark/40"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="h-4 w-4 text-brand-dark/70 shrink-0" />
          <div className="flex bg-brand-bg p-1 border-[3px] border-brand-dark rounded-none w-full md:w-auto overflow-x-auto scrollbar-none">
            {(['all', 'optimized', 'pending', 'needs_attention'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`text-[9px] uppercase font-black tracking-wider px-3.5 py-2 shrink-0 border-[2px] transition-all ${
                  filter === opt
                    ? 'bg-white border-brand-dark text-brand-dark shadow-brutal-sm'
                    : 'border-transparent text-brand-dark/60 hover:text-brand-dark'
                }`}
              >
                {opt.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ASIN Catalog List */}
      <div className="space-y-6">
        {filteredListings.length === 0 ? (
          <div className="brutalist-card p-12 bg-white text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-brand-gold mb-3" />
            <h4 className="font-display font-black text-lg text-brand-dark uppercase">No Listings Found</h4>
            <p className="text-xs font-bold text-brand-dark/60 mt-1">Try resetting your filters or start a new ASIN check.</p>
          </div>
        ) : (
          filteredListings.map((item) => (
            <div 
              key={item.asin}
              onClick={() => navigate(`/workspace/${item.asin}`)}
              className="brutalist-card brutalist-card-hover p-6 bg-white flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer relative"
            >
              {/* Product Info Block */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-black px-2 py-0.5 bg-brand-dark text-white border-2 border-brand-dark">
                    {item.asin}
                  </span>
                  <span className="text-[10px] text-brand-dark/60 font-black uppercase tracking-wider">{item.brand}</span>
                  <span className="text-[10px] text-brand-dark/40 font-black shrink-0">•</span>
                  <span className="text-[10px] text-brand-dark/60 font-black uppercase tracking-wider">{item.category}</span>
                </div>
                
                <h3 className="display-heading text-lg md:text-xl text-brand-dark hover:text-brand-blue transition-colors leading-tight">
                  {item.title}
                </h3>
                
                <div className="text-[10px] font-bold uppercase tracking-wider text-brand-dark/60">
                  Last Scanned: <span className="font-mono text-brand-dark">{item.lastScanned}</span>
                </div>
              </div>

              {/* Action and Score Metrics */}
              <div className="flex items-center gap-8 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-brand-dark/10 pt-4 md:pt-0">
                {/* Score deltas */}
                <div className="text-right">
                  <div className="text-[9px] text-brand-dark/50 font-black uppercase tracking-wider">Rufus Score</div>
                  <div className="flex items-baseline gap-2 justify-end">
                    <span className="text-3xl font-display font-black text-brand-dark">{item.score}</span>
                    {item.score > item.originalScore && (
                      <span className="text-xs font-black text-brand-blue flex items-center font-mono">
                        +{item.score - item.originalScore}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="w-28 text-right">
                  {item.status === 'optimized' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border-[3px] border-brand-dark text-[9px] font-black text-brand-blue uppercase tracking-wider shadow-brutal-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-blue" />
                      Optimized
                    </span>
                  )}
                  {item.status === 'pending' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-gold border-[3px] border-brand-dark text-[9px] font-black text-brand-dark uppercase tracking-wider shadow-brutal-sm">
                      Pending
                    </span>
                  )}
                  {item.status === 'needs_attention' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-red border-[3px] border-brand-dark text-[9px] font-black text-white uppercase tracking-wider shadow-brutal-sm">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Attention
                    </span>
                  )}
                </div>

                <div className="p-2 border-[3px] border-brand-dark bg-white text-brand-dark shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
