import { useMemo } from 'react';

interface RadarDimension {
  name: string;
  original: number;
  optimized: number;
}

interface RadarChartProps {
  data?: RadarDimension[];
  size?: number;
}

const defaultDimensions: RadarDimension[] = [
  { name: 'Cellular Absorption', original: 28, optimized: 92 },
  { name: 'Clinical Proof', original: 35, optimized: 88 },
  { name: 'Replenishment Frequency', original: 45, optimized: 90 },
  { name: 'Target Audience Persona', original: 55, optimized: 95 },
  { name: 'Routine Integration', original: 30, optimized: 85 },
  { name: 'Ingredient Purity', original: 60, optimized: 98 },
  { name: 'Specific Use Case', original: 40, optimized: 88 },
  { name: 'Competitor Defensibility', original: 50, optimized: 92 },
];

export default function RadarChart({ data = defaultDimensions, size = 320 }: RadarChartProps) {
  const center = size / 2;
  const maxVal = 100;
  const radius = center * 0.75;

  const points = useMemo(() => {
    const total = data.length;
    return data.map((dim, i) => {
      const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
      return {
        ...dim,
        angle,
        x: Math.cos(angle),
        y: Math.sin(angle),
      };
    });
  }, [data]);

  // Compute coordinate helpers
  const getCoordinates = (angle: number, value: number) => {
    const factor = (value / maxVal) * radius;
    return {
      x: center + Math.cos(angle) * factor,
      y: center + Math.sin(angle) * factor,
    };
  };

  // Generate path lines
  const originalPath = points.map((p) => {
    const coords = getCoordinates(p.angle, p.original);
    return `${coords.x},${coords.y}`;
  }).join(' ');

  const optimizedPath = points.map((p) => {
    const coords = getCoordinates(p.angle, p.optimized);
    return `${coords.x},${coords.y}`;
  }).join(' ');

  // Radial grid levels
  const gridLevels = [25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-brand-bg-card/40 rounded-2xl border border-brand-bg-border relative overflow-hidden select-none">
      {/* Visual background atmospheric shine */}
      <div className="absolute top-0 right-0 h-40 w-40 bg-brand-crimson/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 bg-brand-cyan/5 rounded-full blur-3xl" />

      <h4 className="font-display font-bold text-[10px] tracking-[0.15em] text-slate-400 mb-4 uppercase">
        SEMANTIC TARGET VS ORIGINAL SPECTRUM
      </h4>

      <svg width={size} height={size} className="overflow-visible select-none">
        {/* Draw background grid webs */}
        {gridLevels.map((level) => {
          const levelPoints = points.map((p) => {
            const coords = getCoordinates(p.angle, level);
            return `${coords.x},${coords.y}`;
          }).join(' ');
          return (
            <polygon
              key={level}
              points={levelPoints}
              fill="none"
              className="stroke-slate-900"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Draw axis spokes */}
        {points.map((p, i) => {
          const endCoords = getCoordinates(p.angle, maxVal);
          const textFactor = radius + 22;
          const textX = center + Math.cos(p.angle) * textFactor;
          const textY = center + Math.sin(p.angle) * textFactor;

          // Adjust text anchoring based on coordinates
          let textAnchor: 'middle' | 'start' | 'end' = 'middle';
          if (Math.cos(p.angle) > 0.1) textAnchor = 'start';
          if (Math.cos(p.angle) < -0.1) textAnchor = 'end';

          return (
            <g key={i}>
              <line
                x1={center}
                y1={center}
                x2={endCoords.x}
                y2={endCoords.y}
                className="stroke-slate-900"
                strokeWidth="1.5"
              />
              <text
                x={textX}
                y={textY + 4}
                textAnchor={textAnchor}
                className="fill-slate-500 font-sans font-medium text-[9px] uppercase tracking-wider"
              >
                {p.name}
              </text>
            </g>
          );
        })}

        {/* Original Intent Shape - Matrix Crimson */}
        <polygon
          points={originalPath}
          fill="rgba(230, 57, 70, 0.06)"
          className="stroke-brand-crimson"
          strokeWidth="2.5"
          style={{ filter: 'drop-shadow(0 0 5px rgba(230, 57, 70, 0.2))' }}
        />

        {/* AI-Optimized Target Shape - Active Cyan */}
        <polygon
          points={optimizedPath}
          fill="rgba(0, 245, 255, 0.1)"
          className="stroke-brand-cyan"
          strokeWidth="3"
          style={{ filter: 'drop-shadow(0 0 10px rgba(0, 245, 255, 0.3))' }}
        />

        {/* Draw active nodes for Original shape */}
        {points.map((p, i) => {
          const coords = getCoordinates(p.angle, p.original);
          return (
            <circle
              key={`orig-${i}`}
              cx={coords.x}
              cy={coords.y}
              r="4.5"
              className="fill-brand-crimson stroke-brand-bg-card"
              strokeWidth="2"
            />
          );
        })}

        {/* Draw active nodes for Optimized shape */}
        {points.map((p, i) => {
          const coords = getCoordinates(p.angle, p.optimized);
          return (
            <circle
              key={`opt-${i}`}
              cx={coords.x}
              cy={coords.y}
              r="5.5"
              className="fill-brand-cyan stroke-brand-bg-card animate-pulse-glow"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      <div className="flex gap-6 mt-4 select-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-brand-crimson rounded-full border border-brand-bg" />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Your Old Listing (Keyword-stuffed draft)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-brand-cyan rounded-full border border-brand-bg animate-pulse" />
          <span className="text-[10px] text-brand-cyan font-bold uppercase tracking-wider">Optimized Listing (COSMO Intent-aligned offer)</span>
        </div>
      </div>
    </div>
  );
}
