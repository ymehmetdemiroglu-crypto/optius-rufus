export type ScoreLevel = 'critical' | 'warning' | 'good';

export function getScoreLevel(score: number): ScoreLevel {
  if (score < 40) return 'critical';
  if (score < 65) return 'warning';
  return 'good';
}

export function getScoreColor(level: ScoreLevel): string {
  switch (level) {
    case 'critical': return 'text-brutal-red';
    case 'warning': return 'text-brand-gold';
    case 'good': return 'text-brand-blue';
  }
}
