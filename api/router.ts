import { router } from './trpcStub.js'; // Let's stub or use standard tRPC router
import { agentsRouter } from './routers/agents.js';

// We can define a stub router for compilation if needed
export const appRouter = {
  agents: agentsRouter,
};

export type AppRouter = typeof appRouter;
