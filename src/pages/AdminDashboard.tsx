import { useState, useEffect } from "react";
import { trpc } from "../providers/trpc";
import { usePipeline } from "../hooks/usePipeline";
import { 
  Search, Palette, Download, FolderOpen, Cpu, 
  Layers, AlertTriangle, CheckCircle, RefreshCw, Upload, ExternalLink 
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"clients" | "branding">("clients");
  const [selectedProspectId, setSelectedProspectId] = useState<number | null>(null);

  // tRPC Queries & Mutations
  const { data: prospectsData, refetch: refetchProspects } = trpc.prospects.list.useQuery({});
  const { data: brandData, refetch: refetchBranding } = trpc.branding.getSettings.useQuery();
  const updateBranding = trpc.branding.updateSettings.useMutation({
    onSuccess: () => {
      refetchBranding();
      alert("Branding settings saved successfully!");
    }
  });

  // Branding states
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#b8860b");
  const [logoBase64, setLogoBase64] = useState("");

  // Populate branding fields when loaded
  useEffect(() => {
    if (brandData) {
      setTimeout(() => {
        setCompanyName(brandData.companyName);
        setWebsite(brandData.website || "");
        setPrimaryColor(brandData.primaryColor);
        setLogoBase64(brandData.logoBase64 || "");
      }, 0);
    }
  }, [brandData]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoBase64(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding.mutate({
      companyName,
      website,
      primaryColor,
      logoBase64,
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-brand-dark font-sans select-none pb-20">
      {/* Top Header */}
      <header className="bg-brand-dark text-white border-b-[3px] border-brand-dark px-8 py-6 flex items-center justify-between shadow-brutal-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-brand-gold border-[2px] border-white flex items-center justify-center font-display font-black text-xl text-brand-dark">Ω</div>
          <div>
            <h1 className="font-display uppercase font-black text-2xl tracking-wide">OPTIMUS RUFUS</h1>
            <p className="font-mono text-[10px] text-white/50 tracking-widest uppercase">Internal Agency Portal</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex border-[2px] border-white/20 bg-white/5 p-1">
          <button 
            onClick={() => setActiveTab("clients")}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === "clients" ? "bg-brand-gold text-brand-dark font-bold" : "text-white/70 hover:text-white"}`}
          >
            <FolderOpen size={14} /> Brand Directory
          </button>
          <button 
            onClick={() => {
              setActiveTab("branding");
              if (brandData) {
                setCompanyName(brandData.companyName);
                setWebsite(brandData.website || "");
                setPrimaryColor(brandData.primaryColor);
                setLogoBase64(brandData.logoBase64 || "");
              }
            }}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === "branding" ? "bg-brand-gold text-brand-dark font-bold" : "text-white/70 hover:text-white"}`}
          >
            <Palette size={14} /> White-Label Settings
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-[1400px] mx-auto px-8 mt-10 grid grid-cols-12 gap-8">
        {activeTab === "clients" ? (
          <>
            {/* Left Column: Brand List & Launch Audit */}
            <div className="col-span-12 lg:col-span-5 space-y-8">
              <AuditLaunchBox onAuditLaunched={refetchProspects} />
              
              <div className="brutalist-card bg-white space-y-4">
                <h2 className="font-display font-black text-lg uppercase tracking-wider border-b-[2px] border-brand-dark pb-2 flex items-center gap-2">
                  <FolderOpen size={18} /> Active Clients / Prospects
                </h2>
                
                <div className="divide-y-[2px] divide-brand-dark/10 max-h-[500px] overflow-y-auto pr-2">
                  {prospectsData?.items && prospectsData.items.length > 0 ? (
                    prospectsData.items.map((p: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any -- map raw prospects to list items
                      <div 
                        key={p.id} 
                        onClick={() => setSelectedProspectId(p.id)}
                        className={`py-4 px-3 cursor-pointer transition-all flex items-center justify-between ${selectedProspectId === p.id ? "bg-brand-gold/15 border-l-4 border-brand-gold" : "hover:bg-brand-bg"}`}
                      >
                        <div>
                          <h3 className="font-display font-bold uppercase text-sm">{p.company || p.firstName || "Unnamed Brand"}</h3>
                          <p className="font-mono text-xs text-gray-500 mt-0.5">{p.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-mono text-[9px] bg-brand-dark text-white px-1.5 py-0.5 rounded-none uppercase">{p.asin || "NO ASIN"}</span>
                            <span className={`font-mono text-[9px] px-1.5 py-0.5 uppercase ${p.status === "analyzed" ? "bg-green-100 text-green-700 font-bold" : "bg-yellow-100 text-yellow-700"}`}>{p.status}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-xs font-bold">{p.landingPageViews || 0} views</p>
                          <p className="font-mono text-[10px] text-gray-400 mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="font-mono text-xs text-gray-500 py-8 text-center">No brands audited yet. Launch an ASIN audit above!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Prospect Details Panel */}
            <div className="col-span-12 lg:col-span-7">
              {selectedProspectId ? (
                <ProspectDetailPanel prospectId={selectedProspectId} />
              ) : (
                <div className="brutalist-card bg-white/50 border-dashed border-[3px] border-brand-dark/20 h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                  <FolderOpen size={48} className="text-brand-dark/25 mb-4" />
                  <h3 className="font-display font-black text-xl uppercase tracking-wider text-brand-dark/40">Select a Client Listing</h3>
                  <p className="font-mono text-xs text-brand-dark/40 mt-2 max-w-sm">Click any brand in the directory list to review optimized copies, run Rufus SOV simulations, view COSMO graphs, and export deliverables.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Branding Configuration Panel */
          <div className="col-span-12 max-w-2xl mx-auto w-full">
            <form onSubmit={handleSaveBranding} className="brutalist-card bg-white space-y-6">
              <h2 className="font-display font-black text-xl uppercase tracking-wider border-b-[2px] border-brand-dark pb-3 flex items-center gap-2">
                <Palette size={20} /> White-Label Settings
              </h2>
              
              <p className="font-mono text-xs text-gray-500">
                Configure your agency branding details. These settings dynamically theme the diagnostic landing pages (`/p/:slug`) in print mode and apply your custom styling directly onto Puppeteer PDF exports.
              </p>

              <div className="space-y-2">
                <label className="font-mono text-xs uppercase font-bold block">Agency / Company Name</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="brutalist-input"
                  placeholder="e.g. Acme Marketing Group"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-mono text-xs uppercase font-bold block">Agency Website</label>
                  <input 
                    type="url" 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="brutalist-input"
                    placeholder="https://acmemarketing.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-xs uppercase font-bold block">Primary Brand Color (Hex)</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-12 w-16 border-[3px] border-brand-dark cursor-pointer bg-white"
                    />
                    <input 
                      type="text" 
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="brutalist-input font-mono"
                      placeholder="#b8860b"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs uppercase font-bold block">Agency Logo Image File</label>
                <div className="border-[3px] border-dashed border-brand-dark p-6 flex flex-col items-center justify-center bg-[#fafafa]">
                  {logoBase64 ? (
                    <div className="text-center space-y-4">
                      <img src={logoBase64} alt="Agency Logo Preview" className="max-h-16 mx-auto object-contain border border-gray-200 p-1" />
                      <button 
                        type="button" 
                        onClick={() => setLogoBase64("")}
                        className="text-xs font-mono font-bold text-red-600 underline cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <Upload size={24} className="mx-auto text-gray-400" />
                      <p className="font-mono text-xs font-bold">Drag & Drop or click to upload logo</p>
                      <p className="font-mono text-[10px] text-gray-400">PNG or JPG. Encoded as Base64 in SQLite</p>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden" 
                        id="logo-file-input" 
                      />
                      <label htmlFor="logo-file-input" className="inline-block mt-2 bg-brand-dark text-white font-mono text-[10px] px-3 py-1.5 uppercase font-bold cursor-pointer hover:bg-brand-dark/80">
                        Choose Image File
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="brutalist-btn w-full mt-4">
                Save Branding Settings
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

/* =========================================================================
   AUDIT LAUNCH BOX COMPONENT
   ========================================================================= */
function AuditLaunchBox({ onAuditLaunched }: { onAuditLaunched: () => void }) {
  const [asin, setAsin] = useState("");
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [marketplace, setMarketplace] = useState("US");
  const [loading, setLoading] = useState(false);

  // tRPC Mutations
  const createProspect = trpc.prospects.create.useMutation();
  const triggerScraper = trpc.scraper.trigger.useMutation();
  const runAnalysis = trpc.analysis.run.useMutation();

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[A-Z0-9]{10}$/.test(asin.toUpperCase())) {
      alert("Please enter a valid 10-character Amazon ASIN!");
      return;
    }

    setLoading(true);
    const clientEmail = email || `client-${asin.toLowerCase()}@optimusrufus.com`;
    const company = brandName || `Brand ${asin.toUpperCase()}`;

    try {
      // Step 1: Create prospect
      const prospect = await createProspect.mutateAsync({
        email: clientEmail,
        firstName: company,
        company: company,
      });

      if (!prospect) throw new Error("Failed to create prospect database record");

      // Step 2: Trigger scrape
      const scrapeResult = await triggerScraper.mutateAsync({
        prospectId: prospect.id,
        asin: asin.toUpperCase(),
        marketplace,
      });

      if (!scrapeResult?.listing) throw new Error("Failed to scrape listing data");

      // Step 3: Run multi-agent analysis & StageCopy rewrite
      await runAnalysis.mutateAsync({
        listingId: scrapeResult.listing.id,
      });

      alert(`✅ Listing Audit successfully generated for ASIN: ${asin.toUpperCase()}!`);
      setAsin("");
      setBrandName("");
      setEmail("");
      onAuditLaunched();
    } catch (err) {
      const error = err as any; // eslint-disable-line @typescript-eslint/no-explicit-any -- catch block exception handling
      console.error(error);
      alert(`❌ Audit launch failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLaunch} className="brutalist-card bg-white space-y-4">
      <h2 className="font-display font-black text-lg uppercase tracking-wider border-b-[2px] border-brand-dark pb-2 flex items-center gap-2">
        <Search size={18} /> Launch New Listing Audit
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="font-mono text-[10px] uppercase font-bold text-gray-500">Amazon ASIN</label>
          <input 
            type="text" 
            value={asin}
            onChange={(e) => setAsin(e.target.value)}
            className="brutalist-input uppercase font-mono" 
            placeholder="B0XXXXXX"
            maxLength={10}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <label className="font-mono text-[10px] uppercase font-bold text-gray-500">Marketplace</label>
          <select 
            value={marketplace} 
            onChange={(e) => setMarketplace(e.target.value)}
            className="brutalist-input h-[48px] bg-white cursor-pointer"
            disabled={loading}
          >
            <option value="US">US (.com)</option>
            <option value="UK">UK (.co.uk)</option>
            <option value="DE">DE (.de)</option>
            <option value="FR">FR (.fr)</option>
            <option value="IT">IT (.it)</option>
            <option value="ES">ES (.es)</option>
            <option value="CA">CA (.ca)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="font-mono text-[10px] uppercase font-bold text-gray-500">Brand / Client Name</label>
          <input 
            type="text" 
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="brutalist-input" 
            placeholder="e.g. NutraWell"
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <label className="font-mono text-[10px] uppercase font-bold text-gray-500">Client Contact Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="brutalist-input" 
            placeholder="client@brand.com"
            disabled={loading}
          />
        </div>
      </div>

      <button 
        type="submit" 
        className="brutalist-btn w-full flex items-center justify-center gap-2 mt-2"
        disabled={loading}
      >
        {loading ? (
          <>
            <RefreshCw size={18} className="animate-spin" /> Ingesting & Analyzing ASIN...
          </>
        ) : (
          <>
            <Search size={18} /> Run Diagnostic Audit
          </>
        )}
      </button>
    </form>
  );
}

/* =========================================================================
   PROSPECT DETAIL PANEL COMPONENT
   ========================================================================= */
function ProspectDetailPanel({ prospectId }: { prospectId: number }) {
  const [simulating, setSimulating] = useState(false);
  
  // tRPC Queries & Mutations
  const { data: detailData, isLoading } = trpc.prospects.getById.useQuery({ id: prospectId });
  const { data: sovHistory, refetch: refetchSOV } = trpc.rufusTracker.getSOVHistory.useQuery({ prospectId });
  const { data: graphData, refetch: refetchGraph } = trpc.catalogGraph.getGraph.useQuery({ prospectId });
  
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

  const handleDownloadBulkSheet = () => {
    if (!detailData?.analysis) return;
    
    // Parse PPC keywords safely from SQLite
    const keywords = (() => {
      try {
        const parsedData = JSON.parse(detailData.analysis.copyPpcKeywords || "[]");
        return Array.isArray(parsedData) ? parsedData : [];
      } catch {
        return [];
      }
    })() as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any -- keywords array typing

    if (keywords.length === 0) {
      alert("No keywords analyzed for this listing yet. Run analysis first!");
      return;
    }

    // Retrieve parsed semantic gaps to inject negative keywords
    const gaps = (() => {
      try {
        const parsedData = JSON.parse(detailData.analysis.gaps || "[]");
        return Array.isArray(parsedData) ? parsedData : [];
      } catch {
        return [];
      }
    })() as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any -- gaps list mapping

    const asin = detailData.listing.asin;
    const brand = (detailData.listing.brand || "Brand").toUpperCase();
    const campaignName = `OR_${brand}_${asin}_COSMO_EXACT`;

    // Amazon Bulk Sheet Header (v3.0 standard Sponsored Products columns)
    const csvRows = [
      "Product,Entity,Operation,Campaign,Ad Group,Bid,Keyword Text,Match Type,SKU,Budget,Bidding Strategy",
    ];

    // 1. Campaign Row
    csvRows.push(
      `Sponsored Products,Campaign,Create,${campaignName},,,,50.00,,Dynamic bids - down only`
    );

    // Group keywords into Ad Groups by matched intent dimension
    const adGroups: Record<string, any[]> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any -- group dynamic keywords
    keywords.forEach((k) => {
      const adGroup = k.placement === "title" ? "Intent_Sleep_Quality" : k.placement === "bullet" ? "Intent_Leg_Cramps" : "Intent_General_Support";
      if (!adGroups[adGroup]) adGroups[adGroup] = [];
      adGroups[adGroup].push(k);
    });

    Object.entries(adGroups).forEach(([adGroupName, kwList]) => {
      // 2. Ad Group Row
      csvRows.push(
        `Sponsored Products,Ad Group,Create,${campaignName},${adGroupName},1.20,,,,`
      );

      // 3. Product Ad Row (merging SKU/ASIN)
      csvRows.push(
        `Sponsored Products,Product Ad,Create,${campaignName},${adGroupName},,,,,${asin}`
      );

      // 4. Keyword targeting rows
      kwList.forEach((kw) => {
        csvRows.push(
          `Sponsored Products,Keyword,Create,${campaignName},${adGroupName},${(kw.bid || 1.15).toFixed(2)},${kw.keyword},Exact,,`
        );
      });
    });

    // 5. Inject Campaign Negative Phrase Exclusion row based on gaps
    const criticalGaps = gaps.filter(g => g.priority === "critical" || g.priority === "high");
    if (criticalGaps.length > 0) {
      // Find what they are deficient in and add phrases as negative target
      const negativeWords = criticalGaps.map(g => g.dimension.split("_")[0]).filter(Boolean);
      negativeWords.slice(0, 3).forEach((word) => {
        csvRows.push(
          `Sponsored Products,Campaign negative keyword,Create,${campaignName},,,,${word},Negative Phrase,`
        );
      });
    }

    // Trigger standard browser CSV download
    const csvContent = csvRows.join("\n");
    const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `amazon_ads_bulksheet_${asin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="brutalist-card bg-white flex flex-col items-center justify-center p-20 min-h-[400px]">
        <RefreshCw size={24} className="animate-spin text-brand-dark mb-4" />
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Loading client specifications...</p>
      </div>
    );
  }

  if (!detailData?.prospect) return null;

  const { prospect, listing, analysis } = detailData;

  return (
    <div className="space-y-8">
      {/* Brand Header */}
      <div className="brutalist-card bg-white space-y-4">
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

        <div className="flex flex-wrap gap-4 pt-2 border-t-[2px] border-brand-dark/10">
          <a 
            href={`/p/${prospect.slug}`} 
            target="_blank" 
            rel="noreferrer"
            className="brutalist-btn-secondary flex items-center gap-2"
          >
            <ExternalLink size={14} /> View Landing Page
          </a>
          <a 
            href={`/api/pdf/${prospect.slug}`} 
            className="brutalist-btn-secondary flex items-center gap-2"
            download
          >
            <Download size={14} /> Download PDF Audit
          </a>
          <button 
            onClick={handleDownloadBulkSheet}
            className="brutalist-btn-secondary flex items-center gap-2"
            disabled={!analysis}
          >
            <Download size={14} /> Export PPC Bulk Sheet
          </button>
        </div>
      </div>

      {/* Rufus Tracker Section */}
      <div className="brutalist-card bg-white space-y-6">
        <div className="flex items-center justify-between border-b-[2px] border-brand-dark pb-2">
          <h3 className="font-display font-black text-lg uppercase tracking-wider flex items-center gap-2">
            <Cpu size={18} /> Rufus Share-of-Voice Monitor
          </h3>
          <button 
            onClick={triggerSOVSimulation}
            disabled={simulating}
            className="brutalist-btn-secondary py-1.5 px-3 text-xs uppercase"
          >
            {simulating ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> Simulating...
              </>
            ) : (
              "Run SOV Simulation"
            )}
          </button>
        </div>

        <p className="font-mono text-xs text-gray-500">
          Runs 10 target category intent queries through our simulated Rufus LLM agent (GPT-4o) evaluating recommendations and rankings against 3 category competitors.
        </p>

        {sovHistory?.history && sovHistory.history.length > 0 ? (
          <div className="space-y-6">
            {/* Current SOV Badge */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border-[2px] border-brand-dark p-4 bg-[#fafafa]">
                <h4 className="font-mono text-[10px] uppercase font-bold text-gray-500">Calculated Rufus SOV</h4>
                <p className="font-display font-black text-3xl text-brand-dark mt-1">{sovHistory.currentSOV}%</p>
                <p className="font-mono text-[9px] text-gray-400 mt-2">Target product won {Math.round(sovHistory.currentSOV / 10)} out of 10 category queries.</p>
              </div>
              <div className="border-[2px] border-brand-dark p-4 bg-[#fafafa]">
                <h4 className="font-mono text-[10px] uppercase font-bold text-gray-500">Last Simulation Date</h4>
                <p className="font-display font-black text-lg text-brand-dark mt-1">
                  {new Date(sovHistory.history[0]?.createdAt).toLocaleDateString()}
                </p>
                <p className="font-mono text-[9px] text-gray-400 mt-2.5">Category: {sovHistory.history[0]?.category}</p>
              </div>
            </div>

            {/* Queries Detail Accordion */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase font-bold border-b border-brand-dark/10 pb-1">Query Simulation Results</h4>
              <div className="divide-y-[2px] divide-brand-dark/10 border-[2px] border-brand-dark bg-white max-h-[300px] overflow-y-auto">
                {sovHistory.history.slice(0, 10).map((q: any, i: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any -- history items mapping
                  const targetRank = q.rankings.find((r: any) => r.asin === "target_product"); // eslint-disable-line @typescript-eslint/no-explicit-any -- target rankings filter
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
            <button 
              onClick={triggerSOVSimulation}
              className="mt-4 brutalist-btn-secondary text-xs uppercase"
              disabled={simulating}
            >
              Run Initial SOV Run
            </button>
          </div>
        )}
      </div>

      {/* COSMO Catalog Graph Visualization */}
      <div className="brutalist-card bg-white space-y-4">
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
            <button 
              onClick={() => refetchGraph()}
              className="mt-4 brutalist-btn-secondary text-xs uppercase"
            >
              Calculate Catalog Connections
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   PIPELINE STATUS PANEL
   ========================================================================= */
function PipelineStatusPanel({ prospectId }: { prospectId: number }) {
  const { job, isLoading, isConnected, error, handleRetry } = usePipeline({ prospectId, enableSse: false });

  if (isLoading && !job) {
    return (
      <div className="border-[2px] border-dashed border-brand-dark/20 p-4 bg-brand-bg/20">
        <p className="font-mono text-[10px] text-gray-400 uppercase">Loading pipeline status...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="border-[2px] border-dashed border-brand-dark/20 p-4 bg-brand-bg/20">
        <p className="font-mono text-[10px] text-gray-400 uppercase">No pipeline jobs found for this prospect.</p>
      </div>
    );
  }

  const stageNames = ["fetch", "preprocess", "embedding", "semantic", "optimize", "competitor"];
  const stageLabels: Record<string, string> = {
    fetch: "Data Fetch",
    preprocess: "Preprocess",
    embedding: "Embedding",
    semantic: "Semantic Analysis",
    optimize: "Content Optimization",
    competitor: "Competitor Analysis",
  };

  return (
    <div className="border-[2px] border-brand-dark bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
          <Cpu size={12} /> Pipeline Job #{job.id}
        </h4>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-[9px] px-2 py-0.5 uppercase font-bold ${
            job.status === "completed" ? "bg-green-100 text-green-700" :
            job.status === "failed" ? "bg-red-100 text-red-700" :
            job.status === "running" ? "bg-blue-100 text-blue-700" :
            "bg-yellow-100 text-yellow-700"
          }`}>
            {job.status}
          </span>
          {isConnected && (
            <span className="font-mono text-[9px] text-green-600 uppercase">● Live</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {stageNames.map((stage, idx) => {
          const stageState = job.stages[stage];
          const isCompleted = stageState?.status === "completed";
          const isFailed = stageState?.status === "failed";
          const isRunning = stageState?.status === "running";

          return (
            <div key={stage} className="flex items-center gap-1 flex-1">
              <div
                className={`h-2 flex-1 rounded-none ${
                  isCompleted ? "bg-green-500" :
                  isFailed ? "bg-red-500" :
                  isRunning ? "bg-blue-500 animate-pulse" :
                  "bg-gray-200"
                }`}
                title={stageLabels[stage]}
              />
              {idx < stageNames.length - 1 && (
                <div className="w-1 h-[2px] bg-brand-dark/20" />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {stageNames.map((stage) => {
          const stageState = job.stages[stage];
          if (!stageState || stageState.status === "pending") return null;
          return (
            <div key={stage} className="flex items-center justify-between border border-brand-dark/10 p-1.5">
              <span className="font-mono text-[9px] uppercase text-gray-600">{stageLabels[stage]}</span>
              {stageState.status === "completed" ? (
                <CheckCircle size={10} className="text-green-600" />
              ) : stageState.status === "failed" ? (
                <button
                  onClick={() => handleRetry(stage)}
                  className="flex items-center gap-1 text-[9px] font-mono text-red-600 hover:underline"
                >
                  <RefreshCw size={8} /> Retry
                </button>
              ) : (
                <RefreshCw size={10} className="text-blue-600 animate-spin" />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 font-mono text-[10px] bg-red-50 border border-red-200 p-2">
          <AlertTriangle size={12} />
          {error}
        </div>
      )}

      {job.tokenUsage > 0 && (
        <p className="font-mono text-[9px] text-gray-400 text-right">
          Token usage: {job.tokenUsage}
        </p>
      )}
    </div>
  );
}

/* =========================================================================
   COSMO CANVAS COMPONENT
   ========================================================================= */
function COSMOCanvas({ links, targetAsin }: { links: any[]; targetAsin: string }) { // eslint-disable-line @typescript-eslint/no-explicit-any -- dynamic cosmo catalog links structure
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
