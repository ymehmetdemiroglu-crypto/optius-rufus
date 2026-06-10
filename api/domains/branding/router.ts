import { z } from "zod";
import { router, publicProcedure } from "../../trpc/context.js";
import * as brandRepo from "./repository.js";

export const brandingRouter = router({
  getSettings: publicProcedure.query(async () => {
    try {
      const row = await brandRepo.getSettings();
      if (row) {
        return {
          companyName: row.companyName || "Optimus Rufus Agency",
          logoUrl: row.logoUrl || "",
          logoBase64: row.logoBase64 || "",
          primaryColor: row.primaryColor || "#b8860b",
          website: row.website || "",
        };
      }
    } catch (err) {
      console.error("Failed to query brand settings:", err);
    }

    return {
      companyName: "Optimus Rufus Agency",
      logoUrl: "",
      logoBase64: "",
      primaryColor: "#b8860b",
      website: "optimusrufus.com",
    };
  }),

  updateSettings: publicProcedure
    .input(
      z.object({
        companyName: z.string().optional(),
        logoUrl: z.string().optional(),
        logoBase64: z.string().optional(),
        primaryColor: z.string().optional(),
        website: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await brandRepo.upsertSettings(input);
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to update settings: ${message}`, { cause: err });
      }
    }),
});
