import { z } from "zod";
import { db } from "../db/client.js";
import { router, publicProcedure } from "../trpc.js";

export const brandingRouter = router({
  getSettings: publicProcedure.query(async () => {
    try {
      const row = db.prepare("SELECT * FROM brand_settings ORDER BY id DESC LIMIT 1").get() as any;
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
      const existing = db.prepare("SELECT id FROM brand_settings LIMIT 1").get() as { id: number } | undefined;
      
      if (existing) {
        db.prepare(
          `UPDATE brand_settings 
           SET companyName = ?, logoUrl = ?, logoBase64 = ?, primaryColor = ?, website = ?
           WHERE id = ?`
        ).run(
          input.companyName ?? "Optimus Rufus Agency",
          input.logoUrl ?? "",
          input.logoBase64 ?? "",
          input.primaryColor ?? "#b8860b",
          input.website ?? "",
          existing.id
        );
      } else {
        db.prepare(
          `INSERT INTO brand_settings (companyName, logoUrl, logoBase64, primaryColor, website)
           VALUES (?, ?, ?, ?, ?)`
        ).run(
          input.companyName ?? "Optimus Rufus Agency",
          input.logoUrl ?? "",
          input.logoBase64 ?? "",
          input.primaryColor ?? "#b8860b",
          input.website ?? ""
        );
      }

      return { success: true };
    }),
});
