import { NavLink } from 'react-router-dom';
import { 
  Compass, 
  LayoutDashboard, 
  Cpu, 
  BarChart3, 
  Users,
  Settings as SettingsIcon, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    { to: '/', label: 'OPERATIONS CONTROL', icon: Compass },
    { to: '/dashboard', label: 'AGENT CORES', icon: LayoutDashboard },
    { to: '/dashboard/prospects', label: 'PROSPECT PIPELINE', icon: Users },
    { to: '/analyzer', label: 'ORCHESTRATION KERNEL', icon: Cpu },
    { to: '/competitors', label: 'INTENT BENCHMARKS', icon: BarChart3 },
    { to: '/settings', label: 'SP-API PROTOCOLS', icon: SettingsIcon },
  ];

  return (
    <aside 
      className={`relative z-20 flex flex-col border-r border-brand-bg-border bg-[#05070A]/90 backdrop-blur-2xl transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-68'
      }`}
    >
      {/* Brand Header: Hexagonal Reactor */}
      <div className="flex h-20 items-center justify-between px-4 border-b border-brand-bg-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            {/* Hexagonal Reactor Frame */}
            <div className="relative flex h-10 w-10 items-center justify-center shrink-0">
              {/* Outer Hexagon frame in Titanium Silver */}
              <svg 
                viewBox="0 0 100 100" 
                className="absolute inset-0 h-full w-full stroke-[#E0E1DD] fill-none stroke-[6]"
              >
                <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" />
              </svg>
              {/* Central glowing red point - The Spark */}
              <div className="h-2.5 w-2.5 rounded-full bg-[#E63946] shadow-[0_0_12px_#E63946] animate-pulse" />
            </div>
            
            <div className="leading-none">
              <div className="font-display text-xs font-bold text-[#E0E1DD] tracking-[0.2em] uppercase select-none flex items-center">
                <span>OPTIMUS</span>
                <span className="mx-1 text-[#E63946] font-light">|</span>
                <span>PRIME</span>
              </div>
              <div className="text-[8px] tracking-[0.25em] text-[#00F5FF] uppercase font-bold mt-1 font-mono">
                AI ORCHESTRATION
              </div>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="relative mx-auto flex h-10 w-10 items-center justify-center">
            <svg 
              viewBox="0 0 100 100" 
              className="absolute inset-0 h-full w-full stroke-[#E0E1DD] fill-none stroke-[8]"
            >
              <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" />
            </svg>
            <div className="h-2.5 w-2.5 rounded-full bg-[#E63946] shadow-[0_0_12px_#E63946] animate-pulse" />
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2.5 px-3 py-6 select-none">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-xl px-4 py-3.5 text-[10px] font-bold tracking-[0.1em] transition-all duration-300 font-display ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-crimson/15 to-brand-cyan/5 text-[#E63946] border-l-2 border-[#E63946] shadow-glow-crimson'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {!isCollapsed && <span>{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Plan Status Card */}
      {!isCollapsed && (
        <div className="m-4 rounded-2xl bg-gradient-to-br from-[#0D111A] to-brand-bg-card/20 p-4 border border-brand-bg-border">
          <div className="flex items-center gap-2 text-[#00F5FF] text-[9px] font-bold tracking-widest font-mono mb-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00F5FF] animate-ping" />
            <span>ORCHESTRATOR ONLINE</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            COSMO Index: <strong className="text-slate-200">1536-dim sync</strong>
          </p>
          <div className="mt-3 h-1 w-full rounded-full bg-slate-900 overflow-hidden">
            <div className="h-full w-[95%] rounded-full bg-gradient-to-r from-[#00F5FF] to-[#E63946]" />
          </div>
        </div>
      )}

      {/* Collapse Action Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-6 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#0D111A] border border-slate-800 text-slate-400 hover:text-slate-200 transition-all hover:bg-slate-800"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
