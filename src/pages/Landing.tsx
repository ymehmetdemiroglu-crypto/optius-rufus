import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  ArrowRight,
  Zap,
  Target,
  ShieldAlert,
  Lock,
  CheckCircle2,
  Flame,
  ArrowUpRight
} from 'lucide-react';

export default function Landing() {
  const [asin, setAsin] = useState('');
  const [marketplace, setMarketplace] = useState('US');
  const navigate = useNavigate();

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asin || asin.length !== 10) return;
    navigate(`/analyzer?asin=${asin.toUpperCase()}&marketplace=${marketplace}`);
  };

  const handleQuickDemo = () => {
    navigate('/analyzer?demo=true');
  };

  return (
    <div className="bg-white text-black">
      {/* HERO SECTION */}
      <section className="brutalist-section border-b-[3px] border-black">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brutal-yellow border-[3px] border-black px-3 py-1.5">
            <Flame className="h-4 w-4 text-black" />
            <span className="font-mono text-xs uppercase tracking-widest font-black">
              THE NEW AMAZON ALGORITHM IS LIVE
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-sans font-black text-6xl md:text-8xl lg:text-9xl leading-[1.05] tracking-tight">
            Your Amazon Listing is Bleeding Money
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl leading-snug max-w-2xl font-medium">
            Amazon&apos;s AI is steering your buyers to competitors. Here&apos;s the exact damage.
          </p>

          {/* ASIN Scanner */}
          <div className="brutalist-card max-w-xl">
            <form onSubmit={handleScan} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2 flex-1 w-full">
                <Search className="h-5 w-5 text-black shrink-0" />
                <input
                  type="text"
                  placeholder="ENTER ASIN (e.g. B0C8XYZ123)"
                  value={asin}
                  onChange={(e) => setAsin(e.target.value.slice(0, 10))}
                  className="brutalist-input font-mono text-sm uppercase tracking-widest font-bold"
                  required
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <select
                  value={marketplace}
                  onChange={(e) => setMarketplace(e.target.value)}
                  className="brutalist-input w-auto font-black text-sm"
                >
                  <option value="US">US</option>
                  <option value="UK">UK</option>
                  <option value="DE">DE</option>
                  <option value="CA">CA</option>
                </select>

                <button
                  type="submit"
                  className="brutalist-btn flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 text-sm"
                >
                  <span>SCAN FREE</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Demo Button */}
          <div className="flex justify-start">
            <button
              onClick={handleQuickDemo}
              className="brutalist-btn-secondary flex items-center gap-2"
            >
              <span>Scan Mock Supplement (1-Second Demo)</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="bg-black text-white border-b-[3px] border-black">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16 space-y-10">
          <div className="space-y-2">
            <h2 className="font-sans font-black text-2xl md:text-4xl tracking-tight">
              Why Your Current Listing is Bleeding Cash Right Now
            </h2>
            <p className="font-mono text-xs uppercase tracking-widest text-white/70">
              The three hard truths Helium 10 won&apos;t tell you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="brutalist-card space-y-4">
              <div className="h-10 w-10 bg-brutal-red border-[3px] border-black text-white flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="font-sans font-bold text-base">1. Keyword stuffing is dead</h3>
              <p className="text-sm leading-snug font-medium">
                Amazon&apos;s AI does not match keywords anymore. It reads <strong>semantic embeddings</strong>. If your title is a collection of comma-separated search words, Rufus flags it as spam and hides it.
              </p>
            </div>

            <div className="brutalist-card space-y-4">
              <div className="h-10 w-10 bg-brutal-blue border-[3px] border-black text-white flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="font-sans font-bold text-base">2. Rufus talks to your buyers</h3>
              <p className="text-sm leading-snug font-medium">
                When customers ask Rufus <em>&quot;is this serum safe for sensitive acne skin,&quot;</em> Rufus scans your listing for cellular-level answers. If you only write general marketing fluff, Rufus recommends your competitor.
              </p>
            </div>

            <div className="brutalist-card space-y-4">
              <div className="h-10 w-10 bg-brutal-yellow border-[3px] border-black text-black flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-sans font-bold text-base">3. COSMO defines relationship connections</h3>
              <p className="text-sm leading-snug font-medium">
                COSMO connects products to daily routines. If your sleep aid listing doesn&apos;t specify <em>when</em> and <em>how</em> it integrates into a night-time routine, COSMO locks you out of search clusters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OFFER SECTION */}
      <section className="brutalist-section border-b-[3px] border-black">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-3 space-y-6">
              <div className="inline-block bg-brutal-blue text-white border-[3px] border-black px-3 py-1 font-mono text-xs font-black uppercase tracking-widest">
                THE NO-BRAINER OFFER
              </div>

              <h3 className="font-sans font-black text-3xl md:text-5xl tracking-tight leading-[1.1]">
                Get the Grand Slam Optimization Bundle For Just $99/Month
              </h3>

              <p className="text-base md:text-lg leading-snug font-medium">
                Stop losing 60% of your warm traffic to optimized competitors. Lock in our complete AI-native engine to rewrite, audit, and audit your entire health and beauty product catalog.
              </p>

              <ul className="space-y-3 text-sm md:text-base font-bold">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-brutal-blue shrink-0" />
                  <span>7-Agent AI Listing Rewrite Engine ($499 Value)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-brutal-blue shrink-0" />
                  <span>24-Dimension COSMO Intent Gap Audit ($299 Value)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-brutal-blue shrink-0" />
                  <span>Interactive Rufus Chat Simulator ($199 Value)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-brutal-blue shrink-0" />
                  <span>Competitor Intent Defensibility Benchmark ($299 Value)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-brutal-blue shrink-0" />
                  <span>SP-API 1-Click Publisher ($199 Value)</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-2 brutalist-card flex flex-col justify-between text-center relative min-h-[300px] border-[3px] border-black">
              <div className="absolute top-0 right-0 bg-brutal-red text-white border-b-[3px] border-l-[3px] border-black px-3 py-1 font-mono text-xs font-black uppercase tracking-widest">
                POPULAR CHOICE
              </div>

              <div className="space-y-2 mt-8">
                <div className="font-mono text-xs uppercase tracking-widest font-black text-black/60">
                  TOTAL VALUE: $1,495
                </div>
                <div className="text-5xl font-black text-black">
                  $99 <span className="text-base font-bold text-black/60">/ month</span>
                </div>
                <p className="text-xs font-medium text-black/70">
                  Includes 100 ASIN Scans &amp; 1-Click Publishing
                </p>
              </div>

              <div className="space-y-3 mt-6">
                <button
                  onClick={handleQuickDemo}
                  className="brutalist-btn w-full flex items-center justify-center gap-2 text-sm"
                >
                  <span>GET STARTED NOW</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <div className="text-xs font-medium text-black/60 flex items-center justify-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>Secure Checkout. Cancel anytime.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GUARANTEE SECTION */}
      <section className="bg-brutal-yellow border-b-[3px] border-black">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="border-[3px] border-black bg-brutal-yellow p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="h-16 w-16 bg-black border-[3px] border-black text-brutal-yellow flex items-center justify-center shrink-0">
              <Zap className="h-8 w-8" />
            </div>

            <div className="space-y-2 flex-1 text-center md:text-left">
              <h3 className="font-sans font-black text-xl md:text-2xl tracking-tight">
                Our Double-Your-Score or Pay-Nothing Guarantee
              </h3>
              <p className="text-sm md:text-base leading-snug font-medium">
                If your listing&apos;s calculated Rufus Compatibility Score does not increase by at least <strong>20 points</strong> or your organic recommendation index does not double in 14 days, send us an email. We will refund every penny. No questions asked. <strong className="text-brutal-red">And you keep all optimized listing copies.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
