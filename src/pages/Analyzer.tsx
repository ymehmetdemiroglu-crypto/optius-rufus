import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PipelineTracker from '../components/PipelineTracker';
import { Cpu } from 'lucide-react';

const mockLogs: Record<number, string[]> = {
  0: [
    '[SP-API Retrieval] Connection initialized to Amazon SP-API OAuth protocols...',
    '[SP-API Retrieval] Staging GET /catalog/2022-04-01/items/B0C8XYZ123...',
    '[SP-API Retrieval] Metadata lock: Title "Liposomal Magnesium L-Threonate Complex..." successfully retrieved.',
    '[SP-API Retrieval] Pulled raw listing attributes, 5 bullet points, and 3 image OCR buffers.'
  ],
  1: [
    '[Preprocessor] Compressing string patterns and stripping junk character nodes...',
    '[Preprocessor] Standardizing catalog domain categories to "Health & Supplements"...',
    '[Preprocessor] Formatted raw text index of 1,280 words.',
    '[Preprocessor] Staging payload structures to active local context stack.'
  ],
  2: [
    '[Neural Embedder] Generating high-dimensional vector representations via OpenAI embedding models...',
    '[Neural Embedder] Mapping catalog attributes to 1536-dimensional float arrays...',
    '[Neural Embedder] Connecting semantic embeddings to self-hosted Qdrant Vector base...',
    '[Neural Embedder] Core representation successfully indexed.'
  ],
  3: [
    '[Semantic Domain Evaluation] Calculating cosine similarity indices against COSMO knowledge clusters...',
    '[Semantic Domain Evaluation] Evaluating 24 dimensions of human buyer behaviors...',
    '[Semantic Domain Evaluation] Profit Gaps identified: [Cellular Absorption Speed], [Clinical Proof], [Routine Context].',
    '[Semantic Domain Evaluation] Rufus Intent Alignment computed: 58/100.'
  ],
  4: [
    '[AI Syntax Orchestration] Staging Title and Bullet Re-Engineering sequence...',
    '[AI Syntax Orchestration] Applying Alex Hormozi copywriting frameworks...',
    '[AI Syntax Orchestration] Bullet 1 rewritten: Focus on encapsulated liposomal absorption value.',
    '[AI Syntax Orchestration] Optimized copy block packaged.'
  ],
  5: [
    '[Competitive Map Alignment] Crawling top 5 niche competitors inside Magnesium domain...',
    '[Competitive Map Alignment] Mapping competitor vector alignment grids...',
    '[Competitive Map Alignment] Benchmark locked: Competitor "MagEnhanced" leads domain with 88 score.',
    '[Competitive Map Alignment] Calculated gap delta offset: -30 pts.'
  ],
  6: [
    '[Elite Core Compliance] Initiating syntax integrity and SP-API restriction check...',
    '[Elite Core Compliance] Projecting post-optimization score boost: +34 score uplift.',
    '[Elite Core Compliance] APPROVED: Zero compliance breaches. Core unlocked.',
    '[System Orchestrator] Staging target optimization files. Initiating compilation...'
  ]
};

export default function Analyzer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState(0);
  const [status, setStatus] = useState<'running' | 'completed' | 'idle' | 'failed'>('running');
  const [logs, setLogs] = useState<string[]>([]);
  
  const asin = searchParams.get('asin') || 'B0C8XYZ123';
  const marketplace = searchParams.get('marketplace') || 'US';

  useEffect(() => {
    let timer: any;
    
    const runStage = (stageNum: number) => {
      if (stageNum >= 7) {
        setStatus('completed');
        timer = setTimeout(() => {
          navigate(`/workspace/${asin}`);
        }, 1500);
        return;
      }

      setCurrentStage(stageNum);
      const stageLogs = mockLogs[stageNum] || [];
      
      let logIndex = 0;
      const addLog = () => {
        if (logIndex < stageLogs.length) {
          setLogs((prev) => [...prev, stageLogs[logIndex]]);
          logIndex++;
          timer = setTimeout(addLog, 400);
        } else {
          timer = setTimeout(() => {
            runStage(stageNum + 1);
          }, 800);
        }
      };
      
      addLog();
    };

    runStage(0);

    return () => {
      clearTimeout(timer);
    };
  }, [asin, navigate]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 select-none py-8 font-sans text-slate-350">
      
      {/* Header HUD */}
      <div className="text-center space-y-3">
        <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-bg-card border border-brand-bg-border shadow-glow-crimson animate-pulse">
          {/* Hexagonal Reactor Icon */}
          <svg 
            viewBox="0 0 100 100" 
            className="absolute inset-0 h-full w-full stroke-brand-crimson fill-none stroke-[8]"
          >
            <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" />
          </svg>
          <Cpu className="h-4.5 w-4.5 text-brand-cyan" />
        </div>
        
        <div>
          <h2 className="font-display font-bold text-xs text-white tracking-[0.2em] uppercase">
            ORCHESTRATION PIPELINE ENGAGED
          </h2>
          <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase">
            Core Target: <span className="font-bold text-brand-crimson font-mono tracking-widest">{asin}</span> 
            <span className="mx-2">•</span> 
            Marketplace Domain: <span className="font-bold text-brand-cyan font-mono">{marketplace}</span>
          </p>
        </div>
      </div>

      {/* Main Execution Core Tracker */}
      <PipelineTracker
        currentStage={currentStage}
        status={status}
        logs={logs}
      />

      {/* Visual background atmospheric effects */}
      <div className="absolute top-1/4 left-1/2 w-64 h-64 bg-brand-crimson/5 rounded-full blur-3xl -translate-x-1/2 -z-10" />
    </div>
  );
}
