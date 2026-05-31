import { router, stubToRouter } from "./trpc.js";
import { agentsRouter } from "./routers/agents.js";
import { prospectsRouter } from "./routers/prospects.js";
import { scraperRouter } from "./routers/scraper.js";
import { analysisRouter } from "./routers/analysis.js";
import { apolloRouter } from "./routers/apollo.js";
import { bookingRouter } from "./routers/booking.js";

export const appRouter = router({
  agents: router(stubToRouter(agentsRouter as Record<string, unknown>)),
  prospects: router(stubToRouter(prospectsRouter as Record<string, unknown>)),
  scraper: router(stubToRouter(scraperRouter as Record<string, unknown>)),
  analysis: router(stubToRouter(analysisRouter as Record<string, unknown>)),
  apollo: router(stubToRouter(apolloRouter as Record<string, unknown>)),
  booking: router(stubToRouter(bookingRouter as Record<string, unknown>)),
});

export type AppRouter = typeof appRouter;
