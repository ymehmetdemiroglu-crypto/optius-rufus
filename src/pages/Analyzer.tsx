import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PipelineTracker from '../components/PipelineTracker';
import { Cpu, Terminal, RefreshCw, Sparkles } from 'lucide-react';

const mockLogs: Record<number, string[]> = {
  0: [
    '[Listing Fetcher] Connection initialized to Amazon SP-API OAuth channel...',
    '[Listing Fetcher] Requesting endpoint GET /catalog/2022-04-01/items/B0C8XYZ123...',
    '[Listing Fetcher] Successfully retrieved title: "Liposomal Magnesium L-Threonate Complex..."',
    '[Listing Fetcher] Pulled 5 bullet points, 1 product description, and 3 active images.'
  ],
  1: [
    '[Preprocessor] Executing regex tag stripper and character normalizer...',
    '[Preprocessor] Normalizing category metadata to "Health & Supplements"...',
    '[Preprocessor] Cleaned raw text content of 1,280 words.',
    '[Preprocessor] Data formatted and pushed to context stack.'
  ],
  2: [
    '[Neural Embedder] Generating text embeddings via OpenAI API text-embedding-3-small...',
    '[Neural Embedder] Vector output structured to 1536-dimensional float space.',
    '[Neural Embedder] Successfully populated embedding_generator context.',
    '[Neural Embedder] Pushed intent embeddings to self-hosted Qdrant Vector database.'
  ],
  3: [
    '[Semantic Gap Analyst] Calculating cosine similarity against COSMO knowledge graph spokes...',
    '[Semantic Gap Analyst] Evaluating 24 dimensions of buyer intents...',
    '[Semantic Gap Analyst] Critical Gaps found in: [Cellular Absorption Rate], [Clinical Proof], [Routine Integration].',
    '[Semantic Gap Analyst] Compatibility Score computed: 58/100.'
  ],
  4: [
    '[Content Optimizer] Initiating Title Engineering sequence...',
    '[Content Optimizer] Title re-engineered to capture cellular bio-availability intent.',
    '[Content Optimizer] Re-structuring 5-Bullet Framework addressing top objections...',
    '[Content Optimizer] Bullet 1 rewritten: Focus on Liposomal encapsulation absorption.'
  ],
  5: [
    '[Benchmark Analyst] Crawling top 5 competitor listings within Magnesium niche...',
    '[Benchmark Analyst] Evaluating competitor vector cosine profiles...',
    '[Benchmark Analyst] Benchmark computed: Competitor "MagEnhanced" leads with 88 score.',
    '[Benchmark Analyst] Calculated gap offset delta: -30 score gap identified.'
  ],
  6: [
    '[AI Reviewer] Validating re-engineered copy against compliance criteria...',
    '[AI Reviewer] Evaluating optimization score projection: +34 score uplift.',
    '[AI Reviewer] APPROVED: Zero SP-API warnings found. Ready to export.',
    '[System Orchestrator] Execution sequence complete. Packing report...'
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
  const isDemo = searchParams.get('demo') === 'true';

  useEffect(() => {
    let timer: any;
    
    // Simulate each stage sequentially
    const runStage = (stageNum: number) => {
      if (stageNum >= 7) {
        setStatus('completed');
        timer = setTimeout(() => {
          // Redirect to workspace page
          navigate(`/workspace/${asin}`);
        }, 1500);
        return;
      }

      setCurrentStage(stageNum);
      
      // Accumulate logs
      const stageLogs = mockLogs[stageNum] || [];
      
      // Typewriter-like staggered entry of logs
      let logIndex = 0;
      const addLog = () => {
        if (logIndex < stageLogs.length) {
          setLogs((prev) => [...prev, stageLogs[logIndex]]);
          logIndex++;
          timer = setTimeout(addLog, 400);
        } else {
          // Go to next stage
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
    <div className="max-w-4xl mx-auto space-y-8 select-none py-8">
      {/* Header HUD */}
      <div className="text-center space-y-3">
        <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-orange to-brand-violet shadow-glow-orange animate-pulse">
          <Cpu className="h-6 w-6 text-white" />
        </div>
        
        <div>
          <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
            Running Intent Scanner Sequence
          </h2>
          <p className="text-xs text-slate-400">
            ASIN: <span className="font-mono text-brand-orange font-bold uppercase tracking-widest">{asin}</span> 
            <span className="mx-2">•</span> 
            Marketplace: <span className="font-bold text-brand-cyan">{marketplace}</span>
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
      <div className="absolute top-1/4 left-1/2 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl -translate-x-1/2" />
    </div>
  );
}
