import { useState } from 'react';
import { trpc } from '../shared/providers/trpc';
import { Search, AlertTriangle, RefreshCw, CheckCircle, ArrowRight, ShieldCheck, Phone, Mail, Globe } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface PeopleSearchProps {
  onProspectImported?: () => void;
}

const SENIORITIES = [
  { value: 'owner', label: 'Owner' },
  { value: 'founder', label: 'Founder' },
  { value: 'c_suite', label: 'C-Suite' },
  { value: 'partner', label: 'Partner' },
  { value: 'vp', label: 'VP' },
  { value: 'head', label: 'Head' },
  { value: 'director', label: 'Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'senior', label: 'Senior IC' },
  { value: 'entry', label: 'Entry Level' },
];

export default function PeopleSearch({ onProspectImported }: PeopleSearchProps) {
  // Search parameters
  const [keywords, setKeywords] = useState('');
  const [titles, setTitles] = useState('');
  const [locations, setLocations] = useState('');
  const [domains, setDomains] = useState('');
  const [selectedSeniorities, setSelectedSeniorities] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 10;

  // UI state
  const [searchParams, setSearchParams] = useState({
    q_keywords: '',
    person_titles: [] as string[],
    person_locations: [] as string[],
    q_organization_domains_list: [] as string[],
    person_seniorities: [] as string[],
    page: 1,
    per_page: perPage,
  });

  // Selected person for import
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [importAsin, setImportAsin] = useState('');
  const [importMarketplace, setImportMarketplace] = useState('US');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStage, setImportStage] = useState<0 | 1 | 2 | 3 | 4>(0); // 0: Idle, 1: Enriching, 2: Ingesting/Scraping, 3: Analyzing, 4: Complete
  const [importError, setImportError] = useState<string | null>(null);
  const [importedProspectSlug, setImportedProspectSlug] = useState<string | null>(null);

  // Queries & Mutations
  const { data, isLoading, isError, error } = trpc.apollo.searchPeople.useQuery(searchParams, {
    placeholderData: (prev) => prev,
  });

  const enrichAndImport = trpc.apollo.enrichAndImport.useMutation();
  const triggerScraper = trpc.scraper.trigger.useMutation();
  const runAnalysis = trpc.analysis.run.useMutation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({
      q_keywords: keywords.trim(),
      person_titles: titles ? titles.split(',').map(t => t.trim()).filter(Boolean) : [],
      person_locations: locations ? locations.split(',').map(l => l.trim()).filter(Boolean) : [],
      q_organization_domains_list: domains ? domains.split(',').map(d => d.trim()).filter(Boolean) : [],
      person_seniorities: selectedSeniorities,
      page: 1,
      per_page: perPage,
    });
  };

  const handleSeniorityToggle = (val: string) => {
    setSelectedSeniorities(prev => 
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSearchParams(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  const openImportModal = (person: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setSelectedPerson(person);
    setImportAsin('');
    setImportMarketplace('US');
    setImportStage(0);
    setImportError(null);
    setImportedProspectSlug(null);
    setIsImportModalOpen(true);
  };

  const handleTriggerImport = async () => {
    if (!selectedPerson) return;
    if (importAsin && !/^[A-Z0-9]{10}$/.test(importAsin.toUpperCase())) {
      alert("Please enter a valid 10-character Amazon ASIN!");
      return;
    }

    setImportError(null);
    try {
      // Step 1: Enrich Profile & Local Ingestion
      setImportStage(1);
      const importResult = await enrichAndImport.mutateAsync({
        personId: selectedPerson.id,
        asin: importAsin ? importAsin.toUpperCase() : undefined,
        marketplace: importMarketplace,
      });

      setImportedProspectSlug(importResult.slug);

      // Step 2: Scrape ASIN details if provided
      if (importAsin) {
        setImportStage(2);
        const scrapeResult = await triggerScraper.mutateAsync({
          prospectId: importResult.prospectId,
          asin: importAsin.toUpperCase(),
          marketplace: importMarketplace,
        });

        if (!scrapeResult?.listing) {
          throw new Error("Local prospect created, but Amazon scraping failed.");
        }

        // Step 3: Run diagnostic analysis
        setImportStage(3);
        await runAnalysis.mutateAsync({
          listingId: scrapeResult.listing.id,
        });
      }

      // Step 4: Completed
      setImportStage(4);
      if (onProspectImported) {
        onProspectImported();
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
      setImportError(err.message || "An unexpected error occurred during import.");
      setImportStage(0);
    }
  };

  const totalPages = Math.ceil((data?.total_entries || 0) / perPage);

  return (
    <div className="space-y-8">
      {/* Search Filter Header Card */}
      <form onSubmit={handleSearch} className="brutalist-card bg-white space-y-6">
        <div className="border-b-[2px] border-brand-dark pb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-wider flex items-center gap-2">
              <Search size={22} className="text-brand-gold" /> Search Net New Prospects
            </h2>
            <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mt-1">
              Search Apollo's 230M+ database instantly. Optimized query, zero credit consumption.
            </p>
          </div>
          <Badge className="bg-brand-gold/10 text-brand-gold border-brand-gold">Master API Key Access</Badge>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase font-bold text-gray-500">Keywords</label>
            <Input 
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. AI Consultant"
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase font-bold text-gray-500">Job Titles (comma-separated)</label>
            <Input 
              type="text"
              value={titles}
              onChange={(e) => setTitles(e.target.value)}
              placeholder="e.g. VP Sales, Founder"
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase font-bold text-gray-500">Locations (comma-separated)</label>
            <Input 
              type="text"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              placeholder="e.g. California, London"
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase font-bold text-gray-500">Domains (comma-separated)</label>
            <Input 
              type="text"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              placeholder="e.g. apple.com, google.com"
            />
          </div>
        </div>

        {/* Seniority Row */}
        <div className="space-y-2">
          <span className="font-mono text-[10px] uppercase font-bold text-gray-500 block">Seniority Levels</span>
          <div className="flex flex-wrap gap-2">
            {SENIORITIES.map((s) => {
              const active = selectedSeniorities.includes(s.value);
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => handleSeniorityToggle(s.value)}
                  className={`px-3 py-1.5 border-[2px] border-brand-dark font-mono text-[10px] uppercase font-bold transition-all shadow-brutal-sm ${
                    active 
                      ? 'bg-brand-gold text-brand-dark -translate-x-[1px] -translate-y-[1px] shadow-[2px_2px_0px_#1a1a1a]' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <Button type="submit" variant="primary" className="w-full">
          <Search size={18} /> Query Prospects Database
        </Button>
      </form>

      {/* Results Section */}
      <div className="brutalist-card bg-white space-y-6">
        <div className="border-b-[2px] border-brand-dark pb-3 flex items-center justify-between">
          <h3 className="font-display font-black text-lg uppercase tracking-wider">
            Matching People ({data?.total_entries ?? 0})
          </h3>
          <p className="font-mono text-[10px] text-gray-500">PAGE {page} OF {totalPages || 1}</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 space-y-4">
            <RefreshCw size={40} className="animate-spin text-brand-gold" />
            <span className="font-mono text-xs uppercase tracking-wider">Querying Apollo Database...</span>
          </div>
        ) : isError ? (
          <div className="p-6 border-[3px] border-brutal-red bg-brutal-red/10 text-brand-dark space-y-2">
            <h4 className="font-display font-black uppercase text-lg flex items-center gap-2 text-brutal-red">
              <AlertTriangle size={20} /> API Query Failure
            </h4>
            <p className="font-mono text-xs">{error?.message || "Verify your APOLLO_API_KEY environment variable."}</p>
          </div>
        ) : !data || data.people.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 space-y-2">
            <Globe size={48} className="text-gray-300 mb-2" />
            <h4 className="font-display font-black uppercase text-lg">No Results Found</h4>
            <p className="font-mono text-xs max-w-md">Try expanding your search criteria or removing filters to discover net-new people.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto border-[3px] border-brand-dark">
              <table className="brutalist-table w-full">
                <thead>
                  <tr>
                    <th>Prospect Name</th>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Availability</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.people.map((person) => (
                    <tr key={person.id} className="hover:bg-brand-gold/5 transition-colors">
                      <td className="font-mono text-xs font-bold text-brand-dark">
                        {person.first_name} {person.last_name_obfuscated}
                      </td>
                      <td className="text-xs font-medium text-gray-700">
                        {person.title || <span className="text-gray-400 italic">Not Specified</span>}
                      </td>
                      <td className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                        {person.organization.name}
                      </td>
                      <td className="text-xs text-gray-600">
                        {person.has_city || person.has_state || person.has_country ? (
                          <span>Location available</span>
                        ) : (
                          <span className="text-gray-400 italic">Unknown</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-tight font-bold">
                            <Mail size={12} className={person.has_email ? "text-green-600" : "text-gray-400"} />
                            {person.has_email ? "Email" : "No Email"}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-tight font-bold">
                            <Phone size={12} className={person.has_direct_phone === 'Yes' ? "text-green-600" : "text-gray-400"} />
                            {person.has_direct_phone === 'Yes' ? "Phone" : "No Phone"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => openImportModal(person)}
                          className="px-3 py-1.5 bg-brand-gold text-brand-dark border-[2px] border-brand-dark font-display font-black text-xs uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1a1a1a] shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                        >
                          Import & Audit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between font-mono text-xs pt-4">
                <button
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="px-4 py-2 border-[3px] border-brand-dark uppercase font-bold shadow-brutal-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] transition-all"
                >
                  PREV PAGE
                </button>
                <span className="font-bold">PAGE {page} OF {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="px-4 py-2 border-[3px] border-brand-dark uppercase font-bold shadow-brutal-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] transition-all"
                >
                  NEXT PAGE
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import Modal */}
      {isImportModalOpen && selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/65 backdrop-blur-sm p-4">
          <div className="brutalist-card bg-white max-w-lg w-full space-y-6 relative border-[4px] shadow-brutal-lg animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="border-b-[3px] border-brand-dark pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display font-black text-xl uppercase tracking-wider">Import New Client Prospect</h3>
                <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mt-1">Apollo Ingestion & Audit Pipeline</p>
              </div>
              <button 
                onClick={() => {
                  if (importStage === 0 || importStage === 4) setIsImportModalOpen(false);
                }}
                disabled={importStage > 0 && importStage < 4}
                className="h-8 w-8 border-[2px] border-brand-dark flex items-center justify-center font-mono font-bold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                X
              </button>
            </div>

            {/* Inactive setup mode */}
            {importStage === 0 && (
              <div className="space-y-5">
                <div className="bg-[#fafafa] border-[2px] border-brand-dark p-4 font-mono text-xs space-y-2">
                  <div className="flex justify-between border-b border-brand-dark/10 pb-1.5">
                    <span className="font-bold text-gray-500 uppercase">PROSPECT NAME:</span>
                    <span className="font-black text-brand-dark">{selectedPerson.first_name} {selectedPerson.last_name_obfuscated}</span>
                  </div>
                  <div className="flex justify-between border-b border-brand-dark/10 pb-1.5">
                    <span className="font-bold text-gray-500 uppercase">JOB TITLE:</span>
                    <span className="font-bold text-brand-dark truncate max-w-[250px]">{selectedPerson.title || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between border-b border-brand-dark/10 pb-1.5">
                    <span className="font-bold text-gray-500 uppercase">COMPANY:</span>
                    <span className="font-black text-brand-dark">{selectedPerson.organization.name}</span>
                  </div>
                </div>

                {/* Optional ASIN Input */}
                <div className="space-y-3 p-4 border-[2px] border-brand-dark bg-brand-gold/5">
                  <h4 className="font-display font-black uppercase text-xs tracking-wider flex items-center gap-1.5 text-brand-dark">
                    <ShieldCheck size={16} /> Link Amazon Listing Audit (Optional)
                  </h4>
                  <p className="font-mono text-[10px] text-gray-500 leading-relaxed">
                    Provide an Amazon ASIN below. Ingesting will automatically scrape listing details, build Cosmo graph visualizers, and execute Rufus SEO scoring.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-mono text-[9px] uppercase font-bold text-gray-500">Amazon ASIN</label>
                      <Input 
                        type="text" 
                        value={importAsin}
                        onChange={(e) => setImportAsin(e.target.value)}
                        className="uppercase font-mono text-xs" 
                        placeholder="B0XXXXXX"
                        maxLength={10}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[9px] uppercase font-bold text-gray-500">Marketplace</label>
                      <select 
                        value={importMarketplace} 
                        onChange={(e) => setImportMarketplace(e.target.value)}
                        className="brutalist-input h-[42px] bg-white cursor-pointer text-xs"
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
                </div>

                {/* Credits Warning box */}
                <div className="border-[2px] border-brand-gold bg-brand-gold/5 p-4 flex gap-3 text-brand-dark select-none">
                  <AlertTriangle size={24} className="text-brand-gold shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-mono text-[10px] uppercase font-black tracking-wide">Apollo Credit Consumption Warning</h5>
                    <p className="font-mono text-[9px] text-gray-600 mt-1 leading-normal">
                      Search query is free. Proceeding with import will enrich this contact to fetch their verified email and phone number, which consumes **1 Apollo Enrichment credit**.
                    </p>
                  </div>
                </div>

                {importError && (
                  <div className="border-[2px] border-brutal-red bg-brutal-red/5 p-3 font-mono text-[10px] text-brutal-red">
                    <strong>Error:</strong> {importError}
                  </div>
                )}

                {/* Confirm actions */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsImportModalOpen(false)}
                    className="flex-1 py-3 border-[3px] border-brand-dark font-display font-black text-sm uppercase tracking-wider shadow-brutal-sm bg-white hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTriggerImport}
                    className="flex-1 py-3 bg-brand-gold text-brand-dark border-[3px] border-brand-dark font-display font-black text-sm uppercase tracking-wider shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1a1a1a] transition-all cursor-pointer"
                  >
                    Confirm Import
                  </button>
                </div>
              </div>
            )}

            {/* Active import processing state */}
            {importStage > 0 && (
              <div className="space-y-6">
                <div className="space-y-4 font-mono text-xs">
                  {/* Step 1 */}
                  <div className="flex items-center justify-between border-b border-brand-dark/5 pb-2">
                    <span className="flex items-center gap-2">
                      <span className={`h-5 w-5 flex items-center justify-center border font-bold text-[10px] ${
                        importStage > 1 ? 'bg-brand-dark text-white border-brand-dark' : 'border-brand-dark'
                      }`}>1</span>
                      Enriching Apollo Profile
                    </span>
                    {importStage === 1 ? (
                      <RefreshCw size={14} className="animate-spin text-brand-gold" />
                    ) : importStage > 1 ? (
                      <CheckCircle size={16} className="text-green-600 font-bold" />
                    ) : (
                      <span className="text-gray-300">Pending</span>
                    )}
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-center justify-between border-b border-brand-dark/5 pb-2">
                    <span className="flex items-center gap-2">
                      <span className={`h-5 w-5 flex items-center justify-center border font-bold text-[10px] ${
                        importStage > 2 ? 'bg-brand-dark text-white border-brand-dark' : 'border-brand-dark'
                      }`}>2</span>
                      Creating Local Prospect Record
                    </span>
                    {importStage === 2 ? (
                      <RefreshCw size={14} className="animate-spin text-brand-gold" />
                    ) : importStage > 2 ? (
                      <CheckCircle size={16} className="text-green-600 font-bold" />
                    ) : (
                      <span className="text-gray-300">Pending</span>
                    )}
                  </div>

                  {/* Step 3 (Only visible if ASIN entered) */}
                  {importAsin && (
                    <>
                      <div className="flex items-center justify-between border-b border-brand-dark/5 pb-2">
                        <span className="flex items-center gap-2">
                          <span className={`h-5 w-5 flex items-center justify-center border font-bold text-[10px] ${
                            importStage > 3 ? 'bg-brand-dark text-white border-brand-dark' : 'border-brand-dark'
                          }`}>3</span>
                          Scraping Amazon Listing ({importAsin.toUpperCase()})
                        </span>
                        {importStage === 3 ? (
                          <RefreshCw size={14} className="animate-spin text-brand-gold" />
                        ) : importStage > 3 ? (
                          <CheckCircle size={16} className="text-green-600 font-bold" />
                        ) : (
                          <span className="text-gray-300">Pending</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-b border-brand-dark/5 pb-2">
                        <span className="flex items-center gap-2">
                          <span className={`h-5 w-5 flex items-center justify-center border font-bold text-[10px] ${
                            importStage > 4 ? 'bg-brand-dark text-white border-brand-dark' : 'border-brand-dark'
                          }`}>4</span>
                          Running Cosmo & Rufus Audits
                        </span>
                        {importStage === 4 ? (
                          <CheckCircle size={16} className="text-green-600 font-bold" />
                        ) : (
                          <span className="text-gray-300">Pending</span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Complete stage */}
                  {importStage === 4 && (
                    <div className="bg-green-50 border-[2px] border-green-600 p-4 space-y-2 mt-6">
                      <h4 className="font-display font-black uppercase text-green-700 text-sm flex items-center gap-1.5">
                        <CheckCircle size={18} /> Ingestion Success
                      </h4>
                      <p className="font-mono text-[10px] text-green-800 leading-normal">
                        Prospect successfully added, enriched via Apollo, and auto-enrolled in expected outreach campaign. 
                        {importAsin ? " Amazon scraper & Rufus SEO reports are compiled." : ""}
                      </p>
                    </div>
                  )}
                </div>

                {importStage === 4 && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsImportModalOpen(false)}
                      className="flex-1 py-3 border-[3px] border-brand-dark font-display font-black text-sm uppercase tracking-wider shadow-brutal-sm bg-white hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      Close Modal
                    </button>
                    {importedProspectSlug && (
                      <a
                        href={`/p/${importedProspectSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-3 bg-brand-gold text-brand-dark border-[3px] border-brand-dark font-display font-black text-sm uppercase tracking-wider text-center shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#1a1a1a] transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                      >
                        View Landing Page <ArrowRight size={16} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
