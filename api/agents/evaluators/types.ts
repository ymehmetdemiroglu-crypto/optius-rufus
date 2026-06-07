export interface EvaluationResult {
  approved: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  reviewedAt: Date;
}

export interface Evaluator<T> {
  evaluate(output: T): Promise<EvaluationResult>;
}
