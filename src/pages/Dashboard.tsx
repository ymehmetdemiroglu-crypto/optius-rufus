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
    <div className="space-y-8 select-none">
      {/* HUD Header Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-3xl text-white tracking-tight">
            Seller Catalog Console
          </h2>
          <p className="text-sm text-slate-400">
            Monitor and manage your ASIN portfolio optimization index
          </p>
        </div>

        <button 
          onClick={handleCreate}
          className="btn-premium flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-glow-orange"
        >
          <Plus className="h-4 w-4" />
          <span>New ASIN Analysis</span>
        </button>
      </div>

      {/* Quick Statistics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-5 border-brand-bg-border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-orange" />
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">PORTFOLIO ASINS</div>
          <div className="text-3xl font-black text-white mt-2">3</div>
        </div>

        <div className="glass-card p-5 border-brand-bg-border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-cyan" />
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">AVERAGE RUFUS SCORE</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-white">66.3</span>
            <span className="text-xs text-emerald-550 font-bold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              +15.6
            </span>
          </div>
        </div>

        <div className="glass-card p-5 border-brand-bg-border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">OPTIMIZED PRODUCTS</div>
          <div className="text-3xl font-black text-white mt-2">1</div>
        </div>

        <div className="glass-card p-5 border-brand-bg-border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">NEEDS ATTENTION</div>
          <div className="text-3xl font-black text-white mt-2">1</div>
        </div>
      </div>

      {/* Catalog Grid Filters */}
      <div className="glass-card p-4 border-brand-bg-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:max-w-md bg-slate-950/60 border border-white/5 px-4 py-2.5 rounded-xl">
          <Search className="h-4 w-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search ASIN, Brand, or Title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full text-slate-100 placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="flex bg-slate-950/60 p-1 border border-white/5 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-none">
            {(['all', 'optimized', 'pending', 'needs_attention'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`text-[10px] uppercase font-bold tracking-wider px-3.5 py-2 rounded-lg shrink-0 transition-all ${
                  filter === opt
                    ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/20 shadow-glow-orange'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ASIN Catalog List */}
      <div className="space-y-4">
        {filteredListings.length === 0 ? (
          <div className="glass-card p-12 border-brand-bg-border text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-brand-orange mb-3" />
            <h4 className="font-display font-bold text-base text-slate-350">No Listings Found</h4>
            <p className="text-xs text-slate-500 mt-1">Try resetting your filters or start a new ASIN check.</p>
          </div>
        ) : (
          filteredListings.map((item) => (
            <div 
              key={item.asin}
              onClick={() => navigate(`/workspace/${item.asin}`)}
              className="glass-card glass-card-hover p-6 border-brand-bg-border flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer relative"
            >
              {/* Product Info Block */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-800 rounded text-brand-orange tracking-widest">
                    {item.asin}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{item.brand}</span>
                  <span className="text-[10px] text-slate-500 font-semibold shrink-0">•</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{item.category}</span>
                </div>
                
                <h3 className="font-display font-bold text-base text-white hover:text-brand-orange transition-colors leading-snug line-clamp-2">
                  {item.title}
                </h3>
                
                <div className="text-[11px] text-slate-500">
                  Last Scanned: <span className="font-semibold text-slate-400">{item.lastScanned}</span>
                </div>
              </div>

              {/* Action and Score Metrics */}
              <div className="flex items-center gap-8 shrink-0">
                {/* Score deltas */}
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">Rufus Score</div>
                  <div className="flex items-baseline gap-2 justify-end">
                    <span className="text-2xl font-black text-white">{item.score}</span>
                    {item.score > item.originalScore && (
                      <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
                        +{item.score - item.originalScore}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="w-28 text-right">
                  {item.status === 'optimized' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-cyan/15 border border-brand-cyan/20 rounded-full text-[10px] font-bold text-brand-cyan uppercase tracking-wider shadow-glow-cyan">
                      <CheckCircle2 className="h-3 w-3" />
                      Optimized
                    </span>
                  )}
                  {item.status === 'pending' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-orange/15 border border-brand-orange/20 rounded-full text-[10px] font-bold text-brand-orange uppercase tracking-wider animate-pulse">
                      Pending
                    </span>
                  )}
                  {item.status === 'needs_attention' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/15 border border-red-500/20 rounded-full text-[10px] font-bold text-red-400 uppercase tracking-wider">
                      <AlertTriangle className="h-3 w-3" />
                      Attention
                    </span>
                  )}
                </div>

                <div className="p-2 bg-slate-800/40 border border-white/5 rounded-lg text-slate-400 group-hover:text-brand-orange">
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
