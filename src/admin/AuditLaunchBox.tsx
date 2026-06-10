import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { trpc } from '../shared/providers/trpc';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface AuditLaunchBoxProps {
  onAuditLaunched: () => void;
}

export default function AuditLaunchBox({ onAuditLaunched }: AuditLaunchBoxProps) {
  const [asin, setAsin] = useState("");
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [marketplace, setMarketplace] = useState("US");
  const [loading, setLoading] = useState(false);

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
      const prospect = await createProspect.mutateAsync({
        email: clientEmail,
        firstName: company,
        company: company,
      });

      if (!prospect) throw new Error("Failed to create prospect database record");

      const scrapeResult = await triggerScraper.mutateAsync({
        prospectId: prospect.id,
        asin: asin.toUpperCase(),
        marketplace,
      });

      if (!scrapeResult?.listing) throw new Error("Failed to scrape listing data");

      await runAnalysis.mutateAsync({
        listingId: scrapeResult.listing.id,
      });

      alert(`✅ Listing Audit successfully generated for ASIN: ${asin.toUpperCase()}!`);
      setAsin("");
      setBrandName("");
      setEmail("");
      onAuditLaunched();
    } catch (err) {
      const error = err as any; // eslint-disable-line @typescript-eslint/no-explicit-any
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
          <Input 
            type="text" 
            value={asin}
            onChange={(e) => setAsin(e.target.value)}
            className="uppercase font-mono" 
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
          <Input 
            type="text" 
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. NutraWell"
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <label className="font-mono text-[10px] uppercase font-bold text-gray-500">Client Contact Email</label>
          <Input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@brand.com"
            disabled={loading}
          />
        </div>
      </div>

      <Button 
        type="submit" 
        variant="primary"
        className="w-full mt-2"
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
      </Button>
    </form>
  );
}
