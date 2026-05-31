import { ArrowRight } from 'lucide-react';

interface StageSocialProofProps {
  urgencyCTA: string;
  onOpenBooking: () => void;
}

const testimonials = [
  {
    brand: 'NutraVive Supplements',
    result: '43% increase in organic ranking in 12 days',
    metric: '+43%',
  },
  {
    brand: 'GlowSkin Labs',
    result: 'Rufus score jumped from 31 to 78',
    metric: '+47 pts',
  },
  {
    brand: 'PrimeFit Nutrition',
    result: '2.3x return on ad spend after optimization',
    metric: '2.3x ROAS',
  },
];

export default function StageSocialProof({ urgencyCTA, onOpenBooking }: StageSocialProofProps) {
  return (
    <section id="stage-social" className="bg-white px-6 py-12 md:py-16 border-t-[3px] border-black">
      <div className="max-w-5xl w-full mx-auto space-y-8">
        <div className="text-center space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-black">
            Proof
          </p>
          <h2 className="font-sans text-3xl md:text-5xl font-black text-black">
            Brands That Fixed This in 14 Days
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[3px] bg-black border-[3px] border-black">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-6 space-y-4">
              <p className="text-2xl font-black text-black leading-tight">
                &ldquo;{t.result}&rdquo;
              </p>
              <div className="space-y-1">
                <p className="font-mono text-xs uppercase tracking-widest text-black">{t.brand}</p>
                <p className="text-3xl font-black text-black">{t.metric}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-[3px] border-black bg-[#FFCC00] p-4 text-center">
          <p className="text-base md:text-lg font-black text-black">
            {urgencyCTA}
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={onOpenBooking}
            className="bg-[#FF1A1A] text-white border-[3px] border-black px-10 py-5 font-black text-lg uppercase tracking-wide hover:bg-black hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <span>Book Your Free Audit Call</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
