import { router } from "./trpc.js";
import { agentsRouter } from "./domains/optimization/router.js";
import { prospectsRouter } from "./domains/prospect/router.js";
import { scraperRouter } from "./domains/listing/router.js";
import { analysisRouter } from "./domains/analysis/router.js";
import { apolloRouter } from "./domains/apollo/router.js";
import { bookingRouter } from "./domains/booking/router.js";
import { brandingRouter } from "./domains/branding/router.js";
import { rufusTrackerRouter } from "./domains/rufus/router.js";
import { catalogGraphRouter } from "./domains/catalog/router.js";
import { ppcRouter } from "./domains/ppc/router.js";

export const appRouter = router({
  agents: agentsRouter,
  prospects: prospectsRouter,
  scraper: scraperRouter,
  analysis: analysisRouter,
  apollo: apolloRouter,
  booking: bookingRouter,
  branding: brandingRouter,
  rufusTracker: rufusTrackerRouter,
  catalogGraph: catalogGraphRouter,
  ppc: ppcRouter,
});

export type AppRouter = typeof appRouter;
