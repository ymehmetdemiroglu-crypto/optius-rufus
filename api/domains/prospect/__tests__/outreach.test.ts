import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dbMocks from '../../../db/drizzle.js';

// Mock drizzle DB queries
vi.mock('../../../db/drizzle.js', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(() => {
      return Promise.resolve([
        {
          id: 42,
          firstName: "Andrew",
          lastName: "Huberman",
          company: "Scicomm Media",
          email: "andrew@huberman.com",
          status: "drafted",
          expectedRevenue: "Class_B",
          outreachEmails: {
            subject: "quick question about your listing",
            body1: "Hey Andrew, check out the Rufus Compatibility score.",
            body2: "Body 2",
            body3: "Body 3",
            body4: "Body 4",
            body5: "Body 5"
          }
        }
      ]);
    }),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };
  return { db: mockDb };
});

describe('Outreach Campaign Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should classify revenue correctly', async () => {
    const { classifyProspectRevenue } = await import('../service.js');
    expect(classifyProspectRevenue("Enterprise")).toBe("Class_A");
    expect(classifyProspectRevenue("GMV $1.5M")).toBe("Class_A");
    expect(classifyProspectRevenue("growth")).toBe("Class_B");
    expect(classifyProspectRevenue("$150,000")).toBe("Class_B");
    expect(classifyProspectRevenue("$20k")).toBe("Class_C");
  });

  it('should fetch the default mapped sequence ID', async () => {
    const { getDefaultSequenceIdForProspect } = await import('../service.js');
    
    // We mock branding repo so it returns mappings
    vi.mock('../../branding/repository.js', () => ({
      getSettings: vi.fn().mockResolvedValue({
        sequenceEnterprise: "seq-enterprise-id",
        sequenceGrowth: "seq-growth-id",
        sequenceStarter: "seq-starter-id",
      }),
    }));

    const seqId = await getDefaultSequenceIdForProspect(42);
    expect(seqId).toBe("seq-growth-id"); // Based on Class_B mock
  });
});
