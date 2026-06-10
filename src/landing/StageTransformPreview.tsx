import { useState, useEffect } from 'react';
import { ArrowLeftRight, Play, CheckCircle } from 'lucide-react';
import type { TransformSnippet } from '../../types/prospect';
import { getScoreLevel, getScoreColor } from '../../lib/score';

interface StageTransformPreviewProps {
  headline: string;
  before: TransformSnippet[];
  after: TransformSnippet[];
  visible: boolean;
  contentScore: number;
}

export default function StageTransformPreview({
  headline,
  before,
  after,
  contentScore,
}: StageTransformPreviewProps) {
  const [showAfter, setShowAfter] = useState(false);
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxScore, setSandboxScore] = useState(contentScore);
  const [isTesting, setIsTesting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (before[1]?.content) {
      const timer = setTimeout(() => {
        setSandboxInput(before[1].content);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [before]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSandboxScore(contentScore);
    }, 0);
    return () => clearTimeout(timer);
  }, [contentScore]);

  const handleTest = () => {
    setIsTesting(true);
    setSuccessMsg(false);

    setTimeout(() => {
      setIsTesting(false);
      // Rules-based scoring simulation
      let points = contentScore;
      const text = sandboxInput.toLowerCase();

      if (text.includes('safe') || text.includes('safety') || text.includes('daily')) {
        points += 14;
      }
      if (text.includes('morning') || text.includes('absorption') || text.includes('direction') || text.includes('take')) {
        points += 12;
      }
      if (text.includes('organic') || text.includes('testing') || text.includes('purity') || text.includes('gluten')) {
        points += 10;
      }
      if (text.includes('bloat') || text.includes('gut') || text.includes('digest')) {
        points += 10;
      }

      const finalScore = Math.min(96, Math.max(contentScore, points));
      setSandboxScore(finalScore);

      if (finalScore > contentScore) {
        setSuccessMsg(true);
      }
    }, 1500);
  };

  return (
    <section
      id="stage-transform"
      className="bg-white px-6 py-16 md:py-24 border-t-[3px] border-brand-dark"
    >
      <div className="max-w-5xl w-full mx-auto space-y-10">
        <div className="text-center space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-blue font-black">
            OPTIMIZATION PREVIEW
          </p>
          <h2 className="display-heading text-3xl md:text-5xl text-brand-dark">
            {headline}
          </h2>
          <p className="text-base text-brand-dark/70 font-medium max-w-2xl mx-auto">
            Toggle between your current listing and what the optimized version could look like.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center">
          <div className="transform-toggle">
            <div
              className="transform-toggle-slider"
              style={{
                left: showAfter ? '50%' : '0%',
                width: '50%',
              }}
            />
            <button
              onClick={() => setShowAfter(false)}
              className={`transform-toggle-option ${!showAfter ? 'active' : 'text-brand-dark'}`}
            >
              Current
            </button>
            <button
              onClick={() => setShowAfter(true)}
              className={`transform-toggle-option ${showAfter ? 'active' : 'text-brand-dark'}`}
            >
              Optimized
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {(showAfter ? after : before).map((snippet, i) => (
            <div
              key={`${showAfter ? 'after' : 'before'}-${i}`}
              className={`border-[3px] border-brand-dark p-5 transition-all duration-300 ${
                showAfter ? 'diff-added border-l-green-500' : 'bg-brutal-concrete'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-dark/50">
                  {snippet.section}
                </span>
                {showAfter && (
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 border border-green-300">
                    OPTIMIZED
                  </span>
                )}
              </div>
              <p className={`text-sm leading-relaxed ${showAfter ? 'text-brand-dark font-medium' : 'text-brand-dark/70'}`}>
                {snippet.content}
              </p>
            </div>
          ))}
        </div>

        {/* Toggle hint */}
        <div className="text-center">
          <button
            onClick={() => setShowAfter(!showAfter)}
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brand-blue font-black hover:text-brand-dark transition-colors"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Toggle to see {showAfter ? 'current' : 'optimized'} version</span>
          </button>
        </div>

        {/* Interactive Sandbox */}
        <div className="border-[3px] border-brand-dark bg-brand-bg p-6 shadow-brutal space-y-4 mt-12">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-brand-blue fill-brand-blue" />
            <h3 className="font-display font-black text-xl text-brand-dark">Rufus Compatibility Sandbox</h3>
          </div>
          <p className="text-sm text-brand-dark/80 font-medium leading-relaxed">
            Test how adding usage timing, ingredient purity, and safety guidelines closes semantic gaps. Update the bullet point text below and click "Test Optimization".
          </p>

          <div className="space-y-4">
            <textarea
              value={sandboxInput}
              onChange={(e) => setSandboxInput(e.target.value)}
              className="w-full h-24 border-2 border-brand-dark p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white text-brand-dark"
              placeholder="Paste or write your bullet points here..."
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-brand-dark/10 pt-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black uppercase text-brand-dark/50">Simulated Score:</span>
                <div className="flex items-center gap-2 bg-white px-3 py-1 border-2 border-brand-dark">
                  <span className={`font-mono text-xl font-black ${getScoreColor(getScoreLevel(sandboxScore))}`}>
                    {sandboxScore}
                  </span>
                  <span className="text-brand-dark/40 font-mono text-xs">/100</span>
                </div>
                {successMsg && sandboxScore > contentScore && (
                  <span className="text-green-600 font-mono text-xs font-black animate-bounce flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>+{sandboxScore - contentScore} points! Gaps Closed</span>
                  </span>
                )}
              </div>

              <button
                onClick={handleTest}
                disabled={isTesting}
                className={`w-full sm:w-auto font-mono text-xs uppercase tracking-widest font-black px-6 py-3 border-[3px] border-brand-dark bg-brand-gold text-brand-dark cursor-pointer transition-all duration-100 select-none shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  isTesting ? 'opacity-65 pointer-events-none' : ''
                }`}
              >
                {isTesting ? 'Analyzing Semantic Gaps...' : 'Test Optimization'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
