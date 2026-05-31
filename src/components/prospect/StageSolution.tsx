import { ArrowRight } from 'lucide-react';
import type { ProspectOpportunity } from '../../types/prospect';

interface StageSolutionProps {
  opportunities: ProspectOpportunity[];
  onOpenBooking: () => void;
}

export default function StageSolution({ opportunities, onOpenBooking }: StageSolutionProps) {
  return (
    <section id="stage-solution" className="bg-white px-6 py-12 md:py-16 border-t-[3px] border-black">
      <div className="max-w-5xl w-full mx-auto space-y-8">
        <div className="text-center space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-black">
            Optimization Blueprint
          </p>
          <h2 className="font-sans text-3xl md:text-5xl font-black text-black">
            What Optimus Rufus Would Change
          </h2>
        </div>

        <div className="space-y-6">
          {opportunities.slice(0, 4).map((opp, i) => (
            <div key={i} className="space-y-2">
              <h3 className="text-base font-bold text-black">{opp.title}</h3>
              <p className="text-xs text-black mb-3">{opp.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[3px]">
                <div className="border-[3px] border-black bg-[#F0F0F0] p-4">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-black mb-1">
                    Before
                  </p>
                  <p className="text-sm text-black leading-relaxed">{opp.before}</p>
                </div>
                <div className="border-[3px] border-black bg-white p-4">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#0055FF] mb-1">
                    After
                  </p>
                  <p className="text-sm text-[#0055FF] leading-relaxed">{opp.after}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onOpenBooking}
            className="bg-[#FF1A1A] text-white border-[3px] border-black px-8 py-4 font-black text-lg uppercase tracking-wide hover:bg-black hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <span>See the Full Optimization Report</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
