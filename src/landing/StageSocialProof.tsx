import { ArrowUpRight, TrendingUp } from 'lucide-react';

interface CaseStudy {
  brand: string;
  category: string;
  beforeScore: number;
  afterScore: number;
  headline: string;
  metric: string;
  quote: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    brand: 'Peak Nutrition Labs',
    category: 'supplement',
    beforeScore: 19,
    afterScore: 87,
    headline: '+280% Organic Rufus Citations in 21 Days',
    metric: '$14,200/mo recovered revenue',
    quote:
      'We had no idea Rufus was routing our highest-intent buyers to competitors. The fix took 48 hours and we saw results in the first week.',
  },
  {
    brand: 'Vitality Greens Co',
    category: 'supplement',
    beforeScore: 24,
    afterScore: 91,
    headline: 'From Invisible to #1 Rufus Recommendation',
    metric: '-$4,800/mo in wasted PPC spend',
    quote:
      'We were spending $4.8k/month on PPC for queries Rufus could have answered organically. The ROI on this optimization was immediate.',
  },
  {
    brand: 'Derma Collective',
    category: 'beauty',
    beforeScore: 23,
    afterScore: 91,
    headline: '+340% Conversion Rate on AI-Driven Queries',
    metric: '12 new intent nodes captured',
    quote:
      'The semantic gap analysis showed us exactly which buyer questions our listing couldn\'t answer. After the patch, our conversion rate on Rufus queries tripled.',
  },
  {
    brand: 'Glow Science',
    category: 'beauty',
    beforeScore: 31,
    afterScore: 88,
    headline: 'Captured 8 High-Intent Buyer Query Nodes',
    metric: '+$9,400/mo in organic revenue',
    quote:
      'Rufus was literally recommending our competitor\'s vitamin C serum for queries we should have been winning. Not anymore.',
  },
  {
    brand: 'Coastal Canine Co',
    category: 'pet',
    beforeScore: 31,
    afterScore: 89,
    headline: '+190% Rufus Citations in 14 Days',
    metric: '#1 recommendation in 8 buyer queries',
    quote:
      'Our salmon oil was invisible to Rufus for "is this safe for small dogs?" queries. The structured dosing content fixed that overnight.',
  },
  {
    brand: 'Pawsome Wellness',
    category: 'pet',
    beforeScore: 27,
    afterScore: 85,
    headline: 'Reclaimed $6.2k/mo from Competitor Interceptions',
    metric: '100% Rufus safety compliance',
    quote:
      'The breed-specific dosing architecture was the missing piece. Rufus now routes every safety query for our category to us first.',
  },
  {
    brand: 'Apex Commerce Group',
    category: 'general',
    beforeScore: 27,
    afterScore: 84,
    headline: '+220% Organic Traffic from AI Search',
    metric: '$11,300/mo revenue lift',
    quote:
      'We didn\'t even know Rufus existed as a traffic channel. Now it drives more conversions than our top 3 PPC campaigns combined.',
  },
  {
    brand: 'Summit Performance Co',
    category: 'general',
    beforeScore: 33,
    afterScore: 90,
    headline: 'Zero to 15 Rufus Recommendation Nodes',
    metric: '-62% cost per acquisition',
    quote:
      'The diagnostic showed us the exact queries competitors were stealing. We fixed 15 semantic gaps in 48 hours and the ad spend savings were immediate.',
  },
];

