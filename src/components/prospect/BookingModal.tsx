import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, ChevronUp } from 'lucide-react';
import type { BookingFormData } from '../../types/prospect';
import { trpc } from '../../providers/trpc';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospectId: number;
}

const revenueOptions = [
  '<$10k',
  '$10k-$50k',
  '$50k-$100k',
  '$100k-$500k',
  '$500k+',
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

export default function BookingModal({ isOpen, onClose, prospectId }: BookingModalProps) {
  const [form, setForm] = useState<BookingFormData>({
    name: '',
    email: '',
    company: '',
    revenue: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const bookMutation = trpc.booking?.create?.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      console.error('Booking failed:', err);
    },
  });

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setForm({ name: '', email: '', company: '', revenue: '', notes: '' });
      setMobileExpanded(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    'w-full bg-white border-[3px] border-black px-4 py-3 text-base text-black placeholder-gray-500 outline-none focus:bg-[#F0F0F0] transition-colors';

  return (
    <>
      {/* Desktop: Inline section */}
      <div className="hidden md:block bg-white px-6 py-12 md:py-16 border-t-[3px] border-black" id="stage-cta">
        <div className="max-w-2xl w-full mx-auto">
          {submitted ? (
            <div className="bg-black text-white p-10 text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="font-sans text-2xl font-black text-white">
                  Audit Call Confirmed
                </h3>
                <p className="text-base text-white">
                  We have received your request. You will receive a calendar invite shortly.
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-white text-black border-[3px] border-black px-6 py-3 font-bold text-sm uppercase tracking-wide hover:bg-[#F0F0F0] transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="font-sans text-2xl md:text-4xl font-black text-black">
                  Book Your Free Audit
                </h3>
                <p className="font-mono text-xs uppercase tracking-widest text-[#0055FF]">
                  Next available slot: {getTomorrowDate()} 10:00 AM ET
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-black mb-1.5">
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
                  <label className="block font-mono text-xs uppercase tracking-widest text-black mb-1.5">
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
                  <label className="block font-mono text-xs uppercase tracking-widest text-black mb-1.5">
                    Company
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => update('company', e.target.value)}
                    className={inputClass}
                    placeholder="Company name"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-black mb-1.5">
                    Monthly Revenue
                  </label>
                  <select
                    value={form.revenue}
                    onChange={(e) => update('revenue', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select range...</option>
                    {revenueOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-black mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="Anything we should know before the call?"
                />
              </div>

              {bookMutation?.isError && (
                <p className="text-sm text-[#FF1A1A] font-bold">
                  Something went wrong. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={bookMutation?.isPending}
                className="bg-[#FF1A1A] text-white border-[3px] border-black w-full flex items-center justify-center gap-2 px-6 py-4 font-black text-lg uppercase tracking-wide hover:bg-black hover:text-white transition-colors disabled:opacity-60"
              >
                {bookMutation?.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <span>Confirm My Audit Call</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Mobile: Collapsible sticky bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        {!mobileExpanded ? (
          <button
            onClick={() => setMobileExpanded(true)}
            className="w-full bg-[#FF1A1A] text-white border-t-[3px] border-black px-6 py-4 font-black text-lg uppercase tracking-wide flex items-center justify-center gap-2"
          >
            <span>Book Your Free Audit Call</span>
            <ChevronUp className="h-5 w-5" />
          </button>
        ) : (
          <div className="bg-white border-t-[3px] border-black max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b-[3px] border-black bg-[#F0F0F0]">
              <span className="font-mono text-xs uppercase tracking-widest text-black">
                Book Your Free Audit
              </span>
              <button
                onClick={() => {
                  setMobileExpanded(false);
                  onClose();
                }}
                className="font-mono text-xs uppercase tracking-widest text-black underline"
              >
                Close
              </button>
            </div>

            <div className="p-4">
              {submitted ? (
                <div className="bg-black text-white p-8 text-center space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-sans text-xl font-black text-white">
                      Audit Call Confirmed
                    </h3>
                    <p className="text-sm text-white">
                      We have received your request. You will receive a calendar invite shortly.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#0055FF]">
                    Next available: {getTomorrowDate()} 10:00 AM ET
                  </p>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-black mb-1">
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
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-black mb-1">
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
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-black mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => update('company', e.target.value)}
                      className={inputClass}
                      placeholder="Company name"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-black mb-1">
                      Monthly Revenue
                    </label>
                    <select
                      value={form.revenue}
                      onChange={(e) => update('revenue', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select range...</option>
                      {revenueOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-black mb-1">
                      Notes
                    </label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => update('notes', e.target.value)}
                      className={`${inputClass} resize-none`}
                      placeholder="Anything we should know before the call?"
                    />
                  </div>

                  {bookMutation?.isError && (
                    <p className="text-xs text-[#FF1A1A] font-bold">
                      Something went wrong. Please try again.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={bookMutation?.isPending}
                    className="bg-[#FF1A1A] text-white border-[3px] border-black w-full flex items-center justify-center gap-2 px-6 py-3 font-black text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors disabled:opacity-60"
                  >
                    {bookMutation?.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <span>Confirm My Audit Call</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
