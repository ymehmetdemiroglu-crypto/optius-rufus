import type { ProspectListing } from '../../types/prospect';

interface ListingPreviewCardProps {
  listing: ProspectListing;
}

export default function ListingPreviewCard({ listing }: ListingPreviewCardProps) {
  return (
    <div className="border-[3px] border-black bg-white p-4 md:p-5 max-w-md w-full mx-auto">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 border-[3px] border-black bg-[#F0F0F0] flex items-center justify-center shrink-0 overflow-hidden">
          {listing.image ? (
            <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] text-black font-mono uppercase">{listing.asin}</span>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-black text-white tracking-widest">
              {listing.asin}
            </span>
            <span className="text-[10px] text-black font-semibold uppercase tracking-wider truncate">
              {listing.brand}
            </span>
          </div>

          <h3 className="text-sm font-bold text-black leading-snug line-clamp-2">
            {listing.title}
          </h3>

          <div className="flex items-center gap-2 text-[11px] text-black">
            <span className="font-mono">{listing.category}</span>
          </div>

          <div className="flex items-center gap-3 pt-0.5">
            <span className="text-lg font-black text-black">${listing.price.toFixed(2)}</span>
            <span className="font-mono text-sm font-bold text-black">
              {listing.rating.toFixed(1)}
            </span>
            <span className="font-mono text-[10px] text-black">
              ({listing.reviewCount.toLocaleString()})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
