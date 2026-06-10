interface COSMOCanvasProps {
  links: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  targetAsin: string;
}

export default function COSMOCanvas({ links, targetAsin }: COSMOCanvasProps) {
  return (
    <div className="border-[3px] border-brand-dark h-[300px] w-full bg-[#1a1a1a] relative overflow-hidden flex items-center justify-center">
      {/* Target Node (Center) */}
      <div className="absolute h-16 w-16 bg-brand-gold border-[3px] border-white rounded-full flex flex-col items-center justify-center text-center shadow-lg z-20">
        <span className="font-display font-black text-xs text-brand-dark leading-none">TARGET</span>
        <span className="font-mono text-[8px] text-brand-dark/80 mt-1 font-bold">{targetAsin}</span>
      </div>

      {/* Competitor Nodes (Orbiting) */}
      {links.map((link: { id: number; relationshipType: string; strengthScore: number; targetAsin: string }, index: number) => {
        // Calculate orbit positions (distributed evenly around center)
        const angle = (index * (2 * Math.PI)) / links.length;
        const radius = 100; // Orbit distance in pixels
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const lineLength = Math.sqrt(x * x + y * y);
        const lineAngle = (Math.atan2(y, x) * 180) / Math.PI;

        // Color based on relationship type
        const nodeColor = 
          link.relationshipType === "substitute" ? "#e63b2e" :
          link.relationshipType === "complementary" ? "#0055ff" : "#888888";

        return (
          <div key={link.id}>
            {/* Connecting Link Line (using rotated div instead of SVG calc) */}
            <div
              className="absolute top-1/2 left-1/2 pointer-events-none z-10 origin-left"
              style={{
                width: `${lineLength}px`,
                height: `${Math.max(1, Math.round(link.strengthScore * 4))}px`,
                backgroundColor: nodeColor,
                opacity: 0.6,
                transform: `rotate(${lineAngle}deg)`,
                borderStyle: link.relationshipType === "complementary" ? "dashed" : "solid",
                borderWidth: 0,
              }}
            />
            {/* Strength Score Indicator */}
            <div
              className="absolute pointer-events-none z-10 font-mono text-[8px] text-white"
              style={{
                left: `calc(50% + ${x / 2}px)`,
                top: `calc(50% + ${y / 2}px)`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {link.strengthScore}
            </div>

            {/* Orbit Node */}
            <div 
              className="absolute h-12 w-12 border-[2px] border-white rounded-full flex flex-col items-center justify-center text-center shadow-md z-20"
              style={{
                left: `calc(50% + ${x}px - 24px)`,
                top: `calc(50% + ${y}px - 24px)`,
                backgroundColor: nodeColor,
              }}
            >
              <span className="font-display font-bold text-[8px] text-white leading-none uppercase">{link.relationshipType.slice(0, 4)}</span>
              <span className="font-mono text-[7px] text-white/90 mt-0.5 font-bold">{link.targetAsin}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
