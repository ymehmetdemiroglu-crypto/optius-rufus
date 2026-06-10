import { useState, useEffect } from 'react';
import { trpc } from '../shared/providers/trpc';
import { Cpu, Layers, Download, ExternalLink, RefreshCw } from 'lucide-react';
import PipelineStatusPanel from './PipelineStatusPanel';
import COSMOCanvas from './COSMOCanvas';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface ProspectDetailPanelProps {
  prospectId: number;
}

export default function ProspectDetailPanel({ prospectId }: ProspectDetailPanelProps) {
  const [simulating, setSimulating] = useState(false);

  // PPC Planner Control Box states
  const [dailyBudget, setDailyBudget] = useState(50);
  const [biddingStrategy, setBiddingStrategy] = useState("dynamicBiddingUpDown");
  const [rankBooster, setRankBooster] = useState(true);

  // Q&A Checklist state
  const [qaItems, setQaItems] = useState([
    { id: 1, text: "Dosage limits & safety warning seeded", checked: true },
    { id: 2, text: "Taste profile / aftertaste details addressed", checked: true },
    { id: 3, text: "Routine integration & timing instructions clarified", checked: false },
    { id: 4, text: "Direct comparison with standard category products seeded", checked: false },
    { id: 5, text: "Form advantages (e.g. capsules vs gummies) explained", checked: false }
  ]);

  // tRPC Queries & Mutations
  const { data: detailData, isLoading } = trpc.prospects.getById.useQuery({ id: prospectId });
  const { data: sovHistory, refetch: refetchSOV } = trpc.rufusTracker.getSOVHistory.useQuery({ prospectId });
  const { data: graphData, refetch: refetchGraph } = trpc.catalogGraph.getGraph.useQuery({ prospectId });
  const { data: brandSettings } = trpc.branding.getSettings.useQuery();

  const runSOV = trpc.rufusTracker.runSOVSimulation.useMutation({
    onSuccess: () => {
      refetchSOV();
      setSimulating(false);
      alert("Rufus Share-of-Voice simulation completed!");
    }
  });

  const triggerSOVSimulation = () => {
    setSimulating(true);
    runSOV.mutate({
      prospectId,
      category: detailData?.listing?.category || "Health & Household",
    });
  };

  // Sync checklist with database Q&A coverage ratio
  useEffect(() => {
    if (sovHistory) {
      const initialCoverage = sovHistory.currentQaCoverage || 40;
      const checkedLength = Math.round((initialCoverage / 100) * qaItems.length);
      setQaItems(prev => prev.map((item, idx) => ({
        ...item,
        checked: idx < checkedLength
      })));
    }
  }, [prospectId, sovHistory]);

  const checkedCount = qaItems.filter(item => item.checked).length;
  const localQaCoverageRatio = Math.round((checkedCount / qaItems.length) * 100);

  const toggleQaItem = (id: number) => {
    setQaItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const { refetch: fetchBulkSheet } = trpc.ppc.downloadBulkSheet.useQuery({
    prospectId,
    dailyBudget,
    biddingStrategy,
    rankBooster,
  }, { enabled: false });

  const handleExportPPC = async () => {
    try {
      const { data } = await fetchBulkSheet();
      if (data && data.csv) {
        const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = data.filename || `ppc_bulk_sheet_${prospectId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert("Could not generate bulk sheet.");
      }
    } catch (err) {
      alert("Failed to export bulk sheet: " + err);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white flex flex-col items-center justify-center p-20 min-h-[400px]">
        <RefreshCw size={24} className="animate-spin text-brand-dark mb-4" />
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Loading client specifications...</p>
      </Card>
    );
  }

  if (!detailData?.prospect) return null;

  const { prospect, listing, analysis } = detailData;

  const agencyName = brandSettings?.companyName || "Optimus Rufus";
  const agencyWebsite = brandSettings?.website || "www.optimusrufus.com";
  const primaryColor = brandSettings?.primaryColor || "#b8860b";

  return (
    <div className="space-y-8">
      {/* Brand Header */}
      <Card className="bg-white space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display font-black text-2xl uppercase tracking-wider">{prospect.company || prospect.firstName || "Unnamed Brand"}</h2>
            <p className="font-mono text-xs text-gray-500 mt-1">{prospect.email} | Analyzed on {new Date(prospect.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <span className="font-mono text-2xl font-black bg-brand-dark text-white px-3 py-1 block shadow-brutal-sm">
              {analysis?.overallScore || "0"}/100
            </span>
            <p className="font-mono text-[9px] text-gray-400 mt-2 uppercase tracking-widest">Audited Score</p>
          </div>
        </div>

        {listing && (
          <div className="border-[2px] border-brand-dark bg-brand-bg p-4 flex gap-4 items-center">
            {listing.images && (
              <img
                src={(() => {
                  try {
                    const parsed = JSON.parse(listing.images);
                    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : "https://placehold.co/100x100/png";
                  } catch {
                    return "https://placehold.co/100x100/png";
                  }
                })()}
                alt="Product Preview"
                className="h-16 w-16 object-contain border border-brand-dark bg-white p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/100x100/png";
                }}
              />
            )}
            <div>
              <h4 className="font-display font-bold text-sm uppercase leading-tight line-clamp-1">{listing.title}</h4>
              <p className="font-mono text-xs text-gray-500 mt-1">ASIN: {listing.asin} | Marketplace: {listing.marketplace || "US"}</p>
              <div className="flex gap-4 mt-2 font-mono text-[10px] text-brand-dark/60">
                <span>Rating: {listing.rating}★</span>
                <span>Reviews: {listing.reviewCount}</span>
                <span>Price: ${listing.price}</span>
              </div>
            </div>
          </div>
        )}

        <PipelineStatusPanel prospectId={prospect.id} />
      </Card>

      {/* PPC Planner Control Box Card */}
      <Card className="bg-white space-y-4">
        <h3 className="font-display font-black text-lg uppercase tracking-wider border-b-[2px] border-brand-dark pb-2">
          PPC Planner Control Box
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Daily Budget Slider */}
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase font-bold text-gray-500 block">
              Daily Budget: ${dailyBudget}
            </label>
            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={dailyBudget}
              onChange={(e) => setDailyBudget(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-dark"
            />
          </div>

          {/* Bidding Strategy Dropdown */}
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase font-bold text-gray-500 block">
              Bidding Strategy
            </label>
            <select
              value={biddingStrategy}
              onChange={(e) => setBiddingStrategy(e.target.value)}
              className="brutalist-input h-10 py-1 text-xs bg-white cursor-pointer"
            >
              <option value="dynamicBiddingUpDown">Dynamic Bidding (Up/Down)</option>
              <option value="dynamicBiddingDownOnly">Dynamic Bidding (Down Only)</option>
              <option value="fixedBids">Fixed Bids</option>
            </select>
          </div>

          {/* Rank Booster Toggle */}
          <div className="flex items-center justify-between md:justify-center gap-3">
            <label className="font-mono text-[10px] uppercase font-bold text-gray-500">
              Rank Booster (Page 2 Conquesting)
            </label>
            <input
              type="checkbox"
              checked={rankBooster}
              onChange={(e) => setRankBooster(e.target.checked)}
              className="w-5 h-5 accent-brand-dark cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 flex gap-4">
          <Button
            variant="primary"
            className="w-full text-sm"
            disabled={!analysis}
            onClick={handleExportPPC}
          >
            <Download size={16} /> Export AEO Compliant PPC Bulk Sheet
          </Button>
        </div>
      </Card>

      {/* AEO Audit Exporter Overlay Info Card */}
      <div className="brutalist-card bg-brand-dark text-white space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-display font-black text-lg uppercase tracking-wider text-brand-gold">
              White-Labeled AEO Audit Exporter
            </h3>
            <p className="font-mono text-[10px] text-white/60 mt-1">
              Active Theme: {agencyName} ({agencyWebsite})
            </p>
          </div>
          <span
            className="h-4 w-4 rounded-full border border-white inline-block shadow-sm"
            style={{ backgroundColor: primaryColor }}
          />
        </div>
        <p className="font-mono text-xs text-white/70 leading-relaxed">
          The PDF download is fully customized with your brand settings. The layout includes custom SVG Vector Semantic Gap charts, Rufus Funnels, and Q&A checklists tailored for agency presentation.
        </p>
        <div className="flex gap-4">
          <a
            href={`/p/${prospect.slug}`}
            target="_blank"
            rel="noreferrer"
            className="bg-white text-brand-dark font-mono text-xs font-black uppercase px-4 py-2 border-2 border-brand-dark hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer flex items-center gap-2"
          >
            <ExternalLink size={14} /> Live Landing Page
          </a>
          <a
            href={`/api/pdf/${prospect.slug}`}
            className="bg-brand-gold text-brand-dark font-mono text-xs font-black uppercase px-4 py-2 border-2 border-brand-dark hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer flex items-center gap-2"
            download
          >
            <Download size={14} /> Download PDF Audit Report
          </a>
        </div>
      </div>

      {/* A9 vs A10 & Rufus Funnel Visualizer (Side-by-Side Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* A9 vs A10 Weighting Widget */}
        <Card className="bg-white space-y-4">
          <h4 className="font-display font-black text-sm uppercase tracking-wide border-b border-brand-dark/10 pb-1.5 text-brand-blue">
            A9 vs A10 Algorithm Weighting
          </h4>
          <p className="font-mono text-[10px] text-gray-500 leading-normal">
            A10 explicitly weights organic sales highest and down-prioritizes PPC-attributed sales compared to A9, making conquesting Page 2 organic positions the key priority.
          </p>
          <div className="space-y-3 font-mono text-xs">
            {/* Metric 1 */}
            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span>Organic Sales Weight</span>
                <span>A9: 95% | A10: 95%</span>
              </div>
              <div className="w-full bg-gray-100 border border-brand-dark h-2.5">
                <div className="h-full bg-green-500" style={{ width: "95%" }} />
              </div>
            </div>
            {/* Metric 2 */}
            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span>PPC Sales Weight</span>
                <span>A9: 85% | A10: 55%</span>
              </div>
              <div className="w-full bg-gray-100 border border-brand-dark h-2.5 flex">
                <div className="h-full bg-brand-gold" style={{ width: "55%" }} />
                <div className="h-full bg-gray-300 opacity-50" style={{ width: "30%" }} />
              </div>
            </div>
            {/* Metric 3 */}
            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span>External Converting Traffic</span>
                <span>A9: 45% | A10: 85%</span>
              </div>
              <div className="w-full bg-gray-100 border border-brand-dark h-2.5 flex">
                <div className="h-full bg-blue-500" style={{ width: "85%" }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Rufus Funnel Visualization */}
        <Card className="bg-white space-y-4">
          <h4 className="font-display font-black text-sm uppercase tracking-wide border-b border-brand-dark/10 pb-1.5 text-brand-blue">
            Rufus Recommendation Funnel
          </h4>
          <div className="flex flex-col gap-1.5 font-mono text-[10px] font-bold">
            <div className="bg-green-500/10 text-green-800 border border-green-300 p-1.5 text-center">
              Layer 4: Personalization (Intent Match)
            </div>
            <div className="bg-yellow-500/10 text-yellow-800 border border-yellow-300 p-1.5 text-center mx-2">
              Layer 3: RAG Retrieval Support (Trust Verification)
            </div>
            <div className="bg-blue-500/10 text-blue-800 border border-blue-300 p-1.5 text-center mx-4">
              Layer 2: COSMO Graph Validation (Context Node)
            </div>
            <div className="bg-purple-500/10 text-purple-800 border border-purple-300 p-1.5 text-center mx-6">
              Layer 1: Indexing & Eligibility (A9/A10 baselines)
            </div>
          </div>
        </Card>
      </div>

      {/* Interactive Q&A Seeding Checklist Card */}
      <Card className="bg-white space-y-4">
        <div className="flex justify-between items-center border-b border-brand-dark/10 pb-2">
          <h3 className="font-display font-black text-lg uppercase tracking-wider">
            Q&A Optimization Pipeline
          </h3>
          <span className="font-mono text-xs font-black bg-brand-blue text-white px-2 py-0.5 border border-brand-dark">
            Coverage: {localQaCoverageRatio}% {localQaCoverageRatio >= 75 ? "🎯 TARGET MET" : "⚠️ NEED 75%+"}
          </span>
        </div>
        <p className="font-mono text-xs text-gray-500">
          Listings with 15+ answered Q&As are recommended **3.2× more often** by Rufus. Check the actions completed to update the pipeline:
        </p>

        <div className="space-y-2 font-mono text-xs">
          {qaItems.map((item) => (
            <div key={item.id} className="flex gap-3 items-center">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleQaItem(item.id)}
                className="w-4 h-4 accent-brand-blue cursor-pointer"
              />
              <span className={item.checked ? "line-through text-gray-400" : "font-bold text-brand-dark"}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Rufus Tracker Section */}
      <Card className="bg-white space-y-6">
        <div className="flex items-center justify-between border-b-[2px] border-brand-dark pb-2">
          <h3 className="font-display font-black text-lg uppercase tracking-wider flex items-center gap-2">
            <Cpu size={18} /> Rufus Share-of-Voice Monitor
          </h3>
          <Button
            variant="secondary"
            className="py-1.5 px-3 text-xs uppercase"
            disabled={simulating}
            onClick={triggerSOVSimulation}
          >
            {simulating ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> Simulating...
              </>
            ) : (
              "Run SOV Simulation"
            )}
          </Button>
        </div>

        <p className="font-mono text-xs text-gray-500">
          Runs 10 target category intent queries through our simulated Rufus LLM agent (GPT-4o) evaluating recommendations and rankings against 3 category competitors.
        </p>

        {sovHistory?.history && sovHistory.history.length > 0 ? (
          <div className="space-y-6">
            {/* Current SOV Badge */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-[2px] border-brand-dark p-4 bg-[#fafafa]">
                <h4 className="font-mono text-[10px] uppercase font-bold text-gray-500">Rufus SOV</h4>
                <p className="font-display font-black text-3xl text-brand-dark mt-1">{sovHistory.currentSOV}%</p>
                <p className="font-mono text-[9px] text-gray-400 mt-2">Win rate out of 10 queries.</p>
              </div>
              <div className="border-[2px] border-brand-dark p-4 bg-[#fafafa]">
                <h4 className="font-mono text-[10px] uppercase font-bold text-gray-500">COSMO Readiness</h4>
                <p className="font-display font-black text-3xl text-brand-dark mt-1">{sovHistory.currentCosmoReadiness}%</p>
                <p className="font-mono text-[9px] text-gray-400 mt-2">Intent nodes coverage.</p>
              </div>
              <div className="border-[2px] border-brand-dark p-4 bg-[#fafafa]">
                <h4 className="font-mono text-[10px] uppercase font-bold text-gray-500">Q&A Coverage</h4>
                <p className="font-display font-black text-3xl text-brand-dark mt-1">{sovHistory.currentQaCoverage}%</p>
                <p className="font-mono text-[9px] text-gray-400 mt-2">Target query coverage.</p>
              </div>
              <div className="border-[2px] border-brand-dark p-4 bg-[#fafafa]">
                <h4 className="font-mono text-[10px] uppercase font-bold text-gray-500">Rufus Recommendation</h4>
                <p className="font-display font-black text-3xl text-brand-dark mt-1">{sovHistory.currentRufusAnsweredRate}%</p>
                <p className="font-mono text-[9px] text-gray-400 mt-2">Confidence recommendation rate.</p>
              </div>
            </div>

            {/* Queries Detail Accordion */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase font-bold border-b border-brand-dark/10 pb-1">Query Simulation Results</h4>
              <div className="divide-y-[2px] divide-brand-dark/10 border-[2px] border-brand-dark bg-white max-h-[300px] overflow-y-auto">
                {sovHistory.history.slice(0, 10).map((q: any, i: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                  const targetRank = q.rankings.find((r: any) => r.asin === "target_product"); // eslint-disable-line @typescript-eslint/no-explicit-any
                  return (
                    <div key={q.queryId} className="p-3 font-mono text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-dark">Q{i+1}: "{q.queryText}"</span>
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold ${targetRank?.recommended ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {targetRank?.recommended ? "RECOMMENDED (Rank #1)" : `Rank #${targetRank?.rank || 4}`}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 italic">"Reason: {targetRank?.reason}"</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="border-[2px] border-brand-dark border-dashed p-8 text-center bg-brand-bg/20">
            <Cpu size={36} className="mx-auto text-brand-dark/25 mb-2" />
            <p className="font-mono text-xs text-gray-500 font-bold">No Rufus SOV simulations run yet.</p>
            <Button
              variant="secondary"
              className="mt-4 text-xs uppercase"
              disabled={simulating}
              onClick={triggerSOVSimulation}
            >
              Run Initial SOV Run
            </Button>
          </div>
        )}
      </Card>

      {/* COSMO Catalog Graph Visualization */}
      <Card className="bg-white space-y-4">
        <h3 className="font-display font-black text-lg uppercase tracking-wider border-b-[2px] border-brand-dark pb-2 flex items-center gap-2">
          <Layers size={18} /> COSMO Catalog Graph Connections
        </h3>
        <p className="font-mono text-xs text-gray-500">
          Visualizes cosine similarities between your listing and competitors using OpenAI 1536-dimensional embeddings. Categories: substitutes (high similarity), complementary (cross-buy potential), or co-occurrences.
        </p>

        {graphData?.links && graphData.links.length > 0 ? (
          <div className="space-y-4">
            <COSMOCanvas links={graphData.links} targetAsin={listing?.asin || "Target"} />
            
            <div className="grid grid-cols-3 gap-2 text-center font-mono text-[9px] uppercase border-[2px] border-brand-dark p-2 bg-brand-bg">
              <div className="flex items-center justify-center gap-1.5"><span className="h-3 w-3 bg-[#e63b2e] border border-brand-dark inline-block"></span> Substitutes (Direct Rival)</div>
              <div className="flex items-center justify-center gap-1.5"><span className="h-3 w-3 bg-[#0055ff] border border-brand-dark inline-block"></span> Complementary (Bundling)</div>
              <div className="flex items-center justify-center gap-1.5"><span className="h-3 w-3 bg-gray-400 border border-brand-dark inline-block"></span> Co-occurrences</div>
            </div>
          </div>
        ) : (
          <div className="border-[2px] border-brand-dark border-dashed p-8 text-center bg-brand-bg/20">
            <Layers size={36} className="mx-auto text-brand-dark/25 mb-2" />
            <p className="font-mono text-xs text-gray-500 font-bold">Catalog similarity links not loaded.</p>
            <Button
              variant="secondary"
              className="mt-4 text-xs uppercase"
              onClick={() => refetchGraph()}
            >
              Calculate Catalog Connections
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
