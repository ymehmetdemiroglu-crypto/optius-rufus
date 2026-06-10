import { useEffect, useRef, useState } from 'react';
import { Network, MessageSquare, BarChart3 } from 'lucide-react';
import type { ProspectScoreBreakdown, CosmoNodeData, ReviewSentimentProfile } from '../../dtos/prospect.dto';
import { getScoreLevel, getScoreColor } from '../shared/lib/score';

interface StageAutopsyProps {
  scores: ProspectScoreBreakdown;
  headline: string;
  body: string;
  category: string;
  visible: boolean;
  cosmoGraphData: CosmoNodeData;
  reviewSentiment: ReviewSentimentProfile[];
  isPrint?: boolean;
}

interface AnimatedScoreProps {
  label: string;
  score: number;
  description: string;
  delay: number;
  animate: boolean;
  isPrint?: boolean;
}

function AnimatedScore({ label, score, description, delay, animate, isPrint }: AnimatedScoreProps) {
  const [displayScore, setDisplayScore] = useState(isPrint ? score : 0);
  const level = getScoreLevel(score);

  useEffect(() => {
    if (isPrint || !animate) return;

    const timeout = setTimeout(() => {
      const duration = 1200;
      const start = performance.now();

      function step(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.round(eased * score));
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }, delay);

    return () => clearTimeout(timeout);
  }, [animate, score, delay, isPrint]);

  return (
    <div className="brutalist-card brutalist-card-hover space-y-3 bg-white">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-dark/50 font-black">
        {label}
      </p>
      <div className="flex items-end gap-2">
        <span className={`font-display text-5xl md:text-6xl font-black ${getScoreColor(level)} ${level === 'critical' ? 'animate-pulse-red' : ''}`}>
          {displayScore}
        </span>
        <span className="text-brand-dark/40 font-mono text-sm mb-2">/100</span>
      </div>
      <div className="gauge-bar">
        <div
          className={`gauge-bar-fill score-${level}`}
          style={{
            width: (isPrint || animate) ? `${score}%` : '0%',
            transition: isPrint ? 'none' : undefined,
            transitionDelay: isPrint ? undefined : `${delay}ms`,
          }}
        />
      </div>
      <p className="text-sm text-brand-dark/80 font-medium leading-snug">{description}</p>
    </div>
  );
}

