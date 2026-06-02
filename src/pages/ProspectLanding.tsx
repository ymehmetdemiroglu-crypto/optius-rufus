import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { trpc } from '../providers/trpc';
import { mapBackendToProspectData } from '../lib/prospectMapper';
import type { ProspectData } from '../types/prospect';

import ProgressBar from '../components/landing/ProgressBar';
import StageHero from '../components/landing/StageHero';
import StageAutopsy from '../components/landing/StageAutopsy';
import StageBleedCalculator from '../components/landing/StageBleedCalculator';
import StageRufusSimulator from '../components/landing/StageRufusSimulator';
import StageTransformPreview from '../components/landing/StageTransformPreview';
import StageRoadmap from '../components/landing/StageRoadmap';
import StageProofWall from '../components/landing/StageProofWall';
import StageBookCall from '../components/landing/StageBookCall';
import FloatingCTA from '../components/landing/FloatingCTA';

const TOTAL_STAGES = 8;

function SkeletonLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-brand-dark select-none font-sans text-white">
      <div className="animate-pulse space-y-6 text-center w-full max-w-2xl">
        <div className="h-4 w-32 bg-white/10 border border-white/20 mx-auto" />
        <div className="h-14 w-full bg-white/10 border-[3px] border-white/10" />
        <div className="h-14 w-3/4 bg-white/10 border-[3px] border-white/10 mx-auto" />
        <div className="h-6 w-1/2 bg-white/10 border border-white/20 mx-auto" />
      </div>
      <div className="mt-10 h-12 w-64 bg-brand-gold/20 border-[3px] border-brand-gold/30" />
      <p className="mt-6 font-mono text-xs text-white/30 uppercase tracking-widest">
        Loading your diagnostic report...
      </p>
    </div>
  );
}

