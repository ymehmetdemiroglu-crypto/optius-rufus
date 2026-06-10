import { useState } from 'react';
import { CheckCircle2, Loader2, Shield, Clock } from 'lucide-react';
import type { BookingFormData } from '../../dtos/prospect.dto';
import { trpc } from '../shared/providers/trpc';

interface StageBookCallProps {
  headline: string;
  guarantee: string;
  prospectId: number;
  prospectName: string;
  prospectEmail: string;
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
  let displayGuarantee = guarantee;

  // If using default / fallback copywriting, customize based on selected package
  if (
    !headline ||
    headline.startsWith("Book Your Free") ||
    headline.includes("Listing Audit")
  ) {
    if (packageType === 'package_1') {
      displayHeadline = `Book Your Rufus Conquest & SOV Consultation, ${prospectName}`;
      displayGuarantee = `If we can't find at least 3 high-intent search queries where your competitors are stealing your sales, the consultation call is 100% free. No credit card required.`;
    } else if (packageType === 'package_2') {
      displayHeadline = `Secure Your Full-Funnel Listing & A+ Overhaul, ${prospectName}`;
      displayGuarantee = `We will rewrite your Core Listing, A+ modules, and Storefront SEO. If this doesn't pass our 7-agent AI audit with a score above 85, we'll rewrite it until it does.`;
    } else if (packageType === 'package_3') {
      displayHeadline = `Secure Your PPC & AEO Intent Alignment Setup, ${prospectName}`;
      displayGuarantee = `Get your COSMO-optimized listing and semantic PPC keyword map. If we don't lower your ACOS by at least 15% in the first 30 days, we'll work with you for free until we do.`;
    } else if (packageType === 'package_4') {
      displayHeadline = `Claim Your COSMO Catalog & Bundling Blueprint, ${prospectName}`;
      displayGuarantee = `We'll build your catalog relationship map and virtual bundles. If we don't find at least 2 highly profitable product bundles to link, you pay nothing.`;
    }
  }

  const bookMutation = trpc.booking?.create?.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => console.error('Booking failed:', err),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    bookMutation?.mutate({
      prospectId,
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
          /* ── Success State ── */
          <div className="brutalist-card bg-brand-dark text-white p-10 text-center space-y-6 shadow-brutal-lg">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-brand-gold border-[3px] border-white/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-brand-dark" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="display-heading text-2xl md:text-3xl text-white">
                Audit Call Confirmed
              </h3>
              <p className="text-base text-white/80 font-medium">
                {form.name}, we've received your request. You'll get a calendar invite within the hour.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-brand-gold font-mono text-xs uppercase tracking-widest">
              <Clock className="h-4 w-4" />
              <span>Check your inbox shortly</span>
            </div>
          </div>
        ) : (
          /* ── Booking Form ── */
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="text-center space-y-3">
              <p className="font-mono text-xs uppercase tracking-widest text-brand-blue font-black">
                FINAL STEP
              </p>
              <h2 className="display-heading text-3xl md:text-5xl text-brand-dark">
                {displayHeadline}
              </h2>
              {/* Package Badge */}
              <div className="inline-block bg-brand-dark text-brand-gold font-mono text-xs uppercase px-3 py-1.5 border-[2px] border-brand-dark font-black tracking-wider">
                {packageType === 'package_1' && `Package 1: Rufus SOV & Conquesting — $${pricePoint.toLocaleString()}`}
                {packageType === 'package_2' && `Package 2: Full-Funnel Listing Optimization — $${pricePoint.toLocaleString()}`}
                {packageType === 'package_3' && `Package 3: AEO & PPC Intent Alignment — $${pricePoint.toLocaleString()}`}
                {packageType === 'package_4' && `Package 4: COSMO Bundling & Catalog — $${pricePoint.toLocaleString()}`}
              </div>
              <p className="font-mono text-xs uppercase tracking-widest text-brand-dark/50 pt-2">
                Next available slot: {getTomorrowDate()} • 10:00 AM ET
              </p>
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

              {bookMutation?.isError && (
                <p className="text-sm text-brutal-red font-bold">
                  Something went wrong. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={bookMutation?.isPending}
                className="brutalist-btn-danger w-full text-lg py-5"
              >
                {bookMutation?.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <span>Confirm My Free Audit Call →</span>
                )}
              </button>
            </div>

            {/* Guarantee */}
            <div className="border-[3px] border-brand-dark bg-brand-gold p-5 md:p-6 flex items-start gap-4 shadow-brutal">
              <div className="h-12 w-12 bg-brand-dark border-[3px] border-brand-dark text-brand-gold flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black text-base uppercase tracking-wide text-brand-dark">
                  Our Guarantee
                </h4>
                <p className="text-sm font-bold text-brand-dark/90 leading-relaxed">
                  {displayGuarantee}
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
