import { z } from "zod";
import * as prospectRepo from "../prospect/repository.js";
import { createContact, enrollInSequence, getSequences } from "./service.js";
import { router, publicProcedure } from "../../trpc.js";

export const apolloRouter = router({
  createContact: publicProcedure
    .input(z.object({ prospectId: z.number().int() }))
    .mutation(async ({ input }) => {
      const prospect = await prospectRepo.getById(input.prospectId);
      if (!prospect) {
        throw new Error(`Prospect not found: ${input.prospectId}`);
      }

      const contact = await createContact({
        email: prospect.email,
        firstName: prospect.firstName || undefined,
        lastName: prospect.lastName || undefined,
        company: prospect.company || undefined,
      });

      await prospectRepo.updateApolloFields(input.prospectId, {
        apolloContactId: contact.id,
        status: "emailed",
      });

      const updated = await prospectRepo.getById(input.prospectId);
      return {
        contactId: contact.id,
        prospect: updated,
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
      const prospect = await prospectRepo.getById(input.prospectId);
      if (!prospect) {
        throw new Error(`Prospect not found: ${input.prospectId}`);
      }
      if (!prospect.apolloContactId) {
        throw new Error(`Prospect has no Apollo contact: ${input.prospectId}`);
      }

      const enrollment = await enrollInSequence(prospect.apolloContactId, input.sequenceId);
      await prospectRepo.updateApolloFields(input.prospectId, {
        apolloSequenceId: input.sequenceId,
        status: "emailed",
      });

      const updated = await prospectRepo.getById(input.prospectId);
      return {
        enrollmentId: enrollment.id,
        prospect: updated,
      };
    }),

  getSequences: publicProcedure
    .input(z.object({}))
    .query(async () => {
      return getSequences();
    }),
});
