import { useEffect, useRef, useState, useCallback } from "react";
import { trpc } from "../providers/trpc";

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

interface UsePipelineOptions {
  jobId?: number | null;
  prospectId?: number | null;
  pollingInterval?: number;
  enableSse?: boolean;
}

export function usePipeline({ jobId, prospectId, pollingInterval = 3000, enableSse = true }: UsePipelineOptions) {
  const [job, setJob] = useState<PipelineJob | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-discover latest job if prospectId provided
  const latestJobQuery = trpc.agents.getLatestJob.useQuery(
    { prospectId: prospectId! },
    { enabled: !!prospectId && !jobId }
  );

  const resolvedJobId = jobId ?? (latestJobQuery.data?.id ?? null);

  // Polling fallback
  const statusQuery = trpc.agents.getStatus.useQuery(
    { jobId: resolvedJobId! },
    {
      enabled: !!resolvedJobId && (!enableSse || !isConnected),
      refetchInterval: pollingInterval,
    }
  );

  useEffect(() => {
    if (statusQuery.data) {
      const jobData = statusQuery.data as PipelineJob;
      setTimeout(() => {
        setJob(jobData);
      }, 0);
    }
  }, [statusQuery.data]);

  // SSE connection
  useEffect(() => {
    if (!resolvedJobId || !enableSse) return;

    const sseUrl = `/api/sse/pipeline/${resolvedJobId}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      setIsConnected(true);
      setError(null);
    });

    es.addEventListener("stage:start", (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      setJob((prev) => {
        if (!prev) return prev;
        const stageKey = data.stage as string;
        const existing = prev.stages[stageKey] ?? { status: "pending" };
        return {
          ...prev,
          currentStage: stageKey,
          stages: {
            ...prev.stages,
            [stageKey]: {
              ...existing,
              status: "running",
              startedAt: new Date().toISOString(),
            },
          },
        };
      });
    });

    es.addEventListener("stage:complete", (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      setJob((prev) => {
        if (!prev) return prev;
        const stageKey = data.stage as string;
        const existing = prev.stages[stageKey] ?? { status: "pending" };
        return {
          ...prev,
          stages: {
            ...prev.stages,
            [stageKey]: {
              ...existing,
              status: "completed",
              completedAt: new Date().toISOString(),
            },
          },
        };
      });
    });

    es.addEventListener("pipeline:complete", () => {
      setJob((prev) => {
        if (!prev) return prev;
        return { ...prev, status: "completed", currentStage: undefined };
      });
      setTimeout(() => es.close(), 1000);
    });

    es.addEventListener("pipeline:error", (e) => {
      const data = JSON.parse((e as MessageEvent).data);
      setJob((prev) => {
        if (!prev) return prev;
        return { ...prev, status: "failed", errorLog: data.error };
      });
      setError(data.error || "Pipeline failed");
      setTimeout(() => es.close(), 1000);
    });

    es.addEventListener("error", () => {
      setIsConnected(false);
      // Polling will take over automatically
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [resolvedJobId, enableSse]);

  const retryStage = trpc.agents.retryStage.useMutation();

  const handleRetry = useCallback(
    (stage: string) => {
      if (!resolvedJobId) return;
      retryStage.mutate({ jobId: resolvedJobId, stage: stage as any }); // eslint-disable-line @typescript-eslint/no-explicit-any -- cast stage string to stage enum type
    },
    [resolvedJobId, retryStage]
  );

  return {
    job,
    isLoading: statusQuery.isLoading,
    isConnected,
    error,
    handleRetry,
  };
}
