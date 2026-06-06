import type {
  RawListingData,
  CleanedText,
  AnalysisResult,
  OptimizedContent,
  CompetitorBenchmark,
} from "../agents/types.js";

export type StageName =
  | "fetch"
  | "preprocess"
  | "embedding"
  | "semantic"
  | "optimize"
  | "competitor";

export interface StageDefinition {
  name: StageName;
  dependencies: StageName[];
}

export interface StageOutput {
  [key: string]: unknown;
  rawListing?: RawListingData;
  cleaned?: CleanedText;
  embedding?: number[];
  analysis?: AnalysisResult;
  optimized?: OptimizedContent & { stageCopy?: unknown };
  competitors?: CompetitorBenchmark[];
}

export interface PipelineJob {
  id: number;
  prospectId: number;
  listingId?: number;
  packageType: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  currentStage?: StageName;
  stages: Record<StageName, PipelineStageState>;
  tokenUsage: number;
  errorLog?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStageState {
  status: "pending" | "running" | "completed" | "failed";
  output?: StageOutput[keyof StageOutput];
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface StageContext {
  jobId: number;
  prospectId: number;
  listingId?: number;
  packageType: string;
  correlationId: string;
  stageOutputs: StageOutput;
}

export interface StageExecutor {
  name: StageName;
  dependencies: StageName[];
  execute(ctx: StageContext): Promise<StageOutput[keyof StageOutput]>;
}

export const STAGE_ORDER: StageDefinition[] = [
  { name: "fetch", dependencies: [] },
  { name: "preprocess", dependencies: ["fetch"] },
  { name: "embedding", dependencies: ["preprocess"] },
  { name: "semantic", dependencies: ["embedding"] },
  { name: "optimize", dependencies: ["semantic"] },
  { name: "competitor", dependencies: ["fetch"] }, // Can run parallel to preprocess→optimize
];
