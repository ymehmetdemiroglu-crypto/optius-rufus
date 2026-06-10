import { EventEmitter } from "events";
import type { DomainEvent, EventBus } from "./infra.types.js";

class MemoryEventBus implements EventBus {
  private emitter = new EventEmitter();

  emit<T>(event: string, payload: T, correlationId?: string): void {
    const evt: DomainEvent<T> = {
      type: event,
      payload,
      timestamp: Date.now(),
      correlationId,
    };
    // Emit asynchronously to avoid blocking the caller
    setImmediate(() => this.emitter.emit(event, evt.payload, { correlationId: evt.correlationId }));
  }

  on<T>(
    event: string,
    handler: (payload: T, meta: { correlationId?: string }) => void
  ): void {
    this.emitter.on(event, handler as (...args: unknown[]) => void);
  }

  off<T>(
    event: string,
    handler: (payload: T, meta: { correlationId?: string }) => void
  ): void {
    this.emitter.off(event, handler as (...args: unknown[]) => void);
  }
}

// Singleton instance for the application
export const eventBus: EventBus = new MemoryEventBus();
