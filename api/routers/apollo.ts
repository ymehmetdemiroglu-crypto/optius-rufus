import { z } from "zod";
import { db } from "../db/client.js";
import type { ProspectRecord } from "../db/client.js";
import { createContact, enrollInSequence, getSequences } from "../services/apollo.js";
import { router, publicProcedure } from "../trpc.js";

export const apolloRouter = router({
  createContact: publicProcedure
    .input(z.object({ prospectId: z.number().int() }))
    .mutation(async ({ input }) => {
      const prospect = db.prepare("SELECT * FROM prospects WHERE id = ?").get(input.prospectId) as ProspectRecord | undefined;
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
        prospect: db.prepare("SELECT * FROM prospects WHERE id = ?").get(input.prospectId) as ProspectRecord | undefined,
      };
    }),

  enrollSequence: publicProcedure
    .input(
      z.object({
        prospectId: z.number().int(),
        sequenceId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const prospect = db.prepare("SELECT * FROM prospects WHERE id = ?").get(input.prospectId) as ProspectRecord | undefined;
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
        prospect: db.prepare("SELECT * FROM prospects WHERE id = ?").get(input.prospectId) as ProspectRecord | undefined,
      };
    }),

  getSequences: publicProcedure
    .input(z.object({}))
    .query(async () => {
      return getSequences();
    }),
});

