import type { JSX } from 'react';
import type { ProspectData } from '../../types/prospect';
import ProgressBar from './ProgressBar';
import StageHero from './StageHero';
import StageAutopsy from './StageAutopsy';
import StageBleedCalculator from './StageBleedCalculator';
import StageRufusSimulator from './StageRufusSimulator';
import StageTransformPreview from './StageTransformPreview';
import StageFreeQAs from './StageFreeQAs';
import StagePPCPlanner from './StagePPCPlanner';
import StageBundlingBlueprint from './StageBundlingBlueprint';
import StageRoadmap from './StageRoadmap';
import StageProofWall from './StageProofWall';
import StageBookCall from './StageBookCall';
import FloatingCTA from './FloatingCTA';
import BrandStyleInjector from './BrandStyleInjector';

const TOTAL_STAGES = 11;

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
              visible={isPrint || currentStage >= 2}
            />
          </div>

          <div id="stage-simulator">
            <StageRufusSimulator
              intro={stageCopy.simulatorIntro}
              scenarios={stageCopy.simulatorScenarios}
              visible={isPrint || currentStage >= 3}
              competitorAudit={stageCopy.competitorAudit}
            />
          </div>

          <div id="stage-transform">
            <StageTransformPreview
              headline={stageCopy.transformHeadline}
              before={stageCopy.transformBefore}
              after={stageCopy.transformAfter}
              contentScore={prospect.scores.contentScore}
              visible={isPrint || currentStage >= 4}
            />
          </div>

          <div id="stage-free-qas">
            <StageFreeQAs
              freeQAs={stageCopy.freeQAs}
              visible={isPrint || currentStage >= 5}
              onCopyQA={onCopyQA}
            />
          </div>

          <div id="stage-ppc-planner">
            <StagePPCPlanner
              ppcKeywords={stageCopy.ppcKeywords}
              visible={isPrint || currentStage >= 6}
              onDownloadPPC={onDownloadPPC}
            />
          </div>

          <div id="stage-bundling">
            <StageBundlingBlueprint
              cosmoBundling={stageCopy.cosmoBundling}
              visible={isPrint || currentStage >= 7}
            />
          </div>

          <div id="stage-roadmap">
            <StageRoadmap
              headline={stageCopy.roadmapHeadline}
              body={stageCopy.roadmapBody}
              prospectName={prospect.name}
              visible={isPrint || currentStage >= 8}
            />
          </div>

          <div id="stage-proof">
            <StageProofWall
              headline={stageCopy.socialProofHeadline}
              urgencyCTA={stageCopy.urgencyCTA}
              onOpenBooking={scrollToBooking}
              visible={isPrint || currentStage >= 9}
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
              visible={currentStage >= 10}
            />
          )}

          {!isPrint && (
            <FloatingCTA
              visible={currentStage >= 1 && currentStage < 10}
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
