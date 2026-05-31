import { Check, Loader2, Sparkles, Terminal } from 'lucide-react';

interface Stage {
  label: string;
  role: string;
  desc: string;
}

const stages: Stage[] = [
  { label: 'SP-API RETRIEVAL', role: 'listing_fetcher', desc: 'Pulling raw ASIN catalog metadata' },
  { label: 'Payload Normalizer', role: 'preprocessor', desc: 'Stripping tags and packaging text nodes' },
  { label: 'Neural Representation', role: 'embedding_generator', desc: 'Projecting vectors to 1536-dim space' },
  { label: 'Intent Evaluation', role: 'semantic_analyzer', desc: 'Analyzing 24 intent gap vectors' },
  { label: 'AI Syntax Core', role: 'content_optimizer', desc: 'Re-structuring Titles and Bullets' },
  { label: 'Competitive Grid', role: 'competitor_analyst', desc: 'Mapping competitive intent vectors' },
  { label: 'Elite Compliance', role: 'reviewer', desc: 'Validating final semantic target specs' }
];

interface PipelineTrackerProps {
  currentStage: number; // 0 to 6
  status: 'running' | 'completed' | 'idle' | 'failed';
  logs: string[];
}

export default function PipelineTracker({ currentStage, status, logs }: PipelineTrackerProps) {
  return (
    <div className="w-full brutalist-card bg-white p-6 relative select-none font-sans text-brand-dark">
      {/* Structural accent border line */}
      <div className="absolute top-0 left-0 w-full h-[6px] bg-brand-gold" />
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {/* Stark Bauhaus Reactor Icon */}
          <div className="h-8 w-8 bg-brand-dark flex items-center justify-center border-2 border-brand-dark">
            <div className="h-3 w-3 bg-brand-gold rotate-45" />
          </div>
          <div>
            <h3 className="font-display font-black text-sm text-brand-dark tracking-wide uppercase">
              AGENT ORCHESTRATION SEQUENCER
            </h3>
            <p className="text-[10px] text-brand-dark/60 font-bold uppercase tracking-wider mt-0.5 font-mono">
              7 Autonomous Agent cores executing real-time semantic alignment protocol
            </p>
          </div>
        </div>
        
        {status === 'running' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-brand-red text-white border-[3px] border-brand-dark shadow-brutal-sm font-mono text-[9px] font-black uppercase">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Pipeline Active</span>
          </div>
        )}
        
        {status === 'completed' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-brand-blue text-white border-[3px] border-brand-dark shadow-brutal-sm font-mono text-[9px] font-black uppercase">
            <Check className="h-3 w-3" />
            <span>Pipeline Locked</span>
          </div>
        )}
      </div>

      {/* Circle path tracker */}
      <div className="relative flex justify-between items-center w-full px-4 py-8 overflow-x-auto min-w-[700px] scrollbar-none">
        
        {/* Background track line */}
        <div className="absolute top-1/2 left-8 right-8 h-1.5 bg-brand-dark/20 -translate-y-1/2 z-0" />
        
        {/* Dynamic active track line */}
        <div 
          className="absolute top-1/2 left-8 h-1.5 bg-brand-blue -translate-y-1/2 z-0 transition-all duration-1000 ease-out" 
          style={{ 
            width: `${status === 'completed' ? 'calc(100% - 64px)' : `calc(${(currentStage / (stages.length - 1)) * 100}% - 64px)`}`
          }}
        />

        {stages.map((stage, idx) => {
          const isCompleted = idx < currentStage || status === 'completed';
          const isCurrent = idx === currentStage && status === 'running';

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center group cursor-pointer font-mono">
              <div 
                className={`flex h-11 w-11 items-center justify-center border-[3px] transition-all duration-350 ${
                  isCompleted 
                    ? 'bg-white border-brand-dark text-brand-blue shadow-brutal-sm' 
                    : isCurrent 
                      ? 'bg-brand-gold border-brand-dark text-brand-dark shadow-brutal scale-110' 
                      : 'bg-brand-bg border-brand-dark/30 text-brand-dark/30'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 stroke-[3]" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 animate-spin stroke-[3]" />
                ) : (
                  <span className="font-display font-black text-xs">{idx + 1}</span>
                )}
              </div>

              {/* Label */}
              <div className="mt-3 text-center max-w-[90px]">
                <div 
                  className={`text-[8px] font-black uppercase tracking-wider transition-colors duration-300 ${
                    isCurrent ? 'text-brand-red animate-pulse' : isCompleted ? 'text-brand-dark' : 'text-brand-dark/40'
                  }`}
                >
                  {stage.label}
                </div>
                <div className="text-[8px] text-brand-dark/50 mt-0.5 line-clamp-1 leading-tight group-hover:line-clamp-none transition-all font-bold">
                  {stage.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Agent Log Shell (Space Grotesk & Inter themed) */}
      <div className="mt-6 border-[3px] border-brand-dark bg-white p-4 font-mono text-[11px] leading-relaxed shadow-brutal-sm">
        <div className="flex items-center justify-between border-b-[2px] border-brand-dark pb-2 mb-3">
          <div className="flex items-center gap-2 text-brand-dark font-black uppercase tracking-wider text-[9px]">
            <Terminal className="h-3.5 w-3.5 text-brand-red" />
            <span>AI Orchestration Kernel Stream</span>
          </div>
          <span className="text-[8px] bg-brand-blue text-white px-2 py-0.5 border border-brand-dark font-black font-mono">NODE ACTIVE: {stages[currentStage]?.label}</span>
        </div>
        <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-brand-dark/80">
          {logs.map((log, idx) => (
            <div key={idx} className={`${idx === logs.length - 1 ? 'text-brand-dark font-black' : ''}`}>
              <span className="text-brand-red mr-2 font-black">&gt;&gt;</span>
              {log}
            </div>
          ))}
          {status === 'running' && (
            <div className="text-brand-red animate-pulse flex items-center gap-1.5 mt-2 font-black">
              <span>●</span>
              <span className="text-[9px] uppercase tracking-wider">Deploying semantic alignment nodes...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
