import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  slug: string;
  visible: boolean;
  onScrollToBooking: () => void;
}

const EXPIRY_HOURS = 48;
const STORAGE_PREFIX = 'or_diag_ts_';

function getOrSetFirstVisit(slug: string): number {
  const key = `${STORAGE_PREFIX}${slug}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const ts = parseInt(stored, 10);
      if (!isNaN(ts)) return ts;
    }
    const now = Date.now();
    localStorage.setItem(key, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

function formatTimeUnit(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

export default function CountdownTimer({
  slug,
  visible,
  onScrollToBooking,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 48, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!visible) return;

    const firstVisit = getOrSetFirstVisit(slug);
    const expiryMs = firstVisit + EXPIRY_HOURS * 60 * 60 * 1000;

    function update() {
      const remaining = expiryMs - Date.now();
      if (remaining <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      const totalSeconds = Math.floor(remaining / 1000);
      setTimeLeft({
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
        expired: false,
      });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [slug, visible]);

  if (!visible) return null;

  const isUrgent = timeLeft.hours < 6;

  if (timeLeft.expired) {
    return (
      <section className="px-6 py-10 border-t-[3px] border-brand-dark bg-[#1a0000]">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-brutal-red text-white border-[3px] border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-widest font-black">
            <AlertTriangle className="h-4 w-4" />
            <span>[SYS] DIAGNOSTIC ENVIRONMENT EXPIRED</span>
          </div>
          <p className="font-display font-black text-2xl md:text-3xl text-white uppercase">
            This diagnostic window has closed
          </p>
          <p className="text-sm text-white/60 font-medium max-w-xl mx-auto">
            The personalized audit data for this listing is no longer guaranteed
            to be current. Book now to restore access and get an updated
            analysis.
          </p>
          <button
            onClick={onScrollToBooking}
            className="brutalist-btn-danger text-base"
          >
            <span>RESTORE ACCESS & BOOK NOW →</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8 border-t-[3px] border-brand-dark bg-brand-dark">
      <div className="max-w-3xl mx-auto">
        <div
          className={`border-[3px] ${isUrgent ? 'border-brutal-red countdown-urgent-pulse' : 'border-brand-gold/50'} p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 ${isUrgent ? 'bg-brutal-red/20 border-brutal-red' : 'bg-brand-gold/10 border-brand-gold/50'} border-2 flex items-center justify-center`}
            >
              <Clock
                className={`h-5 w-5 ${isUrgent ? 'text-brutal-red' : 'text-brand-gold'}`}
              />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/50 font-bold">
                [SYS] Diagnostic environment auto-archives in:
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <TimeBlock value={timeLeft.hours} label="HR" urgent={isUrgent} />
                <span className="text-white/30 font-mono text-lg font-bold mx-0.5">:</span>
                <TimeBlock value={timeLeft.minutes} label="MIN" urgent={isUrgent} />
                <span className="text-white/30 font-mono text-lg font-bold mx-0.5">:</span>
                <TimeBlock value={timeLeft.seconds} label="SEC" urgent={isUrgent} />
              </div>
            </div>
          </div>

          <button
            onClick={onScrollToBooking}
            className={`shrink-0 font-mono text-xs uppercase tracking-widest font-black px-5 py-2.5 border-[3px] transition-all cursor-pointer ${
              isUrgent
                ? 'bg-brutal-red text-white border-brutal-red hover:bg-red-700'
                : 'bg-brand-gold text-brand-dark border-brand-dark hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#ff9900]'
            }`}
          >
            Secure Your Slot →
          </button>
        </div>
      </div>
    </section>
  );
}

function TimeBlock({
  value,
  label,
  urgent,
}: {
  value: number;
  label: string;
  urgent: boolean;
}) {
  return (
    <div className="text-center">
      <span
        className={`font-display text-2xl md:text-3xl font-black tabular-nums ${urgent ? 'text-brutal-red' : 'text-brand-gold'}`}
      >
        {formatTimeUnit(value)}
      </span>
      <span className="block font-mono text-[8px] uppercase tracking-widest text-white/30 mt-0.5">
        {label}
      </span>
    </div>
  );
}
