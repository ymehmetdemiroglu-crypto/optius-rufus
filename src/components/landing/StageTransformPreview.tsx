import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { TransformSnippet } from '../../types/prospect';

interface StageTransformPreviewProps {
  headline: string;
  before: TransformSnippet[];
  after: TransformSnippet[];
  visible: boolean;
}

export default function StageTransformPreview({
  headline,
  before,
  after,
  visible,
}: StageTransformPreviewProps) {
  const [showAfter, setShowAfter] = useState(false);

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
      </div>
    </section>
  );
}
