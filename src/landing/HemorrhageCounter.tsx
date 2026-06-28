import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

interface HemorrhageCounterProps {
  price: number;
  reviewCount: number;
  rufusScore: number;
  overallScore: number;
  category: string;
  visible: boolean;
  onScrollToBooking: () => void;
}

/**
 * Calculates the estimated daily revenue loss based on audit data.
 * Returns loss per second for real-time ticking.
 */
function calculateLossPerSecond(
  price: number,
  reviewCount: number,
  rufusScore: number,
  overallScore: number,
  category: string,
): number {
  const baseTraffic = Math.max(500, reviewCount * 18);
  const efficiencyGap = Math.max(10, 100 - (rufusScore > 0 ? rufusScore : overallScore));

  const lc = category.toLowerCase();
  const cvr =
    lc.includes('supplement') || lc.includes('health')
      ? 0.038
      : lc.includes('beauty') || lc.includes('skin') || lc.includes('serum')
        ? 0.034
        : 0.032;

  const lostConversions = baseTraffic * 0.22 * (efficiencyGap / 100) * cvr * 30;
  const monthlyLoss = lostConversions * price;
  const dailyLoss = Math.max(50, monthlyLoss / 30);
  return dailyLoss / 86400; // per second
}

export default function HemorrhageCounter({
  price,
  reviewCount,
  rufusScore,
  overallScore,
  category,
  visible,
  onScrollToBooking,
}: HemorrhageCounterProps) {
  const [lostAmount, setLostAmount] = useState(0);
  const startTimeRef = useRef<number>(0);
  const lossPerSecondRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    lossPerSecondRef.current = calculateLossPerSecond(
      price,
      reviewCount,
      rufusScore,
      overallScore,
      category,
    );
  }, [price, reviewCount, rufusScore, overallScore, category]);

  const tick = useCallback(() => {
    if (!startTimeRef.current) startTimeRef.current = performance.now();
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    setLostAmount(elapsed * lossPerSecondRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!visible) return;
    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible, tick]);

  if (!visible) return null;

  const formattedLoss = lostAmount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="hemorrhage-banner fixed top-0 left-0 right-0 z-[60] select-none">
      <div className="bg-[#1a0000] border-b-[3px] border-brutal-red px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Warning + Counter */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="hemorrhage-pulse-icon shrink-0 h-8 w-8 bg-brutal-red/20 border-2 border-brutal-red flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-brutal-red" />
          </div>
          <div className="flex items-baseline gap-2 flex-wrap min-w-0">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brutal-red/80 font-bold shrink-0">
              [LIVE] Revenue Hemorrhage:
            </span>
            <span className="font-display text-xl md:text-2xl font-black text-brutal-red tabular-nums tracking-tight">
              {formattedLoss}
            </span>
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest shrink-0">
              lost since page load
            </span>
          </div>
        </div>

        {/* Right: CTA */}
        <button
          onClick={onScrollToBooking}
          className="shrink-0 bg-brutal-red text-white font-mono text-[10px] uppercase tracking-widest font-black px-4 py-2 border-2 border-white/20 hover:bg-red-700 hover:border-white/40 transition-all cursor-pointer"
        >
          Stop the Bleeding →
        </button>
      </div>
    </div>
  );
}
