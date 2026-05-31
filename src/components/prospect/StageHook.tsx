import type { ProspectListing } from '../../types/prospect';
import ListingPreviewCard from './ListingPreviewCard';

interface StageHookProps {
  listing: ProspectListing;
  prospectName: string;
}

export default function StageHook({ listing, prospectName }: StageHookProps) {
  const scrollToNext = () => {
    const el = document.getElementById('stage-diagnosis');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="bg-brand-bg px-6 py-12 md:py-16 select-none font-sans text-brand-dark">
      <div className="max-w-3xl w-full mx-auto text-center space-y-8 brutalist-card bg-white p-8">
        <div className="space-y-3">
          <div className="font-display text-8xl md:text-9xl font-black text-brand-dark leading-none">
            {listing.rating > 0 ? Math.round(listing.rating * 10) : 42}
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-brand-dark/65 font-black">
            Listing Intelligence Score
          </p>
        </div>
 
        <div className="flex justify-center">
          <ListingPreviewCard listing={listing} />
        </div>
 
        <p className="text-xl md:text-2xl font-black text-brand-dark leading-snug">
          {prospectName}, we analyzed <span className="font-mono text-brand-blue">{listing.asin}</span> across
          Rufus, Cosmo, and semantic search signals. What we found should concern you.
        </p>
 
        <button
          onClick={scrollToNext}
          className="brutalist-btn px-8 py-4 text-base"
        >
          <span>See What&apos;s Killing Your Sales</span>
          <span className="text-xl font-black">→</span>
        </button>
      </div>
    </section>
  );
}
