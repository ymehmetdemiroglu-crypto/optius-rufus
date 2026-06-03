interface ProgressBarProps {
  currentStage: number;
  totalStages: number;
  visible: boolean;
}

const STAGE_LABELS = [
  'Scan',
  'Autopsy',
  'Revenue',
  'Rufus Sim',
  'Preview',
  'Roadmap',
  'Proof',
  'Book',
];

export default function ProgressBar({ currentStage, totalStages, visible }: ProgressBarProps) {
  if (!visible) return null;

  const progress = Math.min(((currentStage + 1) / totalStages) * 100, 100);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-brand-dark/95 backdrop-blur-sm border-b-[2px] border-brand-dark">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
        {/* Brand */}
        <span className="font-display font-black text-xs text-brand-gold uppercase tracking-widest shrink-0 hidden sm:block">
          OPTIMUS RUFUS
        </span>

        {/* Progress bar */}
        <div className="flex-1 h-3.5 bg-brand-dark border-[2px] border-white/20 relative overflow-hidden">
          <div
            className="h-full bg-brand-gold transition-all duration-700 ease-out border-r-[2px] border-brand-dark"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stage label */}
        <span className="font-mono text-[10px] text-white/60 uppercase tracking-widest shrink-0">
          {STAGE_LABELS[currentStage] || ''} ({currentStage + 1}/{totalStages})
        </span>
      </div>
    </div>
  );
}
