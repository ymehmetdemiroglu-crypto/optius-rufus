import { useEffect, useRef, useState, useCallback } from 'react';
import type { JSX } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { trpc } from '../providers/trpc';
import { mapBackendToProspectData } from '../lib/prospectMapper';
import type { ProspectData } from '../types/prospect';
import { MOCK_PROSPECT_DATA } from '../lib/mockProspectData';
import { useActivityTracker } from '../hooks/useActivityTracker';
import { STAGE_NAMES, STAGE_IDS } from '../lib/stages';
import SkeletonLoader from '../components/landing/SkeletonLoader';
import LandingPageComposer from '../components/landing/LandingPageComposer';
import ReportNotFound from '../components/landing/ReportNotFound';

export default function ProspectLanding(): JSX.Element {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const slug = urlSlug || 'mock-prospect';
  const [searchParams] = useSearchParams();
  const isPrint = searchParams.get('print') === 'true';

  const [scanComplete, setScanComplete] = useState(isPrint);
  const [currentStage, setCurrentStage] = useState(0);
  const hasIncremented = useRef(false);

  const isMock = slug === 'mock-prospect';

  const { data, isLoading } = trpc.prospects.getBySlug.useQuery(
    { slug: slug || '' },
    { enabled: !!slug && !isMock }
  );

  const { data: brandData } = trpc.branding.getSettings.useQuery();

  const incrementViews = trpc.prospects.incrementViews.useMutation();

  const prospectId = isMock ? 5 : (data?.prospect?.id as number ?? 0);
  const tracker = useActivityTracker(prospectId);
  const trackerRef = useRef(tracker);
  useEffect(() => {
    trackerRef.current = tracker;
  }, [tracker]);

  const handleScanComplete = useCallback(() => {
    setScanComplete(true);
  }, []);

  const handleCopyQA = useCallback((text: string) => {
    trackerRef.current.trackEvent('copy_qa', { text: text.slice(0, 100) }, 10);
  }, []);

  const handleDownloadPPC = useCallback(() => {
    trackerRef.current.trackEvent('download_ppc', {}, 15);
  }, []);

  useEffect(() => {
    if (slug && !isMock && incrementViews && !hasIncremented.current) {
      hasIncremented.current = true;
      incrementViews.mutate({ slug });
    }
  }, [slug, incrementViews, isMock]);

  useEffect(() => {
    if (!scanComplete) return;

    const stageNames = STAGE_NAMES;
    const stageIds = STAGE_IDS;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollY = window.scrollY;

      // Check if we are close to the bottom of the scrollable area
      // or if the page is not scrollable at all
      const isAtBottom = scrollHeight - clientHeight <= 0 || (scrollY + clientHeight >= scrollHeight - 50);

      if (isAtBottom) {
        // Find the highest stage index that is currently rendered and visible in the DOM
        for (let i = stageIds.length - 1; i >= 0; i--) {
          const el = document.getElementById(stageIds[i]);
          if (el && el.offsetHeight > 0) {
            if (i !== currentStage) {
              setCurrentStage(i);
              trackerRef.current.trackScrollStage(i, stageNames[i]);
            }
            break;
          }
        }
        return;
      }

      const scrollTarget = scrollY + clientHeight * 0.4;
      for (let i = stageIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(stageIds[i]);
        if (el && el.offsetTop <= scrollTarget) {
          if (i !== currentStage) {
            setCurrentStage(i);
            trackerRef.current.trackScrollStage(i, stageNames[i]);
          }
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [scanComplete, currentStage]);

  const scrollToBooking = () => {
    const el = document.getElementById('stage-book');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading && !isMock) {
    return <SkeletonLoader />;
  }

  if (!data && !isMock) {
    return <ReportNotFound />;
  }

  const prospect: ProspectData = isMock ? MOCK_PROSPECT_DATA : mapBackendToProspectData(data);

  return (
    <LandingPageComposer
      prospect={prospect}
      brandData={brandData}
      onScanComplete={handleScanComplete}
      onCopyQA={handleCopyQA}
      onDownloadPPC={handleDownloadPPC}
      scrollToBooking={scrollToBooking}
      isPrint={isPrint}
      currentStage={currentStage}
      scanComplete={scanComplete}
    />
  );
}
