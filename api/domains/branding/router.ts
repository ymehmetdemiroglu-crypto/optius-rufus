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
          sequenceEnterprise: row.sequenceEnterprise || "6a3005fee287cb000c007e03",
          sequenceGrowth: row.sequenceGrowth || "6a300617700f6b000cee5416",
          sequenceStarter: row.sequenceStarter || "6a30063082147b001cd1f361",
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
      sequenceEnterprise: "6a3005fee287cb000c007e03",
      sequenceGrowth: "6a300617700f6b000cee5416",
      sequenceStarter: "6a30063082147b001cd1f361",
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
        sequenceEnterprise: z.string().optional(),
        sequenceGrowth: z.string().optional(),
        sequenceStarter: z.string().optional(),
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
