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
    <div className="max-w-4xl mx-auto space-y-8 select-none py-8 font-sans text-brand-dark">
      
      {/* Header HUD */}
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center border-[3px] border-brand-dark bg-white shadow-brutal">
          <Cpu className="h-6 w-6 text-brand-blue" />
        </div>
        
        <div>
          <h2 className="display-heading text-xl md:text-2xl text-brand-dark">
            ORCHESTRATION PIPELINE ENGAGED
          </h2>
          <p className="text-[10px] font-mono mt-2 uppercase text-brand-dark/70 font-black">
            Core Target: <span className="font-mono bg-brand-dark text-white px-2 py-0.5 border border-brand-dark">{asin}</span> 
            <span className="mx-2">•</span> 
            Marketplace Domain: <span className="text-brand-blue font-bold font-mono">{marketplace}</span>
          </p>
        </div>
      </div>

      {/* Main Execution Core Tracker */}
      <PipelineTracker
        currentStage={currentStage}
        status={status}
        logs={logs}
      />
    </div>
  );
}
