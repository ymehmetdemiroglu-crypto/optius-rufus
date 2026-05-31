interface StageNarrativeProps {
  narrative: string;
  category: string;
  listingTitle: string;
}

function highlightText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return (
        <span key={i} className="font-bold text-[#0055FF]">
          {inner}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function StageNarrative({ narrative, category, listingTitle }: StageNarrativeProps) {
  const visitors = 12000;
  const conversionGap = 0.032;
  const aov = 42;
  const monthlyLoss = Math.round(visitors * conversionGap * aov);

  return (
    <section id="stage-narrative" className="bg-white px-6 py-12 md:py-16 border-t-[3px] border-black">
      <div className="max-w-5xl w-full mx-auto space-y-8">
        <div className="text-center space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-black">
            Visitor Intelligence
          </p>
          <h2 className="font-sans text-3xl md:text-5xl font-black text-black">
            Here Is What Happened to Your Last 1,000 Visitors
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <p className="text-base md:text-lg text-black leading-snug font-sans">
              {highlightText(narrative)}
            </p>

            <div className="border-[3px] border-black bg-[#F0F0F0] p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-black mb-1">Product</p>
              <p className="text-sm text-black font-bold line-clamp-2">{listingTitle}</p>
              <p className="font-mono text-xs text-black mt-1">{category}</p>
            </div>
          </div>

          <div className="border-[3px] border-black bg-white p-6 space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-black">
              Estimated Revenue Loss
            </p>
            <div className="space-y-2 text-base text-black">
              <div className="flex justify-between border-b-[2px] border-black pb-2">
                <span className="font-mono text-sm">Monthly Visitors</span>
                <span className="font-mono font-bold">{visitors.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b-[2px] border-black pb-2">
                <span className="font-mono text-sm">Conversion Gap</span>
                <span className="font-mono font-bold">{(conversionGap * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-b-[2px] border-black pb-2">
                <span className="font-mono text-sm">AOV</span>
                <span className="font-mono font-bold">${aov}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-mono text-sm uppercase tracking-wider">Loss / Month</span>
                <span className="font-mono text-2xl font-black text-[#FF1A1A]">
                  ${monthlyLoss.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
