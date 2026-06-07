import type { StageDefinition } from "./types.js";

export const STAGE_ORDER: StageDefinition[] = [
  { name: "fetch", dependencies: [] },
  { name: "preprocess", dependencies: ["fetch"] },
  { name: "embedding", dependencies: ["preprocess"] },
  { name: "semantic", dependencies: ["embedding"] },
  { name: "optimize", dependencies: ["semantic"] },
  { name: "competitor", dependencies: ["fetch"] },
];
