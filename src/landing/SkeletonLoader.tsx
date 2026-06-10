import type { JSX } from 'react';

export default function SkeletonLoader(): JSX.Element {
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
