/* eslint-disable @typescript-eslint/no-explicit-any */
import { initTRPC } from "@trpc/server";

export async function createContext({ req }: { req: Request }) {
  return { req };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
export const t = initTRPC.context<Context>().create();
export const router = t.router;
export const publicProcedure = t.procedure;
