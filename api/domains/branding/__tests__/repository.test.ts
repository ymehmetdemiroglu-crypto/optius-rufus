import { describe, it, expect, vi, beforeEach } from "vitest";
import * as brandRepository from "../repository.js";
import { db as pgDb } from "../../../db/drizzle.js";

// Mock the drizzle database module
vi.mock("../../../db/drizzle.js", () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
    },
  };
});

describe("brandRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSettings", () => {
    it("should fetch and return the latest brand settings", async (): Promise<void> => {
      const mockSettings = {
        id: 1,
        companyName: "Acme Agency",
        website: "https://acme.example.com",
        primaryColor: "#0055ff",
        logoBase64: "data:image/png;base64,123",
        createdAt: "2026-06-07T12:00:00Z",
        updatedAt: "2026-06-07T12:00:00Z",
      };

      // Set up the mock method chain: pgDb.select().from().orderBy().limit()
      const mockLimit = vi.fn().mockResolvedValue([mockSettings]);
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      vi.mocked(pgDb.select).mockReturnValue({ from: mockFrom } as any); // eslint-disable-line @typescript-eslint/no-explicit-any -- mock chain helper

      const result = await brandRepository.getSettings();

      expect(pgDb.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockOrderBy).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSettings);
    });

    it("should return undefined if no brand settings exist", async (): Promise<void> => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      vi.mocked(pgDb.select).mockReturnValue({ from: mockFrom } as any); // eslint-disable-line @typescript-eslint/no-explicit-any -- mock chain helper

      const result = await brandRepository.getSettings();

      expect(result).toBeUndefined();
    });

    it("should throw a wrapped error if query fails", async (): Promise<void> => {
      const mockFrom = vi.fn().mockImplementation(() => {
        throw new Error("Database timeout");
      });
      vi.mocked(pgDb.select).mockReturnValue({ from: mockFrom } as any); // eslint-disable-line @typescript-eslint/no-explicit-any -- mock chain helper

      await expect(brandRepository.getSettings()).rejects.toThrow("Failed to fetch brand settings: Database timeout");
    });
  });
});
