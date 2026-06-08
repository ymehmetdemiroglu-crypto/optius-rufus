import { describe, it, expect, vi, beforeEach } from "vitest";
import { SqliteJobRepository } from "../jobRepository.js";

describe("SqliteJobRepository - Requeue Backoff Fix", () => {
  let mockDb: any;
  let repository: SqliteJobRepository;

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn().mockReturnValue({
        run: vi.fn(),
        get: vi.fn(),
      }),
    };
    repository = new SqliteJobRepository(mockDb);
  });

  it("should update timestamp to now and set delay to backoff on requeue", async () => {
    const jobId = "job-id-123";
    const backoff = 2000;
    const reason = "Failed due to API rate limit";
    const stack = ["Error line 1", "Error line 2"];

    const runMock = vi.fn();
    mockDb.prepare.mockReturnValue({ run: runMock });

    await repository.requeue(jobId, backoff, reason, stack);

    // Verify SQL query
    expect(mockDb.prepare).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE jobs SET status = 'pending', timestamp = ?, delay = ?, failedReason = ?, stacktraceJSON = ? WHERE id = ?")
    );

    // Verify parameters passed to run()
    expect(runMock).toHaveBeenCalled();
    const args = runMock.mock.calls[0];
    
    const passedTimestamp = args[0];
    const passedDelay = args[1];
    const passedReason = args[2];
    const passedStackJSON = args[3];
    const passedId = args[4];

    // Timestamp should be recent (within 100ms of now)
    expect(passedTimestamp).toBeGreaterThan(Date.now() - 1000);
    expect(passedTimestamp).toBeLessThanOrEqual(Date.now());

    expect(passedDelay).toBe(backoff);
    expect(passedReason).toBe(reason);
    expect(JSON.parse(passedStackJSON)).toEqual(stack);
    expect(passedId).toBe(jobId);
  });
});
