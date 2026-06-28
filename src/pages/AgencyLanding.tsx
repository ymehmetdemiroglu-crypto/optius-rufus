import { useState } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Bot, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Search, 
  Layers,
  Calendar,
  Award,
  ChevronRight
} from 'lucide-react';
import StageBookCall from '../landing/StageBookCall';

const SIMULATOR_SCENARIOS = [
  {
    query: "What is the most durable organic memory foam pillow for neck pain?",
    before: {
      score: 54,
      status: "Filtered Out",
      reason: "Missing structural density specs & ergonomic alignment keywords in indexing graph."
    },
    after: {
      score: 92,
      status: "Top Recommended by Rufus",
      reason: "Direct semantic match on neck contour support, hypoallergenic certification & dual-density core."
    }
  },
  {
    query: "Best waterproof ceramic chef knife set with ergonomic grip under $150",
    before: {
      score: 61,
      status: "Ranked Below Competitors",
      reason: "Cosmo graph failed to associate non-slip handle texture with professional kitchen usage intent."
    },
    after: {
      score: 95,
      status: "Primary Rufus Conversational Pick",
      reason: "Optimized COSMO node mapping for culinary precision, rust-proof hardening & ergonomic weight."
    }
  }
];

export default function AgencyLanding() {
  const [activeScenario, setActiveScenario] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const scrollToBooking = () => {
    const el = document.getElementById('stage-book');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShowBookingModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark font-sans selection:bg-brand-gold selection:text-brand-dark">
      {/* ── TOP ANNOUNCEMENT BAR ── */}
      <div className="bg-brand-dark text-brand-gold px-4 py-2 text-xs md:text-sm font-mono text-center font-bold tracking-wide border-b border-white/10 flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>[Q3 ALGORITHM ALERT] Amazon Rufus & COSMO 2.0 Are Dictating 40%+ of Search Traffic. Is Your ASIN Ready?</span>
      </div>

      {/* ── HEADER NAVIGATION ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b-2 border-brand-dark px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-brand-dark text-brand-gold flex items-center justify-center font-black text-xl border-2 border-brand-dark shadow-brutal-sm">
              R
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight text-brand-dark block leading-none">
                OPTIMUS RUFUS
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-brand-blue font-bold">
                AI Listing Optimization Agency
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-wider font-bold text-brand-dark">
            <a href="#how-it-works" className="hover:text-brand-blue transition-colors">How Rufus Works</a>
            <a href="#simulator" className="hover:text-brand-blue transition-colors">Rufus Simulator</a>
            <a href="#deliverables" className="hover:text-brand-blue transition-colors">What You Get</a>
            <a href="#guarantee" className="hover:text-brand-blue transition-colors">Guarantee</a>
          </div>

          <button 
            onClick={scrollToBooking}
            className="brutalist-btn-primary px-5 py-2.5 text-sm font-mono font-bold"
          >
            GET FREE RUFUS AUDIT →
          </button>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="px-6 pt-16 pb-20 md:pt-24 md:pb-28 max-w-7xl mx-auto text-center space-y-8 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 bg-brand-gold/20 border-2 border-brand-dark px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-brand-dark rounded-full shadow-brutal-sm">
          <Sparkles className="w-4 h-4 text-amber-600 fill-amber-600" />
          <span>The #1 Amazon AI Algorithm Optimization Service</span>
        </div>

        <h1 className="display-heading text-4xl sm:text-6xl md:text-7xl max-w-5xl mx-auto text-brand-dark leading-[1.08]">
          We Engineer Amazon Listings That <span className="underline decoration-brand-gold decoration-wavy decoration-4">Amazon Rufus Loves</span> to Recommend.
        </h1>

        <p className="max-w-3xl mx-auto text-lg md:text-xl text-brand-dark/80 font-medium leading-relaxed">
          Amazon’s new AI buying assistant (Rufus) and knowledge graph (COSMO) now decide which products get shown to buyers. We re-architect your bullet points, A+ content, and semantic indexing so Rufus ranks your listing #1.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button 
            onClick={scrollToBooking}
            className="brutalist-btn-danger px-8 py-5 text-lg md:text-xl font-bold w-full sm:w-auto flex items-center justify-center gap-3 shadow-brutal-lg"
          >
            <span>INITIALIZE LISTING OVERHAUL</span>
            <ArrowRight className="w-6 h-6" />
          </button>

          <a 
            href="#simulator"
            className="brutalist-btn-secondary px-8 py-5 text-base md:text-lg font-bold w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Bot className="w-5 h-5" />
            <span>Test Rufus Simulator</span>
          </a>
        </div>

        {/* Social Proof Badges */}
        <div className="pt-10 flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm font-mono font-bold text-brand-dark/70 border-t border-brand-dark/10">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>85+ Rufus Score Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>+34% Average Organic Conversion Lift</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Done-For-You In 5 Business Days</span>
          </div>
        </div>
      </section>

      {/* ── RUFUS SIMULATOR SECTION ── */}
      <section id="simulator" className="bg-brand-dark text-white py-20 px-6 border-y-4 border-brand-dark">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="font-mono text-xs uppercase tracking-widest text-brand-gold font-black">
              [INTERACTIVE DEMO] RUFUS SEMANTIC ENGINE
            </span>
            <h2 className="display-heading text-3xl md:text-5xl text-white">
              See How Rufus Treats Unoptimized Listings vs. Optimus Rufus Overhauls
            </h2>
            <p className="text-white/70 font-mono text-sm">
              Rufus evaluates intent nodes, customer Q&As, and deep product specs. Click a buyer query scenario below:
            </p>
          </div>

          {/* Scenario Tabs */}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            {SIMULATOR_SCENARIOS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setActiveScenario(idx)}
                className={`px-6 py-3 font-mono text-xs uppercase tracking-wider font-bold border-2 transition-all ${
                  activeScenario === idx 
                    ? 'bg-brand-gold text-brand-dark border-brand-gold shadow-brutal-sm' 
                    : 'bg-white/5 text-white/80 border-white/20 hover:border-white/40'
                }`}
              >
                Scenario 0{idx + 1}: {s.query.substring(0, 32)}...
              </button>
            ))}
          </div>

          {/* Simulator Display Card */}
          <div className="brutalist-card bg-slate-900 border-4 border-white/20 p-6 md:p-10 space-y-8 shadow-2xl">
            {/* Simulated Rufus Search Header */}
            <div className="bg-slate-800 border-2 border-white/10 p-4 rounded flex items-center gap-3 font-mono text-sm text-emerald-400">
              <Bot className="w-6 h-6 shrink-0" />
              <span className="text-white/60 font-bold">Simulated Rufus Buyer Query:</span>
              <span className="text-white font-semibold italic">"{SIMULATOR_SCENARIOS[activeScenario].query}"</span>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* BEFORE */}
              <div className="bg-red-950/40 border-2 border-red-500/30 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
                  <span className="font-mono text-xs uppercase text-red-400 font-bold">[BEFORE] Standard Listing</span>
                  <span className="bg-red-500/20 text-red-300 text-xs font-mono font-bold px-2.5 py-1 border border-red-500/40">
                    Rufus Score: {SIMULATOR_SCENARIOS[activeScenario].before.score}/100
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-red-200 font-bold">
                    Recommendation Status: {SIMULATOR_SCENARIOS[activeScenario].before.status}
                  </div>
                  <p className="text-xs font-mono text-white/70 leading-relaxed">
                    {SIMULATOR_SCENARIOS[activeScenario].before.reason}
                  </p>
                </div>
              </div>

              {/* AFTER */}
              <div className="bg-emerald-950/40 border-2 border-emerald-500/40 p-6 space-y-4 relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <span className="font-mono text-xs uppercase text-emerald-400 font-bold">[AFTER] Optimus Rufus Overhaul</span>
                  <span className="bg-emerald-500/30 text-emerald-300 text-xs font-mono font-black px-2.5 py-1 border border-emerald-400">
                    Rufus Score: {SIMULATOR_SCENARIOS[activeScenario].after.score}/100
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-emerald-300 font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>{SIMULATOR_SCENARIOS[activeScenario].after.status}</span>
                  </div>
                  <p className="text-xs font-mono text-white/90 leading-relaxed">
                    {SIMULATOR_SCENARIOS[activeScenario].after.reason}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <button 
                onClick={scrollToBooking}
                className="brutalist-btn-primary px-8 py-4 text-base font-mono font-bold inline-flex items-center gap-2"
              >
                <span>CLAIM YOUR PRODUCT'S RUFUS OVERHAUL NOW</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── DELIVERABLES / WHAT YOU GET ── */}
      <section id="deliverables" className="py-20 px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="font-mono text-xs uppercase tracking-widest text-brand-blue font-black">
            [COMPLETE AGENCY PACKAGE] $1,500 FIXED PRICING
          </span>
          <h2 className="display-heading text-3xl md:text-5xl text-brand-dark">
            Everything Included In Your Full-Funnel Listing Transformation
          </h2>
          <p className="text-brand-dark/70 font-mono text-sm">
            We don't just rewrite text; we rebuild your entire Amazon ASIN conversion engine for both human buyers and AI algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="brutalist-card p-8 space-y-4 bg-white shadow-brutal hover:translate-y-[-4px] transition-all">
            <div className="h-12 w-12 bg-brand-gold border-2 border-brand-dark flex items-center justify-center font-bold text-brand-dark">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-display font-black text-xl text-brand-dark">
              Rufus & COSMO Semantic Copywriting
            </h3>
            <p className="text-sm text-brand-dark/80 leading-relaxed">
              Complete overhaul of your Title, 5 Key Feature Bullets, and Description engineered with deep intent nodes that Rufus scans during customer dialogues.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="brutalist-card p-8 space-y-4 bg-white shadow-brutal hover:translate-y-[-4px] transition-all">
            <div className="h-12 w-12 bg-brand-blue text-white border-2 border-brand-dark flex items-center justify-center font-bold">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-display font-black text-xl text-brand-dark">
              A+ Content Modular Layout Blueprint
            </h3>
            <p className="text-sm text-brand-dark/80 leading-relaxed">
              Conversion-focused visual hierarchy maps, comparison chart copy, and cross-selling table structures that double brand authority.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="brutalist-card p-8 space-y-4 bg-white shadow-brutal hover:translate-y-[-4px] transition-all">
            <div className="h-12 w-12 bg-brand-dark text-brand-gold border-2 border-brand-dark flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-display font-black text-xl text-brand-dark">
              PPC & Knowledge Graph Keyword Map
            </h3>
            <p className="text-sm text-brand-dark/80 leading-relaxed">
              A curated matrix of high-SOV backend search terms, long-tail customer query clusters, and PPC match targets to maximize campaign efficiency.
            </p>
          </div>
        </div>
      </section>

      {/* ── RISK ELIMINATION GUARANTEE ── */}
      <section id="guarantee" className="bg-brand-gold py-16 px-6 border-y-4 border-brand-dark">
        <div className="max-w-4xl mx-auto brutalist-card bg-brand-dark text-white p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-brutal-lg">
          <div className="h-20 w-20 bg-brand-gold text-brand-dark border-4 border-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-3 text-center md:text-left">
            <span className="font-mono text-xs uppercase tracking-widest text-brand-gold font-black">
              [GUARANTEE] 100% RISK-FREE CONTRACT
            </span>
            <h3 className="font-display font-black text-2xl md:text-3xl text-white">
              Reach 85+ Rufus Score Or You Pay Absolutely $0.
            </h3>
            <p className="text-sm text-white/80 leading-relaxed font-mono">
              We benchmark your listing before and after using our AI auditing framework. If your finalized listing does not hit an 85+ Rufus Score, we issue a full 100% refund immediately. No questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* ── BOOKING & SYSTEM ACTIVATION SECTION ── */}
      <StageBookCall 
        headline="Initialize Your Listing Overhaul"
        guarantee="Your listing hits 85+ Rufus Score or you pay nothing. Full refund, no questions."
        visible={true}
      />

      {/* ── FOOTER ── */}
      <footer className="bg-brand-dark text-white border-t-4 border-brand-dark py-12 px-6 font-mono text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <div className="font-display font-black text-lg text-brand-gold tracking-tight">
              OPTIMUS RUFUS AGENCY
            </div>
            <p className="text-white/60">
              Autonomous Amazon Rufus & COSMO Listing Optimization Systems.
            </p>
          </div>

          <div className="text-white/50 space-y-1">
            <p>© {new Date().getFullYear()} Optimus Rufus Agency. All rights reserved.</p>
            <p>Domain: <a href="https://optimusrufus.com" className="text-brand-gold hover:underline">optimusrufus.com</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
