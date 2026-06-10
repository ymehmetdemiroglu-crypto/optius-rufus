import { useState } from 'react';
import { trpc } from '../shared/providers/trpc';
import { FolderOpen, Palette } from 'lucide-react';
import AuditLaunchBox from '../admin/AuditLaunchBox';
import ClientDirectory from '../admin/ClientDirectory';
import ProspectDetailPanel from '../admin/ProspectDetailPanel';
import BrandingPanel from '../admin/BrandingPanel';

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
              <ClientDirectory
                prospects={prospectsData?.items || []}
                selectedProspectId={selectedProspectId}
                onSelectProspect={setSelectedProspectId}
              />
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
          <BrandingPanel
            brandData={brandData}
            onSave={(data) => updateBranding.mutate(data)}
          />
        )}
      </main>
    </div>
  );
}
