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

export default function ProspectLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [scanComplete, setScanComplete] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const hasIncremented = useRef(false);

  const { data, isLoading, error } = trpc.prospects?.getBySlug?.useQuery(
    { slug: slug! },
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

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark text-white px-6 select-none font-sans">
        <div className="border-[3px] border-white/20 bg-white/5 p-10 text-center max-w-md space-y-4">
          <h2 className="display-heading text-2xl text-white">
            Report Unavailable
          </h2>
          <p className="text-sm font-medium text-white/60">
            This diagnostic report has expired or does not exist.
            Contact us if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const prospect: ProspectData = mapBackendToProspectData(data);
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
