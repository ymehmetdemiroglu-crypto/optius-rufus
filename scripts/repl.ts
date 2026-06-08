import * as readline from "readline";
import { OptimizationOrchestrator } from "../api/agents/orchestrator.js";
import type { PipelineState, AgentRole } from "../api/agents/types.js";
import { simulateSingleRufusQuery } from "../api/services/rufusSimulator.js";

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
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
};

const STAGE_NAMES: Record<AgentRole, string> = {
  apify_fetcher: "ApifyFetcher",
  listing_fetcher: "ListingFetcher",
  preprocessor: "Preprocessor",
  embedding_generator: "EmbeddingGenerator",
  semantic_analyzer: "SemanticAnalyzer",
  content_optimizer: "ContentOptimizer",
  competitor_analyst: "CompetitorAnalyst",
  reviewer: "Reviewer",
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
${colors.cyan}${colors.bold}═══ 🤖 Amazon Listing Optimizer — Multi-Agent REPL ═══${colors.reset}

${colors.bold}Commands:${colors.reset}
  ${colors.bold}optimize <ASIN> [marketplace]${colors.reset}  Run the concurrent multi-agent optimization pipeline
  ${colors.bold}status${colors.reset}                        Show the status of the last run
  ${colors.bold}retry <stage_role>${colors.reset}             Retry a failed stage (e.g. competitor_analyst) and resume
  ${colors.bold}rufus <query>${colors.reset}                  Simulate a specific Rufus search query on the optimized product
  ${colors.bold}report${colors.reset}                        Show the final optimization report
  ${colors.bold}logs${colors.reset}                          Show detailed JSON logs
  ${colors.bold}help${colors.reset}                          Show this command list
  ${colors.bold}quit / exit${colors.reset}                   Close the REPL
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
    log(`${stageIcon(name)} ${colors.cyan}${name}${colors.reset}: Starting...`);
  });

  orchestrator.on("stage:complete", ({ name, status, duration }) => {
    const icon = status === "completed" ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
    const statusColor = status === "completed" ? colors.green : colors.red;
    log(`${icon} ${colors.bold}${name}${colors.reset}: ${statusColor}${status}${colors.reset} — ${formatDuration(duration)}`);
  });

  orchestrator.on("review:complete", ({ name, approved, score, issues, suggestions }) => {
    const icon = approved
      ? issues.length === 0 && suggestions.length === 0
        ? `${colors.green}✅${colors.reset}`
        : `${colors.yellow}⚠️${colors.reset}`
      : `${colors.red}❌${colors.reset}`;
    const label = approved ? (issues.length === 0 ? "PASS" : "WARN") : "FAIL";
    const labelColor = approved ? (issues.length === 0 ? colors.green : colors.yellow) : colors.red;
    
    log(`🔍 Reviewer: ${colors.bold}${name}${colors.reset} ... ${icon} ${labelColor}${label}${colors.reset} (score: ${score})`);
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
      console.log();
      log(
        `🏆 ${colors.green}${colors.bold}Pipeline Complete!${colors.reset} Rufus Score: ${before} ${deltaColor}→ ${after}${colors.reset} (${deltaColor}${delta > 0 ? "+" : ""}${delta}${colors.reset})`
      );
      console.log(`Type ${colors.bold}'rufus <your question>'${colors.reset} to query the simulated shopping assistant!`);
    } else {
      log(`${colors.yellow}⚠️ Pipeline completed but no final report was generated.${colors.reset}`);
    }
    rl.prompt();
  });

  orchestrator.on("pipeline:error", (error: string) => {
    log(`${colors.red}💥 Pipeline Execution Interrupted: ${error}${colors.reset}`);
    rl.prompt();
  });
}

