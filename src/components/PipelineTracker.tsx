import { Check, Loader2, Sparkles, Terminal } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Stage {
  label: string;
  role: string;
  desc: string;
}

const stages: Stage[] = [
  { label: 'SP-API Fetcher', role: 'listing_fetcher', desc: 'Pulling raw ASIN details & attributes' },
  { label: 'Preprocessor', role: 'preprocessor', desc: 'Cleaning tags, sorting descriptions' },
  { label: 'Neural Embedder', role: 'embedding_generator', desc: 'Projecting catalog data to vectors' },
  { label: 'Semantic Gap Analyst', role: 'semantic_analyzer', desc: 'Analyzing 24 core COSMO target metrics' },
  { label: 'Content Optimizer', role: 'content_optimizer', desc: 'Re-engineering Titles & Bullets' },
  { label: 'Benchmark Analyst', role: 'competitor_analyst', desc: 'Mapping competitors intent landscapes' },
  { label: 'AI reviewer', role: 'reviewer', desc: 'Validating final semantic alignment' }
];

interface PipelineTrackerProps {
  currentStage: number; // 0 to 6
  status: 'running' | 'completed' | 'idle' | 'failed';
  logs: string[];
}

export default function PipelineTracker({ currentStage, status, logs }: PipelineTrackerProps) {
  return (
    <div className="w-full glass-card p-6 border border-brand-bg-border relative overflow-hidden select-none">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-orange via-brand-violet to-brand-cyan opacity-80" />
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-white">
              Multi-Agent Optimization Core
            </h3>
            <p className="text-xs text-slate-400">
              7 Autonomous LLM Agents executing semantic alignment sequence
            </p>
          </div>
        </div>
        
        {status === 'running' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-brand-orange/10 border border-brand-orange/20 rounded-full">
            <Loader2 className="h-3 w-3 text-brand-orange animate-spin" />
            <span className="text-[10px] text-brand-orange font-bold uppercase tracking-wider">
              Sequence Executing
            </span>
          </div>
        )}
        
        {status === 'completed' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full">
            <Check className="h-3 w-3 text-brand-cyan" />
            <span className="text-[10px] text-brand-cyan font-bold uppercase tracking-wider">
              Analysis Locked
            </span>
          </div>
        )}
      </div>

      {/* Circle path tracker */}
      <div className="relative flex justify-between items-center w-full px-4 py-8 overflow-x-auto min-w-[700px] scrollbar-none">
        
        {/* Glowing background connect line */}
        <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-800 -translate-y-1/2 z-0" />
        
        {/* Dynamic active connecting line */}
        <div 
          className="absolute top-1/2 left-8 h-1 bg-gradient-to-r from-brand-orange to-brand-cyan -translate-y-1/2 z-0 transition-all duration-1000 ease-out" 
          style={{ 
            width: `${status === 'completed' ? 'calc(100% - 64px)' : `calc(${(currentStage / (stages.length - 1)) * 100}% - 64px)`}`
          }}
        />

        {stages.map((stage, idx) => {
          const isCompleted = idx < currentStage || status === 'completed';
          const isCurrent = idx === currentStage && status === 'running';
          const isPending = idx > currentStage && status !== 'completed';

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center group cursor-pointer">
              <div 
                className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-slate-900 border-brand-cyan text-brand-cyan shadow-glow-cyan' 
                    : isCurrent 
                      ? 'bg-slate-900 border-brand-orange text-brand-orange shadow-glow-orange scale-110' 
                      : 'bg-brand-bg-card border-slate-800 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="font-display font-semibold text-sm">{idx + 1}</span>
                )}
              </div>

              {/* Label */}
              <div className="mt-3 text-center max-w-[90px]">
                <div 
                  className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                    isCurrent ? 'text-brand-orange' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {stage.label}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5 line-clamp-1 leading-tight group-hover:line-clamp-none transition-all">
                  {stage.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Agent Log Shell */}
      <div className="mt-6 rounded-xl border border-brand-bg-border bg-slate-950/80 p-4 font-mono text-[11px] leading-relaxed shadow-inner">
        <div className="flex items-center justify-between border-b border-brand-bg-border pb-2 mb-3">
          <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <Terminal className="h-4 w-4 text-brand-orange" />
            <span>AI Orchestrator Kernel Log Output</span>
          </div>
          <span className="text-[9px] text-brand-cyan font-semibold">Active Node: {stages[currentStage]?.label}</span>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={idx} className={`${idx === logs.length - 1 ? 'text-slate-100 font-semibold' : 'text-slate-400'}`}>
              <span className="text-brand-orange/80 mr-2">&gt;&gt;</span>
              {log}
            </div>
          ))}
          {status === 'running' && (
            <div className="text-brand-orange animate-pulse flex items-center gap-1.5 mt-1 font-bold">
              <span>●</span>
              <span className="text-[10px] uppercase tracking-wider">Evaluating semantic intents...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
