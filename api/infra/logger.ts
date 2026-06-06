import type { EventBus } from "./types.js";
import { eventBus } from "./eventBus.js";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  correlationId?: string;
  jobId?: number | string;
  prospectId?: number;
  stage?: string;
  service?: string;
  [key: string]: unknown;
}

class Logger {
  private bus: EventBus;

  constructor(bus: EventBus) {
    this.bus = bus;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const entry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    // Structured console output
    if (level === "error") {
      console.error(JSON.stringify(entry));
    } else if (level === "warn") {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }

    // Emit domain event for downstream observability
    this.bus.emit("log", entry, context?.correlationId);
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext) {
    this.log("error", message, context);
  }
}

export const logger = new Logger(eventBus);
