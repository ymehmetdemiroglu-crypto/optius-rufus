import { useState, useMemo } from 'react';
import { Search, Copy, ExternalLink, Play, Sparkles, Send } from 'lucide-react';
import type { PipelineProspect } from '../../types/prospect';

interface ProspectPipelineProps {
  prospects: PipelineProspect[];
  onTriggerScrape: (prospect: PipelineProspect) => void;
  onAnalyze: (prospect: PipelineProspect) => void;
  onSendToApollo: (prospect: PipelineProspect) => void;
  onCopyLink: (slug: string) => void;
  onUpdateStatus?: (id: number, status: PipelineProspect['status']) => void;
}

const statusConfig: Record<
  PipelineProspect['status'],
  { label: string; className: string }
> = {
  new: { label: 'NEW', className: 'bg-white text-black border-[3px] border-black' },
  scraped: { label: 'SCRAPED', className: 'bg-brutal-blue text-white border-[3px] border-black' },
  analyzed: { label: 'ANALYZED', className: 'bg-brutal-yellow text-black border-[3px] border-black' },
  emailed: { label: 'EMAILED', className: 'bg-black text-white border-[3px] border-black' },
  visited: { label: 'VISITED', className: 'bg-black text-white border-[3px] border-black' },
  booked: { label: 'BOOKED', className: 'bg-brutal-red text-white border-[3px] border-black' },
};

export default function ProspectPipeline({
  prospects,
  onTriggerScrape,
  onAnalyze,
  onSendToApollo,
  onCopyLink,
  onUpdateStatus,
}: ProspectPipelineProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return prospects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.asin.toLowerCase().includes(q) ||
        (p.company && p.company.toLowerCase().includes(q))
    );
  }, [prospects, search]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2 w-full md:max-w-md border-[3px] border-black px-3 py-2 bg-white">
        <Search className="h-4 w-4 text-black shrink-0" />
        <input
          type="text"
          placeholder="SEARCH NAME, ASIN, COMPANY..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-xs w-full text-black placeholder-black/40 font-mono uppercase"
        />
      </div>

      {/* Dense Table */}
      <div className="border-[3px] border-black overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black text-white">
              <th className="font-mono text-xs uppercase tracking-widest px-3 py-2 font-bold">Name</th>
              <th className="font-mono text-xs uppercase tracking-widest px-3 py-2 font-bold">Company</th>
              <th className="font-mono text-xs uppercase tracking-widest px-3 py-2 font-bold">ASIN</th>
              <th className="font-mono text-xs uppercase tracking-widest px-3 py-2 font-bold">Score</th>
              <th className="font-mono text-xs uppercase tracking-widest px-3 py-2 font-bold">Status</th>
              <th className="font-mono text-xs uppercase tracking-widest px-3 py-2 font-bold">Quick Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center font-mono text-xs uppercase text-black/60">
                  No prospects found
                </td>
              </tr>
            ) : (
              filtered.map((prospect, idx) => (
                <tr
                  key={prospect.id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-brutal-concrete'}
                >
                  <td className="px-3 py-2 border-t-[3px] border-black">
                    <span className="text-sm font-bold text-black">{prospect.name}</span>
                  </td>
                  <td className="px-3 py-2 border-t-[3px] border-black">
                    <span className="text-sm text-black">{prospect.company ?? '—'}</span>
                  </td>
                  <td className="px-3 py-2 border-t-[3px] border-black">
                    <span className="font-mono font-bold text-xs text-black">{prospect.asin}</span>
                  </td>
                  <td className="px-3 py-2 border-t-[3px] border-black">
                    {prospect.score !== undefined ? (
                      <span className="font-mono font-bold text-xs text-black">{prospect.score}</span>
                    ) : (
                      <span className="font-mono text-xs text-black/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 border-t-[3px] border-black">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusConfig[prospect.status].className}`}
                    >
                      {statusConfig[prospect.status].label}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-t-[3px] border-black">
                    <div className="flex flex-wrap items-center gap-1">
                      {prospect.status === 'new' && (
                        <button
                          onClick={() => onTriggerScrape(prospect)}
                          className="bg-brutal-red text-white border-[2px] border-black px-2 py-1 font-bold text-[10px] uppercase hover:bg-black transition-colors inline-flex items-center gap-1"
                        >
                          <Play className="h-3 w-3" />
                          Scrape
                        </button>
                      )}

                      {prospect.status === 'scraped' && (
                        <button
                          onClick={() => onAnalyze(prospect)}
                          className="bg-brutal-blue text-white border-[2px] border-black px-2 py-1 font-bold text-[10px] uppercase hover:bg-black transition-colors inline-flex items-center gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          Analyze
                        </button>
                      )}

                      {prospect.status === 'analyzed' && (
                        <button
                          onClick={() => onSendToApollo(prospect)}
                          className="bg-brutal-yellow text-black border-[2px] border-black px-2 py-1 font-bold text-[10px] uppercase hover:bg-black hover:text-white transition-colors inline-flex items-center gap-1"
                        >
                          <Send className="h-3 w-3" />
                          Apollo
                        </button>
                      )}

                      <button
                        onClick={() => onCopyLink(prospect.slug)}
                        className="bg-white text-black border-[2px] border-black px-2 py-1 font-bold text-[10px] uppercase hover:bg-black hover:text-white transition-colors inline-flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Link
                      </button>

                      <button
                        onClick={() => window.open(`/p/${prospect.slug}`, '_blank')}
                        className="bg-white text-black border-[2px] border-black px-2 py-1 font-bold text-[10px] uppercase hover:bg-black hover:text-white transition-colors inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </button>

                      {onUpdateStatus && (
                        <select
                          value={prospect.status}
                          onChange={(e) =>
                            onUpdateStatus(prospect.id, e.target.value as PipelineProspect['status'])
                          }
                          className="bg-white text-black border-[2px] border-black px-2 py-1 font-bold text-[10px] uppercase outline-none cursor-pointer"
                        >
                          <option value="new">NEW</option>
                          <option value="scraped">SCRAPED</option>
                          <option value="analyzed">ANALYZED</option>
                          <option value="emailed">EMAILED</option>
                          <option value="visited">VISITED</option>
                          <option value="booked">BOOKED</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
