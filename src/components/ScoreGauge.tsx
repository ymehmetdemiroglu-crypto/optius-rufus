import { useEffect, useState } from 'react';
 
interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: number;
  showGlow?: boolean;
}
 
export default function ScoreGauge({ score, label, size = 160 }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
 
  useEffect(() => {
    const duration = 1200; // ms
    const startTime = performance.now();
 
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
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
 
  const getColorClass = (val: number) => {
    if (val >= 80) return 'stroke-brand-blue';
    if (val >= 50) return 'stroke-brand-gold';
    return 'stroke-brand-red';
  };
 
  return (
    <div className="flex flex-col items-center justify-center select-none font-sans">
      <div 
        className="relative bg-white border-[3px] border-brand-dark flex items-center justify-center transition-all duration-700 shadow-brutal-sm rounded-full"
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
            className="stroke-brand-bg"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated active score track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`transition-all duration-100 ease-out ${getColorClass(animatedScore)}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            fill="transparent"
          />
        </svg>
 
        {/* Central Text HUD overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-black tracking-tight text-brand-dark">
            {animatedScore}
          </span>
          <span className="text-[8px] tracking-[0.15em] uppercase font-black text-brand-dark/50 mt-1 font-mono">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