export default function StageAutopsy({
  scores,
  headline,
  body,
  category,
  visible,
  cosmoGraphData,
  reviewSentiment,
  isPrint,
}: StageAutopsyProps) {
  const [hasAnimated, setHasAnimated] = useState(isPrint);
  const [activeTab, setActiveTab] = useState<'scores' | 'cosmo' | 'reviews'>('scores');
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isPrint) return;
    if (visible && !hasAnimated) {
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [visible, hasAnimated, isPrint]);

  // Node position mapping (radial layout around core)
  const coreX = 250;
  const coreY = 180;
  const radius = 130;
  const safeNodes = cosmoGraphData?.nodes ?? [];
  const safeEdges = cosmoGraphData?.edges ?? [];
  const coreNode = safeNodes.find(n => n.group === 'core');
  const surroundingNodes = safeNodes.filter(n => n.group !== 'core');

  const nodesWithPositions = [
    ...(coreNode ? [{ ...coreNode, x: coreX, y: coreY }] : []),
    ...surroundingNodes.map((node, index) => {
      const angle = surroundingNodes.length > 0
        ? (index * 2 * Math.PI) / surroundingNodes.length
        : 0;
      return {
        ...node,
        x: Math.round(coreX + radius * Math.cos(angle)),
        y: Math.round(coreY + radius * Math.sin(angle)),
      };
    })
  ];

  return (
    <section
      id="stage-autopsy"
      ref={sectionRef}
      className="bg-white px-6 py-16 md:py-24 border-t-[3px] border-brand-dark"
    >
      <div className="max-w-5xl w-full mx-auto space-y-8">
        {/* Header */}
        <div className={`text-center space-y-3 ${hasAnimated ? 'animate-slide-up' : 'opacity-0'}`}>
          <p className="font-mono text-xs uppercase tracking-widest text-brutal-red font-black">
            DIAGNOSTIC RESULTS
          </p>
          <h2 className="display-heading text-3xl md:text-5xl text-brand-dark">
            {headline}
          </h2>
          <p className="text-base md:text-lg text-brand-dark/80 font-medium max-w-2xl mx-auto leading-relaxed">
            {body}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center border-b-[3px] border-brand-dark pb-0 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('scores')}
            className={`flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-wider font-black border-t-[3px] border-x-[3px] border-brand-dark cursor-pointer transition-all duration-150 ${
              activeTab === 'scores'
                ? 'bg-brand-dark text-white translate-y-[3px]'
                : 'bg-brand-bg text-brand-dark hover:bg-white hover:translate-y-[1px]'
            }`}
            style={{ marginBottom: '-3px' }}
          >
            <BarChart3 className="h-4 w-4" />
            <span>AI Compatibility Scores</span>
          </button>
          <button
            onClick={() => setActiveTab('cosmo')}
            className={`flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-wider font-black border-t-[3px] border-x-[3px] border-brand-dark cursor-pointer transition-all duration-150 ${
              activeTab === 'cosmo'
                ? 'bg-brand-dark text-white translate-y-[3px]'
                : 'bg-brand-bg text-brand-dark hover:bg-white hover:translate-y-[1px]'
            }`}
            style={{ marginBottom: '-3px' }}
          >
            <Network className="h-4 w-4" />
            <span>COSMO Intent Graph</span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-wider font-black border-t-[3px] border-x-[3px] border-brand-dark cursor-pointer transition-all duration-150 ${
              activeTab === 'reviews'
                ? 'bg-brand-dark text-white translate-y-[3px]'
                : 'bg-brand-bg text-brand-dark hover:bg-white hover:translate-y-[1px]'
            }`}
            style={{ marginBottom: '-3px' }}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Review Sentiment Audit</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="min-h-[400px]">
          {activeTab === 'scores' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
              <AnimatedScore
                label="Rufus Score"
                score={scores.rufusScore}
                description="How well Amazon's AI can answer buyer questions from your listing."
                delay={200}
                animate={hasAnimated}
                isPrint={isPrint}
              />
              <AnimatedScore
                label="COSMO Score"
                score={scores.cosmoScore}
                description="How Amazon's knowledge graph connects your product to buyer intent."
                delay={400}
                animate={hasAnimated}
                isPrint={isPrint}
              />
              <AnimatedScore
                label="Semantic Density"
                score={scores.semanticScore}
                description="How complete your semantic coverage is across all buyer queries."
                delay={600}
                animate={hasAnimated}
                isPrint={isPrint}
              />
              <AnimatedScore
                label="Content Quality"
                score={scores.contentScore}
                description="Conversion-readiness of your title, bullets, and description."
                delay={800}
                animate={hasAnimated}
                isPrint={isPrint}
              />
            </div>
          )}

          {activeTab === 'cosmo' && (
            <div className="border-[3px] border-brand-dark bg-brand-bg p-6 shadow-brutal animate-fade-in flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-1/2 space-y-4">
                <h3 className="font-display font-black text-xl text-brand-dark">Amazon's Knowledge Graph Intent Connections</h3>
                <p className="text-sm text-brand-dark/80 font-medium leading-relaxed">
                  Amazon's **COSMO** knowledge graph links customer searches to products based on common-sense relations (e.g., *Is Acme Supergreens good for [Bloating Relief]?*). 
                </p>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-brand-blue border border-brand-dark" />
                    <span className="font-bold">Core Brand node</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-green-500 border border-brand-dark" />
                    <span className="font-bold text-green-700">Healthy Connections (Indexed)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-brutal-red border border-brand-dark animate-pulse" />
                    <span className="font-bold text-brutal-red">Broken Connections (Semantic Gaps)</span>
                  </div>
                </div>
                <div className="border border-brand-dark bg-white p-3 text-xs font-mono leading-relaxed">
                  💡 **Result**: Rufus fails to recommend your product for **{safeNodes.filter(n => n.group === 'gap').map(n => n.label).join(', ')}** because there are no semantic links connecting them in your listing copy.
                </div>
              </div>

              {/* Node graph SVG */}
              <div className="w-full md:w-1/2 flex justify-center bg-white border-[3px] border-brand-dark p-4 shadow-brutal-sm relative overflow-hidden">
                <svg viewBox="0 0 500 360" className="w-full max-w-[420px] h-auto select-none">
                  {/* Drawing Edges */}
                  {safeEdges.map((edge, i) => {
                    const fromNode = nodesWithPositions.find(n => n.id === edge.from);
                    const toNode = nodesWithPositions.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;

                    return (
                      <line
                        key={`edge-${i}`}
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={toNode.x}
                        y2={toNode.y}
                        stroke={edge.active ? '#22c55e' : '#ef4444'}
                        strokeWidth={edge.active ? 2.5 : 2}
                        strokeDasharray={edge.active ? undefined : '5,5'}
                      />
                    );
                  })}

                  {/* Drawing Nodes */}
                  {nodesWithPositions.map((node, i) => {
                    const isCore = node.group === 'core';
                    const isGap = node.group === 'gap';

                    let nodeBg: string;
                    if (isCore) nodeBg = 'fill-brand-blue';
                    else if (isGap) nodeBg = 'fill-brutal-red animate-pulse';
                    else nodeBg = 'fill-green-500';

                    return (
                      <g key={`node-${i}`}>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isCore ? 26 : 14}
                          className={`${nodeBg} stroke-brand-dark`}
                          strokeWidth={2.5}
                        />
                        <foreignObject
                          x={node.x - 60}
                          y={node.y + (isCore ? 28 : 16)}
                          width={120}
                          height={40}
                          className="text-center pointer-events-none"
                        >
                          <div className="font-mono text-[9px] font-black text-brand-dark uppercase bg-white/95 px-1 py-0.5 border border-brand-dark rounded shadow-sm leading-none inline-block">
                            {node.label}
                          </div>
                        </foreignObject>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="border-[3px] border-brand-dark bg-white p-6 shadow-brutal animate-fade-in space-y-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-brutal-red" />
                <h3 className="font-display font-black text-2xl text-brand-dark">Rufus Customer Review Sentiment Audit</h3>
              </div>
              <p className="text-sm text-brand-dark/80 font-medium leading-relaxed">
                Rufus relies heavily on customer review summaries to answer open questions. When buyers ask Rufus conversational questions (e.g. *"Is the packaging reliable?"* or *"How does it mix?"*), Rufus parses the review corpus. If negative patterns emerge, Rufus flags them directly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviewSentiment.map((item, index) => (
                  <div key={index} className="border-2 border-brand-dark p-4 bg-brand-bg relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-black uppercase text-brand-dark">
                          {item.aspect}
                        </span>
                        {item.status === 'good' ? (
                          <span className="bg-green-100 text-green-800 border border-green-300 font-mono text-[10px] font-black px-2 py-0.5 uppercase">
                            OPTIMIZED
                          </span>
                        ) : item.status === 'warning' ? (
                          <span className="bg-yellow-100 text-yellow-800 border border-yellow-300 font-mono text-[10px] font-black px-2 py-0.5 uppercase">
                            RUFUS WARNING
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 border border-red-300 font-mono text-[10px] font-black px-2 py-0.5 uppercase animate-pulse">
                            CRITICAL RISK
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-dark/80 font-medium leading-relaxed">
                        {item.feedback}
                      </p>
                    </div>

                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono font-bold text-brand-dark/60">
                        <span>Sentiment Match</span>
                        <span>{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-white border border-brand-dark h-3">
                        <div
                          className={`h-full ${
                            item.status === 'good'
                              ? 'bg-green-500'
                              : item.status === 'warning'
                              ? 'bg-brand-gold'
                              : 'bg-brutal-red animate-pulse'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Category Average Comparison */}
        <div className={`border-[3px] border-brand-dark bg-brand-bg p-6 text-center shadow-brutal ${hasAnimated ? 'animate-slide-up' : 'opacity-0'}`}
          style={{ animationDelay: '1s' }}>
          <p className="text-base text-brand-dark font-bold uppercase tracking-wide">
            Category Average in <span className="font-black text-brand-blue">{category}</span>:{' '}
            <span className="font-mono font-black text-lg bg-white px-2 py-0.5 border border-brand-dark">
              {scores.categoryAverage ?? 54}
            </span>
            <span className="mx-3 text-brand-dark/30">|</span>
            Your Score:{' '}
            <span className={`font-black font-mono text-xl ${getScoreColor(getScoreLevel(scores.overallScore))}`}>
              {scores.overallScore}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