const MOCK_PROSPECT: ProspectData = {
  id: 4,
  slug: 'mock-prospect',
  name: 'Alex Hormozi',
  company: 'Acme Greens',
  email: 'founder@acmegreens.com',
  listing: {
    asin: 'B08GREEN88',
    title: 'Acme Premium Organic Supergreens Powder — 30 Servings | Gut Health & Natural Energy',
    brand: 'Acme Greens',
    category: 'Supergreens Powder',
    price: 34.95,
    rating: 4.1,
    reviewCount: 245,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
    bullets: [
      "DAILY NUTRIENT BOOST: Contains organic spirulina, chlorella, wheatgrass, and barley grass for all-day cellular vitality.",
      "DIGESTION & GUT HEALTH: Enhanced with natural prebiotics and digestive enzymes for optimal nutrient absorption without bloating.",
      "100% USDA ORGANIC & VEGAN: Pure, clean, plant-based greens with zero artificial sweeteners, soy, dairy, or gluten."
    ],
    description: 'Get your daily greens in one delicious scoop. Powered by clean, organic greens.'
  },
  scores: {
    overallScore: 68,
    rufusScore: 48,
    cosmoScore: 42,
    semanticScore: 43,
    contentScore: 46,
    categoryAverage: 54
  },
  topIssues: [
    {
      title: 'Safety Information',
      severity: 'critical',
      description: 'Lacks explicit statements on daily dosage limits and safety warning callouts.',
      impact: 'Gap: 62%'
    },
    {
      title: 'Usage Instructions',
      severity: 'warning',
      description: 'Fails to detail optimal consumption timing and routine integration.',
      impact: 'Gap: 55%'
    }
  ],
  narrative: 'Your Acme Greens listing is bleeding invisible sales. Amazon\'s AI — Rufus and COSMO — are rewriting the rules of search. Your current listing scores 48/100 for semantic depth. That means qualified buyers are seeing your competitors first.',
  opportunities: [
    {
      title: 'Safety Information',
      description: 'Your listing is missing semantic coverage for safety information.',
      before: 'Current content lacks safety information signals.',
      after: 'Optimized content with targeted safety information messaging.'
    },
    {
      title: 'Usage Instructions',
      description: 'Your listing is missing semantic coverage for usage instructions.',
      before: 'Current content lacks usage instructions signals.',
      after: 'Optimized content with targeted usage instructions messaging.'
    }
  ],
  stageCopy: {
    heroHeadline: 'Alex, Your Acme Greens Listing is Invisible to 73% of Buyers',
    heroSubheadline: 'We ran B08GREEN88 through our 7-agent AI engine — scanning Rufus compatibility, COSMO intent mapping, and semantic coverage across 24 dimensions. What we found should concern you.',
    autopsyHeadline: 'Alex, Your Listing Has 3 Untreated Wounds',
    autopsyBody: 'Your Rufus compatibility score is 48/100 — that means Amazon\'s AI can only answer 48% of buyer questions using your listing. The category leader in Supergreens Powder scores 87. Your biggest gaps: safety information, usage instructions, ingredient purity.',
    bleedHeadline: 'Every Day You Wait, You\'re Writing a Check to Your Competitors',
    bleedBody: 'Based on your category\'s average conversion gap, an unoptimized listing in Supergreens Powder loses between $2,000 and $8,000 per month in missed sales. That\'s money going directly to competitors who\'ve already optimized for Rufus.',
    simulatorIntro: 'This is happening right now. Every time a buyer asks Amazon\'s AI a question your listing can\'t answer, Rufus recommends your competitor instead. Watch it happen:',
    simulatorScenarios: [
      {
        buyerQuestion: 'Is this supergreens powder safe to use daily?',
        rufusAnswer: 'Based on available product information, I cannot determine daily usage safety for this product. Here are products with detailed safety information:',
        competitorName: 'Supergreens Premium Plus',
        failReason: 'Your listing has no specific daily usage or safety information.'
      },
      {
        buyerQuestion: 'When is the best time to use this product?',
        rufusAnswer: 'This listing doesn\'t specify optimal timing or usage schedule. However, Supergreens Premium Plus recommends specific timing for best results.',
        competitorName: 'Supergreens Premium Plus',
        failReason: 'Your listing lacks usage timing and routine integration details.'
      },
      {
        buyerQuestion: 'How does this compare to other supergreens powders?',
        rufusAnswer: 'I don\'t have enough differentiation data for this product. Here are alternatives with detailed comparison information:',
        competitorName: 'Supergreens Elite',
        failReason: 'Your listing doesn\'t address competitive differentiation or unique value proposition.'
      }
    ],
    transformHeadline: 'Here\'s What a Rufus-Optimized Listing Looks Like',
    transformBefore: [
      {
        section: 'Title',
        content: 'Acme Premium Organic Supergreens Powder — 30 Servings | Gut Health & Natural Energy'
      },
      {
        section: 'Bullet 1',
        content: 'DAILY NUTRIENT BOOST: Contains organic spirulina, chlorella, wheatgrass, and barley grass for all-day cellular vitality.'
      },
      {
        section: 'Bullet 2',
        content: 'DIGESTION & GUT HEALTH: Enhanced with natural prebiotics and digestive enzymes for optimal nutrient absorption without bloating.'
      }
    ],
    transformAfter: [
      {
        section: 'Title',
        content: 'Acme Premium Organic Supergreens Powder — Clinically-Formulated for Daily Use | Safe With Medications | 90-Day Supply'
      },
      {
        section: 'Bullet 1',
        content: '✅ SAFE FOR DAILY USE: Specifically formulated for daily consumption. Third-party tested for purity. No known allergen interactions — gluten-free, soy-free, and vegan.'
      },
      {
        section: 'Bullet 2',
        content: '⏰ OPTIMAL TIMING: Take 30 minutes before bed or first thing in the morning for maximum absorption. Integrates seamlessly into your daily wellness routine.'
      }
    ],
    roadmapHeadline: '3 Steps. 48 Hours. Fully Optimized Listing.',
    roadmapBody: 'No software to learn. No APIs to connect. No recurring subscriptions. We do the heavy lifting — you get a ready-to-paste optimized listing file delivered to your inbox.',
    socialProofHeadline: 'Sellers Who Fixed This in the Last 30 Days',
    urgencyCTA: '⚡ We only take 8 new listings per week to maintain quality. 3 slots remaining.',
    ctaHeadline: 'Book Your Free 15-Minute Listing Audit, Alex',
    ctaGuarantee: 'If we can\'t find at least $5,000/year in hidden revenue in your listing during our call, we\'ll send you $100 for wasting your time. No credit card. No commitment. Just clarity.'
  },
  status: 'analyzed',
  views: 0,
  createdAt: ''
};

