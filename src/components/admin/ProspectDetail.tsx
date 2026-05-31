import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { trpc } from '../../providers/trpc';
import {
  User,
  Mail,
  Building2,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { mapBackendToProspectData } from '../../lib/prospectMapper';

const tabs = ['Overview', 'Listing', 'Analysis', 'Preview', 'Bookings'] as const;
type Tab = (typeof tabs)[number];

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  new: { label: 'NEW', className: 'bg-white text-black border-[3px] border-black' },
  scraped: { label: 'SCRAPED', className: 'bg-brutal-blue text-white border-[3px] border-black' },
  analyzed: { label: 'ANALYZED', className: 'bg-brutal-yellow text-black border-[3px] border-black' },
  emailed: { label: 'EMAILED', className: 'bg-black text-white border-[3px] border-black' },
  visited: { label: 'VISITED', className: 'bg-black text-white border-[3px] border-black' },
  booked: { label: 'BOOKED', className: 'bg-brutal-red text-white border-[3px] border-black' },
};

export default function ProspectDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const numericId = id ? parseInt(id, 10) : NaN;

  const { data, isLoading } = trpc.prospects?.getById?.useQuery(
    { id: numericId },
    { enabled: !isNaN(numericId) && numericId > 0 }
  ) ?? { data: null, isLoading: false };

  if (isLoading) {
    return (
      <div className="bg-white text-black min-h-full space-y-6 p-6">
        <div className="h-10 w-48 bg-brutal-concrete border-[3px] border-black animate-pulse" />
        <div className="h-96 bg-brutal-concrete border-[3px] border-black animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white text-black border-[3px] border-black p-10 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-brutal-red mb-3" />
        <h3 className="font-sans font-black text-base uppercase">Prospect Not Found</h3>
        <p className="font-mono text-xs uppercase tracking-widest text-black/60 mt-1">
          The requested prospect does not exist.
        </p>
      </div>
    );
  }

  const prospect = mapBackendToProspectData(data);
  const listing = prospect.listing;
  const scores = prospect.scores;
  const bookings = (data.bookings as Array<Record<string, unknown>>) || [];

  const statusTimeline = [
    { label: 'Created', done: true, date: prospect.createdAt },
    { label: 'Scraped', done: prospect.status !== 'new', date: null },
    { label: 'Analyzed', done: ['analyzed', 'emailed', 'visited', 'booked'].includes(prospect.status), date: null },
    { label: 'Emailed', done: ['emailed', 'visited', 'booked'].includes(prospect.status), date: null },
    { label: 'Visited', done: ['visited', 'booked'].includes(prospect.status), date: null },
    { label: 'Booked', done: prospect.status === 'booked', date: null },
  ];

  return (
    <div className="bg-white text-black min-h-full space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => window.history.back()}
          className="mt-1 p-2 border-[3px] border-black bg-white text-black hover:bg-black hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="space-y-2">
          <h1 className="font-sans font-black text-3xl md:text-4xl uppercase tracking-tight">
            {prospect.name}
          </h1>
          <p className="font-mono text-xs uppercase tracking-widest text-black/60">
            {prospect.email ?? 'NO EMAIL'}
          </p>
          <div className="pt-1">
            <span
              className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                statusConfig[prospect.status]?.className ?? statusConfig.new.className
              }`}
            >
              {statusConfig[prospect.status]?.label ?? prospect.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b-[3px] border-black overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs uppercase font-bold tracking-widest px-4 py-2 shrink-0 border-b-[3px] transition-colors ${
              activeTab === tab
                ? 'border-black text-black'
                : 'border-transparent text-black/40 hover:text-black'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="border-[3px] border-black p-4 md:p-6 min-h-[400px]">
        {activeTab === 'Overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 border-[3px] border-black bg-white">
                <User className="h-5 w-5 text-black shrink-0" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-black/60">Name</p>
                  <p className="text-sm font-bold text-black">{prospect.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border-[3px] border-black bg-white">
                <Mail className="h-5 w-5 text-black shrink-0" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-black/60">Email</p>
                  <p className="text-sm font-bold text-black">{prospect.email ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border-[3px] border-black bg-white">
                <Building2 className="h-5 w-5 text-black shrink-0" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-black/60">Company</p>
                  <p className="text-sm font-bold text-black">{prospect.company ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border-[3px] border-black bg-white">
                <Calendar className="h-5 w-5 text-black shrink-0" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-black/60">Created</p>
                  <p className="text-sm font-bold text-black">
                    {prospect.createdAt
                      ? new Date(prospect.createdAt).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border-[3px] border-black bg-white">
                <Eye className="h-5 w-5 text-black shrink-0" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-black/60">Views</p>
                  <p className="text-sm font-bold text-black">{prospect.views ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border-[3px] border-black bg-white">
                <CheckCircle2 className="h-5 w-5 text-black shrink-0" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-black/60">Apollo Status</p>
                  <p className="text-sm font-bold text-black">
                    {prospect.status === 'emailed' || prospect.status === 'visited' || prospect.status === 'booked'
                      ? 'Enrolled'
                      : 'Not Sent'}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Timeline — vertical line with dots */}
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-black mb-4">
                Status Timeline
              </h3>
              <div className="relative pl-4">
                <div className="absolute left-[7px] top-1 bottom-1 w-[3px] bg-black" />
                <div className="space-y-4">
                  {statusTimeline.map((step, i) => (
                    <div key={i} className="flex items-center gap-3 relative">
                      <div
                        className={`w-4 h-4 shrink-0 border-[3px] border-black ${
                          step.done ? 'bg-brutal-blue' : 'bg-white'
                        }`}
                      />
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          step.done ? 'text-black' : 'text-black/40'
                        }`}
                      >
                        {step.label}
                      </span>
                      {step.date && (
                        <span className="font-mono text-[10px] text-black/60 ml-auto">
                          {new Date(step.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Listing' && (
          <div className="space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-black">Listing Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border-[3px] border-black bg-white">
                <p className="font-mono text-[10px] uppercase tracking-widest text-black/60 mb-1">ASIN</p>
                <p className="text-sm font-mono font-bold text-black">{listing.asin ?? '—'}</p>
              </div>
              <div className="p-3 border-[3px] border-black bg-white">
                <p className="font-mono text-[10px] uppercase tracking-widest text-black/60 mb-1">Brand</p>
                <p className="text-sm font-bold text-black">{listing.brand ?? '—'}</p>
              </div>
              <div className="p-3 border-[3px] border-black bg-white md:col-span-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-black/60 mb-1">Title</p>
                <p className="text-sm font-bold text-black">{listing.title ?? '—'}</p>
              </div>
              <div className="p-3 border-[3px] border-black bg-white">
                <p className="font-mono text-[10px] uppercase tracking-widest text-black/60 mb-1">Category</p>
                <p className="text-sm font-bold text-black">{listing.category ?? '—'}</p>
              </div>
              <div className="p-3 border-[3px] border-black bg-white">
                <p className="font-mono text-[10px] uppercase tracking-widest text-black/60 mb-1">Price</p>
                <p className="text-sm font-mono font-bold text-black">
                  {listing.price !== undefined ? `$${listing.price.toFixed(2)}` : '—'}
                </p>
              </div>
              <div className="p-3 border-[3px] border-black bg-white">
                <p className="font-mono text-[10px] uppercase tracking-widest text-black/60 mb-1">Rating</p>
                <p className="text-sm font-mono font-bold text-black">
                  {listing.rating !== undefined ? listing.rating.toFixed(1) : '—'}
                  <span className="text-xs text-black/60 ml-2">
                    ({listing.reviewCount?.toLocaleString() ?? 0})
                  </span>
                </p>
              </div>
              <div className="p-3 border-[3px] border-black bg-white">
                <p className="font-mono text-[10px] uppercase tracking-widest text-black/60 mb-1">Review Count</p>
                <p className="text-sm font-mono font-bold text-black">
                  {listing.reviewCount?.toLocaleString() ?? '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Analysis' && (
          <div className="space-y-6">
            <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-black">Analysis Report</h3>
            {scores ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Overall', value: scores.overallScore },
                  { label: 'Rufus', value: scores.rufusScore },
                  { label: 'Cosmo', value: scores.cosmoScore },
                  { label: 'Semantic', value: scores.semanticScore },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="p-5 border-[3px] border-black bg-white text-center"
                  >
                    <p className="text-4xl font-black font-sans text-black">{s.value ?? 0}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-black/60 mt-1">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-black/60">No analysis data available.</p>
            )}

            {prospect.topIssues && prospect.topIssues.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-widest font-bold text-black">
                  Top Issues
                </h4>
                <div className="border-[3px] border-black">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black text-white">
                        <th className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 font-bold">Severity</th>
                        <th className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 font-bold">Issue</th>
                        <th className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 font-bold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prospect.topIssues.map((issue, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-brutal-concrete'}>
                          <td className="px-3 py-2 border-t-[3px] border-black">
                            <span
                              className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border-[2px] border-black ${
                                issue.severity === 'critical'
                                  ? 'bg-brutal-red text-white'
                                  : 'bg-brutal-yellow text-black'
                              }`}
                            >
                              {issue.severity}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-t-[3px] border-black text-sm font-bold text-black">
                            {issue.title}
                          </td>
                          <td className="px-3 py-2 border-t-[3px] border-black text-xs text-black/80">
                            {issue.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {prospect.narrative && (
              <div className="space-y-2">
                <h4 className="font-mono text-xs uppercase tracking-widest font-bold text-black">Narrative</h4>
                <div className="border-[3px] border-black p-4 bg-brutal-concrete">
                  <p className="text-sm text-black leading-relaxed">{prospect.narrative}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-black">
                Landing Page Preview
              </h3>
              <a
                href={`/p/${prospect.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold uppercase text-brutal-blue hover:underline"
              >
                Open in new tab →
              </a>
            </div>
            <div className="w-full h-[600px] border-[3px] border-black overflow-hidden bg-white">
              <iframe
                src={`/p/${prospect.slug}`}
                title="Landing Page Preview"
                className="w-full h-full"
                style={{ background: '#FFFFFF' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'Bookings' && (
          <div className="space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-black">Bookings</h3>
            {bookings.length === 0 ? (
              <p className="text-sm text-black/60">No bookings yet.</p>
            ) : (
              <div className="border-[3px] border-black overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black text-white">
                      <th className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 font-bold">Name</th>
                      <th className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 font-bold">Email</th>
                      <th className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 font-bold">Company</th>
                      <th className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 font-bold">Revenue</th>
                      <th className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 font-bold">Date</th>
                      <th className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-brutal-concrete'}>
                        <td className="px-3 py-2 border-t-[3px] border-black text-sm font-bold text-black">
                          {b.name as string}
                        </td>
                        <td className="px-3 py-2 border-t-[3px] border-black text-sm text-black">
                          {b.email as string}
                        </td>
                        <td className="px-3 py-2 border-t-[3px] border-black text-sm text-black">
                          {(b.company as string) ?? '—'}
                        </td>
                        <td className="px-3 py-2 border-t-[3px] border-black text-sm font-mono font-bold text-black">
                          {(b.revenue as string) ?? '—'}
                        </td>
                        <td className="px-3 py-2 border-t-[3px] border-black text-sm font-mono text-black">
                          {b.createdAt ? new Date(b.createdAt as string).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-3 py-2 border-t-[3px] border-black">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white text-black border-[2px] border-black">
                            {(b.status as string) ?? 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