function matchCaseStudies(category: string): CaseStudy[] {
  const lc = category.toLowerCase();

  let matched: CaseStudy[] = [];

  if (
    lc.includes('supplement') ||
    lc.includes('vitamin') ||
    lc.includes('protein') ||
    lc.includes('health') ||
    lc.includes('magnesium') ||
    lc.includes('creatine') ||
    lc.includes('collagen') ||
    lc.includes('berberine') ||
    lc.includes('greens') ||
    lc.includes('mushroom') ||
    lc.includes('sea moss')
  ) {
    matched = CASE_STUDIES.filter((cs) => cs.category === 'supplement');
  } else if (
    lc.includes('beauty') ||
    lc.includes('skin') ||
    lc.includes('serum') ||
    lc.includes('retinol') ||
    lc.includes('cream') ||
    lc.includes('niacinamide')
  ) {
    matched = CASE_STUDIES.filter((cs) => cs.category === 'beauty');
  } else if (
    lc.includes('dog') ||
    lc.includes('pet') ||
    lc.includes('cat') ||
    lc.includes('salmon')
  ) {
    matched = CASE_STUDIES.filter((cs) => cs.category === 'pet');
  }

  // Always include one general case study
  const generals = CASE_STUDIES.filter((cs) => cs.category === 'general');
  if (matched.length === 0) {
    matched = generals;
  } else {
    // Take 2 category-specific + 1 general
    matched = matched.slice(0, 2);
    matched.push(generals[0]);
  }

  return matched.slice(0, 3);
}

interface StageSocialProofProps {
  headline: string;
  urgencyCTA: string;
  category: string;
  onOpenBooking: () => void;
  visible: boolean;
}

export default function StageSocialProof({
  headline,
  urgencyCTA,
  category,
  onOpenBooking,
  visible,
}: StageSocialProofProps) {
  if (!visible) return null;

  const cases = matchCaseStudies(category);

  return (
    <section
      id="stage-proof"
      className="bg-brand-dark px-6 py-16 md:py-24 border-t-[3px] border-white/10"
    >
      <div className="max-w-5xl w-full mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-terminal-green font-black">
            [LOG] DEPLOYMENT RESULTS — VERIFIED
          </p>
          <h2 className="display-heading text-3xl md:text-5xl text-white">
            {headline || 'Sellers Who Fixed This in the Last 30 Days'}
          </h2>
          <p className="text-base text-white/60 font-medium max-w-2xl mx-auto">
            These brands had the same structural gaps your listing has right
            now. Here's what happened after 48 hours of optimization:
          </p>
        </div>

        {/* Case Study Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cases.map((cs, i) => (
            <div
              key={i}
              className="border-[3px] border-white/15 bg-white/5 backdrop-blur-sm p-6 space-y-5 hover:border-terminal-green/50 transition-colors group"
            >
              {/* Brand Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 font-bold">
                  {cs.brand}
                </span>
                <ArrowUpRight className="h-4 w-4 text-terminal-green opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Before / After Scores */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <span className="block font-display text-2xl font-black text-brutal-red">
                    {cs.beforeScore}
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-widest text-white/30">
                    Before
                  </span>
                </div>
                <div className="flex-1 h-[3px] bg-white/10 relative">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-brutal-red via-brand-gold to-terminal-green"
                    style={{ width: '100%' }}
                  />
                  <TrendingUp className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 text-terminal-green" />
                </div>
                <div className="text-center">
                  <span className="block font-display text-2xl font-black text-terminal-green">
                    {cs.afterScore}
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-widest text-white/30">
                    After
                  </span>
                </div>
              </div>

              {/* Headline */}
              <h3 className="font-display font-black text-base text-brand-gold uppercase leading-tight">
                {cs.headline}
              </h3>

              {/* Metric Badge */}
              <div className="inline-block bg-terminal-green/10 border border-terminal-green/30 px-3 py-1.5 font-mono text-[10px] font-bold text-terminal-green uppercase tracking-wider">
                {cs.metric}
              </div>

              {/* Quote */}
              <p className="text-xs text-white/60 font-medium leading-relaxed italic border-l-2 border-white/10 pl-3">
                "{cs.quote}"
              </p>
            </div>
          ))}
        </div>

        {/* Urgency CTA */}
        <div className="text-center space-y-4">
          <p className="font-mono text-sm text-brand-gold font-bold">
            {urgencyCTA || '⚡ We only take 8 new listings per week. 3 slots remaining.'}
          </p>
          <button onClick={onOpenBooking} className="brutalist-btn text-base">
            <span>DEPLOY THE SAME FIX →</span>
          </button>
        </div>
      </div>
    </section>
  );
}
