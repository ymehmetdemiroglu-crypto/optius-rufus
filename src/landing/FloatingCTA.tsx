import { ArrowRight } from 'lucide-react';

interface FloatingCTAProps {
  visible: boolean;
  onClick: () => void;
}

export default function FloatingCTA({ visible, onClick }: FloatingCTAProps) {
  return (
    <div
      className={`floating-cta ${visible ? '' : 'hidden-below'} md:hidden`}
    >
      <button
        onClick={onClick}
        className="w-full bg-brutal-red text-white border-t-[3px] border-brand-dark px-6 py-4 font-display font-black text-base uppercase tracking-wide flex items-center justify-center gap-2 active:bg-brand-dark transition-colors"
      >
        <span>Book Your Free Audit Call</span>
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
