"use client";

import { useState, useCallback } from "react";
import { SwipeCard } from "./swipe-card";

interface SwipeDeckProps {
  domains: string[];
  onSwipe: (domain: string, direction: "left" | "right") => void;
  onRunningLow: () => void;
  isStreaming: boolean;
}

export function SwipeDeck({
  domains,
  onSwipe,
  onRunningLow,
  isStreaming,
}: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      const domain = domains[currentIndex];
      if (!domain) return;
      onSwipe(domain, direction);
      const next = currentIndex + 1;
      setCurrentIndex(next);
      if (domains.length - next <= 3) {
        onRunningLow();
      }
    },
    [currentIndex, domains, onSwipe, onRunningLow]
  );

  // Waiting for first domain
  if (currentIndex >= domains.length) {
    if (isStreaming) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Finding your next domain...</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Cards */}
      <div className="flex-1 relative">
        {domains.slice(currentIndex, currentIndex + 2).map((domain, i) => (
          <SwipeCard
            key={domain}
            domain={domain}
            onSwipe={handleSwipe}
            isTop={i === 0}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-6 py-3 shrink-0">
        <button
          onClick={() => handleSwipe("left")}
          className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-rose-500 active:scale-90 transition-all"
          aria-label="Pass"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <button
          className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 active:scale-90 transition-all"
          aria-label="Super Like"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>

        <button
          onClick={() => handleSwipe("right")}
          className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 active:scale-90 transition-all"
          aria-label="Like"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
