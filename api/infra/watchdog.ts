import { db } from "../db/drizzle.js";
import * as schema from "../db/schema.js";
import { and, eq, lt, gt, sql, sum } from "drizzle-orm";
import { logger } from "./logger.js";
import { sendTelegramMessage } from "./telegram.js";
import { queueWorker } from "../pipeline/worker.js";
import { webhookWorker } from "../infra/workers/webhookWorker.js";
import { getAllCircuitBreakers } from "./circuitBreaker.js";

let watchdogIntervals: NodeJS.Timeout[] = [];

export function startWatchdog() {
  logger.info("Watchdog service started");

  // 1. Every 5 minutes: Check memory usage
  const memInterval = setInterval(async () => {
    try {
      const memory = process.memoryUsage();
      const maxLimit = process.env.MAX_MEMORY_LIMIT_MB 
        ? parseInt(process.env.MAX_MEMORY_LIMIT_MB) * 1024 * 1024 
        : 500 * 1024 * 1024;
      
      if (memory.heapUsed > maxLimit * 0.8) {
        logger.warn("⚠️ Watchdog: High memory usage detected", {
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + "MB",
          limit: Math.round(maxLimit / 1024 / 1024) + "MB",
          ratio: Math.round((memory.heapUsed / maxLimit) * 100) + "%",
        });
      }
    } catch (err) {
      logger.error("Watchdog memory check error", { error: String(err) });
    }
  }, 5 * 60 * 1000);
  watchdogIntervals.push(memInterval);

  // 2. Every 15 minutes: Auto-reset stuck active jobs
  const stuckJobsInterval = setInterval(async () => {
    try {
      const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
      
      const stuckJobs = await db
        .select({ id: schema.jobs.id, name: schema.jobs.name })
        .from(schema.jobs)
        .where(
          and(
            eq(schema.jobs.status, "active"),
            lt(schema.jobs.processedOn, thirtyMinAgo)
          )
        );

      if (stuckJobs.length > 0) {
        logger.warn(`Watchdog: Found ${stuckJobs.length} active jobs stuck for >30 minutes. Resetting to pending.`);
        for (const job of stuckJobs) {
          await db
            .update(schema.jobs)
            .set({
              status: "pending",
              failedReason: "Watchdog auto-recovery: Job stuck in active state for >30 minutes",
              processedOn: null,
            })
            .where(eq(schema.jobs.id, job.id));
          logger.info(`Watchdog recovered stuck job ${job.id} (${job.name})`);
        }
      }
    } catch (err) {
      logger.error("Watchdog stuck jobs check error", { error: String(err) });
    }
  }, 15 * 60 * 1000);
  watchdogIntervals.push(stuckJobsInterval);

  // 3. Every 30 minutes: Alert on high error count
  const failuresInterval = setInterval(async () => {
    try {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const failedJobs = await db
        .select({
          id: schema.jobs.id,
          failedReason: schema.jobs.failedReason,
        })
        .from(schema.jobs)
        .where(
          and(
            eq(schema.jobs.status, "failed"),
            gt(schema.jobs.finishedOn, oneHourAgo)
          )
        );

      if (failedJobs.length > 5) {
        const errorCounts: Record<string, number> = {};
        for (const job of failedJobs) {
          const msg = job.failedReason || "Unknown error";
          errorCounts[msg] = (errorCounts[msg] || 0) + 1;
        }
        const sortedErrors = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]);
        const mostCommonError = sortedErrors[0]?.[0] || "Unknown error";
        
        await sendTelegramMessage(
          `⚠️ *Watchdog Alert: High job failure rate!*\n\n` +
          `Failed jobs in last hour: *${failedJobs.length}*\n\n` +
          `*Most common error:* \`${mostCommonError}\``
        );
      }
    } catch (err) {
      logger.error("Watchdog error count check error", { error: String(err) });
    }
  }, 30 * 60 * 1000);
  watchdogIntervals.push(failuresInterval);

  // 4. Every 60 minutes: Heartbeat summary
  const heartbeatInterval = setInterval(async () => {
    try {
      const uptime = process.uptime();
      
      const queueCounts = await db
        .select({
          queue: schema.jobs.queue,
          status: schema.jobs.status,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.jobs)
        .groupBy(schema.jobs.queue, schema.jobs.status);

      const depths: Record<string, Record<string, number>> = {};
      for (const row of queueCounts) {
        const queueName = row.queue || "unknown";
        const statusName = row.status || "pending";
        if (!depths[queueName]) depths[queueName] = {};
        depths[queueName][statusName] = row.count;
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const usage = await db
        .select({
          totalCost: sum(schema.usageEvents.costCents),
          totalTokens: sum(schema.usageEvents.totalTokens),
        })
        .from(schema.usageEvents)
        .where(gt(schema.usageEvents.createdAt, startOfMonth));
      
      const monthlyCost = Number(usage[0]?.totalCost || 0) / 100;
      const monthlyTokens = Number(usage[0]?.totalTokens || 0);

      logger.info("Watchdog System Heartbeat", {
        uptimeHours: (uptime / 3600).toFixed(2),
        queues: depths,
        monthlySpendCents: usage[0]?.totalCost || 0,
        monthlySpendUsd: monthlyCost.toFixed(2),
        monthlyTokens,
      });

    } catch (err) {
      logger.error("Watchdog heartbeat summary error", { error: String(err) });
    }
  }, 60 * 60 * 1000);
  watchdogIntervals.push(heartbeatInterval);
}

export function stopWatchdog() {
  for (const interval of watchdogIntervals) {
    clearInterval(interval);
  }
  watchdogIntervals = [];
  logger.info("Watchdog service stopped");
}