function stageIcon(name: string): string {
  const icons: Record<string, string> = {
    ApifyFetcher: "📥",
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
    currentState = null;
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

  console.log(`\n${colors.cyan}${colors.bold}═══ Current Pipeline Status ═══${colors.reset}`);
  console.log(`ASIN:        ${currentState.asin}`);
  console.log(`Marketplace: ${currentState.marketplace}`);
  console.log(`Active State: ${currentState.error ? `${colors.red}Failed${colors.reset}` : "Active"}`);
  console.log(`\n${colors.bold}Stages Status:${colors.reset}`);

  for (const task of currentState.tasks) {
    const icon = task.status === "completed" ? `${colors.green}✅${colors.reset}` : task.status === "failed" ? `${colors.red}❌${colors.reset}` : "⏳";
    const duration =
      task.startedAt && task.completedAt
        ? formatDuration(task.completedAt.getTime() - task.startedAt.getTime())
        : "—";
    console.log(`  ${icon} ${colors.bold}${STAGE_NAMES[task.role] || task.role}${colors.reset} (${task.attempt} attempts) — ${duration}`);
    if (task.error) {
      console.log(`     ${colors.red}Error: ${task.error}${colors.reset}`);
    }
  }

  console.log();
}

function showReport() {
  if (!currentState?.finalReport) {
    console.log("No report available. Run a successful pipeline first.");
    return;
  }

  const r = currentState.finalReport;
  console.log(`\n${colors.cyan}${colors.bold}═══ 🏆 Optimus Rufus Final Report ═══${colors.reset}`);
  console.log(`ASIN:           ${r.asin}`);
  console.log(`Marketplace:    ${r.marketplace}`);
  console.log(`Original Score: ${r.originalRufusScore} / 100`);
  console.log(`Optimized Score: ${colors.green}${colors.bold}${r.optimizedRufusScore} / 100${colors.reset}`);
  
  console.log(`\n${colors.bold}✍️ Optimized Listing Title:${colors.reset}`);
  console.log(`"${colors.green}${r.optimizedTitle}${colors.reset}"`);
  
  console.log(`\n${colors.bold}✍️ Optimized Listing Bullets:${colors.reset}`);
  r.optimizedBullets.forEach((b, i) => console.log(`  ${colors.green}${i + 1}. ${b}${colors.reset}`));
  
  console.log(`\n${colors.bold}💬 Recommended Q&As (for Rufus injection):${colors.reset}`);
  r.optimizedQAs.forEach((qa, i) => {
    console.log(`  ${i + 1}. ${colors.bold}${qa.question}${colors.reset}`);
    console.log(`     👉 ${colors.gray}${qa.optimizedAnswer}${colors.reset}`);
  });

  if (r.competitorBenchmarks && r.competitorBenchmarks.length > 0) {
    console.log(`\n${colors.bold}🔎 Competitor Benchmarks:${colors.reset}`);
    r.competitorBenchmarks.forEach((c) => {
      console.log(`  • ${colors.bold}${c.brand}${colors.reset} (${c.asin}) — Score: ${c.score}/100, Rating: ${c.rating}★ (${c.reviewCount} reviews)`);
    });
  }

  console.log(`\n${colors.bold}📊 Identified Gaps & Recommendations (${r.semanticGaps.length}):${colors.reset}`);
  r.semanticGaps.slice(0, 5).forEach((g) => {
    const priorityColor = g.priority === "critical" ? colors.red : g.priority === "high" ? colors.yellow : colors.gray;
    console.log(`  ${priorityColor}[${g.priority.toUpperCase()}]${colors.reset} ${colors.bold}${g.dimension}${colors.reset}: ${g.recommendation}`);
  });
  console.log();
}

async function runRufusQuery(queryText: string) {
  if (!currentState?.finalReport) {
    console.log("No optimized listing report available. Run 'optimize <ASIN>' first.");
    rl.prompt();
    return;
  }

  console.log(`\n💬 ${colors.cyan}${colors.bold}Simulating Amazon Rufus Shopping Assistant...${colors.reset}`);
  console.log(`User query: "${colors.bold}${queryText}${colors.reset}"`);
  console.log(`Evaluating optimized product copy against competitors...\n`);

  const report = currentState.finalReport;
  try {
    const result = await simulateSingleRufusQuery(
      queryText,
      report.optimizedTitle,
      report.optimizedBullets,
      report.optimizedDescription || "",
      "General",
      report.competitorBenchmarks || []
    );

    console.log(`${colors.cyan}${colors.bold}═══ 🛍️ Simulated Rufus Search Results ═══${colors.reset}`);
    console.log(`Query: "${colors.bold}${result.queryText}${colors.reset}"\n`);

    result.rankings.forEach((rankItem) => {
      const isTarget = rankItem.asin === "target_product";
      const productLabel = isTarget
        ? `${colors.green}${colors.bold}[Target Optimized Product]${colors.reset}`
        : `${colors.bold}[Competitor ASIN: ${rankItem.asin}]${colors.reset}`;
      const recLabel = rankItem.recommended
        ? `${colors.green}${colors.bold}Recommended ✅${colors.reset}`
        : `${colors.red}Not Recommended ❌${colors.reset}`;

      console.log(`Rank #${rankItem.rank} | ${recLabel} | ${productLabel}`);
      console.log(`🤖 ${colors.magenta}Rufus says:${colors.reset} "${rankItem.reason}"\n`);
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`${colors.red}Error simulating query: ${msg}${colors.reset}`);
  }

  rl.prompt();
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

      case "retry": {
        const [stageRole] = args;
        if (!currentState) {
          console.log("No pipeline has been run yet.");
          rl.prompt();
          break;
        }
        if (!stageRole) {
          console.log(`${colors.red}Error:${colors.reset} Specify which stage to retry (e.g. retry competitor_analyst).`);
          rl.prompt();
          break;
        }
        const role = stageRole as AgentRole;
        if (!STAGE_NAMES[role]) {
          console.log(`${colors.red}Error:${colors.reset} Invalid stage: "${stageRole}". Valid: ${Object.keys(STAGE_NAMES).join(", ")}`);
          rl.prompt();
          break;
        }

        console.log(`\n🔄 ${colors.yellow}Resuming pipeline and retrying stage ${STAGE_NAMES[role]}...${colors.reset}`);
        try {
          await orchestrator.resumePipeline(currentState);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          log(`${colors.red}💥 Resume error: ${message}${colors.reset}`);
          rl.prompt();
        }
        break;
      }

      case "rufus": {
        const queryText = args.join(" ");
        if (!queryText) {
          console.log(`${colors.red}Error:${colors.reset} Provide a search query. Example: rufus is it gluten free?`);
          rl.prompt();
          break;
        }
        await runRufusQuery(queryText);
        break;
      }

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
