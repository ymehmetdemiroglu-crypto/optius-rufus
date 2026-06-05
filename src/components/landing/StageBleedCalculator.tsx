import { useState, useEffect } from 'react';
import { DollarSign, TrendingDown } from 'lucide-react';

interface StageBleedCalculatorProps {
  headline: string;
  body: string;
  defaultPrice: number;
  defaultTraffic: number;
  conversionGap: number;
  visible: boolean;
}

export default function StageBleedCalculator({
  headline,
  body,
  defaultPrice,
  defaultTraffic,
  conversionGap,
  visible,
}: StageBleedCalculatorProps) {
  const [traffic, setTraffic] = useState(defaultTraffic || 8000);
  const [aov, setAov] = useState(defaultPrice || 30);
  const [gap, setGap] = useState(conversionGap || 3.2);
  const [displayLoss, setDisplayLoss] = useState(0);
  const displayLossRef = useRef(displayLoss);

  useEffect(() => {
    displayLossRef.current = displayLoss;
  }, [displayLoss]);

  const monthlyLoss = Math.round(traffic * (gap / 100) * aov);
  const annualLoss = monthlyLoss * 12;

  // Animate the loss counter
  useEffect(() => {
    if (!visible) return;
    const duration = 1000;
    const start = performance.now();
    const startVal = displayLossRef.current;
    const diff = monthlyLoss - startVal;

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayLoss(Math.round(startVal + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [monthlyLoss, visible]);

  return (
    <section
      id="stage-bleed"
      className="bg-brand-dark text-white px-6 py-16 md:py-24 border-t-[3px] border-brand-dark"
    >
      <div className="max-w-5xl w-full mx-auto space-y-10">
        <div className="text-center space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-brutal-red font-black">
            REVENUE IMPACT
          </p>
          <h2 className="display-heading text-3xl md:text-5xl text-white">
            {headline}
          </h2>
          <p className="text-base md:text-lg text-white/70 font-medium max-w-2xl mx-auto leading-relaxed">
            {body}
          </p>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Traffic */}
          <div className="border-[3px] border-white bg-brand-dark p-5 space-y-3 shadow-brutal-gold hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_#ff9900] transition-all duration-200 ease-out">
            <label className="font-mono text-xs uppercase tracking-widest text-white/50 font-black block">
              Monthly Visitors
            </label>
            <input
              type="range"
              min={1000}
              max={50000}
              step={500}
              value={traffic}
              onChange={(e) => setTraffic(Number(e.target.value))}
              className="bleed-slider"
            />
            <p className="font-mono text-2xl font-black text-white">
              {traffic.toLocaleString()}
            </p>
          </div>

          {/* AOV */}
          <div className="border-[3px] border-white bg-brand-dark p-5 space-y-3 shadow-brutal-gold hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_#ff9900] transition-all duration-200 ease-out">
            <label className="font-mono text-xs uppercase tracking-widest text-white/50 font-black block">
              Average Order Value
            </label>
            <input
              type="range"
              min={10}
              max={200}
              step={5}
              value={aov}
              onChange={(e) => setAov(Number(e.target.value))}
              className="bleed-slider"
            />
            <p className="font-mono text-2xl font-black text-white">
              ${aov}
            </p>
          </div>

          {/* Conversion Gap */}
          <div className="border-[3px] border-white bg-brand-dark p-5 space-y-3 shadow-brutal-gold hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_#ff9900] transition-all duration-200 ease-out">
            <label className="font-mono text-xs uppercase tracking-widest text-white/50 font-black block">
              Conversion Gap vs Leader
            </label>
            <input
              type="range"
              min={0.5}
              max={8}
              step={0.1}
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              className="bleed-slider"
            />
            <p className="font-mono text-2xl font-black text-white">
              {gap.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Loss Display */}
        <div className="border-[3px] border-brutal-red bg-brutal-red/10 p-8 md:p-10 text-center space-y-4 shadow-brutal-red hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0px_#e63b2e] transition-all duration-200 ease-out">
          <div className="flex items-center justify-center gap-3">
            <TrendingDown className="h-8 w-8 text-brutal-red" />
            <p className="font-mono text-xs uppercase tracking-widest text-brutal-red font-black">
              ESTIMATED MONTHLY LOSS
            </p>
          </div>
          <div className="flex items-center justify-center gap-1">
            <DollarSign className="h-10 w-10 text-brutal-red" />
            <span className="font-display text-6xl md:text-8xl font-black text-brutal-red">
              {displayLoss.toLocaleString()}
            </span>
          </div>
          <p className="font-mono text-sm text-white/60">
            That's <span className="font-black text-brutal-red">${annualLoss.toLocaleString()}</span> per year.
            Enough to fund your entire Q4 ad budget.
          </p>
        </div>
      </div>
    </section>
  );
}
