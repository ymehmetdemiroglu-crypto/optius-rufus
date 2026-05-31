export interface ProspectListing {
  asin: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  image?: string;
}

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

export interface ProspectScoreBreakdown {
  overallScore: number;
  rufusScore: number;
  cosmoScore: number;
  semanticScore: number;
  contentScore: number;
  categoryAverage?: number;
}

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
  status: 'new' | 'scraped' | 'analyzed' | 'emailed' | 'visited' | 'booked';
  views: number;
  createdAt: string;
}

export interface BookingFormData {
  name: string;
  email: string;
  company: string;
  revenue: string;
  notes: string;
}

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
