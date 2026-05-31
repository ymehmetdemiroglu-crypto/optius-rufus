import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { trpc } from '../providers/trpc';
import StageHook from '../components/prospect/StageHook';
import StageDiagnosis from '../components/prospect/StageDiagnosis';
import StageScore from '../components/prospect/StageScore';
import StageNarrative from '../components/prospect/StageNarrative';
import StageSolution from '../components/prospect/StageSolution';
import StageSocialProof from '../components/prospect/StageSocialProof';
import BookingModal from '../components/prospect/BookingModal';
import { mapBackendToProspectData } from '../lib/prospectMapper';
import type { ProspectData } from '../types/prospect';

function SkeletonLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 space-y-8 bg-white">
      <div className="animate-pulse space-y-4 text-center w-full max-w-2xl">
        <div className="h-4 w-32 bg-gray-300 mx-auto" />
        <div className="h-12 w-full bg-gray-300" />
        <div className="h-12 w-3/4 bg-gray-300 mx-auto" />
        <div className="h-6 w-1/2 bg-gray-300 mx-auto" />
      </div>
      <div className="border-[3px] border-black w-full max-w-md h-32 bg-gray-200" />
      <div className="h-10 w-48 bg-gray-300" />
    </div>
  );
}

export default function ProspectLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [bookingOpen, setBookingOpen] = useState(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <SkeletonLoader />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black px-6">
        <div className="border-[3px] border-black p-10 text-center max-w-md bg-white">
          <h2 className="font-sans text-xl font-black text-black mb-2">
            Dossier Unavailable
          </h2>
          <p className="text-sm text-black">
            This dossier has expired or does not exist.
          </p>
        </div>
      </div>
    );
  }

  const prospect: ProspectData = mapBackendToProspectData(data);

  return (
    <div className="min-h-screen bg-white text-black">
      <StageHook
        listing={prospect.listing}
        prospectName={prospect.name}
      />

      <StageDiagnosis topIssues={prospect.topIssues} />
      <StageScore scores={prospect.scores} category={prospect.listing.category} />
      <StageNarrative
        narrative={prospect.narrative}
        category={prospect.listing.category}
        listingTitle={prospect.listing.title}
      />
      <StageSolution
        opportunities={prospect.opportunities}
        onOpenBooking={() => setBookingOpen(true)}
      />
      <StageSocialProof
        urgencyCTA={data.analysis?.copyUrgencyCTA as string || 'Only 3 audit slots remaining this week.'}
        onOpenBooking={() => setBookingOpen(true)}
      />

      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        prospectId={prospect.id}
      />
    </div>
  );
}
