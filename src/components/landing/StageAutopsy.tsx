import { useEffect, useRef, useState } from 'react';
import type { ProspectScoreBreakdown } from '../../types/prospect';

interface StageAutopsyProps {
  scores: ProspectScoreBreakdown;
  headline: string;
  body: string;
  category: string;
  visible: boolean;
}

interface AnimatedScoreProps {
  label: string;
  score: number;
  description: string;
  delay: number;
  animate: boolean;
}

function getScoreLevel(score: number): 'critical' | 'warning' | 'good' {
  if (score < 40) return 'critical';
  if (score < 65) return 'warning';
  return 'good';
}

function getScoreColor(level: 'critical' | 'warning' | 'good'): string {
  switch (level) {
    case 'critical': return 'text-brutal-red';
    case 'warning': return 'text-brand-gold';
    case 'good': return 'text-brand-blue';
  }
}

function AnimatedScore({ label, score, description, delay, animate }: AnimatedScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const level = getScoreLevel(score);

  useEffect(() => {
    if (!animate) return;

    const timeout = setTimeout(() => {
      const duration = 1200;
      const start = performance.now();

      function step(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.round(eased * score));
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }, delay);

    return () => clearTimeout(timeout);
  }, [animate, score, delay]);

  return (
    <div className="brutalist-card brutalist-card-hover space-y-3">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-dark/50 font-black">
        {label}
      </p>
      <div className="flex items-end gap-2">
        <span className={`font-display text-5xl md:text-6xl font-black ${getScoreColor(level)} ${level === 'critical' ? 'animate-pulse-red' : ''}`}>
          {displayScore}
        </span>
        <span className="text-brand-dark/40 font-mono text-sm mb-2">/100</span>
      </div>
      {/* Gauge bar */}
      <div className="gauge-bar">
        <div
          className={`gauge-bar-fill score-${level}`}
          style={{
            width: animate ? `${score}%` : '0%',
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
      <p className="text-sm text-brand-dark/80 font-medium leading-snug">{description}</p>
    </div>
  );
}

export default function StageAutopsy({ scores, headline, body, category, visible }: StageAutopsyProps) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (visible && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [visible, hasAnimated]);

  return (
    <section
      id="stage-autopsy"
      ref={sectionRef}
      className="bg-white px-6 py-16 md:py-24 border-t-[3px] border-brand-dark"
    >
      <div className="max-w-5xl w-full mx-auto space-y-10">
        <div className={`text-center space-y-3 ${hasAnimated ? 'animate-slide-up' : 'opacity-0'}`}>
          <p className="font-mono text-xs uppercase tracking-widest text-brutal-red font-black">
            DIAGNOSTIC RESULTS
          </p>
          <h2 className="display-heading text-3xl md:text-5xl text-brand-dark">
            {headline}
          </h2>
          <p className="text-base md:text-lg text-brand-dark/80 font-medium max-w-2xl mx-auto leading-relaxed">
            {body}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatedScore
            label="Rufus Score"
            score={scores.rufusScore}
            description="How well Amazon's AI can answer buyer questions from your listing."
            delay={200}
            animate={hasAnimated}
          />
          <AnimatedScore
            label="COSMO Score"
            score={scores.cosmoScore}
            description="How Amazon's knowledge graph connects your product to buyer intent."
            delay={400}
            animate={hasAnimated}
          />
          <AnimatedScore
            label="Semantic Density"
            score={scores.semanticScore}
            description="How complete your semantic coverage is across all buyer queries."
            delay={600}
            animate={hasAnimated}
          />
          <AnimatedScore
            label="Content Quality"
            score={scores.contentScore}
            description="Conversion-readiness of your title, bullets, and description."
            delay={800}
            animate={hasAnimated}
          />
        </div>

        {/* Category Average Comparison */}
        <div className={`border-[3px] border-brand-dark bg-brand-bg p-6 text-center shadow-brutal ${hasAnimated ? 'animate-slide-up' : 'opacity-0'}`}
          style={{ animationDelay: '1s' }}>
          <p className="text-base text-brand-dark font-bold uppercase tracking-wide">
            Category Average in <span className="font-black text-brand-blue">{category}</span>:{' '}
            <span className="font-mono font-black text-lg bg-white px-2 py-0.5 border border-brand-dark">
              {scores.categoryAverage ?? 54}
            </span>
            <span className="mx-3 text-brand-dark/30">|</span>
            Your Score:{' '}
            <span className={`font-black font-mono text-xl ${getScoreColor(getScoreLevel(scores.overallScore))}`}>
              {scores.overallScore}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
