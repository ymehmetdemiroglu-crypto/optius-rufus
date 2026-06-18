import { describe, it, expect, vi, beforeEach } from "vitest";
import * as prospectService from "../service.js";
import * as prospectRepo from "../repository.js";
import * as listingRepo from "../../listing/repository.js";
// Mock repositories relative to this test file
vi.mock("../repository.js", () => {
  return {
    create: vi.fn(),
    getById: vi.fn(),
    getByEmail: vi.fn(),
    updateStatus: vi.fn(),
    updateReplyDetails: vi.fn(),
    updateApolloFields: vi.fn(),
    recordActivity: vi.fn(),
  };
});

vi.mock("../../listing/repository.js", () => {
  return {
    getLatestByProspectId: vi.fn(),
  };
});

vi.mock("../../analysis/repository.js", () => {
  return {
    getLatestByListingId: vi.fn(),
  };
});

vi.mock("../../../infra/queue.js", () => {
  return {
    pipelineQueue: {
      add: vi.fn().mockResolvedValue({ id: "mock-job-id" }),
    },
  };
});

// Mock Apollo services
vi.mock("../../apollo/service.js", () => {
  return {
    createContact: vi.fn().mockResolvedValue({ id: "mock-apollo-contact-id" }),
    enrollInSequence: vi.fn().mockResolvedValue({ id: "mock-apollo-sequence-enrollment-id" }),
  };
});

describe("prospectService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("classifyProspectRevenue", () => {
    it("should correctly classify Enterprise tier (Class A)", () => {
      expect(prospectService.classifyProspectRevenue("$1,500,000 / year")).toBe("Class_A");
      expect(prospectService.classifyProspectRevenue("1.2M")).toBe("Class_A");
      expect(prospectService.classifyProspectRevenue("Enterprise Scale")).toBe("Class_A");
    });

    it("should correctly classify Growth tier (Class B)", () => {
      expect(prospectService.classifyProspectRevenue("$250,000")).toBe("Class_B");
      expect(prospectService.classifyProspectRevenue("150k")).toBe("Class_B");
      expect(prospectService.classifyProspectRevenue("10000/mo")).toBe("Class_B"); // monthly check
    });

    it("should correctly classify Starter tier (Class C)", () => {
      expect(prospectService.classifyProspectRevenue("$50,000")).toBe("Class_C");
      expect(prospectService.classifyProspectRevenue("starter")).toBe("Class_C");
      expect(prospectService.classifyProspectRevenue("")).toBe("Class_C");
      expect(prospectService.classifyProspectRevenue(undefined)).toBe("Class_C");
    });
  });

  describe("handleApolloReply", () => {
    const mockProspect = {
      id: 1,
      slug: "test-slug",
      email: "seller@brand.com",
      firstName: "Jane",
      lastName: "Doe",
      company: "Brand Co",
      expectedRevenue: "$150,000",
      status: "new",
      landingPageViews: 0,
      createdAt: "2026-06-14T12:00:00Z",
    };

    it("should process reply for an existing prospect and trigger background audit if ASIN is found", async () => {
      vi.mocked(prospectRepo.getByEmail).mockResolvedValue(mockProspect);
      vi.mocked(prospectRepo.getById).mockResolvedValue({
        ...mockProspect,
        status: "analyzing",
        asin: "B0C2D8H69B",
      });
      vi.mocked(listingRepo.getLatestByProspectId).mockResolvedValue(undefined); // no listing yet

      const payload = {
        email: "seller@brand.com",
        asin: "B0C2D8H69B",
        expectedRevenue: "$150,000",
        email_message: {
          subject: "Audit query",
          body_text: "Let me know your results.",
        }
      };

      const result = await prospectService.handleApolloReply(payload);

      expect(prospectRepo.getByEmail).toHaveBeenCalledWith("seller@brand.com");
      expect(prospectRepo.updateStatus).toHaveBeenCalledWith(mockProspect.id, "replied");
      expect(prospectRepo.updateReplyDetails).toHaveBeenCalledWith(mockProspect.id, expect.objectContaining({
        asin: "B0C2D8H69B",
      }));
      expect(result.success).toBe(true);
      expect(result.auditTriggered).toBe(true);
      expect(result.asin).toBe("B0C2D8H69B");
    });

    it("should extract ASIN from email body text if not explicitly provided", async () => {
      vi.mocked(prospectRepo.getByEmail).mockResolvedValue(mockProspect);
      vi.mocked(prospectRepo.getById).mockResolvedValue({
        ...mockProspect,
        status: "analyzing",
        asin: "B07XYZ9999",
      });
      vi.mocked(listingRepo.getLatestByProspectId).mockResolvedValue(undefined);

      const payload = {
        email: "seller@brand.com",
        email_message: {
          subject: "Audit query",
          body_text: "Hey there! My listing ASIN is B07XYZ9999, please check it.",
        }
      };

      const result = await prospectService.handleApolloReply(payload);

      expect(result.success).toBe(true);
      expect(result.auditTriggered).toBe(true);
      expect(result.asin).toBe("B07XYZ9999");
    });
  });
});
