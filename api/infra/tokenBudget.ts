import { db } from "../db/drizzle.js";
import * as schema from "../db/schema.js";
import { eq, and, gte, sum } from "drizzle-orm";
import { eventBus } from "../infra/eventBus.js";
import { logger } from "../infra/logger.js";

// Package tier token budgets (in cents of estimated cost)
const TIER_BUDGETS_CENTS: Record<string, number> = {
  package_1: 500,
  package_2: 1500,
  package_3: 3000,
  package_4: 5000,
};

export class TokenBudgetExceededError extends Error {
  constructor(
    message: string,
    public prospectId: number,
    public remainingCents: number,
    public requestedCents: number
  ) {
    super(message);
    this.name = "TokenBudgetExceededError";
  }
}

export class TokenBudgetService {
  /**
   * Record token usage for a service call.
   */
  async trackUsage(
    prospectId: number,
    jobId: number | undefined,
    service: string,
    promptTokens: number,
    completionTokens: number,
    costCents: number
  ): Promise<void> {
    const totalTokens = promptTokens + completionTokens;
    await db.insert(schema.usageEvents).values({
      prospectId,
      jobId: jobId ?? null,
      service,
      promptTokens,
      completionTokens,
      totalTokens,
      costCents,
    });

    logger.info(`Token usage tracked`, {
      prospectId,
      jobId,
      service,
      promptTokens,
      completionTokens,
      costCents,
    });

    eventBus.emit("token:usage", {
      prospectId,
      jobId,
      service,
      promptTokens,
      completionTokens,
      costCents,
    });
  }

  /**
   * Get remaining budget for a prospect in cents.
   */
  async getRemainingBudget(prospectId: number): Promise<number> {
    const rows = await db
      .select({ packageType: schema.prospects.packageType })
      .from(schema.prospects)
      .where(eq(schema.prospects.id, prospectId))
      .limit(1);

    const prospect = rows[0];
    if (!prospect) return 0;

    const tierCap = TIER_BUDGETS_CENTS[prospect.packageType] ?? TIER_BUDGETS_CENTS.package_2;

    // Sum usage for current calendar month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usageRows = await db
      .select({ spent: sum(schema.usageEvents.costCents) })
      .from(schema.usageEvents)
      .where(
        and(
          eq(schema.usageEvents.prospectId, prospectId),
          gte(schema.usageEvents.createdAt, startOfMonth)
        )
      );

    const spent = Number(usageRows[0]?.spent ?? 0);
    return Math.max(0, tierCap - spent);
  }

  /**
   * Check if a prospective cost is within budget. Throws if exceeded.
   */
  async checkBudget(prospectId: number, estimatedCostCents: number): Promise<void> {
    const remaining = await this.getRemainingBudget(prospectId);
    if (estimatedCostCents > remaining) {
      const err = new TokenBudgetExceededError(
        `Token budget exceeded for prospect ${prospectId}. Remaining: ${remaining}c, requested: ${estimatedCostCents}c`,
        prospectId,
        remaining,
        estimatedCostCents
      );
      logger.warn(err.message, { prospectId, remaining, estimatedCostCents });
      eventBus.emit("token-budget:exceeded", {
        prospectId,
        remaining,
        requested: estimatedCostCents,
      });
      throw err;
    }
  }

  /**
   * Get the tier cap for a package type.
   */
  getTierCap(packageType: string): number {
    return TIER_BUDGETS_CENTS[packageType] ?? TIER_BUDGETS_CENTS.package_2;
  }
}

export const tokenBudgetService = new TokenBudgetService();
