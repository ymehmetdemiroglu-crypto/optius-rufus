import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { trpc } from '../providers/trpc';
import { mapBackendToProspectData } from '../lib/prospectMapper';
import type { ProspectData } from '../types/prospect';
import { MOCK_PROSPECT_DATA } from '../lib/mockProspectData';

import ProgressBar from '../components/landing/ProgressBar';
import StageHero from '../components/landing/StageHero';
import StageAutopsy from '../components/landing/StageAutopsy';
import StageBleedCalculator from '../components/landing/StageBleedCalculator';
import StageRufusSimulator from '../components/landing/StageRufusSimulator';
import StageTransformPreview from '../components/landing/StageTransformPreview';
import StageFreeQAs from '../components/landing/StageFreeQAs';
import StagePPCPlanner from '../components/landing/StagePPCPlanner';
import StageBundlingBlueprint from '../components/landing/StageBundlingBlueprint';
import StageRoadmap from '../components/landing/StageRoadmap';
import StageProofWall from '../components/landing/StageProofWall';
import StageBookCall from '../components/landing/StageBookCall';
import FloatingCTA from '../components/landing/FloatingCTA';

const TOTAL_STAGES = 11;

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


export default function ProspectLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [scanComplete, setScanComplete] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const hasIncremented = useRef(false);

  const isMock = slug === 'mock-prospect';

  const { data, isLoading } = trpc.prospects?.getBySlug?.useQuery(
    { slug: slug || '' },
    { enabled: !!slug && !isMock }
  );

  const incrementViews = trpc.prospects?.incrementViews?.useMutation();

  useEffect(() => {
    if (slug && !isMock && incrementViews && !hasIncremented.current) {
      hasIncremented.current = true;
      incrementViews.mutate({ slug });
    }
  }, [slug, incrementViews, isMock]);

  // Track scroll position to determine current stage
  useEffect(() => {
    if (!scanComplete) return;

    const stageIds = [
      'stage-hero',
      'stage-autopsy',
      'stage-bleed',
      'stage-simulator',
      'stage-transform',
      'stage-free-qas',
      'stage-ppc-planner',
      'stage-bundling',
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

  if (isLoading && !isMock) {
    return <SkeletonLoader />;
  }

  if (!data && !isMock) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-brand-dark select-none font-sans text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        
        <div className="relative z-10 text-center space-y-8 max-w-lg">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-brand-red border-[3px] border-white/20 mx-auto">
            <span className="text-2xl font-black text-brand-dark font-mono">?</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="display-heading text-3xl md:text-5xl text-white">
              REPORT NOT FOUND
            </h1>
            <p className="font-mono text-xs uppercase tracking-widest text-white/40">
              INVALID OR EXPIRED DIAGNOSTIC LINK
            </p>
          </div>

          <div className="border-[3px] border-white/10 bg-white/5 p-6 md:p-8 space-y-3 backdrop-blur-sm">
            <p className="text-sm text-white/70 font-medium leading-relaxed">
              We couldn't find a listing analysis for this link. If this is a mistake, please verify the URL or contact us to request an audit.
            </p>
          </div>

          <a 
            href="/"
            className="inline-block bg-brand-gold text-brand-dark font-bold px-6 py-3 border-[3px] border-brand-dark shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 uppercase font-mono text-xs tracking-wider"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  const prospect: ProspectData = isMock ? MOCK_PROSPECT_DATA : mapBackendToProspectData(data);
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
            cosmoGraphData={stageCopy.cosmoGraphData}
            reviewSentiment={stageCopy.reviewSentiment}
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
            competitorAudit={stageCopy.competitorAudit}
          />

          {/* Stage 5: Transformation Preview */}
          <StageTransformPreview
            headline={stageCopy.transformHeadline}
            before={stageCopy.transformBefore}
            after={stageCopy.transformAfter}
            contentScore={prospect.scores.contentScore}
            visible={currentStage >= 4}
          />

          {/* Stage 6: Free QAs */}
          <StageFreeQAs
            freeQAs={stageCopy.freeQAs}
            visible={currentStage >= 5}
          />

          {/* Stage 7: Conversational PPC Planner */}
          <StagePPCPlanner
            ppcKeywords={stageCopy.ppcKeywords}
            visible={currentStage >= 6}
          />

          {/* Stage 8: COSMO Bundling Blueprint */}
          <StageBundlingBlueprint
            cosmoBundling={stageCopy.cosmoBundling}
            visible={currentStage >= 7}
          />

          {/* Stage 9: Roadmap */}
          <StageRoadmap
            headline={stageCopy.roadmapHeadline}
            body={stageCopy.roadmapBody}
            prospectName={prospect.name}
            visible={currentStage >= 8}
          />

          {/* Stage 10: Social Proof */}
          <StageProofWall
            headline={stageCopy.socialProofHeadline}
            urgencyCTA={stageCopy.urgencyCTA}
            onOpenBooking={scrollToBooking}
            visible={currentStage >= 9}
          />

          {/* Stage 11: Book Call */}
          <StageBookCall
            headline={stageCopy.ctaHeadline}
            guarantee={stageCopy.ctaGuarantee}
            prospectId={prospect.id}
            prospectName={prospect.name}
            prospectEmail={prospect.email || ''}
            visible={currentStage >= 10}
          />

          {/* Floating CTA (mobile) */}
          <FloatingCTA
            visible={currentStage >= 1 && currentStage < 10}
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
