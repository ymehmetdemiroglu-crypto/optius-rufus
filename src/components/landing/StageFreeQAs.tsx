import { useState } from 'react';
import { HelpCircle, Copy, Check, MessageSquare } from 'lucide-react';
import type { FreeQAItem } from '../../types/prospect';

interface StageFreeQAsProps {
  freeQAs: FreeQAItem[];
  visible: boolean;
}

export default function StageFreeQAs({ freeQAs, visible }: StageFreeQAsProps) {
  const [copiedIndex, setCopiedIndex] = useState<{ [key: string]: boolean }>({});

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedIndex((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    });
  };

  if (!freeQAs || freeQAs.length === 0) return null;

  return (
    <section
      id="stage-free-qas"
      className="bg-brand-bg px-6 py-16 md:py-24 border-t-[3px] border-brand-dark"
    >
      <div className="max-w-5xl w-full mx-auto space-y-10">
        <div className="text-center space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-brutal-red font-black">
            FREE ASSET DELIVERABLE
          </p>
          <h2 className="display-heading text-3xl md:text-5xl text-brand-dark">
            Your Free Rufus-Ready Q&A Pack
          </h2>
          <p className="text-base md:text-lg text-brand-dark/70 font-medium max-w-2xl mx-auto leading-relaxed">
            Amazon's Rufus AI indexes customer Q&A sections directly. Paste these 3 optimized questions and answers into your listing Q&A to seed Rufus's knowledge database instantly.
          </p>
        </div>

        {/* Q&A Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {freeQAs.map((item, i) => (
            <div
              key={i}
              className="border-[3px] border-brand-dark bg-white p-5 shadow-brutal flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                {/* Header Tag */}
                <div className="flex items-center justify-between border-b-2 border-brand-dark/10 pb-2">
                  <span className="font-mono text-[9px] font-black uppercase text-brand-blue bg-brand-blue/10 px-2 py-0.5 border border-brand-blue/30 rounded">
                    Fixes: {item.dimension.replace(/_/g, ' ')}
                  </span>
                  <HelpCircle className="h-4 w-4 text-brand-dark/40" />
                </div>

                {/* Question */}
                <div className="space-y-1">
                  <p className="font-mono text-[10px] font-black uppercase text-brand-dark/50">Question:</p>
                  <div className="flex items-start justify-between gap-2 bg-brand-bg/40 p-2.5 border border-brand-dark/20 rounded">
                    <p className="text-xs font-black text-brand-dark">{item.question}</p>
                    <button
                      onClick={() => handleCopy(item.question, `q-${i}`)}
                      className="text-brand-dark/50 hover:text-brand-dark cursor-pointer shrink-0"
                      title="Copy Question"
                    >
                      {copiedIndex[`q-${i}`] ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Answer */}
                <div className="space-y-1">
                  <p className="font-mono text-[10px] font-black uppercase text-brand-dark/50">Answer:</p>
                  <div className="flex items-start justify-between gap-2 bg-brand-bg/40 p-2.5 border border-brand-dark/20 rounded">
                    <p className="text-xs font-medium text-brand-dark/95 leading-relaxed">{item.answer}</p>
                    <button
                      onClick={() => handleCopy(item.answer, `a-${i}`)}
                      className="text-brand-dark/50 hover:text-brand-dark cursor-pointer shrink-0"
                      title="Copy Answer"
                    >
                      {copiedIndex[`a-${i}`] ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status footer */}
              <div className="text-[10px] font-mono font-bold text-brand-dark/40 text-center border-t border-brand-dark/10 pt-2 flex items-center justify-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>Ready to Paste on Seller Central</span>
              </div>
            </div>
          ))}
        </div>

        {/* Callout box */}
        <div className="border-2 border-brand-dark/20 bg-white/60 p-4 text-center max-w-xl mx-auto rounded">
          <p className="text-xs text-brand-dark/80 font-mono font-bold leading-relaxed">
            💡 **Tip**: Post these questions using a personal account, then log into your Seller Central account to submit the answers. They usually index and feed Rufus search within 24 hours.
          </p>
        </div>
      </div>
    </section>
  );
}
