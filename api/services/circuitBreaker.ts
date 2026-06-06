import { logger } from "../infra/logger.js";
import { eventBus } from "../infra/eventBus.js";

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  monitoringPeriodMs: number;
  name: string;
}

class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures: number[] = [];
  private lastFailureTime?: number;
  private nextAttempt?: number;
  private opts: CircuitBreakerOptions;

  constructor(opts: Partial<CircuitBreakerOptions> & { name: string }) {
    this.opts = {
      failureThreshold: opts.failureThreshold ?? 5,
      recoveryTimeoutMs: opts.recoveryTimeoutMs ?? 120_000,
      monitoringPeriodMs: opts.monitoringPeriodMs ?? 60_000,
      name: opts.name,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() >= (this.nextAttempt ?? 0)) {
        this.state = "half-open";
        logger.info(`Circuit breaker ${this.opts.name} entering half-open state`, {
          service: this.opts.name,
        });
      } else {
        const err = new Error(
          `Circuit breaker '${this.opts.name}' is OPEN. Retry after ${new Date(this.nextAttempt!).toISOString()}`
        );
        eventBus.emit("circuit-breaker:open", { name: this.opts.name, nextAttempt: this.nextAttempt });
        throw err;
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess() {
    if (this.state === "half-open") {
      this.state = "closed";
      this.failures = [];
      logger.info(`Circuit breaker ${this.opts.name} closed after successful call`, {
        service: this.opts.name,
      });
      eventBus.emit("circuit-breaker:closed", { name: this.opts.name });
    }
  }

  private onFailure() {
    const now = Date.now();
    this.failures.push(now);
    this.lastFailureTime = now;

    // Prune failures outside monitoring window
    const cutoff = now - this.opts.monitoringPeriodMs;
    this.failures = this.failures.filter((t) => t > cutoff);

    if (this.failures.length >= this.opts.failureThreshold) {
      this.state = "open";
      this.nextAttempt = now + this.opts.recoveryTimeoutMs;
      logger.warn(`Circuit breaker ${this.opts.name} OPENED due to ${this.failures.length} failures`, {
        service: this.opts.name,
        nextAttempt: this.nextAttempt,
      });
      eventBus.emit("circuit-breaker:open", { name: this.opts.name, nextAttempt: this.nextAttempt });
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

const breakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(name: string): CircuitBreaker {
  if (!breakers.has(name)) {
    breakers.set(name, new CircuitBreaker({ name }));
  }
  return breakers.get(name)!;
}
