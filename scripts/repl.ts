import * as readline from "readline";
import { OptimizationOrchestrator } from "../api/agents/orchestrator.js";
import type { PipelineState } from "../api/agents/types.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

const orchestrator = new OptimizationOrchestrator();
let currentState: PipelineState | null = null;

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

function timestamp(): string {
  const now = new Date();
  return `[${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}]`;
}

function log(msg: string) {
  console.log(`${colors.gray}${timestamp()}${colors.reset} ${msg}`);
}

function printBanner() {
  console.log(`
${colors.cyan}${colors.bold}🤖 Amazon Listing Optimizer — Multi-Agent REPL${colors.reset}

Commands:
  ${colors.bold}optimize <ASIN> <marketplace>${colors.reset}  Run optimization pipeline
  ${colors.bold}status${colors.reset}                          Show current pipeline state
  ${colors.bold}retry${colors.reset}                           Retry failed stage
  ${colors.bold}report${colors.reset}                          Show final optimization report
  ${colors.bold}logs${colors.reset}                            Show agent execution logs
  ${colors.bold}help${colors.reset}                            Show this help
  ${colors.bold}quit${colors.reset}                            Exit REPL
`);
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function setupEventListeners() {
  orchestrator.on("pipeline:start", ({ asin, marketplace }) => {
    log(`🚀 Pipeline started for ${colors.bold}${asin}${colors.reset} (${marketplace})`);
  });

  orchestrator.on("stage:start", ({ name }) => {
    log(`${stageIcon(name)} ${name}: Running...`);
  });

  orchestrator.on("stage:complete", ({ name, status, duration }) => {
    const icon = status === "completed" ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
    log(`${icon} ${name}: ${status} — ${formatDuration(duration)}`);
  });

  orchestrator.on("review:complete", ({ name, approved, score, issues, suggestions }) => {
    const icon = approved
      ? issues.length === 0 && suggestions.length === 0
        ? `${colors.green}✅${colors.reset}`
        : `${colors.yellow}⚠️${colors.reset}`
      : `${colors.red}❌${colors.reset}`;
    const label = approved ? (issues.length === 0 ? "PASS" : "WARN") : "FAIL";
    log(`🔍 Reviewer: ${name}... ${icon} ${label} (score: ${score})`);
    for (const issue of issues) {
      log(`   ${colors.red}Issue:${colors.reset} ${issue}`);
    }
    for (const suggestion of suggestions) {
      log(`   ${colors.yellow}Suggestion:${colors.reset} ${suggestion}`);
    }
  });

  orchestrator.on("pipeline:complete", (state: PipelineState) => {
    currentState = state;
    if (state.finalReport) {
      const before = state.finalReport.originalRufusScore;
      const after = state.finalReport.optimizedRufusScore;
      const delta = after - before;
      const deltaColor = delta > 0 ? colors.green : delta < 0 ? colors.red : colors.yellow;
      log(
        `🏆 Pipeline complete! Rufus Score: ${before} ${deltaColor}→ ${after}${colors.reset} (${deltaColor}${delta > 0 ? "+" : ""}${delta}${colors.reset})`
      );
    } else {
      log(`${colors.yellow}⚠️ Pipeline completed but no final report generated${colors.reset}`);
    }
    rl.prompt();
  });

  orchestrator.on("pipeline:error", (error: string) => {
    log(`${colors.red}💥 Pipeline error: ${error}${colors.reset}`);
    rl.prompt();
  });
}

function stageIcon(name: string): string {
  const icons: Record<string, string> = {
    ListingFetcher: "📦",
    Preprocessor: "🧹",
    EmbeddingGenerator: "🔢",
    SemanticAnalyzer: "📊",
    ContentOptimizer: "✍️",
    CompetitorAnalyst: "🔎",
  };
  return icons[name] ?? "⚙️";
}

async function runOptimization(asin: string, marketplace: string) {
  try {
    await orchestrator.runPipeline(asin, marketplace);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log(`${colors.red}💥 Unhandled error: ${message}${colors.reset}`);
    rl.prompt();
  }
}

function showStatus() {
  if (!currentState) {
    console.log("No pipeline has been run yet.");
    return;
  }

  console.log(`\n${colors.bold}Pipeline Status${colors.reset}`);
  console.log(`ASIN: ${currentState.asin}`);
  console.log(`Marketplace: ${currentState.marketplace}`);
  console.log(`Stage: ${currentState.currentStage + 1} / 6`);

  for (const task of currentState.tasks) {
    const icon = task.status === "completed" ? "✅" : task.status === "failed" ? "❌" : "⏳";
    const duration =
      task.startedAt && task.completedAt
        ? formatDuration(task.completedAt.getTime() - task.startedAt.getTime())
        : "—";
    console.log(`  ${icon} ${task.role} (${task.attempt} attempts) — ${duration}`);
    if (task.error) {
      console.log(`     ${colors.red}Error: ${task.error}${colors.reset}`);
    }
  }

  console.log();
}

function showReport() {
  if (!currentState?.finalReport) {
    console.log("No report available. Run a pipeline first.");
    return;
  }

  const r = currentState.finalReport;
  console.log(`\n${colors.cyan}${colors.bold}═══ Optimization Report ═══${colors.reset}`);
  console.log(`ASIN:        ${r.asin}`);
  console.log(`Marketplace: ${r.marketplace}`);
  console.log(`Original Score: ${r.originalRufusScore}`);
  console.log(`Optimized Score: ${colors.green}${r.optimizedRufusScore}${colors.reset}`);
  console.log(`\n${colors.bold}Optimized Title:${colors.reset}`);
  console.log(r.optimizedTitle);
  console.log(`\n${colors.bold}Optimized Bullets:${colors.reset}`);
  r.optimizedBullets.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
  console.log(`\n${colors.bold}Q&A Suggestions:${colors.reset}`);
  r.optimizedQAs.forEach((qa, i) => {
    console.log(`  ${i + 1}. ${colors.bold}${qa.question}${colors.reset}`);
    console.log(`     ${qa.optimizedAnswer}`);
  });
  if (r.competitorBenchmarks && r.competitorBenchmarks.length > 0) {
    console.log(`\n${colors.bold}Competitor Benchmarks:${colors.reset}`);
    r.competitorBenchmarks.forEach((c) => {
      console.log(`  • ${c.brand} — Score: ${c.score}, Rating: ${c.rating}★ (${c.reviewCount} reviews)`);
    });
  }
  console.log(`\n${colors.bold}Semantic Gaps (${r.semanticGaps.length} found):${colors.reset}`);
  r.semanticGaps.slice(0, 5).forEach((g) => {
    const color = g.priority === "critical" ? colors.red : g.priority === "high" ? colors.yellow : colors.gray;
    console.log(`  ${color}[${g.priority}]${colors.reset} ${g.dimension}: ${g.recommendation}`);
  });
  console.log();
}

function showLogs() {
  if (!currentState) {
    console.log("No pipeline has been run yet.");
    return;
  }

  console.log(`\n${colors.bold}Execution Logs (JSON)${colors.reset}\n`);
  console.log(
    JSON.stringify(
      {
        asin: currentState.asin,
        marketplace: currentState.marketplace,
        tasks: currentState.tasks.map((t) => ({
          role: t.role,
          status: t.status,
          attempts: t.attempt,
          durationMs:
            t.startedAt && t.completedAt
              ? t.completedAt.getTime() - t.startedAt.getTime()
              : null,
          error: t.error,
        })),
        reviews: currentState.reviews.map((r) => ({
          approved: r.approved,
          score: r.score,
          issues: r.issues,
        })),
      },
      null,
      2
    )
  );
  console.log();
}

async function main() {
  printBanner();
  setupEventListeners();
  rl.prompt();

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    const [command, ...args] = trimmed.split(/\s+/);

    switch (command.toLowerCase()) {
      case "optimize": {
        const [asin, marketplace = "US"] = args;
        if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
          console.log(`${colors.red}Error:${colors.reset} Provide a valid 10-char ASIN. Example: optimize B08XYZ1234 US`);
          rl.prompt();
          break;
        }
        console.log();
        await runOptimization(asin, marketplace);
        break;
      }

      case "status":
        showStatus();
        rl.prompt();
        break;

      case "retry":
        console.log("Retry not yet implemented in REPL. Use the tRPC API or restart the pipeline.");
        rl.prompt();
        break;

      case "report":
        showReport();
        rl.prompt();
        break;

      case "logs":
        showLogs();
        rl.prompt();
        break;

      case "help":
        printBanner();
        rl.prompt();
        break;

      case "quit":
      case "exit":
        console.log("Goodbye! 👋");
        rl.close();
        process.exit(0);
        break;

      default:
        if (trimmed) {
          console.log(`Unknown command: ${command}. Type 'help' for available commands.`);
        }
        rl.prompt();
    }
  });

  rl.on("close", () => {
    console.log("Goodbye! 👋");
    process.exit(0);
  });
}

main();
