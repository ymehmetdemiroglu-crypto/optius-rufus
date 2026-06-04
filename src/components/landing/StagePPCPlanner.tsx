import { useState } from 'react';
import { Download, Target, FileSpreadsheet } from 'lucide-react';
import type { PPCKeywordItem } from '../../types/prospect';

interface StagePPCPlannerProps {
  ppcKeywords: PPCKeywordItem[];
  visible: boolean;
  onDownloadPPC?: () => void;
}

export default function StagePPCPlanner({ ppcKeywords, visible, onDownloadPPC }: StagePPCPlannerProps) {
  const [downloaded, setDownloaded] = useState(false);

  const downloadCSV = () => {
    const headers = ['Intent Category', 'Conversational Keyword', 'Difficulty', 'Monthly Search Volume', 'Est. CPC Bid ($)'];
    const escapeCSV = (val: string | number) => {
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = ppcKeywords.map(k => [
      escapeCSV(k.intent),
      escapeCSV(k.keyword),
      escapeCSV(k.difficulty),
      escapeCSV(k.searchVolume),
      escapeCSV(k.bidEstimate.toFixed(2)),
    ]);

    const csvString = [headers.map(escapeCSV).join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'rufus_conversational_ppc_plan.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onDownloadPPC?.();

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  if (!ppcKeywords || ppcKeywords.length === 0) return null;

  return (
    <section
      id="stage-ppc-planner"
      className="bg-white px-6 py-16 md:py-24 border-t-[3px] border-brand-dark"
    >
      <div className="max-w-5xl w-full mx-auto space-y-10">
        <div className="text-center space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-brand-blue font-black">
            PPC STRATEGY DELIVERABLE
          </p>
          <h2 className="display-heading text-3xl md:text-5xl text-brand-dark">
            Conversational AEO PPC Campaign Planner
          </h2>
          <p className="text-base md:text-lg text-brand-dark/70 font-medium max-w-2xl mx-auto leading-relaxed">
            Rufus places sponsored listing ads directly in chat logs. Bidding on traditional keywords is expensive; bidding on long-tail conversational user intents gets you inside Rufus recommendations at a fraction of the cost.
          </p>
        </div>

        {/* Table container */}
        <div className="border-[3px] border-brand-dark bg-brand-bg shadow-brutal overflow-hidden">
          {/* Header */}
          <div className="bg-brand-dark p-4 text-white flex items-center justify-between flex-wrap gap-4 border-b-[3px] border-brand-dark">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-brand-gold" />
              <span className="font-mono text-xs font-black uppercase tracking-wider">
                Rufus Bidding Keywords (AEO)
              </span>
            </div>
            <button
              onClick={downloadCSV}
              className="bg-brand-gold text-brand-dark font-mono text-[10px] font-black uppercase tracking-wider px-4 py-2 border-2 border-brand-dark shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer inline-flex items-center gap-1.5 transition-all"
            >
              {downloaded ? (
                <>
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Plan Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Campaign CSV</span>
                </>
              )}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-[3px] border-brand-dark font-mono text-[10px] font-black uppercase text-brand-dark/50 bg-white">
                  <th className="p-4 border-r-2 border-brand-dark">Intent Category</th>
                  <th className="p-4 border-r-2 border-brand-dark">Target Conversational Query</th>
                  <th className="p-4 border-r-2 border-brand-dark text-center">Difficulty</th>
                  <th className="p-4 border-r-2 border-brand-dark text-right">Volume</th>
                  <th className="p-4 text-right">Est. CPC Bid</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs text-brand-dark font-bold">
                {ppcKeywords.map((item, i) => (
                  <tr
                    key={i}
                    className="border-b-2 border-brand-dark/15 last:border-b-0 hover:bg-white/40 transition-colors"
                  >
                    <td className="p-4 border-r-2 border-brand-dark/15 bg-white/20">
                      {item.intent}
                    </td>
                    <td className="p-4 border-r-2 border-brand-dark/15 font-sans italic text-sm">
                      "{item.keyword}"
                    </td>
                    <td className="p-4 border-r-2 border-brand-dark/15 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 border text-[9px] font-black uppercase rounded ${
                          item.difficulty === 'Low'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : item.difficulty === 'Medium'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                            : 'bg-red-100 text-red-700 border-red-300'
                        }`}
                      >
                        {item.difficulty}
                      </span>
                    </td>
                    <td className="p-4 border-r-2 border-brand-dark/15 text-right font-black">
                      {item.searchVolume.toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-brand-blue font-black bg-white/20">
                      ${item.bidEstimate.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action guidelines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-mono">
          <div className="border-2 border-brand-dark p-4 bg-white space-y-2">
            <p className="font-black text-brand-dark uppercase border-b border-brand-dark/10 pb-1">
              🚀 Setup instructions
            </p>
            <p className="text-brand-dark/80 leading-relaxed font-bold">
              Download the CSV, import it as a **Manual targeting Exact match campaign** in Amazon Ad Console, and assign the recommended bids. Ensure these phrases are also mentioned in your listing bullets.
            </p>
          </div>
          <div className="border-2 border-brand-dark p-4 bg-white space-y-2">
            <p className="font-black text-brand-dark uppercase border-b border-brand-dark/10 pb-1">
              💡 Why this works
            </p>
            <p className="text-brand-dark/80 leading-relaxed font-bold">
              Because Rufus triggers recommendations based on conversational prompt logic, placing Exact Match bids on full questions captures Rufus's context parser, triggering your sponsored card first.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
