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
    <div className="w-full glass-card p-6 border border-brand-bg-border relative overflow-hidden select-none font-sans text-slate-350">
      {/* Structural accent border line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-cyan via-[#E63946] to-brand-cyan opacity-80" />
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {/* Hexagonal Reactor mini icon */}
          <div className="relative flex h-8 w-8 items-center justify-center shrink-0">
            <svg 
              viewBox="0 0 100 100" 
              className="absolute inset-0 h-full w-full stroke-brand-crimson fill-none stroke-[8]"
            >
              <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" />
            </svg>
            <div className="h-1.5 w-1.5 rounded-full bg-[#E63946] shadow-[0_0_12px_#E63946] animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs text-white tracking-[0.05em] uppercase">
              AGENT ORCHESTRATION SEQUENCER
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              7 Autonomous Agent cores executing real-time semantic alignment protocol
            </p>
          </div>
        </div>
        
        {status === 'running' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-brand-crimson/10 border border-brand-crimson/20 rounded-full">
            <Loader2 className="h-3 w-3 text-brand-crimson animate-spin" />
            <span className="text-[9px] text-brand-crimson font-bold uppercase tracking-wider font-mono">
              Pipeline Active
            </span>
          </div>
        )}
        
        {status === 'completed' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full">
            <Check className="h-3 w-3 text-brand-cyan" />
            <span className="text-[9px] text-brand-cyan font-bold uppercase tracking-wider font-mono">
              Pipeline Locked
            </span>
          </div>
        )}
      </div>

      {/* Circle path tracker */}
      <div className="relative flex justify-between items-center w-full px-4 py-8 overflow-x-auto min-w-[700px] scrollbar-none">
        
        {/* Background track line */}
        <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-900 -translate-y-1/2 z-0" />
        
        {/* Dynamic active track line (Cyan to Crimson) */}
        <div 
          className="absolute top-1/2 left-8 h-1 bg-gradient-to-r from-brand-cyan to-brand-crimson -translate-y-1/2 z-0 transition-all duration-1000 ease-out" 
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
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-[#05070A] border-brand-cyan text-brand-cyan shadow-glow-cyan' 
                    : isCurrent 
                      ? 'bg-[#05070A] border-brand-crimson text-brand-crimson shadow-glow-crimson scale-110' 
                      : 'bg-brand-bg-card border-slate-900 text-slate-600'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="font-display font-semibold text-xs">{idx + 1}</span>
                )}
              </div>

              {/* Label */}
              <div className="mt-3 text-center max-w-[90px]">
                <div 
                  className={`text-[8px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                    isCurrent ? 'text-brand-crimson animate-pulse' : isCompleted ? 'text-slate-350' : 'text-slate-650'
                  }`}
                >
                  {stage.label}
                </div>
                <div className="text-[8px] text-slate-550 mt-0.5 line-clamp-1 leading-tight group-hover:line-clamp-none transition-all">
                  {stage.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Agent Log Shell (JetBrains Mono themed) */}
      <div className="mt-6 rounded-xl border border-brand-bg-border bg-[#05070A]/90 p-4 font-mono text-[10px] leading-relaxed shadow-inner">
        <div className="flex items-center justify-between border-b border-brand-bg-border pb-2 mb-3">
          <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
            <Terminal className="h-3.5 w-3.5 text-brand-crimson" />
            <span>AI Orchestration Kernel Stream</span>
          </div>
          <span className="text-[8px] text-brand-cyan font-bold font-mono">NODE ACTIVE: {stages[currentStage]?.label}</span>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto font-mono text-slate-400">
          {logs.map((log, idx) => (
            <div key={idx} className={`${idx === logs.length - 1 ? 'text-slate-100 font-bold' : ''}`}>
              <span className="text-brand-crimson/80 mr-2">&gt;&gt;</span>
              {log}
            </div>
          ))}
          {status === 'running' && (
            <div className="text-brand-crimson animate-pulse flex items-center gap-1.5 mt-1 font-bold">
              <span>●</span>
              <span className="text-[9px] uppercase tracking-wider">Deploying semantic alignment nodes...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
