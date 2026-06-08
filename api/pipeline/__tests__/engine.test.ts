import { describe, it, expect, vi, beforeEach } from "vitest";
import { PipelineEngine } from "../engine.js";
import * as pipelineRepo from "../../db/repositories/pipelineRepository.js";
import { stageExecutors } from "../executors.js";

// Mock the pipeline repository
vi.mock("../../db/repositories/pipelineRepository.js", () => {
  return {
    createJob: vi.fn(),
    getJob: vi.fn(),
    updateJobStatus: vi.fn(),
    createStage: vi.fn(),
    updateStageStatus: vi.fn(),
    getStagesForJob: vi.fn(),
  };
});

// Mock the stage executors to allow tracking call sequences
vi.mock("../executors.js", () => {
  return {
    stageExecutors: [
      { name: "fetch", dependencies: [], execute: vi.fn() },
      { name: "preprocess", dependencies: ["fetch"], execute: vi.fn() },
      { name: "embedding", dependencies: ["preprocess"], execute: vi.fn() },
      { name: "semantic", dependencies: ["embedding"], execute: vi.fn() },
      { name: "optimize", dependencies: ["semantic"], execute: vi.fn() },
      { name: "competitor", dependencies: ["fetch"], execute: vi.fn() },
    ],
  };
});

