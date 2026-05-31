export type AgentRole =
  | "listing_fetcher"
  | "preprocessor"
  | "embedding_generator"
  | "semantic_analyzer"
  | "content_optimizer"
  | "competitor_analyst"
  | "reviewer";

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "retrying";

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

export interface OptimizedContent {
  title: string;
  bullets: string[];
  description: string | null;
  qas: QAPair[];
}

export interface QAPair {
  question: string;
  optimizedAnswer: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
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

export interface OptimizationReport {
  asin: string;
  marketplace: string;
  originalRufusScore: number;
  optimizedRufusScore: number;
  semanticGaps: SemanticGap[];
  optimizedTitle: string;
  optimizedBullets: string[];
  optimizedDescription: string | null;
  optimizedQAs: QAPair[];
  competitorBenchmarks: CompetitorBenchmark[] | null;
  createdAt: Date;
}

export interface AgentTask {
  id: string;
  asin: string;
  marketplace: string;
  role: AgentRole;
  status: TaskStatus;
  input: unknown;
  output: unknown;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  attempt: number;
  maxAttempts: number;
}

export interface ReviewResult {
  taskId: string;
  approved: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  reviewedAt: Date;
}

export interface PipelineState {
  asin: string;
  marketplace: string;
  tasks: AgentTask[];
  reviews: ReviewResult[];
  currentStage: number;
  finalReport?: OptimizationReport;
  error?: string;
}

export interface Agent {
  role: AgentRole;
  execute(input: unknown): Promise<unknown>;
}
