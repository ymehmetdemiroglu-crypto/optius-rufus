import { logger } from "../infra/logger.js";
import { eventBus } from "../infra/eventBus.js";
import type { StageContext } from "./pipeline.types.js";

export async function executeWithRetry<T>(
  execute: () => Promise<T>,
  evaluate: (output: T) => { approved: boolean; issues: string[]; score: number },
  options: { maxAttempts?: number; stage: string; ctx: StageContext }
): Promise<T> {
  const { maxAttempts = 3, stage, ctx } = options;
  let output: T | undefined;
  let attempts = 1;
  let approved = false;
  let issues: string[] = [];

  while (attempts <= maxAttempts && !approved) {
    try {
      output = await execute();
      const { approved: isApproved, issues: evalIssues, score } = evaluate(output);
      if (isApproved) {
        approved = true;
      } else {
        issues = evalIssues;
        logger.warn(`Stage ${stage} evaluation failed on attempt ${attempts}`, { jobId: ctx.jobId, issues, score });
        eventBus.emit("review:warning", { stage, issues, score });
        attempts++;
      }
    } catch (execErr) {
      const message = execErr instanceof Error ? execErr.message : String(execErr);
      issues = [`Agent execution error: ${message}`];
      attempts++;
    }
  }

  if (!approved || output === undefined) {
    throw new Error(`Stage ${stage} failed evaluation after ${maxAttempts} attempts. Issues: ${issues.join("; ")}`);
  }

  return output;
}
