import { useState } from 'react';
import { CheckCircle2, Loader2, Shield } from 'lucide-react';
import type { BookingFormData } from '../dtos/prospect.dto';
import { trpc } from '../shared/providers/trpc';

interface StageBookCallProps {
  headline: string;
  guarantee: string;
  prospectId?: number;
  prospectName?: string;
  prospectEmail?: string;
  visible: boolean;
  packageType?: string;
  pricePoint?: number;
}


const revenueOptions = [
  '<$10k/mo',
  '$10k–$50k/mo',
  '$50k–$100k/mo',
  '$100k–$500k/mo',
  '$500k+/mo',
];

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function StageBookCall({
  headline,
  guarantee,
  prospectId,
  prospectName,
  prospectEmail,
  packageType = 'package_2',
  pricePoint = 1500,
  visible,
}: StageBookCallProps) {
  const [form, setForm] = useState<BookingFormData>({
    name: prospectName || '',
    email: prospectEmail || '',
    company: '',
    revenue: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  // Resolve dynamic package pricing and guarantees
  let displayHeadline = headline;
  let displayGuarantee = `Your listing hits 85+ Rufus Score or you pay nothing. Full refund, no questions.`;

  // If using default / fallback copywriting, customize based on selected package
  if (
    !headline ||
    headline.startsWith("Book Your Free") ||
    headline.includes("Listing Audit")
  ) {
    displayHeadline = prospectName ? `[CRITICAL] ${prospectName}, Your Window Is Closing` : `[CRITICAL] Your Window Is Closing`;
  }

  const bookMutation = trpc.booking?.create?.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => console.error('Booking failed:', err),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    // Transition immediately to Calendly scheduler for frictionless onboarding
    setSubmitted(true);

    bookMutation?.mutate({
      prospectId: prospectId || undefined,
      name: form.name,
      email: form.email,
      company: form.company || undefined,
      revenue: form.revenue || undefined,
      notes: form.notes || undefined,
    });
  };


  const update = (field: keyof BookingFormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const inputClass =
    'w-full bg-white border-[3px] border-brand-dark px-4 py-3 text-base text-brand-dark placeholder-gray-400 outline-none focus:border-brand-blue transition-colors';

  if (!visible) return null;

  return (
    <section
      id="stage-book"
      className="bg-brand-bg px-6 py-16 md:py-24 border-t-[3px] border-brand-dark"
    >
      <div className="max-w-2xl w-full mx-auto space-y-8">
        {submitted ? (
          /* ── Success State with Inline Calendly ── */
          <div className="space-y-6">
            <div className="brutalist-card bg-brand-dark text-white p-6 text-center space-y-4 shadow-brutal-lg">
              <div className="flex justify-center">
                <div className="h-14 w-14 bg-brand-gold border-[3px] border-white/20 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-brand-dark" />
                </div>
              </div>
              <div className="space-y-1 font-mono">
                <h3 className="display-heading text-xl md:text-2xl text-white">
                  [OK] INITIALIZATION CONFIRMED
                </h3>
                <p className="text-sm text-white/80 font-medium">
                  {form.name}, your onboarding sequence is queued. Select a deployment window below:
                </p>
              </div>
            </div>
            
            <div className="brutalist-card bg-white p-2 border-[3px] border-brand-dark shadow-brutal-lg min-h-[650px] overflow-hidden">
              <iframe
                src={`${import.meta.env.VITE_CALENDLY_URL || 'https://calendly.com/optimusrufus'}?embed_domain=${window.location.hostname}&embed_type=Inline&name=${encodeURIComponent(form.name)}&email=${encodeURIComponent(form.email)}`}
                width="100%"
                height="650px"
                frameBorder="0"
                title="Calendly Scheduler"
                className="w-full h-[650px]"
              />
            </div>
          </div>
        ) : (
          /* ── Booking Form ── */
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="text-center space-y-3">
              <p className="font-mono text-xs uppercase tracking-widest text-brand-blue font-black">
                [SYS] SYSTEM ACTIVATION
              </p>
              <h2 className="display-heading text-3xl md:text-5xl text-brand-dark">
                {displayHeadline}
              </h2>
              {/* Package Badge */}
              <div className="inline-block bg-brand-dark text-brand-gold font-mono text-xs uppercase px-3 py-1.5 border-[2px] border-brand-dark font-black tracking-wider">
                Full-Funnel Listing Optimization — $1,500
              </div>

              <div className="block pt-1">
                <div className="inline-block bg-white border-2 border-brand-dark px-3 py-1.5 font-mono text-xs font-bold text-brand-dark">
                  [INCLUDED] A+ Content Layout • Semantic PPC Keyword Map • COSMO Bundling Blueprint — $0 additional
                </div>
              </div>

              <p className="font-mono text-xs uppercase tracking-widest text-brand-dark/50 pt-2">
                Next deployment window: {getTomorrowDate()} • 10:00 AM ET
              </p>
            </div>

            {/* ── Sales Call Hype & Live Demo Agenda Box ── */}
            <div className="border-[3px] border-brand-dark bg-brand-dark text-white p-6 md:p-8 space-y-4 shadow-brutal-lg font-mono">
              <div className="flex items-center gap-3 border-b border-white/20 pb-3">
                <span className="bg-brand-gold text-brand-dark text-xs font-black uppercase px-2.5 py-1">[LIVE SESSION]</span>
                <h3 className="font-display font-black text-lg md:text-xl text-brand-gold uppercase tracking-wide">
                  WHAT HAPPENS ON YOUR 15-MINUTE BRIEFING:
                </h3>
              </div>
              <ul className="space-y-3 text-xs md:text-sm text-white/90 leading-relaxed font-sans font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="text-brand-gold font-bold shrink-0 text-base">⚡</span>
                  <span><strong>Live Threat Assessment:</strong> We run your listing through our Rufus sandbox in real-time — you watch your competitors steal your traffic, then watch the patched version reclaim it.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-brand-gold font-bold shrink-0 text-base">📊</span>
                  <span><strong>Competitor Kill Map:</strong> We identify every intent node your rivals are intercepting and build a 48-hour blitz plan to systematically recapture your organic market share.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-brand-gold font-bold shrink-0 text-base">🎯</span>
                  <span><strong>Zero-Friction Deployment:</strong> Walk away with production-ready copy, 15 structured Q&A seed nodes, and a PPC keyword map — ready to publish to Seller Central immediately.</span>
                </li>
              </ul>
            </div>

            <div className="brutalist-card p-6 md:p-8 space-y-5 shadow-brutal-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-brand-dark mb-1.5 font-black">
                    Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    className={inputClass}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-brand-dark mb-1.5 font-black">
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className={inputClass}
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-brand-dark mb-1.5 font-black">
                    Company
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => update('company', e.target.value)}
                    className={inputClass}
                    placeholder="Brand or company name"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-brand-dark mb-1.5 font-black">
                    Monthly Revenue
                  </label>
                  <select
                    value={form.revenue}
                    onChange={(e) => update('revenue', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select range...</option>
                    {revenueOptions.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-brand-dark mb-1.5 font-black">
                  Anything else we should know?
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="Number of ASINs, specific concerns, etc."
                />
              </div>

              <button
                type="submit"
                disabled={bookMutation?.isPending}
                className="brutalist-btn-danger w-full text-lg py-5"
              >
                {bookMutation?.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>INITIALIZING...</span>
                  </>
                ) : (
                  <span>DEPLOY FIX NOW →</span>
                )}
              </button>
            </div>

            {/* Guarantee */}
            <div className="border-[3px] border-brand-dark bg-brand-gold p-5 md:p-6 flex items-start gap-4 shadow-brutal font-mono">
              <div className="h-12 w-12 bg-brand-dark border-[3px] border-brand-dark text-brand-gold flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black text-base uppercase tracking-wide text-brand-dark">
                  [GUARANTEE] RISK ELIMINATION PROTOCOL
                </h4>
                <p className="text-sm font-bold text-brand-dark/90 leading-relaxed">
                  85+ Rufus Score in 48 hours or full refund. No calls, no forms, no friction. Your listing hits the target or you pay nothing.
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
