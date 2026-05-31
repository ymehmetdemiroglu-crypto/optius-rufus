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
    <section className="bg-white px-6 py-12 md:py-16">
      <div className="max-w-3xl w-full mx-auto text-center space-y-6">
        <div className="space-y-2">
          <div className="font-mono text-8xl md:text-9xl font-black text-black leading-none">
            {listing.rating > 0 ? Math.round(listing.rating * 10) : 42}
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-black">
            Listing Intelligence Score
          </p>
        </div>

        <div>
          <ListingPreviewCard listing={listing} />
        </div>

        <p className="text-xl md:text-2xl font-bold text-black leading-snug">
          {prospectName}, we analyzed <span className="font-mono">{listing.asin}</span> across
          Rufus, Cosmo, and semantic search signals. What we found should concern you.
        </p>

        <button
          onClick={scrollToNext}
          className="bg-[#FF1A1A] text-white border-[3px] border-black px-8 py-4 font-black text-lg uppercase tracking-wide hover:bg-black hover:text-white transition-colors inline-flex items-center gap-2"
        >
          <span>See What&apos;s Killing Your Sales</span>
          <span className="text-xl">→</span>
        </button>
      </div>
    </section>
  );
}
