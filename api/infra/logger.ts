import { sendTelegramMessage } from "./telegram.js";

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface LogContext {
  correlationId?: string;
  jobId?: number | string;
  prospectId?: number;
  stage?: string;
  service?: string;
  [key: string]: unknown;
}

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== "production") {
      const colors = {
        debug: "\x1b[90m", // Gray
        info: "\x1b[32m",  // Green
        warn: "\x1b[33m",  // Yellow
        error: "\x1b[31m", // Red
        fatal: "\x1b[35;1m", // Magenta Bold
      };
      const reset = "\x1b[0m";
      const color = colors[level] || reset;
      const emoji = {
        debug: "⚙️",
        info: "ℹ️",
        warn: "⚠️",
        error: "❌",
        fatal: "🚨",
      }[level] || "📝";

      const ts = new Date().toISOString().split("T")[1].slice(0, -1);
      const ctxStr = context ? ` ${JSON.stringify(context)}` : "";
      const logLine = `${color}[${ts}] ${emoji} [${level.toUpperCase()}] ${message}${ctxStr}${reset}`;

      if (level === "error" || level === "fatal") {
        console.error(logLine);
      } else if (level === "warn") {
        console.warn(logLine);
      } else {
        console.log(logLine);
      }
    } else {
      const entry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        ...context,
      };

      if (level === "error" || level === "fatal") {
        console.error(JSON.stringify(entry));
      } else if (level === "warn") {
        console.warn(JSON.stringify(entry));
      } else {
        console.log(JSON.stringify(entry));
      }
    }

    if (level === "fatal") {
      const ctxStr = context ? `\nContext: ${JSON.stringify(context, null, 2)}` : "";
      sendTelegramMessage(`🚨 *FATAL ERROR:* ${message}${ctxStr}`).catch((err) => {
        console.error("Failed to send Telegram fatal alert:", err);
      });
    }
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

  fatal(message: string, context?: LogContext) {
    this.log("fatal", message, context);
  }
}

export const logger = new Logger();
