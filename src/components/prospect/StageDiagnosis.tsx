import type { ProspectIssue } from '../../types/prospect';

interface StageDiagnosisProps {
  topIssues: ProspectIssue[];
}

export default function StageDiagnosis({ topIssues }: StageDiagnosisProps) {
  const issues = topIssues.slice(0, 3);

  return (
    <section id="stage-diagnosis" className="bg-white px-6 py-12 md:py-16 border-t-[3px] border-black">
      <div className="max-w-5xl w-full mx-auto space-y-8">
        <div className="text-center space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-black">
            Diagnosis
          </p>
          <h2 className="font-sans text-3xl md:text-5xl font-black text-black">
            3 Critical Issues Hiding in Your Listing
          </h2>
        </div>

        <div className="border-[3px] border-black overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-[3px] border-black bg-black">
                <th className="p-4 font-mono text-xs uppercase tracking-widest text-white">Issue</th>
                <th className="p-4 font-mono text-xs uppercase tracking-widest text-white">Severity</th>
                <th className="p-4 font-mono text-xs uppercase tracking-widest text-white">What It&apos;s Costing You</th>
                <th className="p-4 font-mono text-xs uppercase tracking-widest text-white">Fix</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue, i) => {
                const isCritical = issue.severity === 'critical';
                return (
                  <tr
                    key={i}
                    className={`border-b-[3px] border-black ${i % 2 === 1 ? 'bg-[#F0F0F0]' : 'bg-white'}`}
                  >
                    <td className="p-4 text-base font-bold text-black border-r-[3px] border-black">
                      {issue.title}
                    </td>
                    <td className="p-4 border-r-[3px] border-black">
                      <span
                        className={`font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1 border-[3px] border-black ${
                          isCritical
                            ? 'bg-[#FF1A1A] text-black'
                            : 'bg-[#F0F0F0] text-black'
                        }`}
                      >
                        {isCritical ? 'CRITICAL' : 'WARNING'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-black border-r-[3px] border-black">
                      {issue.impact}
                    </td>
                    <td className="p-4 text-sm text-black">
                      {issue.description}
                    </td>
                  </tr>
                );
              })}
              {issues.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-black font-mono text-sm">
                    No issues detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
