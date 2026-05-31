import type { ProspectData, ProspectIssue, ProspectOpportunity, ProspectScoreBreakdown, ProspectListing } from '../types/prospect';

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

  const firstName = (prospect.firstName as string) || '';
  const lastName = (prospect.lastName as string) || '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || ((prospect.email as string) ?? 'Unknown');

  const images = listing ? safeJsonParse(listing.images as string, [] as string[]) : [];
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
      }
    : {
        asin: '',
        title: 'No listing data',
        brand: '',
        category: '',
        price: 0,
        rating: 0,
        reviewCount: 0,
      };

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

  const narrative = (analysis?.copyProblemNarrative as string) || 'No narrative available.';

  const rawOpportunities = analysis ? safeJsonParse(analysis.opportunities as string, [] as string[]) : [];
  const opportunities: ProspectOpportunity[] = rawOpportunities.map((dim: string) => ({
    title: dim.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    description: `Your listing is missing semantic coverage for ${dim.replace(/_/g, ' ')}.`,
    before: `Current content lacks ${dim.replace(/_/g, ' ')} signals.`,
    after: `Optimized content with targeted ${dim.replace(/_/g, ' ')} messaging.`,
  }));

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
    status: (prospect.status as ProspectData['status']) || 'new',
    views: typeof prospect.landingPageViews === 'number' ? prospect.landingPageViews : 0,
    createdAt: (prospect.createdAt as string) || '',
  };
}
