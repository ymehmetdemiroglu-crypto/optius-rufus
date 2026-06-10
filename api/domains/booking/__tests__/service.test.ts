import { describe, it, expect, vi, beforeEach } from "vitest";
import * as bookingService from "../service.js";
import * as bookingRepo from '../../booking/repository.js';

// Mock the booking repository
vi.mock("../../booking/repository.js", () => {
  return {
    create: vi.fn(),
    getByProspectId: vi.fn(),
    listAll: vi.fn(),
  };
});

describe("bookingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createBooking", () => {
    it("should transform input and create a booking with pending status", async (): Promise<void> => {
      const input = {
        prospectId: 10,
        name: "John Doe",
        email: "john@example.com",
        company: "John Corp",
      };

      const mockRecord = {
        id: 5,
        prospectId: 10,
        name: "John Doe",
        email: "john@example.com",
        company: "John Corp",
        revenue: undefined,
        notes: undefined,
        scheduledDate: undefined,
        status: "pending",
        createdAt: "2026-06-07T12:00:00Z",
      };

      vi.mocked(bookingRepo.create).mockResolvedValue(mockRecord);

      const result = await bookingService.createBooking(input);

      expect(bookingRepo.create).toHaveBeenCalledWith({
        prospectId: 10,
        name: "John Doe",
        email: "john@example.com",
        company: "John Corp",
        revenue: undefined,
        notes: undefined,
        scheduledDate: undefined,
        status: "pending",
      });
      expect(result).toEqual(mockRecord);
    });

    it("should throw a wrapped error if repository creation fails", async (): Promise<void> => {
      const input = {
        prospectId: 10,
        name: "John Doe",
        email: "john@example.com",
      };

      vi.mocked(bookingRepo.create).mockRejectedValue(new Error("Unique constraint failed"));

      await expect(bookingService.createBooking(input)).rejects.toThrow("Failed to create booking");
    });
  });

  describe("getBookingsByProspectId", () => {
    it("should return the list of bookings for a prospect", async (): Promise<void> => {
      const mockRecords = [
        {
          id: 5,
          prospectId: 10,
          name: "John Doe",
          email: "john@example.com",
          company: undefined,
          revenue: undefined,
          notes: undefined,
          scheduledDate: undefined,
          status: "pending",
          createdAt: "2026-06-07T12:00:00Z",
        },
      ];

      vi.mocked(bookingRepo.getByProspectId).mockResolvedValue(mockRecords);

      const result = await bookingService.getBookingsByProspectId(10);

      expect(bookingRepo.getByProspectId).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockRecords);
    });

    it("should throw a wrapped error if repository fetch fails", async (): Promise<void> => {
      vi.mocked(bookingRepo.getByProspectId).mockRejectedValue(new Error("Connection reset"));

      await expect(bookingService.getBookingsByProspectId(10)).rejects.toThrow("Failed to fetch bookings for prospect 10");
    });
  });
});
