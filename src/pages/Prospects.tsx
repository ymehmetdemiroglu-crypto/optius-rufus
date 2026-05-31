import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { trpc } from '../providers/trpc';
import ProspectPipeline from '../components/admin/ProspectPipeline';
import TriggerScrapeModal from '../components/admin/TriggerScrapeModal';
import type { PipelineProspect } from '../types/prospect';

function mapToPipelineProspect(prospect: Record<string, unknown>): PipelineProspect {
  const firstName = (prospect.firstName as string) || '';
  const lastName = (prospect.lastName as string) || '';
  return {
    id: typeof prospect.id === 'number' ? prospect.id : parseInt(prospect.id as string, 10),
    name: [firstName, lastName].filter(Boolean).join(' ') || ((prospect.email as string) ?? 'Unknown'),
    company: (prospect.company as string) || undefined,
    asin: (prospect.asin as string) || '—',
    status: (prospect.status as PipelineProspect['status']) || 'new',
    slug: (prospect.slug as string) || '',
  };
}

export default function Prospects() {
  const [scrapeTarget, setScrapeTarget] = useState<PipelineProspect | null>(null);
  const [scrapeModalOpen, setScrapeModalOpen] = useState(false);

  const { data, isLoading, refetch } = trpc.prospects?.list?.useQuery({ limit: 100 });

  const analyzeMutation = trpc.analysis?.runByProspect?.useMutation({
    onSuccess: () => refetch(),
  });

  const apolloMutation = trpc.apollo?.createContact?.useMutation({
    onSuccess: () => refetch(),
  });

  const updateStatusMutation = trpc.prospects?.updateStatus?.useMutation({
    onSuccess: () => refetch(),
  });

  const prospects = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((p: unknown) => mapToPipelineProspect(p as Record<string, unknown>));
  }, [data]);

  const handleTriggerScrape = (prospect: PipelineProspect) => {
    setScrapeTarget(prospect);
    setScrapeModalOpen(true);
  };

  const handleAnalyze = (prospect: PipelineProspect) => {
    analyzeMutation?.mutate({ prospectId: prospect.id });
  };

  const handleSendToApollo = (prospect: PipelineProspect) => {
    apolloMutation?.mutate({ prospectId: prospect.id });
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
  };

  if (isLoading) {
    return (
      <div className="bg-white text-black min-h-full space-y-6 p-6">
        <div className="h-10 w-64 bg-brutal-concrete border-[3px] border-black animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-brutal-concrete border-[3px] border-black animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-black min-h-full space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-sans font-black text-3xl md:text-4xl uppercase tracking-tight">
          PROSPECT OPS
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-black/60">
          Manage outreach pipeline: scrape, analyze, and sequence prospects
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button className="bg-brutal-blue text-white border-[3px] border-black px-4 py-2 font-bold text-sm uppercase hover:bg-black transition-colors inline-flex items-center gap-2 w-fit">
          <Plus className="h-4 w-4" />
          + NEW PROSPECT
        </button>
      </div>

      <ProspectPipeline
        prospects={prospects}
        onTriggerScrape={handleTriggerScrape}
        onAnalyze={handleAnalyze}
        onSendToApollo={handleSendToApollo}
        onCopyLink={handleCopyLink}
        onUpdateStatus={(id, status) => updateStatusMutation?.mutate({ id, status })}
      />

      <TriggerScrapeModal
        isOpen={scrapeModalOpen}
        onClose={() => {
          setScrapeModalOpen(false);
          setScrapeTarget(null);
          refetch();
        }}
        prospect={scrapeTarget}
      />
    </div>
  );
}
