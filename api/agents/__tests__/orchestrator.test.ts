import { describe, it, expect, vi, beforeEach } from "vitest";
import { OptimizationOrchestrator } from "../orchestrator.js";
import { DefaultAgentRegistry } from "../registry.js";
import { ReviewerAgent } from "../reviewer.js";
import type { Agent, AgentRole, PipelineState } from "../types.js";

describe("OptimizationOrchestrator - Concurrent DAG & Resumption", () => {
  let orchestrator: OptimizationOrchestrator;
  let mockRegistry: any;
  let mockReviewer: any;
  let agents: Record<string, Agent>;

  beforeEach(() => {
    agents = {
      apify_fetcher: { role: "apify_fetcher", execute: vi.fn() },
      preprocessor: { role: "preprocessor", execute: vi.fn() },
      embedding_generator: { role: "embedding_generator", execute: vi.fn() },
      semantic_analyzer: { role: "semantic_analyzer", execute: vi.fn() },
      content_optimizer: { role: "content_optimizer", execute: vi.fn() },
      competitor_analyst: { role: "competitor_analyst", execute: vi.fn() },
    };

    mockRegistry = {
      get: vi.fn((role: AgentRole) => agents[role]),
    };

    mockReviewer = {
      review: vi.fn(async (task) => ({
        approved: true,
        score: 100,
        issues: [],
        suggestions: [],
        reviewedAt: new Date(),
      })),
    };

    orchestrator = new OptimizationOrchestrator(mockRegistry, mockReviewer);
  });

  it("should run independent stages concurrently and assemble report on success", async () => {
    const callTimeline: string[] = [];

    vi.mocked(agents.apify_fetcher.execute).mockImplementation(async () => {
      callTimeline.push("apify_fetcher:start");
      await new Promise((r) => setTimeout(r, 10));
      callTimeline.push("apify_fetcher:end");
      return { asin: "B00001", category: "Magnesium" };
    });

    vi.mocked(agents.preprocessor.execute).mockImplementation(async () => {
      callTimeline.push("preprocessor:start");
      await new Promise((r) => setTimeout(r, 5));
      callTimeline.push("preprocessor:end");
      return { text: "magnesium details" };
    });

    vi.mocked(agents.embedding_generator.execute).mockResolvedValue([0.1, 0.2]);
    vi.mocked(agents.semantic_analyzer.execute).mockResolvedValue({ rufusScore: 80, semanticGaps: [] });
    vi.mocked(agents.content_optimizer.execute).mockResolvedValue({ title: "Optimized Title", bullets: [], qas: [] });

    vi.mocked(agents.competitor_analyst.execute).mockImplementation(async () => {
      callTimeline.push("competitor_analyst:start");
      await new Promise((r) => setTimeout(r, 15));
      callTimeline.push("competitor_analyst:end");
      return [];
    });

    const state = await orchestrator.runPipeline("B00001", "US");

    expect(state.error).toBeUndefined();
    expect(callTimeline[0]).toBe("apify_fetcher:start");
    expect(callTimeline[1]).toBe("apify_fetcher:end");

    // Both preprocessor and competitor_analyst must start concurrently since they only depend on apify_fetcher
    const starts = callTimeline.slice(2, 4);
    expect(starts).toContain("preprocessor:start");
    expect(starts).toContain("competitor_analyst:start");

    expect(state.finalReport).toBeDefined();
    expect(state.finalReport?.optimizedTitle).toBe("Optimized Title");
  });

  it("should support resuming the pipeline after retrying a failed stage", async () => {
    const callTimeline: string[] = [];

    vi.mocked(agents.apify_fetcher.execute).mockResolvedValue({ asin: "B00002", category: "Magnesium" });
    
    // First run: preprocessor fails
    vi.mocked(agents.preprocessor.execute).mockImplementation(async () => {
      callTimeline.push("preprocessor:failed");
      throw new Error("Preprocessor error");
    });

    vi.mocked(agents.competitor_analyst.execute).mockImplementation(async () => {
      callTimeline.push("competitor_analyst:succeeded");
      return [];
    });

    let state = await orchestrator.runPipeline("B00002", "US");

    expect(state.error).toContain("One or more stages failed");
    expect(callTimeline).toContain("preprocessor:failed");
    expect(callTimeline).toContain("competitor_analyst:succeeded");

    const preprocessorTask = state.tasks.find((t) => t.role === "preprocessor");
    const competitorTask = state.tasks.find((t) => t.role === "competitor_analyst");
    expect(preprocessorTask?.status).toBe("failed");
    expect(competitorTask?.status).toBe("completed");

    // Clear calls and prepare preprocessor to succeed on retry
    vi.mocked(agents.preprocessor.execute).mockImplementation(async () => {
      callTimeline.push("preprocessor:succeeded");
      return { text: "magnesium details" };
    });
    vi.mocked(agents.embedding_generator.execute).mockResolvedValue([0.1, 0.2]);
    vi.mocked(agents.semantic_analyzer.execute).mockResolvedValue({ rufusScore: 80, semanticGaps: [] });
    vi.mocked(agents.content_optimizer.execute).mockResolvedValue({ title: "Optimized Title", bullets: [], qas: [] });

    // Clear competitor mock implementation to verify it is NOT re-executed
    vi.mocked(agents.competitor_analyst.execute).mockImplementation(async () => {
      callTimeline.push("competitor_analyst:re-executed");
      return [];
    });

    state = await orchestrator.resumePipeline(state);

    expect(state.error).toBeUndefined();
    expect(callTimeline).toContain("preprocessor:succeeded");
    expect(callTimeline).not.toContain("competitor_analyst:re-executed");

    const resolvedPreprocessor = state.tasks.find((t) => t.role === "preprocessor");
    expect(resolvedPreprocessor?.status).toBe("completed");
    expect(state.finalReport).toBeDefined();
  });

  it("should invalidate and force re-execution of downstream stages when a parent stage is retried", async () => {
    const callTimeline: string[] = [];

    vi.mocked(agents.apify_fetcher.execute).mockResolvedValue({ asin: "B00003", category: "Magnesium" });
    vi.mocked(agents.preprocessor.execute).mockImplementation(async () => {
      callTimeline.push("preprocessor:run-1");
      return { text: "details 1" };
    });
    vi.mocked(agents.embedding_generator.execute).mockImplementation(async () => {
      callTimeline.push("embedding:run-1");
      return [0.1];
    });
    vi.mocked(agents.semantic_analyzer.execute).mockImplementation(async () => {
      callTimeline.push("semantic:run-1");
      return { rufusScore: 70, semanticGaps: [] };
    });
    vi.mocked(agents.content_optimizer.execute).mockImplementation(async () => {
      callTimeline.push("optimize:run-1");
      return { title: "Title 1", bullets: [], qas: [] };
    });
    vi.mocked(agents.competitor_analyst.execute).mockImplementation(async () => {
      callTimeline.push("competitor:run-1");
      return [];
    });

    let state = await orchestrator.runPipeline("B00003", "US");
    expect(state.error).toBeUndefined();

    // Verify all ran once
    expect(callTimeline).toContain("preprocessor:run-1");
    expect(callTimeline).toContain("embedding:run-1");
    expect(callTimeline).toContain("semantic:run-1");
    expect(callTimeline).toContain("optimize:run-1");
    expect(callTimeline).toContain("competitor:run-1");

    // Clear timeline
    callTimeline.length = 0;

    // Reset preprocessor to pending to simulate user retry
    const preprocessorTask = state.tasks.find((t) => t.role === "preprocessor")!;
    preprocessorTask.status = "pending";
    preprocessorTask.output = null;

    // Change execution returns to verify they run again
    vi.mocked(agents.preprocessor.execute).mockImplementation(async () => {
      callTimeline.push("preprocessor:run-2");
      return { text: "details 2" };
    });
    vi.mocked(agents.embedding_generator.execute).mockImplementation(async () => {
      callTimeline.push("embedding:run-2");
      return [0.2];
    });
    vi.mocked(agents.semantic_analyzer.execute).mockImplementation(async () => {
      callTimeline.push("semantic:run-2");
      return { rufusScore: 85, semanticGaps: [] };
    });
    vi.mocked(agents.content_optimizer.execute).mockImplementation(async () => {
      callTimeline.push("optimize:run-2");
      return { title: "Title 2", bullets: [], qas: [] };
    });
    vi.mocked(agents.competitor_analyst.execute).mockImplementation(async () => {
      callTimeline.push("competitor:run-2");
      return [];
    });

    state = await orchestrator.resumePipeline(state);

    expect(state.error).toBeUndefined();
    // Preprocessor and all its downstream tasks must be re-run
    expect(callTimeline).toContain("preprocessor:run-2");
    expect(callTimeline).toContain("embedding:run-2");
    expect(callTimeline).toContain("semantic:run-2");
    expect(callTimeline).toContain("optimize:run-2");

    // Competitor should NOT be re-run since it doesn't depend on preprocessor
    expect(callTimeline).not.toContain("competitor:run-2");
  });
});
