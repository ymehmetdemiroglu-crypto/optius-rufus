export const STAGES = [
  { id: 'hero', label: 'Overview', component: 'StageHero' },
  { id: 'autopsy', label: 'Autopsy', component: 'StageAutopsy' },
  { id: 'bleed', label: 'Revenue', component: 'StageBleedCalculator' },
  { id: 'simulator', label: 'Rufus Sim', component: 'StageRufusSimulator' },
  { id: 'transform', label: 'Preview', component: 'StageTransformPreview' },
  { id: 'free-qas', label: 'Free QAs', component: 'StageFreeQAs' },
  { id: 'ppc-planner', label: 'PPC Planner', component: 'StagePPCPlanner' },
  { id: 'bundling', label: 'Bundling', component: 'StageBundlingBlueprint' },
  { id: 'aeo-audit', label: 'AEO Audit', component: 'StageAEOPDFAudit' },
  { id: 'roadmap', label: 'Roadmap', component: 'StageRoadmap' },
  { id: 'proof', label: 'Proof', component: 'StageProofWall' },
  { id: 'book', label: 'Book', component: 'StageBookCall' },
] as const;

export type StageId = typeof STAGES[number]['id'];

export const STAGE_LABELS = STAGES.map((s) => s.label);
export const STAGE_NAMES = STAGES.map((s) => s.id);
export const STAGE_IDS = STAGES.map((s) => `stage-${s.id}`);
