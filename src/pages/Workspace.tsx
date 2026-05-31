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
    <div className="space-y-8 select-none py-2 font-sans text-brand-dark">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[3px] border-brand-dark pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2.5 border-[3px] border-brand-dark bg-white text-brand-dark hover:bg-brand-gold transition-all shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] font-black px-2 py-0.5 bg-brand-dark text-white border-2 border-brand-dark uppercase tracking-widest">
                {asin}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-brand-blue text-white border-2 border-brand-dark text-[9px] font-black uppercase tracking-wider font-mono shadow-brutal-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                SP-API PROTOCOL ACTIVE
              </span>
            </div>
            <h2 className="display-heading text-xl md:text-2xl text-brand-dark mt-2 tracking-wide">
              Liposomal Magnesium L-Threonate Complex Optimization Hub
            </h2>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="brutalist-btn flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-black uppercase shadow-brutal hover:-translate-x-[1px] hover:-translate-y-[1px] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Syncing core...' : 'Publish to SP-API'}</span>
          </button>
        </div>
      </div>

      {/* Main Score Overview & Visual Radar Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* THE BUYER ALIGNMENT SCORE */}
        <div className="brutalist-card p-6 bg-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[6px] bg-brand-red" />
          
          <h3 className="font-display font-black text-[10px] text-brand-red uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono mt-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>THE RUFUS BUY INTENT SCORE</span>
          </h3>
          
          <div className="flex items-center justify-around gap-4 py-4">
            <ScoreGauge score={58} label="Invisible to AI" size={105} />
            <div className="flex flex-col items-center justify-center font-black font-mono text-brand-dark">
              <span className="text-brand-red text-xl font-display font-black">+34</span>
              <span className="text-[8px] text-brand-dark/50 uppercase tracking-widest">Score Boom</span>
              <div className="h-[2px] w-6 bg-brand-dark my-2" />
              <Zap className="h-4 w-4 text-brand-gold animate-bounce" />
            </div>
            <ScoreGauge score={sandboxScore} label="COSMO ALIGNED" size={105} />
          </div>

          <div className="text-center text-xs text-brand-dark border-t-[2px] border-brand-dark/10 pt-4 font-bold leading-relaxed font-sans mt-2">
            The Offer Stack: We <strong className="text-brand-blue font-black uppercase">obliterated 92% of your profit leaks</strong>. Rufus can now rank you as the #1 gentle-on-the-stomach solution.
          </div>
        </div>

        {/* Custom SVG Radar Chart */}
        <div className="lg:col-span-2">
          <RadarChart size={300} />
        </div>
      </div>

      {/* Mode navigation tabs */}
      <div className="flex bg-brand-bg p-1 border-[3px] border-brand-dark rounded-none w-fit overflow-x-auto max-w-full scrollbar-none select-none">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-2 text-[9px] uppercase font-black tracking-wider px-5 py-2.5 transition-all border-[2px] font-display ${
            activeTab === 'editor'
              ? 'bg-white border-brand-dark text-brand-dark shadow-brutal-sm'
              : 'border-transparent text-brand-dark/50 hover:text-brand-dark'
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Listing Re-Engineering Console</span>
        </button>
        <button
          onClick={() => setActiveTab('radar')}
          className={`flex items-center gap-2 text-[9px] uppercase font-black tracking-wider px-5 py-2.5 transition-all border-[2px] font-display ${
            activeTab === 'radar'
              ? 'bg-white border-brand-dark text-brand-dark shadow-brutal-sm'
              : 'border-transparent text-brand-dark/50 hover:text-brand-dark'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>24-Dimension Gap Analysis (Profit Leaks)</span>
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 text-[9px] uppercase font-black tracking-wider px-5 py-2.5 transition-all border-[2px] font-display ${
            activeTab === 'simulator'
              ? 'bg-white border-brand-dark text-brand-dark shadow-brutal-sm'
              : 'border-transparent text-brand-dark/50 hover:text-brand-dark'
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Original Frame */}
            <div className="brutalist-card p-6 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b-[2px] border-brand-dark pb-3 mb-4">
                  <span className="text-[10px] font-black text-brand-red uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <AlertTriangle className="h-4 w-4" />
                    Original Listing Copy
                  </span>
                  <span className="text-[8px] text-brand-dark/50 font-black uppercase tracking-wider font-mono">ASIN Source Data</span>
                </div>
                <div className="space-y-4 font-sans text-xs">
                  <div>
                    <h5 className="text-[9px] text-brand-dark/55 font-black uppercase tracking-wider mb-1.5 font-mono">Product Title</h5>
                    <p className="text-xs text-brand-dark/80 bg-brand-bg/40 p-3.5 border-2 border-brand-dark/20 leading-relaxed">
                      Magnesium L-Threonate capsules, 2000mg complex pill supplement for relaxation, sleep support. High strength magnesium threonate for adults.
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[9px] text-brand-dark/55 font-black uppercase tracking-wider mb-1.5 font-mono">Bullet Point 1 (Absorption)</h5>
                    <p className="text-xs text-brand-dark/80 bg-brand-bg/40 p-3.5 border-2 border-brand-dark/20 leading-relaxed">
                      Our magnesium threonate complex pills are high quality supplements. Standard tablets are easy to take and provide daily support for health.
                    </p>
                  </div>
                  <div>
                    <h5 className="text-[9px] text-brand-dark/55 font-black uppercase tracking-wider mb-1.5 font-mono">Product Description (Semantic)</h5>
                    <p className="text-xs text-brand-dark/80 bg-brand-bg/40 p-3.5 border-2 border-brand-dark/20 leading-relaxed">
                      Standard magnesium complex tablets. Formulated for adults seeking magnesium threonate health assistance. Please consult a doctor before using standard pills daily.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Re-Engineered Frame */}
            <div className="brutalist-card p-6 bg-white flex flex-col justify-between relative">
              <div className="absolute top-0 right-0 w-full h-[6px] bg-brand-blue" />
              <div>
                <div className="flex items-center justify-between border-b-[2px] border-brand-dark pb-3 mb-4 mt-2">
                  <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <Sparkles className="h-4 w-4 text-brand-blue" />
                    AI-Optimized & Re-Engineered Copy
                  </span>
                  <span className="text-[9px] text-brand-blue font-black uppercase tracking-wider font-mono">Predictive Score: {sandboxScore}</span>
                </div>
                <div className="space-y-4 font-sans text-xs">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <h5 className="text-[9px] text-brand-dark/60 font-black uppercase tracking-wider font-mono">Optimized Title</h5>
                      <button 
                        onClick={() => handleCopy('Liposomal Magnesium L-Threonate Complex - 2000mg Maximum Cellular Absorption', 'title')}
                        className="text-brand-dark/40 hover:text-brand-dark p-1 rounded"
                      >
                        {copied === 'title' ? <Check className="h-3.5 w-3.5 text-brand-blue stroke-[3]" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-xs text-brand-dark bg-brand-bg/20 p-3.5 border-[3px] border-brand-dark shadow-brutal-sm leading-relaxed font-bold">
                      <span className="bg-brand-blue/15 text-brand-blue px-1 border border-brand-blue/20 font-black">Liposomal Magnesium L-Threonate Complex</span> - 2000mg <span className="bg-brand-blue/15 text-brand-blue px-1 border border-brand-blue/20 font-black">Maximum Cellular Absorption</span> & Cognitive Focus
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <h5 className="text-[9px] text-brand-dark/60 font-black uppercase tracking-wider font-mono">Optimized Bullet 1 (Encapsulated Bio-availability)</h5>
                      <button 
                        onClick={() => handleCopy('Premium Liposomal encapsulation delivers up to 5x higher cellular absorption speed directly crossing the blood-brain barrier.', 'bullet')}
                        className="text-brand-dark/40 hover:text-brand-dark p-1 rounded"
                      >
                        {copied === 'bullet' ? <Check className="h-3.5 w-3.5 text-brand-blue stroke-[3]" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-xs text-brand-dark bg-brand-bg/20 p-3.5 border-[3px] border-brand-dark shadow-brutal-sm leading-relaxed font-bold">
                      <span className="bg-brand-blue/15 text-brand-blue px-1 border border-brand-blue/20 font-black">Premium Liposomal encapsulation</span> protects magnesium molecules, delivering up to <span className="bg-brand-blue/15 text-brand-blue px-1 border border-brand-blue/20 font-black">5x higher cellular absorption speed</span> directly crossing the blood-brain barrier to satisfy advanced Rufus Q&A bio-availability indexes.
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <h5 className="text-[9px] text-brand-dark/60 font-black uppercase tracking-wider font-mono">Interactive Sandbox Console</h5>
                      <span className="text-[8px] text-brand-dark/50 uppercase font-black tracking-wider italic font-mono">Type below to trigger real-time neural mapping</span>
                    </div>
                    <textarea
                      rows={4}
                      value={sandboxText}
                      onChange={(e) => handleSandboxChange(e.target.value)}
                      className="text-xs text-brand-dark bg-white p-3.5 border-[3px] border-brand-dark focus:border-brand-blue outline-none resize-none font-mono shadow-brutal-sm rounded-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEMANTIC GAPS */}
        {activeTab === 'radar' && (
          <div className="brutalist-card p-0 bg-white overflow-hidden">
            <div className="border-b-[3px] border-brand-dark p-4 bg-brand-bg flex justify-between items-center">
              <span className="text-[10px] font-black text-brand-dark uppercase tracking-widest font-display">Calculated Semantic Intent Gaps (COSMO Engine)</span>
              <span className="text-[9px] text-brand-dark/50 font-black uppercase tracking-wider font-mono">Sorted by gap severity</span>
            </div>
            
            <div className="divide-y-[3px] divide-brand-dark font-sans text-xs bg-white">
              {semanticGaps.map((gap, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-brand-bg/20 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-display font-black text-sm tracking-wider text-brand-dark uppercase">{gap.dimension}</h4>
                      
                      {gap.priority === 'critical' && (
                        <span className="px-2 py-0.5 bg-brand-red text-white border-2 border-brand-dark text-[8px] font-black uppercase tracking-wider rounded-none font-mono shadow-brutal-sm">
                          Critical Gap
                        </span>
                      )}
                      {gap.priority === 'high' && (
                        <span className="px-2 py-0.5 bg-brand-gold text-brand-dark border-2 border-brand-dark text-[8px] font-black uppercase tracking-wider rounded-none font-mono shadow-brutal-sm">
                          High
                        </span>
                      )}
                      {gap.priority === 'medium' && (
                        <span className="px-2 py-0.5 bg-brand-blue text-white border-2 border-brand-dark text-[8px] font-black uppercase tracking-wider rounded-none font-mono shadow-brutal-sm">
                          Medium
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-dark/80 leading-relaxed max-w-2xl font-bold">
                      {gap.recommendation}
                    </p>
                  </div>
                  
                  {/* Stats comparison */}
                  <div className="flex items-center gap-6 shrink-0 font-mono text-xs border-l-0 sm:border-l-[2px] sm:border-brand-dark/10 sm:pl-6">
                    <div className="text-center w-16">
                      <div className="text-[8px] text-brand-dark/50 uppercase font-black tracking-wider">ORIGINAL</div>
                      <div className="text-xs font-black text-brand-red">{gap.original}%</div>
                    </div>
                    <div className="text-center w-16">
                      <div className="text-[8px] text-brand-dark/50 uppercase font-black tracking-wider">OPTIMIZED</div>
                      <div className="text-xs font-black text-brand-blue">{gap.optimized}%</div>
                    </div>
                    <div className="text-center w-16">
                      <div className="text-[8px] text-brand-dark/50 uppercase font-black tracking-wider">BOOM</div>
                      <div className="text-xs font-black text-brand-red">+{gap.gap}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* QA Selector */}
            <div className="brutalist-card p-4 bg-white h-fit space-y-4">
              <h4 className="text-[9px] text-brand-dark/50 font-black uppercase tracking-wider pb-2 border-b-[2px] border-brand-dark font-mono">
                RUFUS CONVERSATIONAL TOPICS
              </h4>
              <div className="space-y-3">
                {simulatorQAs.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveQA(idx)}
                    className={`w-full text-left p-3.5 border-[3px] transition-all font-sans font-bold text-xs leading-relaxed ${
                      activeQA === idx
                        ? 'bg-brand-gold border-brand-dark text-brand-dark shadow-brutal-sm'
                        : 'bg-white border-brand-dark/20 text-brand-dark/65 hover:text-brand-dark hover:border-brand-dark/50'
                    }`}
                  >
                    {item.q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Device Simulator */}
            <div className="lg:col-span-2 brutalist-card bg-white p-0 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-[6px] bg-brand-gold" />
              
              {/* Device Header */}
              <div className="bg-brand-bg p-4 border-b-[3px] border-brand-dark flex items-center justify-between mt-[6px]">
                <div className="flex items-center gap-3">
                  {/* Stark Bauhaus Logo */}
                  <div className="h-8 w-8 bg-brand-dark flex items-center justify-center border-2 border-brand-dark">
                    <div className="h-3 w-3 bg-brand-blue rotate-45" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-[11px] text-brand-dark tracking-wide uppercase">OPTIMUS AI CORE</h4>
                    <p className="text-[8px] text-brand-blue font-black uppercase tracking-wider font-mono">Conversational Simulator</p>
                  </div>
                </div>
                
                <span className="text-[8px] text-brand-dark/60 font-black uppercase font-mono bg-white px-2 py-0.5 border-2 border-brand-dark shadow-brutal-sm">
                  SPY TOOL SIMULATION
                </span>
              </div>

              {/* Chat messages pane */}
              <div className="p-6 space-y-6 min-h-[300px] font-sans text-xs bg-white">
                {/* User Bubble */}
                <div className="flex justify-end">
                  <div className="bg-brand-blue text-white border-[3px] border-brand-dark shadow-brutal-sm rounded-none px-4 py-3 text-xs max-w-sm font-bold uppercase tracking-wide">
                    {simulatorQAs[activeQA].q}
                  </div>
                </div>

                {/* Compare response splits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Old Response Box */}
                  <div className="bg-brand-red/5 border-[3px] border-brand-dark p-4 space-y-2 relative">
                    <div className="text-[9px] font-black text-brand-red uppercase tracking-wider font-mono">Rufus Response (Old Listing)</div>
                    <p className="text-xs text-brand-dark/80 leading-relaxed italic font-bold">
                      &quot;{simulatorQAs[activeQA].original}&quot;
                    </p>
                    <div className="text-[9px] text-brand-red font-black font-mono uppercase">Verdict: Suggests competitors instead.</div>
                  </div>

                  {/* Optimized Response Box */}
                  <div className="bg-brand-blue/5 border-[3px] border-brand-dark p-4 space-y-2 relative shadow-brutal-sm">
                    <div className="text-[9px] font-black text-brand-blue uppercase tracking-wider flex items-center gap-1 font-mono">
                      <Sparkles className="h-3.5 w-3.5 text-brand-blue" />
                      Rufus Response (Optimized Listing)
                    </div>
                    <p className="text-xs text-brand-dark leading-relaxed font-bold">
                      &quot;{simulatorQAs[activeQA].optimized}&quot;
                    </p>
                    <div className="text-[9px] text-brand-blue font-black font-mono uppercase">Verdict: Direct Product Recommendation &amp; Citation lock.</div>
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
