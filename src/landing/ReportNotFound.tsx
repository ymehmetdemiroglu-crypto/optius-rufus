import type { JSX } from 'react';

export default function ReportNotFound(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 bg-brand-dark select-none font-sans text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      
      <div className="relative z-10 text-center space-y-8 max-w-lg">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-brand-red border-[3px] border-white/20 mx-auto">
          <span className="text-2xl font-black text-brand-dark font-mono">?</span>
        </div>
        
        <div className="space-y-4">
          <h1 className="display-heading text-3xl md:text-5xl text-white">
            REPORT NOT FOUND
          </h1>
          <p className="font-mono text-xs uppercase tracking-widest text-white/40">
            INVALID OR EXPIRED DIAGNOSTIC LINK
          </p>
        </div>

        <div className="border-[3px] border-white/10 bg-white/5 p-6 md:p-8 space-y-3 backdrop-blur-sm">
          <p className="text-sm text-white/70 font-medium leading-relaxed">
            We couldn&apos;t find a listing analysis for this link. If this is a mistake, please verify the URL or contact us to request an audit.
          </p>
        </div>

        <a 
          href="/"
          className="inline-block bg-brand-gold text-brand-dark font-bold px-6 py-3 border-[3px] border-brand-dark shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 uppercase font-mono text-xs tracking-wider"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
}
