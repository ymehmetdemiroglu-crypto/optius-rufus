import { Cpu, CheckCircle2, Loader2, AlertCircle, PlayCircle } from 'lucide-react';
import type { JSX } from 'react';

type PipelineStatus = "pending" | "running" | "completed" | "failed";

interface PipelineStageState {
  status: PipelineStatus;
  output?: unknown;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

interface PipelineJob {
  id: number;
  prospectId: number;
  listingId?: number;
  packageType: string;
  status: PipelineStatus;
  currentStage?: string;
  stages: Record<string, PipelineStageState>;
  tokenUsage: number;
  errorLog?: string;
  createdAt: string;
  updatedAt: string;
}

interface LiveAuditProgressProps {
  job: PipelineJob | null;
  isConnected: boolean;
  error: string | null;
  prospectName: string;
  companyName?: string;
  asin?: string;
}

export default function LiveAuditProgress({
  job,
  isConnected,
  error,
  prospectName,
  companyName,
  asin,
}: LiveAuditProgressProps): JSX.Element {
  const stageNames = ["fetch", "preprocess", "embedding", "semantic", "optimize", "competitor"];
  
  const stageLabels: Record<string, string> = {
    fetch: "Amazon Data Retrieval",
    preprocess: "Review Sentiment Parsing",
    embedding: "Vector Space Mapping",
    semantic: "Rufus & COSMO Simulation",
    optimize: "Direct Response Copywriting",
    competitor: "Page 2 PPC Conquesting Map",
  };

  const stageDescriptions: Record<string, string> = {
    fetch: "Extracting product images, features, price points, and metadata...",
    preprocess: "Formatting listing descriptions and analyzing buyer reviews...",
    embedding: "Indexing intent keywords against Amazon's catalog database...",
    semantic: "Querying Rufus agent cluster and calculating COSMO relevance...",
    optimize: "Generating value-focused copywriting and mapping semantic gaps...",
    competitor: "Benchmarking against top competitors and preparing keywords...",
  };

  // Calculate percentage
  let completedCount = 0;
  if (job) {
    stageNames.forEach((s) => {
      if (job.stages[s]?.status === "completed") {
        completedCount++;
      }
    });
  }
  const percentage = Math.round((completedCount / stageNames.length) * 100);

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center px-4 py-12 select-none">
      <div className="max-w-xl mx-auto w-full space-y-8">
        
        {/* Top Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 bg-brand-gold border-[2px] border-white text-brand-dark font-display font-black text-2xl mb-2 shadow-brutal-sm">
            Ω
          </div>
          <h1 className="font-display font-black uppercase text-xl text-white tracking-wider">
            OPTIMUS RUFUS
          </h1>
          <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest">
            Conversational search listing optimizer
          </p>
        </div>

        {/* Outer Brutalist Console Container */}
        <div className="brutalist-card bg-brand-dark text-white border-[3px] border-white p-6 shadow-brutal-lg relative overflow-hidden bg-dot-grid">
          
          {/* Status Indicators */}
          <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-4">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide">
              <Cpu size={14} className="text-brand-gold animate-spin-slow" />
              <span>Job #{job?.id || "Discovery"}</span>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 border border-green-500/30 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                  Live Sync
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 uppercase animate-pulse">
                  Connecting...
                </span>
              )}
            </div>
          </div>

          {/* Prospect Info details */}
          <div className="mb-6 font-mono text-[11px] text-white/70 space-y-1 bg-white/5 p-3 border border-white/10">
            <div>TARGET ASIN : <span className="text-white font-bold">{asin || "ASIN Loading..."}</span></div>
            <div>PROSPECT    : <span className="text-white font-bold">{prospectName} {companyName ? `(${companyName})` : ""}</span></div>
            <div>STATUS      : <span className="text-brand-gold uppercase font-bold">{job?.status || "Analyzing Reply"}</span></div>
          </div>

          {/* Real-time progress bar */}
          <div className="space-y-1 mb-8">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-white/60">AUDIT COMPUTATION PROGRESS</span>
              <span className="text-brand-gold font-bold">{percentage}%</span>
            </div>
            <div className="w-full h-4 bg-white/10 border border-white/20 p-0.5">
              <div 
                className="h-full bg-brand-gold transition-all duration-500 shadow-inner"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Pipeline execution logs */}
          <div className="space-y-4">
            {stageNames.map((stage) => {
              const stageState = job?.stages[stage];
              const isCompleted = stageState?.status === "completed";
              const isFailed = stageState?.status === "failed";
              const isRunning = stageState?.status === "running" || (job?.currentStage === stage && job?.status === "running");

              return (
                <div key={stage} className="flex items-start gap-3 border border-white/5 bg-white/[0.02] p-3">
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : isFailed ? (
                      <AlertCircle size={16} className="text-red-500" />
                    ) : isRunning ? (
                      <Loader2 size={16} className="text-brand-gold animate-spin" />
                    ) : (
                      <PlayCircle size={16} className="text-white/20" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-xs uppercase ${isRunning ? 'text-brand-gold font-bold' : isCompleted ? 'text-white' : 'text-white/40'}`}>
                        {stageLabels[stage]}
                      </span>
                      {isCompleted && (
                        <span className="font-mono text-[9px] text-green-500 font-bold uppercase">Success</span>
                      )}
                      {isRunning && (
                        <span className="font-mono text-[9px] text-brand-gold font-bold uppercase animate-pulse">Running</span>
                      )}
                      {isFailed && (
                        <span className="font-mono text-[9px] text-red-500 font-bold uppercase">Failed</span>
                      )}
                    </div>
                    
                    {(isRunning || (isFailed && stageState?.errorMessage)) && (
                      <p className={`font-mono text-[10px] leading-relaxed ${isFailed ? 'text-red-400' : 'text-white/60'}`}>
                        {isFailed ? stageState.errorMessage : stageDescriptions[stage]}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error display */}
          {(error || (job?.status === "failed" && job?.errorLog)) && (
            <div className="mt-6 border border-red-500/30 bg-red-500/10 p-3 flex gap-2 text-red-400 font-mono text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <div className="font-bold uppercase mb-1">AUDIT PIPELINE FAILURE</div>
                <p className="text-[10px] leading-normal opacity-90">{error || job?.errorLog}</p>
              </div>
            </div>
          )}

          {/* Completed CTA message */}
          {job?.status === "completed" && (
            <div className="mt-6 border border-green-500/30 bg-green-500/10 p-4 text-center font-mono text-xs space-y-2">
              <p className="text-green-400 font-bold uppercase animate-pulse-green">
                DIAGNOSTIC ARCHITECTURE COMPILED SUCCESSFULLY!
              </p>
              <p className="text-[10px] text-white/60">
                Opening listing autopsy report portal...
              </p>
            </div>
          )}

        </div>

        {/* Footer info */}
        <p className="font-mono text-[9px] text-white/20 text-center uppercase tracking-widest">
          Securing Intent Nodes • COSMO Mapping • Rufus Optimization Engine
        </p>

      </div>
    </div>
  );
}
