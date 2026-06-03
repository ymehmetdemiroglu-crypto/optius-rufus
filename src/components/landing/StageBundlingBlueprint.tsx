import { Box, Layers, Plus } from 'lucide-react';
import type { BundlingItem } from '../../types/prospect';

interface StageBundlingBlueprintProps {
  cosmoBundling: BundlingItem[];
  visible: boolean;
}

export default function StageBundlingBlueprint({ cosmoBundling, visible }: StageBundlingBlueprintProps) {
  if (!cosmoBundling || cosmoBundling.length === 0) return null;

  return (
    <section
      id="stage-bundling"
      className="bg-brand-bg px-6 py-16 md:py-24 border-t-[3px] border-brand-dark"
    >
      <div className="max-w-5xl w-full mx-auto space-y-10">
        <div className="text-center space-y-3">
          <p className="font-mono text-xs uppercase tracking-widest text-brutal-red font-black">
            PORTFOLIO STRATEGY
          </p>
          <h2 className="display-heading text-3xl md:text-5xl text-brand-dark">
            COSMO Co-Purchase & Virtual Bundling Blueprint
          </h2>
          <p className="text-base md:text-lg text-brand-dark/70 font-medium max-w-2xl mx-auto leading-relaxed">
            Amazon's COSMO knowledge graph analyzes how buyers build routines. By creating virtual bundles (FBA Bundles) in your catalog, you force Amazon's system to link your main product with secondary intent categories.
          </p>
        </div>

        {/* Blueprint Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cosmoBundling.map((bundle, i) => (
            <div
              key={i}
              className="border-[3px] border-brand-dark bg-white p-5 shadow-brutal flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2 border-b-2 border-brand-dark/10 pb-2">
                  <Box className="h-5 w-5 text-brand-blue" />
                  <span className="font-display font-black text-lg text-brand-dark">
                    {bundle.title}
                  </span>
                </div>

                {/* Combo Flow Visualization */}
                <div className="flex items-center justify-center gap-3 bg-brand-bg/50 p-4 border border-brand-dark/20 rounded flex-wrap">
                  {bundle.products.map((prod, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="font-mono text-xs font-black bg-white px-3 py-1.5 border border-brand-dark shadow-sm uppercase tracking-wide max-w-[180px] truncate">
                        {prod}
                      </div>
                      {j < bundle.products.length - 1 && (
                        <Plus className="h-4 w-4 text-brand-dark/60 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Rationale explanation */}
                <div className="space-y-1">
                  <p className="font-mono text-[9px] font-black uppercase text-brand-dark/50">COSMO Graph Rationale:</p>
                  <p className="text-xs text-brand-dark/85 font-medium leading-relaxed bg-brand-bg/20 p-3 border border-brand-dark/10">
                    {bundle.rationale}
                  </p>
                </div>
              </div>

              {/* Action badge footer */}
              <div className="text-[10px] font-mono font-bold text-brand-dark/40 border-t border-brand-dark/10 pt-2 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span>Action: Create Virtual Bundle in Amazon Brand Benefits Tab</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
