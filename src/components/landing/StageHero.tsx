import { useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import StageScanAnimation from './StageScanAnimation';
import type { ProspectListing } from '../../types/prospect';

interface StageHeroProps {
  listing: ProspectListing;
  prospectName: string;
  headline: string;
  subheadline: string;
  onScanComplete: () => void;
}

export default function StageHero({
  listing,
  prospectName,
  headline,
  subheadline,
  onScanComplete,
}: StageHeroProps) {
  const [scanStarted, setScanStarted] = useState(false);
  const [scanDone, setScanDone] = useState(false);

  const handleScanComplete = useCallback(() => {
    setScanDone(true);
    onScanComplete();
    // Auto-scroll after a short delay
    setTimeout(() => {
      const el = document.getElementById('stage-autopsy');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 600);
  }, [onScanComplete]);

  return (
    <section
      id="stage-hero"
      className="min-h-screen flex flex-col justify-center bg-brand-dark text-white px-6 py-12 md:py-20 select-none relative overflow-hidden"
    >
      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="max-w-4xl w-full mx-auto relative z-10 space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-brutal-red text-white border-[3px] border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-widest font-black shadow-[3px_3px_0px_rgba(255,255,255,0.2)]">
          <AlertTriangle className="h-4 w-4" />
          <span>DIAGNOSTIC REPORT FOR {listing.brand?.toUpperCase() || 'YOUR BRAND'}</span>
        </div>

        {/* Headline */}
        <h1 className="display-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-white leading-[1.05]">
          {headline}
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl leading-relaxed max-w-2xl font-medium text-white/80">
          {subheadline}
        </p>

        {/* Listing Preview */}
        {listing.image && (
          <div className="flex items-center gap-4 border-[3px] border-white/20 bg-white/5 p-4 max-w-lg backdrop-blur-sm">
            <img
              src={listing.image}
              alt={listing.title}
              className="w-16 h-16 object-cover border-[2px] border-white/20 bg-white"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-white/50 uppercase tracking-widest">
                {listing.asin} • {listing.category}
              </p>
              <p className="text-sm font-bold text-white truncate">{listing.title}</p>
              <p className="text-xs text-white/60 font-mono">
                ${listing.price} • ★{listing.rating} ({listing.reviewCount.toLocaleString()} reviews)
              </p>
            </div>
          </div>
        )}

        {/* Scan Section */}
        {!scanStarted ? (
          <div className="space-y-4">
            <button
              onClick={() => setScanStarted(true)}
              className="brutalist-btn bg-brand-gold text-brand-dark text-base md:text-lg"
            >
              <span>RUN FREE AUTOPSY ON {listing.asin || 'YOUR LISTING'}</span>
              <span className="text-xl">→</span>
            </button>
            <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
              Takes 4 seconds • No signup required • 100% free
            </p>
          </div>
        ) : (
          <div className={`transition-all duration-500 ${scanDone ? 'opacity-60' : 'opacity-100'}`}>
            <StageScanAnimation
              asin={listing.asin}
              brand={listing.brand || 'Unknown'}
              onComplete={handleScanComplete}
            />
          </div>
        )}
      </div>
    </section>
  );
}
