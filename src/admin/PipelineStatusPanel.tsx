import { Cpu, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { usePipeline } from '../../hooks/usePipeline';
import Badge from '../ui/Badge';

interface PipelineStatusPanelProps {
  prospectId: number;
}

export default function PipelineStatusPanel({ prospectId }: PipelineStatusPanelProps) {
  const { job, isLoading, isConnected, error, handleRetry } = usePipeline({ prospectId, enableSse: false });

  if (isLoading && !job) {
    return (
      <div className="border-[2px] border-dashed border-brand-dark/20 p-4 bg-brand-bg/20">
        <p className="font-mono text-[10px] text-gray-400 uppercase">Loading pipeline status...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="border-[2px] border-dashed border-brand-dark/20 p-4 bg-brand-bg/20">
        <p className="font-mono text-[10px] text-gray-400 uppercase">No pipeline jobs found for this prospect.</p>
      </div>
    );
  }

  const stageNames = ["fetch", "preprocess", "embedding", "semantic", "optimize", "competitor"];
  const stageLabels: Record<string, string> = {
    fetch: "Data Fetch",
    preprocess: "Preprocess",
    embedding: "Embedding",
    semantic: "Semantic Analysis",
    optimize: "Content Optimization",
    competitor: "Competitor Analysis",
  };

  return (
    <div className="border-[2px] border-brand-dark bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
          <Cpu size={12} /> Pipeline Job #{job.id}
        </h4>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              job.status === "completed" ? "success" :
              job.status === "failed" ? "danger" :
              job.status === "running" ? "info" :
              "warning"
            }
            className="px-2 font-bold"
          >
            {job.status}
          </Badge>
          {isConnected && (
            <span className="font-mono text-[9px] text-green-600 uppercase">● Live</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {stageNames.map((stage, idx) => {
          const stageState = job.stages[stage];
          const isCompleted = stageState?.status === "completed";
          const isFailed = stageState?.status === "failed";
          const isRunning = stageState?.status === "running";

          return (
            <div key={stage} className="flex items-center gap-1 flex-1">
              <div
                className={`h-2 flex-1 rounded-none ${
                  isCompleted ? "bg-green-500" :
                  isFailed ? "bg-red-500" :
                  isRunning ? "bg-blue-500 animate-pulse" :
                  "bg-gray-200"
                }`}
                title={stageLabels[stage]}
              />
              {idx < stageNames.length - 1 && (
                <div className="w-1 h-[2px] bg-brand-dark/20" />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {stageNames.map((stage) => {
          const stageState = job.stages[stage];
          if (!stageState || stageState.status === "pending") return null;
          return (
            <div key={stage} className="flex items-center justify-between border border-brand-dark/10 p-1.5">
              <span className="font-mono text-[9px] uppercase text-gray-600">{stageLabels[stage]}</span>
              {stageState.status === "completed" ? (
                <CheckCircle size={10} className="text-green-600" />
              ) : stageState.status === "failed" ? (
                <button
                  onClick={() => handleRetry(stage)}
                  className="flex items-center gap-1 text-[9px] font-mono text-red-600 hover:underline"
                >
                  <RefreshCw size={8} /> Retry
                </button>
              ) : (
                <RefreshCw size={10} className="text-blue-600 animate-spin" />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 font-mono text-[10px] bg-red-50 border border-red-200 p-2">
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      {job.tokenUsage > 0 && (
        <p className="font-mono text-[9px] text-gray-400 text-right">
          Token usage: {job.tokenUsage}
        </p>
      )}
    </div>
  );
}
