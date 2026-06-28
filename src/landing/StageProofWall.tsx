import { ArrowRight, Zap } from 'lucide-react';

interface StageProofWallProps {
  headline: string;
  urgencyCTA: string;
  onOpenBooking: () => void;
  visible: boolean;
}

const testimonials = [
  {
    brand: 'Brand A-7',
    quote: '[RESULT] Rufus Score: 29 → 84. Organic rank delta: +43% in 12 days. Zero ad spend increase.',
    metric: '+43%',
    metricLabel: 'Organic Rank',
    category: 'Health & Household',
  },
  {
    brand: 'Brand B-3',
    quote: '[RESULT] Rufus Score: 31 → 78. Sales velocity increase detected within 7 days of deployment.',
    metric: '+47 pts',
    metricLabel: 'Rufus Score',
    category: 'Beauty & Personal Care',
  },
  {
    brand: 'Brand C-1',
    quote: '[RESULT] ROAS delta: 1.0x → 2.3x across 5 ASINs. Semantic gap closure rate: 94%.',
    metric: '2.3x',
    metricLabel: 'ROAS',
    category: 'Sports & Outdoors',
  },
];

export default function StageProofWall({ headline, urgencyCTA, onOpenBooking, visible }: StageProofWallProps) {
  if (!visible) return null;
  return (
    <section
      id="stage-proof"
      className="bg-white px-6 py-16 md:py-24 border-t-[3px] border-brand-dark"
    >
      <div className="max-w-5xl w-full mx-auto space-y-10">
        <div className="text-center space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-dark/60 font-black">
            [LOG] DEPLOYMENT OUTCOMES
          </p>
          <h2 className="display-heading text-3xl md:text-5xl text-brand-dark">
            {headline}
          </h2>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[3px] bg-brand-dark border-[3px] border-brand-dark">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-6 md:p-8 space-y-5 flex flex-col font-mono">
              <p className="text-sm font-bold text-brand-dark leading-relaxed flex-1">
                {t.quote}
              </p>
              <div className="space-y-2 pt-2 border-t border-brand-dark/10">
                <div className="flex items-end gap-2">
                  <span className="font-display text-4xl font-black text-brand-dark">{t.metric}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-brand-dark/50 font-black mb-1">
                    {t.metricLabel}
                  </span>
                </div>
                <p className="font-mono text-xs uppercase tracking-widest text-brand-dark/60 font-black">
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
          <p className="text-base md:text-lg font-black text-brand-dark text-center font-mono">
            {urgencyCTA}
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={onOpenBooking}
            className="brutalist-btn-danger text-lg md:text-xl px-10 py-5"
          >
            <span>INITIALIZE SYSTEM UPGRADE</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
