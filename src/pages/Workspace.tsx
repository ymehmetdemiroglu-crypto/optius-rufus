import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ScoreGauge from '../components/ScoreGauge';
import RadarChart from '../components/RadarChart';
import { 
  Sparkles, 
  ArrowLeft, 
  Check, 
  Copy, 
  Cpu, 
  MessageSquare, 
  Save, 
  Zap, 
  BookOpen, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';

interface SemanticGap {
  dimension: string;
  original: number;
  optimized: number;
  gap: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

const semanticGaps: SemanticGap[] = [
  {
    dimension: 'Cellular Absorption Speed',
    original: 28,
    optimized: 92,
    gap: 64,
    priority: 'critical',
    recommendation: 'Specify "Liposomal encapsulation" in bullet 1 to satisfy Rufus bio-availability queries.',
  },
  {
    dimension: 'Clinical Ingredient Proof',
    original: 35,
    optimized: 88,
    gap: 53,
    priority: 'critical',
    recommendation: 'Incorporate 3rd-party laboratory testing percentages into the body copy.',
  },
  {
    dimension: 'Routine Context',
    original: 30,
    optimized: 85,
    gap: 55,
    priority: 'high',
    recommendation: 'Add "take in morning with water" to anchor the product into daily cognitive health routines.',
  },
  {
    dimension: 'Pain Reliever Alignment',
    original: 48,
    optimized: 92,
    gap: 44,
    priority: 'high',
    recommendation: 'Clarify stomach tolerability to answer "does this cause cramps" customer concerns.',
  },
  {
    dimension: 'Target Demographics Persona',
    original: 55,
    optimized: 95,
    gap: 40,
    priority: 'medium',
    recommendation: 'Directly mention "busy professionals" and "students" in the product description.',
  }
];

export default function Workspace() {
  const { asin } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'editor' | 'radar' | 'simulator'>('editor');
  const [copied, setCopied] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sandboxScore, setSandboxScore] = useState(92);
  const [sandboxText, setSandboxText] = useState(
    'Our Liposomal Magnesium L-Threonate complex is engineered for maximum cellular bio-availability. Formulated with pure, clinically tested cognitive-grade threonate, this gentle-on-the-stomach capsule directly crosses the blood-brain barrier to support memory, mental focus, and deep sleep routines.'
  );

  // Rufus Simulator conversation state
  const [activeQA, setActiveQA] = useState(0);
  const simulatorQAs = [
    {
      q: 'Is this magnesium gentle on the stomach?',
      original: 'Based on details, the listing does not specify stomach tolerability or encapsulation type. Some magnesium forms are known to cause discomfort.',
      optimized: 'Yes! According to the listing, this supplement uses Liposomal encapsulation which makes it highly gentle on the stomach and minimizes digestive discomfort.'
    },
    {
      q: 'Does it support focus and memory?',
      original: 'The description mentions "magnesium threonate" but does not supply evidence or details regarding brain health or focus routines.',
      optimized: 'Absolutely. It is formulated with premium L-Threonate which directly crosses the blood-brain barrier to accelerate mental clarity, memory, and cognitive performance.'
    },
    {
      q: 'How does this compare to standard magnesium oxide?',
      original: 'The listing does not contain comparisons or cellular absorption metrics compared to oxide forms.',
      optimized: 'This Liposomal complex provides up to 5x higher cellular absorption speed and bio-availability compared to standard magnesium oxide, as highlighted in their lab results.'
    }
  ];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1200);
  };

  const handleSandboxChange = (text: string) => {
    setSandboxText(text);
    if (!text.toLowerCase().includes('liposomal')) {
      setSandboxScore(72);
    } else if (text.toLowerCase().includes('clinical') && text.toLowerCase().includes('absorption')) {
      setSandboxScore(95);
    } else {
      setSandboxScore(92);
    }
  };

  return (
    <div className="space-y-8 select-none py-2 font-sans text-slate-350">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-bg-border pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 border border-brand-bg-border bg-brand-bg-card/60 rounded-xl text-slate-400 hover:text-slate-200 transition-all hover:bg-brand-bg-card"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-900 border border-white/5 rounded text-brand-crimson tracking-widest uppercase">
                {asin}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-cyan/10 border border-brand-cyan/20 rounded text-[9px] font-bold text-brand-cyan uppercase tracking-wider font-mono">
                <ShieldCheck className="h-3 w-3" />
                SP-API PROTOCOL ACTIVE
              </span>
            </div>
            <h2 className="font-display font-extrabold text-lg md:text-xl text-white tracking-[0.05em] mt-2 uppercase">
              Liposomal Magnesium L-Threonate Complex Optimization Hub
            </h2>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="btn-premium flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-bold text-white shadow-glow-crimson disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Syncing core...' : 'Publish to SP-API'}</span>
          </button>
        </div>
      </div>

      {/* Main Score Overview & Visual Radar Chart Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* THE BUYER ALIGNMENT SCORE */}
        <div className="glass-card p-6 border-brand-bg-border flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-crimson/5 rounded-full blur-2xl" />
          
          <h3 className="font-display font-bold text-[10px] text-brand-crimson uppercase tracking-[0.15em] mb-4 flex items-center gap-1.5 font-mono">
            <Sparkles className="h-3.5 w-3.5 text-brand-crimson" />
            <span>THE RUFUS BUY INTENT SCORE</span>
          </h3>
          
          <div className="flex items-center justify-around gap-4 py-4">
            <ScoreGauge score={58} label="Invisible to AI" size={110} />
            <div className="flex flex-col items-center justify-center font-bold font-mono">
              <span className="text-brand-crimson text-lg">+34</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest">Score Boom</span>
              <div className="h-[1px] w-6 bg-slate-800 my-2" />
              <Zap className="h-3.5 w-3.5 text-brand-crimson animate-pulse" />
            </div>
            <ScoreGauge score={sandboxScore} label="COSMO ALIGNED" size={110} />
          </div>

          <div className="text-center text-xs text-slate-400 border-t border-brand-bg-border pt-4 font-medium leading-relaxed font-sans">
            The Offer Stack: We <strong className="text-brand-cyan">obliterated 92% of your profit leaks</strong>. Rufus can now rank you as the #1 gentle-on-the-stomach solution.
          </div>
        </div>

        {/* Custom SVG Radar Chart */}
        <div className="md:col-span-2">
          <RadarChart size={300} />
        </div>
      </div>

      {/* Mode navigation tabs */}
      <div className="flex bg-[#05070A]/80 p-1 border border-brand-bg-border rounded-xl w-fit overflow-x-auto max-w-full scrollbar-none select-none">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider px-5 py-2.5 rounded-lg shrink-0 transition-all font-display ${
            activeTab === 'editor'
              ? 'bg-brand-crimson/15 text-brand-crimson border border-brand-crimson/20 shadow-glow-crimson'
              : 'text-slate-450 hover:text-slate-200'
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Listing Re-Engineering Console</span>
        </button>
        <button
          onClick={() => setActiveTab('radar')}
          className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider px-5 py-2.5 rounded-lg shrink-0 transition-all font-display ${
            activeTab === 'radar'
              ? 'bg-brand-crimson/15 text-brand-crimson border border-brand-crimson/20 shadow-glow-crimson'
              : 'text-slate-455 hover:text-slate-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>24-Dimension Gap Analysis (Profit Leaks)</span>
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider px-5 py-2.5 rounded-lg shrink-0 transition-all font-display ${
            activeTab === 'simulator'
              ? 'bg-brand-crimson/15 text-brand-crimson border border-brand-crimson/20 shadow-glow-crimson'
              : 'text-slate-455 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Rufus AI Mobile Simulator (Spy Tool)</span>
        </button>
      </div>

      {/* Content display area */}
      <div className="space-y-6">
        
        {/* TAB 1: SPLIT EDITOR */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Original Frame */}
            <div className="glass-card p-6 border-brand-bg-border flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-brand-bg-border pb-3 mb-4">
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <AlertTriangle className="h-4 w-4" />
                    Original Listing Copy
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider font-mono">ASIN Source Data</span>
                </div>
                <div className="space-y-4 font-sans text-xs">
                  <div>
                    <h5 className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 font-mono">Product Title</h5>
                    <p className="text-xs text-slate-400 bg-slate-950/40 p-3.5 rounded-lg border border-red-500/10 leading-relaxed">
                      Magnesium L-Threonate capsules, 2000mg complex pill supplement for relaxation, sleep support. High strength magnesium threonate for adults.
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 font-mono">Bullet Point 1 (Absorption)</h5>
                    <p className="text-xs text-slate-400 bg-slate-950/40 p-3.5 rounded-lg border border-red-500/10 leading-relaxed">
                      Our magnesium threonate complex pills are high quality supplements. Standard tablets are easy to take and provide daily support for health.
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 font-mono">Product Description (Semantic)</h5>
                    <p className="text-xs text-slate-400 bg-slate-950/40 p-3.5 rounded-lg border border-red-500/10 leading-relaxed">
                      Standard magnesium complex tablets. Formulated for adults seeking magnesium threonate health assistance. Please consult a doctor before using standard pills daily.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Re-Engineered Frame */}
            <div className="glass-card p-6 border-brand-bg-border flex flex-col justify-between relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-cyan/5 rounded-full blur-2xl" />
              <div>
                <div className="flex items-center justify-between border-b border-brand-bg-border pb-3 mb-4">
                  <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <Sparkles className="h-4 w-4 text-brand-cyan" />
                    AI-Optimized & Re-Engineered Copy
                  </span>
                  <span className="text-[9px] text-brand-cyan font-bold uppercase tracking-wider font-mono">Predictive Score: {sandboxScore}</span>
                </div>
                <div className="space-y-4 font-sans text-xs">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <h5 className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Optimized Title</h5>
                      <button 
                        onClick={() => handleCopy('Liposomal Magnesium L-Threonate Complex - 2000mg Maximum Cellular Absorption', 'title')}
                        className="text-slate-500 hover:text-slate-350 p-1 rounded"
                      >
                        {copied === 'title' ? <Check className="h-3 w-3 text-brand-cyan" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 bg-slate-950/40 p-3.5 rounded-lg border border-brand-cyan/20 leading-relaxed">
                      <span className="bg-brand-cyan/15 text-brand-cyan px-1 rounded font-semibold">Liposomal Magnesium L-Threonate Complex</span> - 2000mg <span className="bg-brand-cyan/15 text-brand-cyan px-1 rounded font-semibold">Maximum Cellular Absorption</span> & Cognitive Focus
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <h5 className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Optimized Bullet 1 (Encapsulated Bio-availability)</h5>
                      <button 
                        onClick={() => handleCopy('Premium Liposomal encapsulation delivers up to 5x higher cellular absorption speed directly crossing the blood-brain barrier.', 'bullet')}
                        className="text-slate-500 hover:text-slate-350 p-1 rounded"
                      >
                        {copied === 'bullet' ? <Check className="h-3 w-3 text-brand-cyan" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 bg-slate-950/40 p-3.5 rounded-lg border border-brand-cyan/20 leading-relaxed">
                      <span className="bg-brand-cyan/15 text-brand-cyan px-1 rounded font-semibold">Premium Liposomal encapsulation</span> protects magnesium molecules, delivering up to <span className="bg-brand-cyan/15 text-brand-cyan px-1 rounded font-semibold">5x higher cellular absorption speed</span> directly crossing the blood-brain barrier to satisfy advanced Rufus Q&A bio-availability indexes.
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <h5 className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Interactive Sandbox Console</h5>
                      <span className="text-[8px] text-slate-550 uppercase font-bold tracking-wider italic font-mono">Type below to trigger real-time neural mapping</span>
                    </div>
                    <textarea
                      rows={4}
                      value={sandboxText}
                      onChange={(e) => handleSandboxChange(e.target.value)}
                      className="text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-lg border border-brand-cyan/25 focus:border-brand-crimson/40 leading-relaxed w-full outline-none resize-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEMANTIC GAPS */}
        {activeTab === 'radar' && (
          <div className="glass-card border-brand-bg-border overflow-hidden">
            <div className="border-b border-brand-bg-border p-4 bg-slate-950/40 flex justify-between items-center">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest font-display">Calculated Semantic Intent Gaps (COSMO Engine)</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Sorted by gap severity</span>
            </div>
            
            <div className="divide-y divide-brand-bg-border font-sans text-xs">
              {semanticGaps.map((gap, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/2 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h4 className="font-display font-bold text-xs tracking-wider text-slate-200 uppercase">{gap.dimension}</h4>
                      
                      {gap.priority === 'critical' && (
                        <span className="px-2 py-0.5 bg-brand-crimson/10 border border-brand-crimson/20 text-[8px] font-bold uppercase tracking-wider text-brand-crimson rounded font-mono">
                          Critical Gap
                        </span>
                      )}
                      {gap.priority === 'high' && (
                        <span className="px-2 py-0.5 bg-brand-orange/10 border border-brand-orange/20 text-[8px] font-bold uppercase tracking-wider text-brand-orange rounded font-mono">
                          High
                        </span>
                      )}
                      {gap.priority === 'medium' && (
                        <span className="px-2 py-0.5 bg-brand-cyan/10 border border-brand-cyan/20 text-[8px] font-bold uppercase tracking-wider text-brand-cyan rounded font-mono">
                          Medium
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-450 leading-relaxed max-w-2xl font-medium">
                      {gap.recommendation}
                    </p>
                  </div>
                  
                  {/* Stats comparison */}
                  <div className="flex items-center gap-6 shrink-0 font-mono text-xs">
                    <div className="text-center w-16">
                      <div className="text-[8px] text-slate-550 uppercase font-bold tracking-wider">ORIGINAL</div>
                      <div className="text-xs font-bold text-red-500">{gap.original}%</div>
                    </div>
                    <div className="text-center w-16">
                      <div className="text-[8px] text-slate-550 uppercase font-bold tracking-wider">OPTIMIZED</div>
                      <div className="text-xs font-bold text-brand-cyan">{gap.optimized}%</div>
                    </div>
                    <div className="text-center w-16">
                      <div className="text-[8px] text-slate-550 uppercase font-bold tracking-wider">BOOM</div>
                      <div className="text-xs font-black text-brand-crimson">+{gap.gap}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* QA Selector */}
            <div className="glass-card p-4 border-brand-bg-border h-fit space-y-3">
              <h4 className="text-[9px] text-slate-500 font-bold uppercase tracking-wider pb-2 border-b border-brand-bg-border font-mono">
                RUFUS CONVERSATIONAL TOPICS
              </h4>
              <div className="space-y-2">
                {simulatorQAs.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveQA(idx)}
                    className={`w-full text-left p-3.5 rounded-xl text-xs leading-relaxed transition-all border font-sans ${
                      activeQA === idx
                        ? 'bg-brand-crimson/10 border-brand-crimson/30 text-white font-semibold'
                        : 'bg-slate-950/20 border-white/5 text-slate-400 hover:text-slate-350 hover:bg-slate-950/40'
                    }`}
                  >
                    {item.q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Device Simulator */}
            <div className="md:col-span-2 glass-card border-brand-bg-border rounded-2xl overflow-hidden shadow-2xl relative bg-[#05070A]">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-crimson to-brand-cyan" />
              
              {/* Device Header */}
              <div className="bg-[#0D111A]/90 p-4 border-b border-brand-bg-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Hexagonal Reactor Frame */}
                  <div className="relative flex h-8 w-8 items-center justify-center">
                    <svg 
                      viewBox="0 0 100 100" 
                      className="absolute inset-0 h-full w-full stroke-[#E0E1DD] fill-none stroke-[8]"
                    >
                      <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" />
                    </svg>
                    <div className="h-2 w-2 rounded-full bg-[#E63946] shadow-[0_0_12px_#E63946] animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-[10px] text-white tracking-[0.1em] uppercase">OPTIMUS AI CORE</h4>
                    <p className="text-[8px] text-[#00F5FF] font-bold uppercase tracking-widest font-mono">Conversational Simulator</p>
                  </div>
                </div>
                
                <span className="text-[8px] text-slate-500 font-bold uppercase font-mono bg-slate-950 px-2 py-0.5 rounded border border-white/5">
                  SPY TOOL SIMULATION
                </span>
              </div>

              {/* Chat messages pane */}
              <div className="p-6 space-y-6 min-h-[300px] font-sans text-xs">
                {/* User Bubble */}
                <div className="flex justify-end">
                  <div className="bg-brand-crimson/15 border border-brand-crimson/30 rounded-2xl rounded-tr-none px-4 py-3 text-xs text-slate-200 max-w-sm">
                    {simulatorQAs[activeQA].q}
                  </div>
                </div>

                {/* Compare response splits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Old Response Box */}
                  <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 space-y-2">
                    <div className="text-[9px] font-bold text-red-400 uppercase tracking-widest font-mono">Rufus Response (Old Listing)</div>
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                      "{simulatorQAs[activeQA].original}"
                    </p>
                    <div className="text-[9px] text-red-550 font-bold font-mono">Verdict: Suggests competitors instead.</div>
                  </div>

                  {/* Optimized Response Box */}
                  <div className="bg-brand-cyan/5 border border-brand-cyan/10 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-brand-cyan/5 rounded-full blur-xl" />
                    <div className="text-[9px] font-bold text-brand-cyan uppercase tracking-widest flex items-center gap-1 font-mono">
                      <Sparkles className="h-3 w-3 text-brand-cyan" />
                      Rufus Response (Optimized Listing)
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      "{simulatorQAs[activeQA].optimized}"
                    </p>
                    <div className="text-[9px] text-brand-cyan font-bold font-mono">Verdict: Direct Product Recommendation & Citation lock.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
