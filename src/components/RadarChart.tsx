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
    <div className="flex flex-col items-center justify-center p-6 bg-white border-[3px] border-brand-dark relative overflow-hidden select-none shadow-brutal w-full">
      <h4 className="font-display font-black text-xs tracking-wider text-brand-dark mb-6 uppercase">
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
              className="stroke-brand-dark/25"
              strokeWidth="2"
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
                className="stroke-brand-dark/30"
                strokeWidth="2"
              />
              <text
                x={textX}
                y={textY + 4}
                textAnchor={textAnchor}
                className="fill-brand-dark font-mono font-black text-[9px] uppercase tracking-wider"
              >
                {p.name}
              </text>
            </g>
          );
        })}
 
        {/* Original Intent Shape - Stark Red */}
        <polygon
          points={originalPath}
          fill="rgba(230, 59, 46, 0.12)"
          className="stroke-brand-red"
          strokeWidth="3"
        />
 
        {/* AI-Optimized Target Shape - Stark Blue */}
        <polygon
          points={optimizedPath}
          fill="rgba(0, 85, 255, 0.15)"
          className="stroke-brand-blue"
          strokeWidth="3.5"
        />
 
        {/* Draw active nodes for Original shape */}
        {points.map((p, i) => {
          const coords = getCoordinates(p.angle, p.original);
          return (
            <rect
              key={`orig-${i}`}
              x={coords.x - 4}
              y={coords.y - 4}
              width="8"
              height="8"
              className="fill-brand-red stroke-brand-dark"
              strokeWidth="2"
            />
          );
        })}
 
        {/* Draw active nodes for Optimized shape */}
        {points.map((p, i) => {
          const coords = getCoordinates(p.angle, p.optimized);
          return (
            <rect
              key={`opt-${i}`}
              x={coords.x - 5}
              y={coords.y - 5}
              width="10"
              height="10"
              className="fill-brand-blue stroke-brand-dark"
              strokeWidth="2"
            />
          );
        })}
      </svg>
 
      <div className="flex flex-col sm:flex-row gap-4 mt-6 select-none w-full justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-brand-red border-2 border-brand-dark" />
          <span className="text-[10px] text-brand-dark font-bold uppercase tracking-wider">Your Old Listing (Keyword-stuffed draft)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-brand-blue border-2 border-brand-dark" />
          <span className="text-[10px] text-brand-dark font-bold uppercase tracking-wider">Optimized Listing (COSMO Intent-aligned offer)</span>
        </div>
      </div>
    </div>
  );
}
