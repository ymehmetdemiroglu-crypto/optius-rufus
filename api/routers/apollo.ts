import { z } from "zod";
import { db } from "../db/client.js";
import { createContact, enrollInSequence, getSequences } from "../services/apollo.js";

export const apolloRouter = {
  createContact: {
    type: "mutation" as const,
    input: z.object({ prospectId: z.number().int() }),
    resolve: async ({ input }: { input: { prospectId: number } }) => {
      const prospect = db.prepare("SELECT * FROM prospects WHERE id = ?").get(input.prospectId);
      if (!prospect) {
        throw new Error(`Prospect not found: ${input.prospectId}`);
      }

      const contact = await createContact({
        email: prospect.email,
        firstName: prospect.firstName || undefined,
        lastName: prospect.lastName || undefined,
        company: prospect.company || undefined,
      });

      db.prepare("UPDATE prospects SET apolloContactId = ?, status = 'emailed' WHERE id = ?").run(contact.id, input.prospectId);
      return {
        contactId: contact.id,
        prospect: db.prepare("SELECT * FROM prospects WHERE id = ?").get(input.prospectId),
      };
    },
  },

  enrollSequence: {
    type: "mutation" as const,
    input: z.object({
      prospectId: z.number().int(),
      sequenceId: z.string(),
    }),
    resolve: async ({ input }: { input: { prospectId: number; sequenceId: string } }) => {
      const prospect = db.prepare("SELECT * FROM prospects WHERE id = ?").get(input.prospectId);
      if (!prospect) {
        throw new Error(`Prospect not found: ${input.prospectId}`);
      }
      if (!prospect.apolloContactId) {
        throw new Error(`Prospect has no Apollo contact: ${input.prospectId}`);
      }

      const enrollment = await enrollInSequence(prospect.apolloContactId, input.sequenceId);
      db.prepare("UPDATE prospects SET apolloSequenceId = ?, status = 'emailed' WHERE id = ?").run(input.sequenceId, input.prospectId);

      return {
        enrollmentId: enrollment.id,
        prospect: db.prepare("SELECT * FROM prospects WHERE id = ?").get(input.prospectId),
      };
    },
  },

  getSequences: {
    type: "query" as const,
    input: z.object({}),
    resolve: async () => {
      return getSequences();
    },
  },
};
