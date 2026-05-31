import { NavLink } from 'react-router-dom';
import { 
  Compass, 
  LayoutDashboard, 
  Cpu, 
  BarChart3, 
  Settings as SettingsIcon, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    { to: '/', label: 'Overview Pitch', icon: Compass },
    { to: '/dashboard', label: 'ASIN Catalog', icon: LayoutDashboard },
    { to: '/analyzer', label: 'AI Optimization', icon: Cpu },
    { to: '/competitors', label: 'Competitors', icon: BarChart3 },
    { to: '/settings', label: 'Integrations', icon: SettingsIcon },
  ];

  return (
    <aside 
      className={`relative z-20 flex flex-col border-r border-brand-bg-border bg-[#0B0F19]/80 backdrop-blur-xl transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-20 items-center justify-between px-5 border-b border-brand-bg-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-orange to-brand-violet shadow-glow-orange animate-pulse-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-display text-lg font-bold bg-gradient-to-r from-brand-orange to-brand-violet bg-clip-text text-transparent">
                Optimus Rufus
              </span>
              <div className="text-[10px] tracking-wider text-brand-cyan uppercase font-semibold">
                AI Listing Eng.
              </div>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-orange to-brand-violet shadow-glow-orange">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2 px-3 py-6">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-orange/10 to-brand-violet/10 text-brand-orange border-l-2 border-brand-orange shadow-[inset_1px_0_0_rgba(255,255,255,0.05)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Plan Status Card */}
      {!isCollapsed && (
        <div className="m-4 rounded-2xl bg-gradient-to-br from-brand-bg-card to-[#1E293B]/20 p-4 border border-brand-bg-border">
          <div className="flex items-center gap-2 text-brand-cyan text-xs font-semibold mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>PRO ACTIVE</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Rufus Indexing: <strong className="text-slate-200">92% Coverage</strong>
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-brand-cyan to-brand-violet" />
          </div>
        </div>
      )}

      {/* Collapse Action Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-6 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-slate-850 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all hover:bg-slate-800"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
