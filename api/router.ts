import { router } from "./trpc.js";
import { agentsRouter } from "./routers/agents.js";
import { prospectsRouter } from "./routers/prospects.js";
import { scraperRouter } from "./routers/scraper.js";
import { analysisRouter } from "./routers/analysis.js";
import { apolloRouter } from "./routers/apollo.js";
import { bookingRouter } from "./routers/booking.js";
import { brandingRouter } from "./routers/branding.js";
import { rufusTrackerRouter } from "./routers/rufusTracker.js";
import { catalogGraphRouter } from "./routers/catalogGraphRouter.js";

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
});

export type AppRouter = typeof appRouter;

