import type {
  ProspectData,
  ProspectIssue,
  ProspectOpportunity,
  ProspectScoreBreakdown,
  ProspectListing,
  StageCopyData,
} from '../../dtos/prospect.dto';
import { safeJsonParse } from './utils';
import {
  getDefaultSimulatorScenarios,
  getDefaultTransformBefore,
  getDefaultTransformAfter,
  getDefaultFreeQAs,
  getDefaultReviewSentiment,
  getDefaultCompetitorAudit,
  getDefaultPpcKeywords,
  getDefaultCosmoBundling,
  getDefaultCosmoGraphData,
} from './defaults';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBackendToProspectData(data: any): ProspectData {
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

  const scores: ProspectScoreBreakdown = analysis
    ? {
        overallScore: typeof analysis.overallScore === 'number' ? analysis.overallScore : 0,
        rufusScore: typeof analysis.rufusScore === 'number' ? analysis.rufusScore : 0,
        cosmoScore: typeof analysis.cosmoScore === 'number' ? analysis.cosmoScore : 0,
        semanticScore: typeof analysis.semanticScore === 'number' ? analysis.semanticScore : 0,
        contentScore: typeof analysis.contentScore === 'number' ? analysis.contentScore : 0,
        visualScore: typeof analysis.visualScore === 'number' ? analysis.visualScore : 0,
        categoryAverage: 54,
      }
    : {
        overallScore: 0,
        rufusScore: 0,
        cosmoScore: 0,
        semanticScore: 0,
        contentScore: 0,
        visualScore: 0,
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
    simulatorScenarios: (() => {
      const parsed = safeJsonParse(analysis?.copySimulatorScenarios as string, getDefaultSimulatorScenarios());
      const arr = Array.isArray(parsed) ? parsed : getDefaultSimulatorScenarios();
      return arr.map((item: any) => ({
        buyerQuestion: item.buyerQuestion || item.scenario || 'Shopper conversational query',
        rufusAnswer: item.rufusAnswer || `Amazon Rufus recommends alternative options based on missing intent tags.`,
        competitorName: item.competitorName || 'Top Category Competitor',
        failReason: item.failReason || item.beforeRank || 'Unstructured bullet metadata',
      }));
    })(),
    transformHeadline:
      (analysis?.copyTransformHeadline as string) ||
      `Here's What a Rufus-Optimized Listing Looks Like`,
    transformBefore: (() => {
      const parsed = safeJsonParse(analysis?.copyTransformBefore as string, getDefaultTransformBefore(mappedListing.title, bullets));
      const arr = Array.isArray(parsed) ? parsed : getDefaultTransformBefore(mappedListing.title, bullets);
      return arr.map((item: any, idx: number) => {
        if (typeof item === 'string') return { section: `Current Element ${idx + 1}`, content: item };
        return { section: item.section || `Current Element ${idx + 1}`, content: item.content || String(item) };
      });
    })(),
    transformAfter: (() => {
      const parsed = safeJsonParse(analysis?.copyTransformAfter as string, getDefaultTransformAfter());
      const arr = Array.isArray(parsed) ? parsed : getDefaultTransformAfter();
      return arr.map((item: any, idx: number) => {
        if (typeof item === 'string') return { section: `Optimized Element ${idx + 1}`, content: item };
        return { section: item.section || `Optimized Element ${idx + 1}`, content: item.content || String(item) };
      });
    })(),
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

    // Advanced upgrades mapping with fallbacks
    freeQAs: (() => {
      const parsed = safeJsonParse(analysis?.copyFreeQAs as string, getDefaultFreeQAs(mappedListing.category));
      return Array.isArray(parsed) ? parsed : getDefaultFreeQAs(mappedListing.category);
    })(),
    reviewSentiment: (() => {
      const parsed = safeJsonParse(analysis?.copyReviewSentiment as string, getDefaultReviewSentiment());
      return Array.isArray(parsed) ? parsed : getDefaultReviewSentiment();
    })(),
    competitorAudit: (() => {
      const parsed = safeJsonParse(analysis?.copyCompetitorAudit as string, getDefaultCompetitorAudit(mappedListing.category));
      return Array.isArray(parsed) ? parsed : getDefaultCompetitorAudit(mappedListing.category);
    })(),
    ppcKeywords: (() => {
      const parsed = safeJsonParse(analysis?.copyPpcKeywords as string, getDefaultPpcKeywords(mappedListing.category));
      return Array.isArray(parsed) ? parsed : getDefaultPpcKeywords(mappedListing.category);
    })(),
    cosmoBundling: (() => {
      const parsed = safeJsonParse(analysis?.copyCosmoBundling as string, getDefaultCosmoBundling(mappedListing.brand));
      return Array.isArray(parsed) ? parsed : getDefaultCosmoBundling(mappedListing.brand);
    })(),
    cosmoGraphData: safeJsonParse(
      analysis?.copyCosmoGraphData as string,
      getDefaultCosmoGraphData(mappedListing.brand)
    ),
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
    outreachEmails: prospect.outreachEmails || undefined,
    views: typeof prospect.landingPageViews === 'number' ? prospect.landingPageViews : 0,
    packageType: (prospect.packageType as string) || 'package_2',
    pricePoint: typeof prospect.pricePoint === 'number' ? prospect.pricePoint : 1500,
    createdAt: (prospect.createdAt as string) || '',
  };
}