describe("PipelineEngine - Concurrent DAG Execution", () => {
  let engine: PipelineEngine;
  const correlationId = "test-correlation-id";

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new PipelineEngine();
  });

  it("should run independent branches concurrently after their dependencies complete", async () => {
    const jobId = 1;
    const mockJobRecord = {
      id: jobId,
      prospectId: 101,
      listingId: 201,
      packageType: "package_2",
      status: "pending",
      stagesJSON: "{}",
      tokenUsage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // All stages start as pending
    const mockStages: Record<string, import("../../pipeline/types.js").PipelineStageState> = {
      fetch: { status: "pending" },
      preprocess: { status: "pending" },
      embedding: { status: "pending" },
      semantic: { status: "pending" },
      optimize: { status: "pending" },
      competitor: { status: "pending" },
    };

    vi.mocked(pipelineRepo.getJob).mockResolvedValue(mockJobRecord as any);
    vi.mocked(pipelineRepo.getStagesForJob).mockResolvedValue(mockStages as any);

    const callTimeline: string[] = [];

    // Setup mock executors with simulated network delays
    const fetchExecutor = stageExecutors.find((e) => e.name === "fetch")!;
    const preprocessExecutor = stageExecutors.find((e) => e.name === "preprocess")!;
    const embeddingExecutor = stageExecutors.find((e) => e.name === "embedding")!;
    const semanticExecutor = stageExecutors.find((e) => e.name === "semantic")!;
    const optimizeExecutor = stageExecutors.find((e) => e.name === "optimize")!;
    const competitorExecutor = stageExecutors.find((e) => e.name === "competitor")!;

    vi.mocked(fetchExecutor.execute).mockImplementation(async () => {
      callTimeline.push("fetch:start");
      await new Promise((r) => setTimeout(r, 10));
      callTimeline.push("fetch:end");
      return { asin: "B00001" };
    });

    vi.mocked(preprocessExecutor.execute).mockImplementation(async () => {
      callTimeline.push("preprocess:start");
      await new Promise((r) => setTimeout(r, 10));
      callTimeline.push("preprocess:end");
      return { cleanedText: "hello" };
    });

    vi.mocked(embeddingExecutor.execute).mockImplementation(async () => {
      callTimeline.push("embedding:start");
      return [0.1, 0.2];
    });

    vi.mocked(semanticExecutor.execute).mockImplementation(async () => {
      callTimeline.push("semantic:start");
      return { score: 90 };
    });

    vi.mocked(optimizeExecutor.execute).mockImplementation(async () => {
      callTimeline.push("optimize:start");
      return { optimizedContent: "world" };
    });

    vi.mocked(competitorExecutor.execute).mockImplementation(async () => {
      callTimeline.push("competitor:start");
      await new Promise((r) => setTimeout(r, 15));
      callTimeline.push("competitor:end");
      return [{ asin: "B00002" }];
    });

    await engine.runJob(jobId, correlationId);

    // Verify stages executed in the correct dependency order
    expect(callTimeline[0]).toBe("fetch:start");
    expect(callTimeline[1]).toBe("fetch:end");

    // Both preprocess and competitor must start concurrently since they only depend on fetch
    const firstTwoStartsAfterFetch = callTimeline.slice(2, 4);
    expect(firstTwoStartsAfterFetch).toContain("preprocess:start");
    expect(firstTwoStartsAfterFetch).toContain("competitor:start");

    // Preprocess ends in 10ms, competitor in 15ms.
    // So embedding:start must run immediately after preprocess:end, before competitor:end completes
    const indexOfPreprocessEnd = callTimeline.indexOf("preprocess:end");
    const indexOfEmbeddingStart = callTimeline.indexOf("embedding:start");
    const indexOfCompetitorEnd = callTimeline.indexOf("competitor:end");

    expect(indexOfEmbeddingStart).toBeGreaterThan(indexOfPreprocessEnd);
    expect(indexOfCompetitorEnd).toBeGreaterThan(indexOfEmbeddingStart);

    // Check database state update calls
    expect(pipelineRepo.updateJobStatus).toHaveBeenCalledWith(jobId, "running");
    expect(pipelineRepo.updateJobStatus).toHaveBeenCalledWith(jobId, "completed", null);
    expect(pipelineRepo.updateStageStatus).toHaveBeenCalledWith(jobId, "fetch", "completed", expect.any(Object));
    expect(pipelineRepo.updateStageStatus).toHaveBeenCalledWith(jobId, "competitor", "completed", expect.any(Object));
  });

  it("should fail gracefully, allowing independent branches to finish but skipping downstream dependencies of the failed stage", async () => {
    const jobId = 2;
    const mockJobRecord = {
      id: jobId,
      prospectId: 102,
      listingId: 202,
      packageType: "package_2",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockStages: Record<string, import("../../pipeline/types.js").PipelineStageState> = {
      fetch: { status: "pending" },
      preprocess: { status: "pending" },
      embedding: { status: "pending" },
      semantic: { status: "pending" },
      optimize: { status: "pending" },
      competitor: { status: "pending" },
    };

    vi.mocked(pipelineRepo.getJob).mockResolvedValue(mockJobRecord as any);
    vi.mocked(pipelineRepo.getStagesForJob).mockResolvedValue(mockStages as any);

    const callTimeline: string[] = [];

    const fetchExecutor = stageExecutors.find((e) => e.name === "fetch")!;
    const preprocessExecutor = stageExecutors.find((e) => e.name === "preprocess")!;
    const embeddingExecutor = stageExecutors.find((e) => e.name === "embedding")!;
    const competitorExecutor = stageExecutors.find((e) => e.name === "competitor")!;

    vi.mocked(fetchExecutor.execute).mockResolvedValue({ asin: "B00001" });

    // Preprocess fails
    vi.mocked(preprocessExecutor.execute).mockImplementation(async () => {
      callTimeline.push("preprocess:failed");
      throw new Error("Preprocessing failed due to bad encoding");
    });

    // Embedding should never be called
    vi.mocked(embeddingExecutor.execute).mockImplementation(async () => {
      callTimeline.push("embedding:called");
      return [];
    });

    // Competitor should still run and succeed
    vi.mocked(competitorExecutor.execute).mockImplementation(async () => {
      callTimeline.push("competitor:succeeded");
      return [{ asin: "B00002" }];
    });

    await engine.runJob(jobId, correlationId);

    // Verify preprocess failed and competitor still succeeded
    expect(callTimeline).toContain("preprocess:failed");
    expect(callTimeline).toContain("competitor:succeeded");
    expect(callTimeline).not.toContain("embedding:called");

    // Verify database updates
    expect(pipelineRepo.updateStageStatus).toHaveBeenCalledWith(
      jobId,
      "preprocess",
      "failed",
      null,
      "Preprocessing failed due to bad encoding"
    );

    // Downstream steps (embedding, semantic, optimize) must be marked as failed/skipped
    expect(pipelineRepo.updateStageStatus).toHaveBeenCalledWith(
      jobId,
      "embedding",
      "failed",
      null,
      "Skipped: Dependency failed"
    );
    expect(pipelineRepo.updateStageStatus).toHaveBeenCalledWith(
      jobId,
      "semantic",
      "failed",
      null,
      "Skipped: Dependency failed"
    );
    expect(pipelineRepo.updateStageStatus).toHaveBeenCalledWith(
      jobId,
      "optimize",
      "failed",
      null,
      "Skipped: Dependency failed"
    );

    // Verify overall job marked as failed
    expect(pipelineRepo.updateJobStatus).toHaveBeenCalledWith(
      jobId,
      "failed",
      null,
      expect.stringContaining("One or more stages failed")
    );
  });

  it("should invalidate and force re-execution of downstream stages when a parent stage is retried", async () => {
    const jobId = 3;
    const mockJobRecord = {
      id: jobId,
      prospectId: 103,
      listingId: 203,
      packageType: "package_2",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // First run results: all completed
    const mockStages: Record<string, import("../../pipeline/types.js").PipelineStageState> = {
      fetch: { status: "completed", output: { asin: "B00003" } },
      // preprocess is pending (the user clicked retry on it, clearing its status to pending!)
      preprocess: { status: "pending" },
      // embedding, semantic, optimize were completed previously, but depend on preprocess!
      embedding: { status: "completed", output: [0.1] },
      semantic: { status: "completed", output: { score: 90 } },
      optimize: { status: "completed", output: { optimized: true } },
      // competitor was completed previously and does NOT depend on preprocess
      competitor: { status: "completed", output: [] },
    };

    vi.mocked(pipelineRepo.getJob).mockResolvedValue(mockJobRecord as any);
    vi.mocked(pipelineRepo.getStagesForJob).mockResolvedValue(mockStages as any);

    const callTimeline: string[] = [];

    const fetchExecutor = stageExecutors.find((e) => e.name === "fetch")!;
    const preprocessExecutor = stageExecutors.find((e) => e.name === "preprocess")!;
    const embeddingExecutor = stageExecutors.find((e) => e.name === "embedding")!;
    const semanticExecutor = stageExecutors.find((e) => e.name === "semantic")!;
    const optimizeExecutor = stageExecutors.find((e) => e.name === "optimize")!;
    const competitorExecutor = stageExecutors.find((e) => e.name === "competitor")!;

    // We change mock implementation of executors to check if they run
    vi.mocked(fetchExecutor.execute).mockImplementation(async () => {
      callTimeline.push("fetch:run");
      return {};
    });
    vi.mocked(preprocessExecutor.execute).mockImplementation(async () => {
      callTimeline.push("preprocess:run");
      return { cleanedText: "new text" };
    });
    vi.mocked(embeddingExecutor.execute).mockImplementation(async () => {
      callTimeline.push("embedding:run");
      return [0.2];
    });
    vi.mocked(semanticExecutor.execute).mockImplementation(async () => {
      callTimeline.push("semantic:run");
      return {};
    });
    vi.mocked(optimizeExecutor.execute).mockImplementation(async () => {
      callTimeline.push("optimize:run");
      return {};
    });
    vi.mocked(competitorExecutor.execute).mockImplementation(async () => {
      callTimeline.push("competitor:run");
      return [];
    });

    await engine.runJob(jobId, correlationId);

    // Verify: fetch is completed and not modified, so it should NOT run
    expect(callTimeline).not.toContain("fetch:run");

    // Preprocess is pending, so it MUST run
    expect(callTimeline).toContain("preprocess:run");

    // Embedding, semantic, optimize depend on preprocess, so they MUST run again because preprocess output changed!
    expect(callTimeline).toContain("embedding:run");
    expect(callTimeline).toContain("semantic:run");
    expect(callTimeline).toContain("optimize:run");

    // Competitor does NOT depend on preprocess, and is already completed, so it should NOT run
    expect(callTimeline).not.toContain("competitor:run");

    // DB should be updated with completed statuses
    expect(pipelineRepo.updateStageStatus).toHaveBeenCalledWith(jobId, "preprocess", "completed", expect.any(Object));
    expect(pipelineRepo.updateStageStatus).toHaveBeenCalledWith(jobId, "embedding", "completed", expect.any(Object));
  });
});
