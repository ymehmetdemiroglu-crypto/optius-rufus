import * as Sentry from "@sentry/node";
import { initTRPC } from "@trpc/server";

interface Context {
  user?: { id: number; email: string };
}

export const t = initTRPC.context<Context>().create({
  onError: ({ path, error, ctx }) => {
    Sentry.captureException(error, {
      tags: { procedure: path },
      user: ctx?.user
        ? { id: ctx.user.id.toString(), email: ctx.user.email }
        : undefined,
    });
    console.error(`tRPC Error in ${path}:`, error);
  },
});
