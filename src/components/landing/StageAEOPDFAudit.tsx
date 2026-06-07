import type { JSX } from 'react';
import { ShieldCheck, Layers, CheckSquare, Compass, Send } from 'lucide-react';
import type { ProspectData } from '../../types/prospect';

interface StageAEOPDFAuditProps {
  prospect: ProspectData;
  brandData?: {
    companyName?: string;
    logoUrl?: string;
    logoBase64?: string;
    primaryColor?: string;
    website?: string;
  };
  visible: boolean;
  isPrint: boolean;
}

export default function StageAEOPDFAudit({
  prospect,
  brandData,
  visible,
  isPrint,
}: StageAEOPDFAuditProps): JSX.Element | null {
  if (!visible) return null;

  const agencyName = brandData?.companyName || "Optimus Rufus";
  const agencyWebsite = brandData?.website || "www.optimusrufus.com";

  // Radar Chart calculations
  const vertices = [
    { name: "Safety & Form", angle: -Math.PI / 2 },
    { name: "Usage Timing", angle: -Math.PI / 2 + (72 * Math.PI) / 180 },
    { name: "Purity & Sourcing", angle: -Math.PI / 2 + (144 * Math.PI) / 180 },
    { name: "Attribution Traffic", angle: -Math.PI / 2 + (216 * Math.PI) / 180 },
    { name: "COSMO Seeding", angle: -Math.PI / 2 + (288 * Math.PI) / 180 },
  ];

  const scores = [
    prospect.scores.rufusScore,
    prospect.scores.cosmoScore,
    prospect.scores.semanticScore,
    prospect.scores.contentScore,
    prospect.scores.visualScore,
  ];

  const targetScores = [90, 92, 88, 95, 90];

  const getPointString = (scoreMap: number[]) => {
    return vertices
      .map((v, i) => {
        const r = (scoreMap[i] / 100) * 130; // Max radius 130
        const x = 200 + r * Math.cos(v.angle);
        const y = 200 + r * Math.sin(v.angle);
        return `${x},${y}`;
      })
      .join(" ");
  };

  const actualPoints = getPointString(scores);
  const targetPoints = getPointString(targetScores);

  // 15-Point Q&A Checklist Items
  const qaChecklist = [
    { text: "Confirm exact capsule count and pill size metrics in listing Q&A.", checked: true },
    { text: "Address common taste profiles/aftertaste explicitly in Q&A responses.", checked: true },
    { text: "Clarify daily dosage guidelines and age-safety thresholds.", checked: scores[0] > 50 },
    { text: "Define product form suitability (e.g. why capsules are superior to liquid).", checked: scores[0] > 60 },
    { text: "List key allergen exclusion declarations (soy, dairy, gluten-free verification).", checked: false },
    { text: "Clarify optimal routine timing (morning vs. night consumption recommendations).", checked: scores[1] > 55 },
    { text: "Specify mixability with food or acidic liquids.", checked: scores[1] > 65 },
    { text: "Identify usage results timeline expectation patterns.", checked: false },
    { text: "Detail target audience specificity (athletes, seniors, pregnant individuals).", checked: false },
    { text: "Detail ingredient purity sourcing locations and methods.", checked: scores[2] > 60 },
    { text: "Verify organic certification agency names and standards compliance.", checked: false },
    { text: "Address filler ingredient declarations explicitly.", checked: false },
    { text: "Contrast formulation differences against main premium competitor profiles.", checked: false },
    { text: "Address potential side effects or digestion warnings head-on.", checked: false },
    { text: "Seed answer clarifying eco-friendly packaging and storage constraints.", checked: false },
  ];

  return (
    <section
      id="stage-aeo-audit"
      className="bg-white px-6 py-16 md:py-24 border-t-[3px] border-brand-dark"
    >
      <div className="max-w-5xl w-full mx-auto space-y-12">
        {/* White-Label Header */}
        <div className="border-[3px] border-brand-dark p-6 bg-brand-bg shadow-brutal flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-brand-gold font-black bg-brand-dark text-white px-2 py-0.5">
              STANDALONE AUDIT REPORT
            </span>
            <h2 className="display-heading text-2xl md:text-3xl text-brand-dark mt-2">
              White-Labeled AEO Audit Report
            </h2>
            <p className="text-sm font-mono font-bold text-brand-dark/60 mt-1">
              Prepared for: {prospect.listing.brand} (ASIN: {prospect.listing.asin})
            </p>
          </div>
          <div className="text-left md:text-right font-mono text-xs font-black space-y-1">
            <p className="text-brand-dark">Agency: {agencyName}</p>
            <p className="text-brand-gold">{agencyWebsite}</p>
            <p className="text-brand-dark/40">Value: $2,500 – $5,000 USD</p>
          </div>
        </div>

        {/* 2x2 Grid for the new sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: Vector Semantic Gap Radar Chart */}
          <div className="border-[3px] border-brand-dark p-6 bg-white shadow-brutal space-y-4">
            <div className="flex items-center gap-2 text-brand-blue font-black font-display text-lg uppercase border-b-2 border-brand-dark pb-2">
              <Compass className="h-5 w-5" />
              <span>Vector Semantic Gap</span>
            </div>
            <p className="text-xs text-brand-dark/70 font-medium leading-relaxed">
              Comparison between your listing's semantic density and the high-relevance target required to secure conversational recommendations.
            </p>

            <div className="flex justify-center bg-brand-bg border border-brand-dark py-4 relative">
              <svg viewBox="0 0 400 400" className="w-full max-w-[280px] h-auto select-none">
                {/* Background Grid Circles */}
                {[0.25, 0.5, 0.75, 1.0].map((scale, index) => (
                  <circle
                    key={index}
                    cx="200"
                    cy="200"
                    r={130 * scale}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                ))}

                {/* Grid Lines */}
                {vertices.map((v, i) => {
                  const x = 200 + 130 * Math.cos(v.angle);
                  const y = 200 + 130 * Math.sin(v.angle);
                  return (
                    <line
                      key={i}
                      x1="200"
                      y1="200"
                      x2={x}
                      y2={y}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Target Area */}
                <polygon
                  points={targetPoints}
                  fill="rgba(59, 130, 246, 0.1)"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeDasharray="3,3"
                />

                {/* Actual Area */}
                <polygon
                  points={actualPoints}
                  fill="rgba(239, 68, 68, 0.2)"
                  stroke="#ef4444"
                  strokeWidth="3.5"
                />

                {/* Labels */}
                {vertices.map((v, i) => {
                  const textR = 150;
                  const x = 200 + textR * Math.cos(v.angle);
                  const y = 200 + textR * Math.sin(v.angle);
                  return (
                    <text
                      key={i}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      className="font-mono text-[9px] font-black fill-brand-dark uppercase"
                    >
                      {v.name}
                    </text>
                  );
                })}
              </svg>
            </div>

            <div className="flex gap-4 justify-center font-mono text-[10px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3 bg-brutal-red inline-block border border-brand-dark" />
                <span>Your Listing Score</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3 bg-brand-blue/20 inline-block border border-brand-blue border-dashed" />
                <span>AEO Target Score</span>
              </div>
            </div>
          </div>

          {/* Section 2: Rufus Funnel Breakdown */}
          <div className="border-[3px] border-brand-dark p-6 bg-white shadow-brutal space-y-4">
            <div className="flex items-center gap-2 text-brand-blue font-black font-display text-lg uppercase border-b-2 border-brand-dark pb-2">
              <Layers className="h-5 w-5" />
              <span>Rufus Funnel (Layer 1–4)</span>
            </div>
            <p className="text-xs text-brand-dark/70 font-medium leading-relaxed">
              How search queries filter down through Amazon's conversational recommendation stack.
            </p>

            <div className="space-y-3">
              {[
                {
                  layer: "Layer 4: Personalization Match",
                  desc: "Contextual relevancy based on customer profile match.",
                  score: prospect.scores.overallScore,
                  color: "bg-green-500",
                },
                {
                  layer: "Layer 3: RAG Validation Layer",
                  desc: "Corpus trust alignment with reviews and Q&As.",
                  score: prospect.scores.rufusScore,
                  color: "bg-brand-gold",
                },
                {
                  layer: "Layer 2: COSMO Graph Validation",
                  desc: "Functional node linking between intent and listing.",
                  score: prospect.scores.cosmoScore,
                  color: "bg-brand-blue",
                },
                {
                  layer: "Layer 1: Indexing & Eligibility",
                  desc: "Semantic text ingestion and category alignment.",
                  score: prospect.scores.semanticScore,
                  color: "bg-purple-500",
                },
              ].map((lvl, index) => (
                <div key={index} className="border-2 border-brand-dark p-3 bg-brand-bg relative flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[11px] font-black uppercase text-brand-dark">
                      {lvl.layer}
                    </span>
                    <span className={`text-[10px] font-mono font-black text-white px-1.5 py-0.5 border border-brand-dark ${lvl.color}`}>
                      {lvl.score}/100
                    </span>
                  </div>
                  <p className="text-[10px] text-brand-dark/80 font-bold mt-1 leading-snug">
                    {lvl.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: 15-Point Q&A Seeding Roadmap */}
          <div className="border-[3px] border-brand-dark p-6 bg-white shadow-brutal space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 text-brand-blue font-black font-display text-lg uppercase border-b-2 border-brand-dark pb-2">
              <CheckSquare className="h-5 w-5" />
              <span>15-Point Q&A Seeding Roadmap</span>
            </div>
            <p className="text-xs text-brand-dark/70 font-medium leading-relaxed">
              Targeted customer questions to seed in the listing's Q&A section, ensuring Rufus can resolve buyer doubts and avoid competitor recommendation hedging.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[10px]">
              <div>
                <p className="font-black text-brand-gold uppercase tracking-wider mb-2 border-b border-brand-dark/20 pb-1">
                  Phase 1: Form Mismatches
                </p>
                <div className="space-y-2">
                  {qaChecklist.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        readOnly
                        className="mt-0.5 accent-brand-gold"
                      />
                      <span className={`${item.checked ? 'line-through text-brand-dark/50' : 'font-bold text-brand-dark'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-black text-brand-blue uppercase tracking-wider mb-2 border-b border-brand-dark/20 pb-1">
                  Phase 2: Intent Activation
                </p>
                <div className="space-y-2">
                  {qaChecklist.slice(5, 10).map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        readOnly
                        className="mt-0.5 accent-brand-blue"
                      />
                      <span className={`${item.checked ? 'line-through text-brand-dark/50' : 'font-bold text-brand-dark'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-black text-purple-600 uppercase tracking-wider mb-2 border-b border-brand-dark/20 pb-1">
                  Phase 3: Trust Defense
                </p>
                <div className="space-y-2">
                  {qaChecklist.slice(10, 15).map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        readOnly
                        className="mt-0.5 accent-purple-500"
                      />
                      <span className={`${item.checked ? 'line-through text-brand-dark/50' : 'font-bold text-brand-dark'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Amazon Attribution Traffic Plan */}
          <div className="border-[3px] border-brand-dark p-6 bg-white shadow-brutal space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 text-brand-blue font-black font-display text-lg uppercase border-b-2 border-brand-dark pb-2">
              <Send className="h-5 w-5" />
              <span>Amazon Attribution Traffic Plan</span>
            </div>
            <p className="text-xs text-brand-dark/70 font-medium leading-relaxed">
              Inject high-intent external traffic into your optimized listing using Amazon Attribution links. External traffic velocity acts as a powerful multiplier for COSMO co-purchase nodes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-[10px] leading-relaxed">
              <div className="border-2 border-brand-dark bg-brand-bg p-4 space-y-3">
                <p className="font-black text-brand-dark uppercase text-[11px] border-b border-brand-dark/20 pb-1">
                  Google Search Ad Recommendations
                </p>
                <div className="space-y-1.5">
                  <p className="font-bold text-brand-dark/60 uppercase text-[9px]">Target Query Node:</p>
                  <p className="font-black text-brand-dark bg-white px-2 py-1 border border-brand-dark">
                    "pure organic {prospect.listing.category.toLowerCase()} daily supplement"
                  </p>
                  <p className="font-bold text-brand-dark/60 uppercase text-[9px] mt-2">Recommended Ad Copy:</p>
                  <div className="bg-white p-2 border border-brand-dark font-sans font-medium text-xs text-brand-dark">
                    <span className="font-bold block border-b border-brand-dark/10 pb-0.5 mb-1 text-brand-blue">
                      USDA Organic {prospect.listing.brand} — Daily Vitality Support
                    </span>
                    100% Pure Plant-Based. Digestion & Bloating Support. Seeded with Key Prebiotics. Fast Amazon Shipping.
                  </div>
                </div>
              </div>

              <div className="border-2 border-brand-dark bg-brand-bg p-4 space-y-3">
                <p className="font-black text-brand-dark uppercase text-[11px] border-b border-brand-dark/20 pb-1">
                  TikTok Creative Hook Recommendations
                </p>
                <div className="space-y-1.5">
                  <p className="font-bold text-brand-dark/60 uppercase text-[9px]">Visual Hook Script:</p>
                  <div className="bg-white p-2 border border-brand-dark font-sans font-medium text-xs text-brand-dark">
                    <span className="font-bold block border-b border-brand-dark/10 pb-0.5 mb-1 text-purple-600">
                      "Why Amazon Rufus kept recommending my competitors..."
                    </span>
                    Show screen recording of Rufus shopping chat. Explain that hidden certifications and listing gaps meant Rufus didn't know the product was organic. Showcase the newly updated packaging.
                  </div>
                  <p className="font-bold text-brand-dark/60 uppercase text-[9px] mt-2">Attribution Tracking Link Format:</p>
                  <p className="font-black text-brand-gold bg-brand-dark px-2 py-1 text-[9px] select-all truncate">
                    https://www.amazon.com/dp/{prospect.listing.asin}?tag=agency-conquest-aeo-20&m1=attribution-conquesting
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
