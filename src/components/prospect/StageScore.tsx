import type { ProspectScoreBreakdown } from '../../types/prospect';

interface StageScoreProps {
  scores: ProspectScoreBreakdown;
  category: string;
}

function getScoreColor(score: number): string {
  if (score < 50) return 'text-[#FF1A1A]';
  if (score <= 75) return 'text-black';
  return 'text-[#0055FF]';
}

interface ScoreBoxProps {
  label: string;
  score: number;
  description: string;
}

function ScoreBox({ label, score, description }: ScoreBoxProps) {
  return (
    <div className="border-[3px] border-black bg-white p-4 md:p-6 space-y-3">
      <p className="font-mono text-xs uppercase tracking-widest text-black">{label}</p>
      <p className={`font-mono text-5xl font-black ${getScoreColor(score)}`}>{score}</p>
      <p className="text-sm text-black leading-snug">{description}</p>
    </div>
  );
}

export default function StageScore({ scores, category }: StageScoreProps) {
  return (
    <section id="stage-score" className="bg-white px-6 py-12 md:py-16 border-t-[3px] border-black">
      <div className="max-w-5xl w-full mx-auto space-y-8">
        <div className="text-center space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-black">
            Intelligence Score
          </p>
          <h2 className="font-sans text-3xl md:text-5xl font-black text-black">
            Your Listing Intelligence Score
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[3px] bg-black border-[3px] border-black">
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

        <div className="border-[3px] border-black bg-[#F0F0F0] p-4 text-center">
          <p className="text-base text-black">
            Average in <span className="font-black">{category}</span>:{' '}
            <span className="font-mono font-bold">{scores.categoryAverage ?? 54}</span>
            <span className="mx-2 text-black">|</span>
            Your score:{' '}
            <span className={`font-black font-mono text-lg ${getScoreColor(scores.overallScore)}`}>
              {scores.overallScore}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
