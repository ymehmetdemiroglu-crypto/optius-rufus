import { useRef, useState } from 'react';
import { trpc } from '../providers/trpc';

export function useActivityTracker(prospectId: number) {
  const recordActivity = trpc.prospects?.recordActivity?.useMutation();
  const trackedStages = useRef<Set<number>>(new Set());
  const [interestScore, setInterestScore] = useState(0);

  const trackEvent = (eventType: string, eventData?: Record<string, unknown>, scoreIncrement = 0) => {
    // Only track if prospectId is valid (non-zero)
    if (!prospectId) return;

    setInterestScore((prev) => {
      const newScore = Math.min(100, prev + scoreIncrement);
      
      try {
        recordActivity?.mutate({
          prospectId,
          eventType,
          eventData,
          interestScore: newScore,
        });
      } catch (err) {
        console.warn("⚠️ Failed to mutate activity tracking:", err);
      }

      return newScore;
    });
  };

  const trackScrollStage = (stageIndex: number, stageName: string) => {
    // Avoid double tracking the same scroll stage index in a single session
    if (trackedStages.current.has(stageIndex)) return;
    trackedStages.current.add(stageIndex);

    // Dynamic scoring weights for scroll progression
    let scoreIncrement = 5;
    if (stageIndex === 1) scoreIncrement = 10;      // Autopsy
    else if (stageIndex === 2) scoreIncrement = 15; // Bleed Calculator
    else if (stageIndex === 3) scoreIncrement = 15; // Rufus Simulator
    else if (stageIndex === 4) scoreIncrement = 10; // Sandbox / Transform
    else if (stageIndex === 5) scoreIncrement = 15; // Free QAs
    else if (stageIndex === 6) scoreIncrement = 20; // PPC Planner
    else if (stageIndex === 7) scoreIncrement = 15; // Bundling Blueprint
    else if (stageIndex === 10) scoreIncrement = 30; // Final Book CTA stage

    trackEvent('scroll_stage', { stageIndex, stageName }, scoreIncrement);
  };

  return {
    interestScore,
    trackScrollStage,
    trackEvent,
  };
}
