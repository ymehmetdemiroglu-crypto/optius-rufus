interface AnimatedGaugeProps {
  score: number;
  label: string;
  color?: 'crimson' | 'cyan' | 'silver';
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
}

const colorMap: Record<string, string> = {
  crimson: '#FF1A1A',
  cyan: '#0055FF',
  silver: '#000000',
};

export default function AnimatedGauge({
  score,
  label,
  color = 'cyan',
}: AnimatedGaugeProps) {
  const textColor = colorMap[color] || '#000000';

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className="text-7xl font-mono font-black leading-none"
        style={{ color: textColor }}
      >
        {score}
      </span>
      <span className="font-mono text-xs uppercase tracking-widest text-black">
        {label}
      </span>
    </div>
  );
}
