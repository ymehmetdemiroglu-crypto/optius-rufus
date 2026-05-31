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
      className={`relative z-20 flex flex-col border-r-[3px] border-brand-dark bg-white transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-68'
      }`}
    >
      {/* Brand Header: Bauhaus styled */}
      <div className="flex h-20 items-center justify-between px-4 border-b-[3px] border-brand-dark">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            {/* Bauhaus Grid Box Logo */}
            <div className="h-10 w-10 bg-brand-dark flex items-center justify-center shrink-0 border-[3px] border-brand-dark">
              <div className="h-4 w-4 bg-brand-gold rotate-45" />
            </div>
            
            <div className="leading-none">
              <div className="font-display text-xs font-black text-brand-dark tracking-[0.15em] uppercase select-none flex items-center">
                <span>OPTIMUS</span>
                <span className="mx-1 text-brand-blue font-black">|</span>
                <span>PRIME</span>
              </div>
              <div className="text-[8px] tracking-[0.2em] text-brand-blue uppercase font-bold mt-1 font-mono">
                AI ORCHESTRATION
              </div>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="mx-auto h-10 w-10 bg-brand-dark flex items-center justify-center border-[3px] border-brand-dark">
            <div className="h-4 w-4 bg-brand-gold rotate-45" />
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-3 px-3 py-6 select-none">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-4 border-[3px] border-transparent px-4 py-3 text-[10px] font-bold tracking-[0.1em] transition-all duration-200 font-display ${
                  isActive
                    ? 'bg-white border-brand-dark text-brand-dark shadow-brutal-blue'
                    : 'text-brand-dark/70 hover:bg-brand-bg/50 hover:text-brand-dark hover:border-brand-dark/20'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0 text-brand-dark" />
              {!isCollapsed && <span>{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Plan Status Card */}
      {!isCollapsed && (
        <div className="m-4 bg-[#f5f0e8] p-4 border-[3px] border-brand-dark shadow-brutal-sm">
          <div className="flex items-center gap-2 text-brand-blue text-[9px] font-bold tracking-widest font-mono mb-1.5">
            <div className="h-2 w-2 bg-brand-blue animate-pulse" />
            <span>ORCHESTRATOR ONLINE</span>
          </div>
          <p className="text-[10px] text-brand-dark font-mono">
            COSMO Index: <strong className="text-brand-dark font-black">1536-dim sync</strong>
          </p>
          <div className="mt-3 h-3 w-full bg-white border-2 border-brand-dark overflow-hidden">
            <div className="h-full w-[95%] bg-brand-blue" />
          </div>
        </div>
      )}

      {/* Collapse Action Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-6 -right-4 flex h-8 w-8 items-center justify-center bg-white border-[3px] border-brand-dark text-brand-dark hover:bg-brand-gold transition-all shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px]"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
