import { useEffect, useRef, useState, useCallback } from 'react';
import type { JSX } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { trpc } from '../providers/trpc';
import { mapBackendToProspectData } from '../lib/prospectMapper';
import type { ProspectData } from '../types/prospect';
import { MOCK_PROSPECT_DATA } from '../lib/mockProspectData';
import { useActivityTracker } from '../hooks/useActivityTracker';
import SkeletonLoader from '../components/landing/SkeletonLoader';
import LandingPageComposer from '../components/landing/LandingPageComposer';
import ReportNotFound from '../components/landing/ReportNotFound';

export default function ProspectLanding(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();
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

    const stageNames = [
      'hero', 'autopsy', 'bleed', 'simulator', 'transform',
      'free-qas', 'ppc-planner', 'bundling', 'aeo-audit', 'roadmap', 'proof', 'book',
    ];

    const stageIds = [
      'stage-hero',
      'stage-autopsy',
      'stage-bleed',
      'stage-simulator',
      'stage-transform',
      'stage-free-qas',
      'stage-ppc-planner',
      'stage-bundling',
      'stage-aeo-audit',
      'stage-roadmap',
      'stage-proof',
      'stage-book',
    ];

    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight * 0.4;

      for (let i = stageIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(stageIds[i]);
        if (el && el.offsetTop <= scrollY) {
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
