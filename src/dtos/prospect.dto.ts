// ── Listing ──

export interface ProspectListing {
  asin: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  image?: string;
  bullets?: string[];
  description?: string;
}

// ── Scores ──

export interface ProspectScoreBreakdown {
  overallScore: number;
  rufusScore: number;
  cosmoScore: number;
  semanticScore: number;
  contentScore: number;
  categoryAverage?: number;
}

// ── Issues & Opportunities ──

export interface ProspectIssue {
  title: string;
  severity: 'critical' | 'warning';
  description: string;
  impact: string;
}

export interface ProspectOpportunity {
  title: string;
  description: string;
  before: string;
  after: string;
}

// ── Rufus Simulator ──

export interface SimulatorScenario {
  buyerQuestion: string;
  rufusAnswer: string;
  competitorName: string;
  failReason: string;
}

// ── Transformation Preview ──

export interface TransformSnippet {
  section: string;
  content: string;
}

// ── Advanced Upgrades ──

export interface FreeQAItem {
  question: string;
  answer: string;
  dimension: string;
}

export interface ReviewSentimentProfile {
  aspect: string;
  status: 'critical' | 'warning' | 'good';
  feedback: string;
  percentage: number;
}

export interface CompetitorComparison {
  query: string;
  competitorName: string;
  competitorAdvantage: string;
  yourGap: string;
}

export interface PPCKeywordItem {
  intent: string;
  keyword: string;
  difficulty: 'Low' | 'Medium' | 'High';
  searchVolume: number;
  bidEstimate: number;
}

export interface BundlingItem {
  title: string;
  products: string[];
  rationale: string;
}

export interface CosmoNodeData {
  nodes: Array<{ id: string; label: string; group: 'core' | 'connected' | 'gap' }>;
  edges: Array<{ from: string; to: string; active: boolean }>;
}

// ── Stage Copy (All 8 stages) ──

export interface StageCopyData {
  // Stage 1: Hero
  heroHeadline: string;
  heroSubheadline: string;
  // Stage 2: Autopsy
  autopsyHeadline: string;
  autopsyBody: string;
  // Stage 3: Bleed Calculator
  bleedHeadline: string;
  bleedBody: string;
  // Stage 4: Rufus Simulator
  simulatorIntro: string;
  simulatorScenarios: SimulatorScenario[];
  // Stage 5: Transformation
  transformHeadline: string;
  transformBefore: TransformSnippet[];
  transformAfter: TransformSnippet[];
  // Stage 6: Roadmap
  roadmapHeadline: string;
  roadmapBody: string;
  // Stage 7: Social Proof
  socialProofHeadline: string;
  urgencyCTA: string;
  // Stage 8: CTA
  ctaHeadline: string;
  ctaGuarantee: string;

  // Advanced features
  freeQAs: FreeQAItem[];
  reviewSentiment: ReviewSentimentProfile[];
  competitorAudit: CompetitorComparison[];
  ppcKeywords: PPCKeywordItem[];
  cosmoBundling: BundlingItem[];
  cosmoGraphData: CosmoNodeData;
}

// ── Prospect Data (complete landing page data) ──

export interface ProspectData {
  id: number;
  slug: string;
  name: string;
  company?: string;
  email?: string;
  listing: ProspectListing;
  scores: ProspectScoreBreakdown;
  topIssues: ProspectIssue[];
  narrative: string;
  opportunities: ProspectOpportunity[];
  stageCopy: StageCopyData;
  status: 'new' | 'scraped' | 'analyzed' | 'emailed' | 'visited' | 'booked';
  views: number;
  packageType?: string;
  pricePoint?: number;
  createdAt: string;
}

// ── Booking ──

export interface BookingFormData {
  name: string;
  email: string;
  company: string;
  revenue: string;
  notes: string;
}

// ── Pipeline (admin) ──

export interface PipelineProspect {
  id: number;
  name: string;
  company?: string;
  asin: string;
  status: ProspectData['status'];
  score?: number;
  title?: string;
  slug: string;
}
