import { describe, it, expect, vi, beforeEach } from "vitest";
import { JobRepository } from "../jobRepository.js";

type MockDb = {
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

describe("JobRepository - Requeue Backoff Fix", () => {
  let mockDb: MockDb;
  let repository: JobRepository;

  beforeEach(() => {
    mockDb = {
      insert: vi.fn(() => ({
        values: vi.fn(() => Promise.resolve()),
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
      })),
    };
    repository = new JobRepository(mockDb as unknown as ConstructorParameters<typeof JobRepository>[0]);
  });

  it("should update timestamp to now and set delay to backoff on requeue", async () => {
    const jobId = "job-id-123";
    const backoff = 2000;
    const reason = "Failed due to API rate limit";
    const stack = ["Error line 1", "Error line 2"];

    const setMock = vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) }));
    mockDb.update.mockReturnValue({ set: setMock });

    await repository.requeue(jobId, backoff, reason, stack);

    // Verify update was called on jobs table
    expect(mockDb.update).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalled();
    const setArgs = (setMock.mock.calls[0] as unknown[])[0] as Record<string, unknown>;

    // Timestamp should be recent (within 1000ms of now)
    expect(setArgs.timestamp).toBeGreaterThan(Date.now() - 1000);
    expect(setArgs.timestamp).toBeLessThanOrEqual(Date.now());

    expect(setArgs.delay).toBe(backoff);
    expect(setArgs.failedReason).toBe(reason);
    expect(setArgs.stacktraceJSON).toEqual(stack);
    expect(setArgs.status).toBe("pending");
  });
});
