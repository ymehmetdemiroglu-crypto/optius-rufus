import { ArrowRight, Zap } from 'lucide-react';

interface StageProofWallProps {
  headline: string;
  urgencyCTA: string;
  onOpenBooking: () => void;
  visible: boolean;
}

const testimonials = [
  {
    brand: 'NutraVive Supplements',
    quote: '43% increase in organic ranking in 12 days after optimization.',
    metric: '+43%',
    metricLabel: 'Organic Rank',
    category: 'Health & Household',
  },
  {
    brand: 'GlowSkin Labs',
    quote: 'Rufus score jumped from 31 to 78. Sales followed within a week.',
    metric: '+47 pts',
    metricLabel: 'Rufus Score',
    category: 'Beauty & Personal Care',
  },
  {
    brand: 'PrimeFit Nutrition',
    quote: '2.3x return on ad spend after semantic optimization of our top 5 ASINs.',
    metric: '2.3x',
    metricLabel: 'ROAS',
    category: 'Sports & Outdoors',
  },
];

export default function StageProofWall({ headline, urgencyCTA, onOpenBooking }: StageProofWallProps) {
  return (
    <section
      id="stage-proof"
      className="bg-white px-6 py-16 md:py-24 border-t-[3px] border-brand-dark"
    >
      <div className="max-w-5xl w-full mx-auto space-y-10">
        <div className="text-center space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-dark/60 font-black">
            PROOF
          </p>
          <h2 className="display-heading text-3xl md:text-5xl text-brand-dark">
            {headline}
          </h2>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[3px] bg-brand-dark border-[3px] border-brand-dark">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-6 md:p-8 space-y-5 flex flex-col">
              <p className="text-xl font-black text-brand-dark leading-tight flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <span className="font-display text-4xl font-black text-brand-dark">{t.metric}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-brand-dark/50 font-black mb-1">
                    {t.metricLabel}
                  </span>
                </div>
                <p className="font-mono text-xs uppercase tracking-widest text-brand-dark/60">
                  {t.brand}
                </p>
                <p className="text-[10px] font-mono text-brand-dark/40 uppercase tracking-wider">
                  {t.category}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Urgency Bar */}
        <div className="border-[3px] border-brand-dark bg-brand-gold p-4 md:p-5 flex items-center justify-center gap-3 shadow-brutal">
          <Zap className="h-5 w-5 text-brand-dark shrink-0" />
          <p className="text-base md:text-lg font-black text-brand-dark text-center">
            {urgencyCTA}
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={onOpenBooking}
            className="brutalist-btn-danger text-lg md:text-xl px-10 py-5"
          >
            <span>Book Your Free Audit Call</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
