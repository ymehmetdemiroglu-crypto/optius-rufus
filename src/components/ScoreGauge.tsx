import { useEffect, useState } from 'react';

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: number;
  showGlow?: boolean;
}

export default function ScoreGauge({ score, label, size = 160, showGlow = true }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1200; // ms
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(easeProgress * score));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  const radius = size * 0.4;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Determine color theme based on score value
  const getColorClass = (val: number) => {
    if (val >= 80) return 'stroke-brand-cyan';
    if (val >= 50) return 'stroke-brand-orange';
    return 'stroke-red-500';
  };

  const getGlowColorClass = (val: number) => {
    if (val >= 80) return 'shadow-[0_0_30px_rgba(6,182,212,0.3)] border-brand-cyan/20';
    if (val >= 50) return 'shadow-[0_0_30px_rgba(255,107,0,0.3)] border-brand-orange/20';
    return 'shadow-[0_0_30px_rgba(239,68,68,0.3)] border-red-500/20';
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`relative rounded-full border bg-brand-bg-card/40 flex items-center justify-center transition-all duration-700 ${getGlowColorClass(animatedScore)}`}
        style={{ width: size + 20, height: size + 20 }}
      >
        <svg 
          width={size} 
          height={size} 
          className="transform -rotate-90 select-none"
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated active score track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`transition-all duration-100 ease-out stroke-linecap-round ${getColorClass(animatedScore)}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            fill="transparent"
          />
        </svg>

        {/* Central Text HUD overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          <span className="font-display text-4xl font-extrabold tracking-tight text-white animate-pulse-glow">
            {animatedScore}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
