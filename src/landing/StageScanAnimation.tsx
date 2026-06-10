import { useState, useEffect, useRef } from 'react';

interface StageScanAnimationProps {
  asin: string;
  brand: string;
  onComplete: () => void;
}

const SCAN_LINES = [
  { text: '> Connecting to Amazon search index...', delay: 0 },
  { text: '> Extracting listing semantic signature...', delay: 600 },
  { text: '> Running Rufus compatibility check...', delay: 1200 },
  { text: '> Analyzing COSMO intent graph...', delay: 1800 },
  { text: '> Benchmarking against top 5 competitors...', delay: 2400 },
  { text: '> Compiling diagnostic report...', delay: 3000 },
  { text: '> ⚠ CRITICAL ISSUES FOUND', delay: 3600, isWarning: true },
];

export default function StageScanAnimation({ asin, brand, onComplete }: StageScanAnimationProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [complete, setComplete] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Reveal lines one by one
    SCAN_LINES.forEach((line, i) => {
      const t = setTimeout(() => {
        setVisibleLines(i + 1);
        if (i === SCAN_LINES.length - 1) {
          // Last line revealed — wait a beat, then complete
          const t2 = setTimeout(() => {
            setComplete(true);
            onComplete();
          }, 800);
          timeoutRef.current.push(t2);
        }
      }, line.delay);
      timeoutRef.current.push(t);
    });

    const currentTimeouts = timeoutRef.current;

    return () => {
      currentTimeouts.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <div className="terminal-screen max-w-2xl mx-auto">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 bg-brutal-red border border-brand-dark/30" />
          <div className="w-3 h-3 bg-brand-gold border border-brand-dark/30" />
          <div className="w-3 h-3 bg-terminal-green border border-brand-dark/30" />
        </div>
        <span className="text-xs text-terminal-green/60">
          OPTIMUS RUFUS v3.1 — LISTING AUTOPSY ENGINE
        </span>
      </div>

      <div className="mb-2 text-terminal-green/70 text-xs">
        TARGET: {asin} | BRAND: {brand.toUpperCase()} | STATUS: SCANNING
      </div>

      <div className="border-t border-terminal-green/20 pt-3 space-y-2">
        {SCAN_LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={`terminal-line ${line.isWarning ? 'text-brutal-red font-bold' : 'text-terminal-green'}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {line.text}
          </div>
        ))}

        {!complete && (
          <div className="flex items-center gap-1 text-terminal-green">
            <span>{'>'}</span>
            <span className="terminal-cursor" />
          </div>
        )}

        {complete && (
          <div className="mt-4 border-t border-terminal-green/20 pt-3">
            <div className="text-terminal-green font-bold animate-pulse-red text-brutal-red">
              DIAGNOSTIC COMPLETE — SCROLL TO VIEW RESULTS ↓
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
