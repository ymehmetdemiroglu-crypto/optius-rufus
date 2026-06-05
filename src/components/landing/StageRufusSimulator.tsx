import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Bot, AlertCircle, ChevronRight, ArrowRightLeft } from 'lucide-react';
import type { SimulatorScenario, CompetitorComparison } from '../../types/prospect';

interface StageRufusSimulatorProps {
  intro: string;
  scenarios: SimulatorScenario[];
  visible: boolean;
  competitorAudit: CompetitorComparison[];
}

function TypewriterText({ text, speed = 25, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    const t0 = setTimeout(() => setDisplayed(''), 0);

    const interval = setInterval(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => {
      clearTimeout(t0);
      clearInterval(interval);
    };
  }, [text, speed, onComplete]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && <span className="terminal-cursor inline-block w-1.5 h-4 bg-brand-dark/60 ml-0.5 align-middle" />}
    </span>
  );
}

export default function StageRufusSimulator({ intro, scenarios, visible, competitorAudit }: StageRufusSimulatorProps) {
  const [activeScenario, setActiveScenario] = useState(0);
  const [phase, setPhase] = useState<'question' | 'typing' | 'answer' | 'fail'>('question');

  const current = scenarios[activeScenario];
  const audit = competitorAudit[activeScenario];

  useEffect(() => {
    if (!visible) return;
    const t0 = setTimeout(() => setPhase('question'), 0);

    // Auto-progress through phases
    const t1 = setTimeout(() => setPhase('typing'), 1500);
    const t2 = setTimeout(() => setPhase('answer'), 2500);
    const t3 = setTimeout(() => setPhase('fail'), 4500);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeScenario, visible]);

  const handleNext = () => {
    if (activeScenario < scenarios.length - 1) {
      setActiveScenario((prev) => prev + 1);
    }
  };

  const handleSelect = (index: number) => {
    setActiveScenario(index);
  };

  if (!current) return null;

  return (
    <section
      id="stage-simulator"
      className="bg-brand-bg px-6 py-16 md:py-24 border-t-[3px] border-brand-dark"
    >
      <div className="max-w-5xl w-full mx-auto space-y-10">
        <div className="text-center space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-dark/60 font-black">
            RUFUS SIMULATION
          </p>
          <h2 className="display-heading text-3xl md:text-5xl text-brand-dark">
            Watch Amazon's AI Send Your Buyers Away
          </h2>
          <p className="text-base md:text-lg text-brand-dark/70 font-medium max-w-2xl mx-auto leading-relaxed">
            {intro}
          </p>
        </div>

        {/* Scenario Tabs */}
        <div className="flex gap-2 justify-center flex-wrap">
          {scenarios.map((_, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`font-mono text-xs uppercase tracking-widest font-black px-5 py-2.5 border-[3px] border-brand-dark cursor-pointer transition-all duration-150 ease-out select-none ${
                i === activeScenario
                  ? 'bg-brand-dark text-white translate-x-[2px] translate-y-[2px] shadow-none'
                  : 'bg-white text-brand-dark shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
              }`}
            >
              Scenario {i + 1}
            </button>
          ))}
        </div>

        {/* Chat Simulator */}
        <div className="chat-phone-frame max-w-lg mx-auto">
          {/* Phone Header */}
          <div className="chat-header">
            <Bot className="h-4 w-4" />
            <span>Amazon Rufus AI</span>
            <span className="ml-auto text-[10px] text-white/50">LIVE SIMULATION</span>
          </div>

          {/* Chat Body */}
          <div className="chat-body">
            {/* Buyer Message */}
            <div className="flex justify-end">
              <div className="chat-bubble-buyer">
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-3.5 w-3.5 text-brand-blue shrink-0 mt-0.5" />
                  <p className="font-medium text-brand-dark">{current.buyerQuestion}</p>
                </div>
              </div>
            </div>

            {/* Rufus Response */}
            {(phase === 'typing' || phase === 'answer' || phase === 'fail') && (
              <div className="flex justify-start">
                <div className="chat-bubble-rufus">
                  <div className="flex items-start gap-2">
                    <Bot className="h-3.5 w-3.5 text-brand-gold shrink-0 mt-0.5" />
                    {phase === 'typing' ? (
                      <div className="flex gap-1 py-1">
                        <span className="w-2 h-2 bg-brand-dark/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-brand-dark/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-brand-dark/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <p className="text-brand-dark">
                        <TypewriterText text={current.rufusAnswer} speed={20} />
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Competitor Recommendation */}
            {phase === 'fail' && (
              <div className="flex justify-start animate-slide-up">
                <div className="chat-bubble-rufus border-brand-blue">
                  <p className="text-xs font-mono text-brand-blue font-bold uppercase tracking-wider mb-1">
                    Rufus Recommends:
                  </p>
                  <p className="text-sm font-bold text-brand-dark">{current.competitorName}</p>
                </div>
              </div>
            )}

            {/* Fail Reason */}
            {phase === 'fail' && (
              <div className="flex justify-start animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="chat-bubble-warning">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-brutal-red shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-brutal-red">{current.failReason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side-by-Side Competitor Audit Panel */}
        {phase === 'fail' && audit && (
          <div className="max-w-2xl mx-auto border-[3px] border-brand-dark bg-white p-5 shadow-brutal animate-slide-up mt-6 space-y-4">
            <div className="flex items-center gap-2 text-brand-blue font-black font-display text-lg uppercase border-b-2 border-brand-dark pb-2">
              <ArrowRightLeft className="h-5 w-5 text-brand-blue" />
              <span>Competitor Loss Audit vs. {audit.competitorName}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="border-2 border-brutal-red bg-brutal-red/5 p-3 space-y-2">
                <p className="font-black text-brutal-red uppercase text-[10px] tracking-widest">YOUR SEMANTIC GAP:</p>
                <p className="text-brand-dark leading-relaxed font-bold">{audit.yourGap}</p>
              </div>
              <div className="border-2 border-green-500 bg-green-500/5 p-3 space-y-2">
                <p className="font-black text-green-700 uppercase text-[10px] tracking-widest">COMPETITOR ADVANTAGE:</p>
                <p className="text-brand-dark leading-relaxed font-bold">{audit.competitorAdvantage}</p>
              </div>
            </div>
            <div className="text-[10px] font-mono font-bold text-brand-dark/50 text-center">
              Target Query: "{audit.query}"
            </div>
          </div>
        )}

        {/* Next Button */}
        {phase === 'fail' && activeScenario < scenarios.length - 1 && (
          <div className="text-center animate-fade-in mt-6">
            <button
              onClick={handleNext}
              className="brutalist-btn-secondary inline-flex items-center gap-2"
            >
              <span>See Next Scenario</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Summary after all scenarios */}
        {phase === 'fail' && activeScenario === scenarios.length - 1 && (
          <div className="border-[3px] border-brutal-red bg-brutal-red/5 p-6 text-center animate-fade-in max-w-lg mx-auto">
            <p className="text-lg font-black text-brand-dark">
              Your listing failed <span className="text-brutal-red">{scenarios.length} out of {scenarios.length}</span> common buyer questions.
              <br />
              <span className="text-brand-dark/60 text-base font-bold">Every failed question = lost sale.</span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
