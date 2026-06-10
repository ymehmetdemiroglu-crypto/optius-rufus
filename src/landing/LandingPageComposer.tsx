import { useState, useEffect } from 'react';
import type { JSX } from 'react';
import type { ProspectData } from '../../dtos/prospect.dto';
import ProgressBar from './ProgressBar';
import StageHero from './StageHero';
import StageAutopsy from './StageAutopsy';
import StageBleedCalculator from './StageBleedCalculator';
import StageRufusSimulator from './StageRufusSimulator';
import StageTransformPreview from './StageTransformPreview';
import StageFreeQAs from './StageFreeQAs';
import StagePPCPlanner from './StagePPCPlanner';
import StageBundlingBlueprint from './StageBundlingBlueprint';
import StageAEOPDFAudit from './StageAEOPDFAudit';
import StageRoadmap from './StageRoadmap';
import StageProofWall from './StageProofWall';
import StageBookCall from './StageBookCall';
import FloatingCTA from './FloatingCTA';
import BrandStyleInjector from './BrandStyleInjector';
import { STAGES } from '../shared/lib/stages';

const TOTAL_STAGES = STAGES.length;

interface LandingPageComposerProps {
  prospect: ProspectData;
  brandData?: { primaryColor?: string; logoBase64?: string };
  onScanComplete: () => void;
  onCopyQA: (text: string) => void;
  onDownloadPPC: () => void;
  scrollToBooking: () => void;
  isPrint: boolean;
  currentStage: number;
  scanComplete: boolean;
}

export default function LandingPageComposer({
  prospect,
  brandData,
  onScanComplete,
  onCopyQA,
  onDownloadPPC,
  scrollToBooking,
  isPrint,
  currentStage,
  scanComplete,
}: LandingPageComposerProps): JSX.Element {
  const { stageCopy } = prospect;

  const [maxStage, setMaxStage] = useState(currentStage);

  useEffect(() => {
    setMaxStage((prev) => Math.max(prev, currentStage));
  }, [currentStage]);

  const estimatedTraffic = Math.max(2000, (prospect.listing.reviewCount || 100) * 20);
  const conversionGap = Math.max(1.5, (100 - prospect.scores.overallScore) / 15);

  return (
    <div className="min-h-screen bg-brand-dark text-brand-dark selection:bg-brand-gold selection:text-brand-dark">
      {brandData && (
        <BrandStyleInjector brandData={brandData} />
      )}

      {!isPrint && (
        <ProgressBar
          currentStage={currentStage}
          totalStages={TOTAL_STAGES}
          visible={scanComplete}
        />
      )}

      <div id="stage-hero">
        <StageHero
          listing={prospect.listing}
          prospectName={prospect.name}
          headline={stageCopy.heroHeadline}
          subheadline={stageCopy.heroSubheadline}
          onScanComplete={onScanComplete}
        />
      </div>

      {scanComplete && (
        <>
          <div id="stage-autopsy">
            <StageAutopsy
              scores={prospect.scores}
              headline={stageCopy.autopsyHeadline}
              body={stageCopy.autopsyBody}
              category={prospect.listing.category}
              visible={scanComplete}
              cosmoGraphData={stageCopy.cosmoGraphData}
              reviewSentiment={stageCopy.reviewSentiment}
              isPrint={isPrint}
            />
          </div>

          <div id="stage-bleed">
            <StageBleedCalculator
              key={`bleed-${prospect.id}`}
              headline={stageCopy.bleedHeadline}
              body={stageCopy.bleedBody}
              defaultPrice={prospect.listing.price}
              defaultTraffic={estimatedTraffic}
              conversionGap={conversionGap}
              visible={isPrint || maxStage >= 0}
            />
          </div>

          <div id="stage-simulator">
            <StageRufusSimulator
              intro={stageCopy.simulatorIntro}
              scenarios={stageCopy.simulatorScenarios}
              visible={isPrint || maxStage >= 1}
              competitorAudit={stageCopy.competitorAudit}
            />
          </div>

          <div id="stage-transform">
            <StageTransformPreview
              headline={stageCopy.transformHeadline}
              before={stageCopy.transformBefore}
              after={stageCopy.transformAfter}
              contentScore={prospect.scores.contentScore}
              visible={isPrint || maxStage >= 2}
            />
          </div>

          <div id="stage-free-qas">
            <StageFreeQAs
              freeQAs={stageCopy.freeQAs}
              visible={isPrint || maxStage >= 3}
              onCopyQA={onCopyQA}
            />
          </div>

          <div id="stage-ppc-planner">
            <StagePPCPlanner
              ppcKeywords={stageCopy.ppcKeywords}
              visible={isPrint || maxStage >= 4}
              onDownloadPPC={onDownloadPPC}
            />
          </div>

          <div id="stage-bundling">
            <StageBundlingBlueprint
              cosmoBundling={stageCopy.cosmoBundling}
              visible={isPrint || maxStage >= 5}
            />
          </div>

          <div id="stage-aeo-audit">
            <StageAEOPDFAudit
              prospect={prospect}
              brandData={brandData}
              visible={isPrint || maxStage >= 6}
              isPrint={isPrint}
            />
          </div>

          <div id="stage-roadmap">
            <StageRoadmap
              headline={stageCopy.roadmapHeadline}
              body={stageCopy.roadmapBody}
              prospectName={prospect.name}
              visible={isPrint || maxStage >= 7}
            />
          </div>

          <div id="stage-proof">
            <StageProofWall
              headline={stageCopy.socialProofHeadline}
              urgencyCTA={stageCopy.urgencyCTA}
              onOpenBooking={scrollToBooking}
              visible={isPrint || maxStage >= 8}
            />
          </div>

          {!isPrint && (
            <StageBookCall
              key={`book-${prospect.id}`}
              headline={stageCopy.ctaHeadline}
              guarantee={stageCopy.ctaGuarantee}
              prospectId={prospect.id}
              prospectName={prospect.name}
              prospectEmail={prospect.email || ''}
              packageType={prospect.packageType}
              pricePoint={prospect.pricePoint}
              visible={maxStage >= 9}
            />
          )}

          {!isPrint && (
            <FloatingCTA
              visible={maxStage >= 1 && currentStage < 11}
              onClick={scrollToBooking}
            />
          )}

          <div className="report-ready" style={{ display: 'none' }} />
        </>
      )}

      {!isPrint && (
        <footer className="bg-brand-dark border-t-[3px] border-white/10 py-8 px-6 text-center">
          <p className="font-mono text-xs text-white/30 uppercase tracking-widest">
            OPTIMUS RUFUS — AI-NATIVE AMAZON LISTING OPTIMIZATION
          </p>
        </footer>
      )}
    </div>
  );
}
