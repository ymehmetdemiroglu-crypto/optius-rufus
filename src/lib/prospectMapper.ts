import type {
  ProspectData,
  ProspectIssue,
  ProspectOpportunity,
  ProspectScoreBreakdown,
  ProspectListing,
  StageCopyData,
  SimulatorScenario,
  TransformSnippet,
} from '../types/prospect';

function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export function mapBackendToProspectData(data: {
  prospect: Record<string, unknown>;
  listing: Record<string, unknown> | null;
  analysis: Record<string, unknown> | null;
}): ProspectData {
  const prospect = data.prospect;
  const listing = data.listing;
  const analysis = data.analysis;

  // ── Name ──
  const firstName = (prospect.firstName as string) || '';
  const lastName = (prospect.lastName as string) || '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || ((prospect.email as string) ?? 'Unknown');

  // ── Listing ──
  const images = listing ? safeJsonParse(listing.images as string, [] as string[]) : [];
  const bullets = listing ? safeJsonParse(listing.bullets as string, [] as string[]) : [];

  const mappedListing: ProspectListing = listing
    ? {
        asin: (listing.asin as string) || '',
        title: (listing.title as string) || '',
        brand: (listing.brand as string) || '',
        category: (listing.category as string) || '',
        price: typeof listing.price === 'number' ? listing.price : 0,
        rating: typeof listing.rating === 'number' ? listing.rating : 0,
        reviewCount: typeof listing.reviewCount === 'number' ? listing.reviewCount : 0,
        image: images[0],
        bullets,
        description: (listing.description as string) || undefined,
      }
    : {
        asin: '',
        title: 'No listing data',
        brand: '',
        category: '',
        price: 0,
        rating: 0,
        reviewCount: 0,
        bullets: [],
      };

  // ── Scores ──
  const scores: ProspectScoreBreakdown = analysis
    ? {
        overallScore: typeof analysis.overallScore === 'number' ? analysis.overallScore : 0,
        rufusScore: typeof analysis.rufusScore === 'number' ? analysis.rufusScore : 0,
        cosmoScore: typeof analysis.cosmoScore === 'number' ? analysis.cosmoScore : 0,
        semanticScore: typeof analysis.semanticScore === 'number' ? analysis.semanticScore : 0,
        contentScore: typeof analysis.contentScore === 'number' ? analysis.contentScore : 0,
        categoryAverage: 54,
      }
    : {
        overallScore: 0,
        rufusScore: 0,
        cosmoScore: 0,
        semanticScore: 0,
        contentScore: 0,
        categoryAverage: 54,
      };

  // ── Top Issues ──
  const rawTopIssues = analysis ? safeJsonParse(analysis.topIssues as string, [] as unknown[]) : [];
  const topIssues: ProspectIssue[] = rawTopIssues.map((issue: unknown) => {
    const g = issue as Record<string, unknown>;
    return {
      title: (g.dimension as string) || 'Unknown Issue',
      severity: g.priority === 'critical' ? 'critical' : 'warning',
      description: (g.recommendation as string) || '',
      impact: `Gap: ${Math.round(((g.gap as number) || 0) * 100)}%`,
    };
  });

  // ── Narrative ──
  const narrative = (analysis?.copyProblemNarrative as string) || (analysis?.copyAutopsyBody as string) || 'No narrative available.';

  // ── Opportunities ──
  const rawOpportunities = analysis ? safeJsonParse(analysis.opportunities as string, [] as string[]) : [];
  const opportunities: ProspectOpportunity[] = rawOpportunities.map((dim: string) => ({
    title: dim.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    description: `Your listing is missing semantic coverage for ${dim.replace(/_/g, ' ')}.`,
    before: `Current content lacks ${dim.replace(/_/g, ' ')} signals.`,
    after: `Optimized content with targeted ${dim.replace(/_/g, ' ')} messaging.`,
  }));

  // ── Stage Copy (all 8 stages) ──
  const defaultSimulatorScenarios: SimulatorScenario[] = [
    {
      buyerQuestion: `Is this product safe to use daily?`,
      rufusAnswer: `Based on available information, I cannot determine daily usage safety. Here are products with detailed safety info:`,
      competitorName: 'Category Leader',
      failReason: 'No daily usage or safety information in your listing.',
    },
    {
      buyerQuestion: `When is the best time to use this?`,
      rufusAnswer: `This listing doesn't specify optimal timing. However, other products recommend specific timing:`,
      competitorName: 'Category Leader',
      failReason: 'Missing usage timing and routine integration details.',
    },
    {
      buyerQuestion: `How does this compare to alternatives?`,
      rufusAnswer: `I don't have enough differentiation data. Here are products with comparison info:`,
      competitorName: 'Category Leader',
      failReason: 'No competitive differentiation or unique value details.',
    },
  ];

  const defaultTransformBefore: TransformSnippet[] = [
    { section: 'Title', content: mappedListing.title || 'Current title' },
    { section: 'Bullet 1', content: (bullets[0] as string) || 'Current bullet point' },
    { section: 'Bullet 2', content: (bullets[1] as string) || 'Current bullet point' },
  ];

  const defaultTransformAfter: TransformSnippet[] = [
    { section: 'Title', content: 'Optimized title with semantic coverage' },
    { section: 'Bullet 1', content: 'Optimized bullet addressing top buyer questions' },
    { section: 'Bullet 2', content: 'Optimized bullet with usage timing and safety' },
  ];

  const stageCopy: StageCopyData = {
    heroHeadline:
      (analysis?.copyHeroHeadline as string) ||
      (analysis?.copyPersonalizedHook as string) ||
      `${name}, Your Listing is Invisible to 73% of Buyers`,
    heroSubheadline:
      (analysis?.copyHeroSubheadline as string) ||
      `We analyzed ${mappedListing.asin} across Rufus, COSMO, and semantic search signals. What we found should concern you.`,
    autopsyHeadline:
      (analysis?.copyAutopsyHeadline as string) ||
      `${name}, Your Listing Has 3 Untreated Wounds`,
    autopsyBody:
      (analysis?.copyAutopsyBody as string) ||
      (analysis?.copyProblemNarrative as string) ||
      `Your listing scores ${scores.rufusScore}/100 for Rufus compatibility.`,
    bleedHeadline:
      (analysis?.copyBleedHeadline as string) ||
      `Every Day You Wait, You're Writing a Check to Your Competitors`,
    bleedBody:
      (analysis?.copyBleedBody as string) ||
      `An unoptimized listing in ${mappedListing.category || 'your category'} loses $2,000–$8,000/month.`,
    simulatorIntro:
      (analysis?.copySimulatorIntro as string) ||
      `Watch Amazon's AI send your buyers to competitors. This is happening right now:`,
    simulatorScenarios: safeJsonParse<SimulatorScenario[]>(
      analysis?.copySimulatorScenarios as string,
      defaultSimulatorScenarios
    ),
    transformHeadline:
      (analysis?.copyTransformHeadline as string) ||
      `Here's What a Rufus-Optimized Listing Looks Like`,
    transformBefore: safeJsonParse<TransformSnippet[]>(
      analysis?.copyTransformBefore as string,
      defaultTransformBefore
    ),
    transformAfter: safeJsonParse<TransformSnippet[]>(
      analysis?.copyTransformAfter as string,
      defaultTransformAfter
    ),
    roadmapHeadline:
      (analysis?.copyRoadmapHeadline as string) ||
      `3 Steps. 48 Hours. Fully Optimized Listing.`,
    roadmapBody:
      (analysis?.copyRoadmapBody as string) ||
      (analysis?.copySolutionPitch as string) ||
      `No software to learn. No APIs to connect. We do the work — you get the results.`,
    socialProofHeadline:
      (analysis?.copySocialProofHeadline as string) ||
      `Sellers Who Fixed This in the Last 30 Days`,
    urgencyCTA:
      (analysis?.copyUrgencyCTA as string) ||
      `⚡ We only take 8 new listings per week. 3 slots remaining.`,
    ctaHeadline:
      (analysis?.copyCtaHeadline as string) ||
      `Book Your Free 15-Minute Listing Audit, ${name}`,
    ctaGuarantee:
      (analysis?.copyCtaGuarantee as string) ||
      `If we can't find at least $5,000/year in hidden revenue, we'll send you $100 for wasting your time.`,
  };

  return {
    id: typeof prospect.id === 'number' ? prospect.id : parseInt(prospect.id as string, 10),
    slug: (prospect.slug as string) || '',
    name,
    company: (prospect.company as string) || undefined,
    email: (prospect.email as string) || undefined,
    listing: mappedListing,
    scores,
    topIssues,
    narrative,
    opportunities,
    stageCopy,
    status: (prospect.status as ProspectData['status']) || 'new',
    views: typeof prospect.landingPageViews === 'number' ? prospect.landingPageViews : 0,
    createdAt: (prospect.createdAt as string) || '',
  };
}
