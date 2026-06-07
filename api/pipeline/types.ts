export type StageName =
  | "fetch"
  | "preprocess"
  | "embedding"
  | "semantic"
  | "optimize"
  | "competitor";

export interface RawListingData {
  asin: string;
  title: string;
  bullets: string[];
  description: string;
  brand: string;
  category: string;
  subcategory: string;
  images: string[];
  price: number;
  rating: number;
  reviewCount: number;
  attributes: Record<string, unknown>;
}

export interface CleanedText {
  text: string;
  source: RawListingData;
}

export interface SemanticGap {
  dimension: string;
  currentScore: number;
  targetScore: number;
  gap: number;
  priority: "critical" | "high" | "medium" | "low";
  recommendation: string;
}

export interface AnalysisResult {
  rufusScore: number;
  cosmoScore: number;
  semanticGaps: SemanticGap[];
}

export interface QAPair {
  question: string;
  optimizedAnswer: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
}

export interface OptimizedContent {
  title: string;
  bullets: string[];
  description: string | null;
  qas: QAPair[];
}

export interface CompetitorBenchmark {
  asin: string;
  title: string;
  brand: string;
  price: number;
  rating: number;
  reviewCount: number;
  score: number;
  embeddingSimilarity: number;
}

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
