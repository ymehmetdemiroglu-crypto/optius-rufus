import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateOutreachCopy } from '../outreach.js';

// Mock drizzle DB queries
vi.mock('../../../db/drizzle.js', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation((limitVal) => {
      // Return mock records based on context
      return Promise.resolve([
        {
          id: 42,
          firstName: "Andrew",
          lastName: "Huberman",
          company: "Scicomm Media",
          email: "andrew@huberman.com",
          status: "drafted",
          expectedRevenue: "Class_B",
          asin: "B07T7H5C5R",
          rufusScore: 48,
          copySimulatorScenarios: JSON.stringify([
            {
              failReason: "missing daily dosage guidelines and allergen warnings",
              competitorName: "NutraWell Products"
            }
          ])
        }
      ]);
    }),
  };
  return { db: mockDb };
});

describe('Outreach Campaign Copy Generation Test', () => {
  it('should generate copy containing the weakness scorecard and pitching a PDF autopsy', async () => {
    console.log("🚀 Testing outreach copywriter LLM generation...");
    const emails = await generateOutreachCopy(42);
    
    console.log("\n==================================================");
    console.log(`✉️ Generated Subject: "${emails.subject}"`);
    console.log(`✉️ Touch 1 Body:\n${emails.body1}`);
    console.log(`--------------------------------------------------`);
    console.log(`✉️ Touch 2 Body:\n${emails.body2}`);
    console.log(`--------------------------------------------------`);
    console.log(`✉️ Touch 3 Body:\n${emails.body3}`);
    console.log(`--------------------------------------------------`);
    console.log(`✉️ Touch 4 Body:\n${emails.body4}`);
    console.log(`--------------------------------------------------`);
    console.log(`✉️ Touch 5 Body:\n${emails.body5}`);
    console.log("==================================================\n");

    // Assertions
    expect(emails.subject).toBeDefined();
    expect(emails.body1).toContain("NutraWell"); // Competitor Name
    expect(emails.body1).toContain("dosage"); // Gaps
    
    // Check no links
    expect(emails.body1).not.toContain("http");
    expect(emails.body2).not.toContain("http");
    expect(emails.body3).not.toContain("http");
    expect(emails.body4).not.toContain("http");
    expect(emails.body5).not.toContain("http");

    // Check CTA in first email is reply-focused or conversational
    const body1Lower = emails.body1.toLowerCase();
    const hasCta = body1Lower.includes("reply") || 
                   body1Lower.includes("send") || 
                   body1Lower.includes("drop") || 
                   body1Lower.includes("checklist") || 
                   body1Lower.includes("pdf");
    expect(hasCta).toBe(true);
  });
});