export default function ProspectLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [scanComplete, setScanComplete] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const hasIncremented = useRef(false);

  const { data, isLoading } = trpc.prospects?.getBySlug?.useQuery(
    { slug: slug || '' },
    { enabled: !!slug }
  );

  const incrementViews = trpc.prospects?.incrementViews?.useMutation();

  useEffect(() => {
    if (slug && incrementViews && !hasIncremented.current) {
      hasIncremented.current = true;
      incrementViews.mutate({ slug });
    }
  }, [slug, incrementViews]);

  // Track scroll position to determine current stage
  useEffect(() => {
    if (!scanComplete) return;

    const stageIds = [
      'stage-hero',
      'stage-autopsy',
      'stage-bleed',
      'stage-simulator',
      'stage-transform',
      'stage-roadmap',
      'stage-proof',
      'stage-book',
    ];

    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight * 0.4;

      for (let i = stageIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(stageIds[i]);
        if (el && el.offsetTop <= scrollY) {
          setCurrentStage(i);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [scanComplete]);

  const handleScanComplete = useCallback(() => {
    setScanComplete(true);
  }, []);

  const scrollToBooking = () => {
    const el = document.getElementById('stage-book');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading && slug) {
    return <SkeletonLoader />;
  }

  const prospect: ProspectData = data ? mapBackendToProspectData(data) : MOCK_PROSPECT;
  const { stageCopy } = prospect;

  // Calculate bleed calculator defaults
  const estimatedTraffic = Math.max(2000, (prospect.listing.reviewCount || 100) * 20);
  const conversionGap = Math.max(1.5, (100 - prospect.scores.overallScore) / 15);

  return (
    <div className="min-h-screen bg-brand-dark text-brand-dark selection:bg-brand-gold selection:text-brand-dark">
      {/* Progress Bar */}
      <ProgressBar
        currentStage={currentStage}
        totalStages={TOTAL_STAGES}
        visible={scanComplete}
      />

      {/* Stage 1: Hero + Scan */}
      <StageHero
        listing={prospect.listing}
        prospectName={prospect.name}
        headline={stageCopy.heroHeadline}
        subheadline={stageCopy.heroSubheadline}
        onScanComplete={handleScanComplete}
      />

      {/* Remaining stages only visible after scan */}
      {scanComplete && (
        <>
          {/* Stage 2: Autopsy Report */}
          <StageAutopsy
            scores={prospect.scores}
            headline={stageCopy.autopsyHeadline}
            body={stageCopy.autopsyBody}
            category={prospect.listing.category}
            visible={scanComplete}
          />

          {/* Stage 3: Bleed Calculator */}
          <StageBleedCalculator
            headline={stageCopy.bleedHeadline}
            body={stageCopy.bleedBody}
            defaultPrice={prospect.listing.price}
            defaultTraffic={estimatedTraffic}
            conversionGap={conversionGap}
            visible={currentStage >= 2}
          />

          {/* Stage 4: Rufus Simulator */}
          <StageRufusSimulator
            intro={stageCopy.simulatorIntro}
            scenarios={stageCopy.simulatorScenarios}
            visible={currentStage >= 3}
          />

          {/* Stage 5: Transformation Preview */}
          <StageTransformPreview
            headline={stageCopy.transformHeadline}
            before={stageCopy.transformBefore}
            after={stageCopy.transformAfter}
            visible={currentStage >= 4}
          />

          {/* Stage 6: Roadmap */}
          <StageRoadmap
            headline={stageCopy.roadmapHeadline}
            body={stageCopy.roadmapBody}
            prospectName={prospect.name}
            visible={currentStage >= 5}
          />

          {/* Stage 7: Social Proof */}
          <StageProofWall
            headline={stageCopy.socialProofHeadline}
            urgencyCTA={stageCopy.urgencyCTA}
            onOpenBooking={scrollToBooking}
            visible={currentStage >= 6}
          />

          {/* Stage 8: Book Call */}
          <StageBookCall
            headline={stageCopy.ctaHeadline}
            guarantee={stageCopy.ctaGuarantee}
            prospectId={prospect.id}
            prospectName={prospect.name}
            prospectEmail={prospect.email || ''}
            visible={currentStage >= 7}
          />

          {/* Floating CTA (mobile) */}
          <FloatingCTA
            visible={currentStage >= 1 && currentStage < 7}
            onClick={scrollToBooking}
          />
        </>
      )}

      {/* Footer */}
      <footer className="bg-brand-dark border-t-[3px] border-white/10 py-8 px-6 text-center">
        <p className="font-mono text-xs text-white/30 uppercase tracking-widest">
          OPTIMUS RUFUS — AI-NATIVE AMAZON LISTING OPTIMIZATION
        </p>
      </footer>
    </div>
  );
}
