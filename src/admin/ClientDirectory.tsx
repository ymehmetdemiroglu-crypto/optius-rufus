import { FolderOpen } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface ClientDirectoryProps {
  prospects: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  selectedProspectId: number | null;
  onSelectProspect: (id: number) => void;
}

export default function ClientDirectory({ prospects, selectedProspectId, onSelectProspect }: ClientDirectoryProps) {
  return (
    <Card className="bg-white space-y-4">
      <h2 className="font-display font-black text-lg uppercase tracking-wider border-b-[2px] border-brand-dark pb-2 flex items-center gap-2">
        <FolderOpen size={18} /> Active Clients / Prospects
      </h2>
      
      <div className="divide-y-[2px] divide-brand-dark/10 max-h-[500px] overflow-y-auto pr-2">
        {prospects && prospects.length > 0 ? (
          prospects.map((p: any) => (
            <div 
              key={p.id} 
              onClick={() => onSelectProspect(p.id)}
              className={`py-4 px-3 cursor-pointer transition-all flex items-center justify-between ${selectedProspectId === p.id ? "bg-brand-gold/15 border-l-4 border-brand-gold" : "hover:bg-brand-bg"}`}
            >
              <div>
                <h3 className="font-display font-bold uppercase text-sm">{p.company || p.firstName || "Unnamed Brand"}</h3>
                <p className="font-mono text-xs text-gray-500 mt-0.5">{p.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="default">{p.asin || "NO ASIN"}</Badge>
                  <Badge variant={p.status === "analyzed" ? "success" : "warning"} className={p.status === "analyzed" ? "font-bold" : ""}>
                    {p.status}
                  </Badge>
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
    </Card>
  );
}
