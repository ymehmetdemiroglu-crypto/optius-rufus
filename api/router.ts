import { router } from "./trpc.js";
import { agentsRouter } from "./routers/agents.js";
import { prospectsRouter } from "./routers/prospects.js";
import { scraperRouter } from "./routers/scraper.js";
import { analysisRouter } from "./routers/analysis.js";
import { apolloRouter } from "./routers/apollo.js";
import { bookingRouter } from "./routers/booking.js";

export const appRouter = router({
  agents: agentsRouter,
  prospects: prospectsRouter,
  scraper: scraperRouter,
  analysis: analysisRouter,
  apollo: apolloRouter,
  booking: bookingRouter,
});

export type AppRouter = typeof appRouter;

