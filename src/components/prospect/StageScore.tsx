import type { ProspectScoreBreakdown } from '../../types/prospect';

interface StageScoreProps {
  scores: ProspectScoreBreakdown;
  category: string;
}

function getScoreColor(score: number): string {
  if (score < 50) return 'text-brand-red';
  if (score <= 75) return 'text-brand-dark';
  return 'text-brand-blue';
}
 
interface ScoreBoxProps {
  label: string;
  score: number;
  description: string;
}
 
function ScoreBox({ label, score, description }: ScoreBoxProps) {
  return (
    <div className="border-[3px] border-brand-dark bg-white p-4 md:p-6 space-y-3 shadow-brutal-sm">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-dark/50 font-black">{label}</p>
      <p className={`font-display text-5xl font-black ${getScoreColor(score)}`}>{score}</p>
      <p className="text-sm text-brand-dark/90 font-bold leading-snug">{description}</p>
    </div>
  );
}
 
export default function StageScore({ scores, category }: StageScoreProps) {
  return (
    <section id="stage-score" className="bg-brand-bg px-6 py-12 md:py-16 border-t-[3px] border-brand-dark select-none text-brand-dark font-sans">
      <div className="max-w-5xl w-full mx-auto space-y-8">
        <div className="text-center space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-dark/60 font-black">
            Intelligence Score
          </p>
          <h2 className="display-heading text-3xl md:text-5xl text-brand-dark">
            Your Listing Intelligence Score
          </h2>
        </div>
 
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ScoreBox
            label="Overall"
            score={scores.overallScore}
            description="Combined performance across all Amazon AI signals."
          />
          <ScoreBox
            label="Rufus"
            score={scores.rufusScore}
            description="Conversational search compatibility and answer coverage."
          />
          <ScoreBox
            label="Cosmo"
            score={scores.cosmoScore}
            description="Amazon&apos;s semantic relevance engine score."
          />
          <ScoreBox
            label="Semantic"
            score={scores.semanticScore}
            description="Entity coverage and meaning-based indexing."
          />
        </div>
 
        <div className="border-[3px] border-brand-dark bg-white p-6 text-center shadow-brutal">
          <p className="text-base text-brand-dark font-bold uppercase tracking-wide">
            Average in <span className="font-black text-brand-blue">{category}</span>:{' '}
            <span className="font-mono font-black text-lg bg-brand-bg px-2 py-0.5 border border-brand-dark">{scores.categoryAverage ?? 54}</span>
            <span className="mx-3 text-brand-dark/30">|</span>
            Your score:{' '}
            <span className={`font-black font-mono text-xl ${getScoreColor(scores.overallScore)}`}>
              {scores.overallScore}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
