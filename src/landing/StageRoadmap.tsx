import { Phone, Wrench, FileDown, ArrowRight } from 'lucide-react';

interface StageRoadmapProps {
  headline: string;
  body: string;
  prospectName: string;
  visible: boolean;
}

const steps = [
  {
    icon: Phone,
    number: '01',
    title: 'Book a 15-Min Call',
    description: "Free, no strings. We'll walk through your diagnostic report and show you exactly what's costing you sales.",
    detail: 'No credit card. No commitment.',
  },
  {
    icon: Wrench,
    number: '02',
    title: 'We Optimize For You',
    description: 'Our 7-agent AI engine + human review rewrites your entire listing for Rufus, COSMO, and semantic search.',
    detail: '48-hour turnaround.',
  },
  {
    icon: FileDown,
    number: '03',
    title: 'Download Your File',
    description: 'You receive a ready-to-paste optimized listing file. Copy into Seller Central. Done.',
    detail: 'No software to install.',
  },
];

export default function StageRoadmap({ headline, body, visible }: StageRoadmapProps) {
  if (!visible) return null;
  return (
    <section
      id="stage-roadmap"
      className="bg-brand-dark text-white px-6 py-16 md:py-24 border-t-[3px] border-brand-dark"
    >
      <div className="max-w-5xl w-full mx-auto space-y-12">
        <div className="text-center space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-gold font-black">
            HOW IT WORKS
          </p>
          <h2 className="display-heading text-3xl md:text-5xl text-white">
            {headline}
          </h2>
          <p className="text-base md:text-lg text-white/70 font-medium max-w-2xl mx-auto leading-relaxed">
            {body}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="border-[3px] border-white/20 bg-white/5 p-6 md:p-8 space-y-4 relative group hover:border-brand-gold transition-colors"
              >
                {/* Connector arrow (between cards on desktop) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-brand-gold" />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 border-[3px] border-brand-gold bg-brand-gold/10 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-brand-gold" />
                  </div>
                  <span className="font-display text-3xl font-black text-white/20">
                    {step.number}
                  </span>
                </div>

                <h3 className="font-display font-black text-xl uppercase tracking-wide text-white">
                  {step.title}
                </h3>

                <p className="text-sm text-white/70 font-medium leading-relaxed">
                  {step.description}
                </p>

                <p className="font-mono text-xs text-brand-gold/80 uppercase tracking-widest font-black">
                  {step.detail}
                </p>
              </div>
            );
          })}
        </div>

        {/* Key Message */}
        <div className="border-[3px] border-brand-gold bg-brand-gold/10 p-6 text-center">
          <p className="text-lg font-black text-white">
            Most of our clients see ranking improvements within{' '}
            <span className="text-brand-gold">7-14 days</span> of updating their listings.
          </p>
        </div>
      </div>
    </section>
  );
}
