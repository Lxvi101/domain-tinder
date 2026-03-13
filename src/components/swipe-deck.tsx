"use client";

import { useState, useCallback } from "react";
import { SwipeCard } from "./swipe-card";

interface SwipeDeckProps {
  domains: string[];
  onSwipe: (domain: string, direction: "left" | "right") => void;
  onEmpty: () => void;
}

export function SwipeDeck({ domains, onSwipe, onEmpty }: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      const domain = domains[currentIndex];
      onSwipe(domain, direction);
      const next = currentIndex + 1;
      if (next >= domains.length) {
        onEmpty();
      } else {
        setCurrentIndex(next);
      }
    },
    [currentIndex, domains, onSwipe, onEmpty]
  );

  if (currentIndex >= domains.length) {
    return null;
  }

  return (
    <div className="relative w-full flex flex-col items-center">
      <div className="relative w-full h-[65vh] max-h-[500px]">
        {domains.slice(currentIndex, currentIndex + 2).map((domain, i) => (
          <SwipeCard
            key={domain}
            domain={domain}
            onSwipe={handleSwipe}
            isTop={i === 0}
          />
        ))}
      </div>

      {/* Tinder-style Action buttons */}
      <div className="flex items-center gap-6 mt-8">
        {/* NOPE Button */}
        <button
          onClick={() => handleSwipe("left")}
          className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500 hover:bg-zinc-800 hover:scale-110 active:scale-95 transition-all shadow-lg"
          aria-label="Pass"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Super Like (Decorative) */}
        <button
          className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 hover:bg-zinc-800 hover:scale-110 active:scale-95 transition-all shadow-lg"
          aria-label="Super Like"
        >
           <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>

        {/* LIKE Button */}
        <button
          onClick={() => handleSwipe("right")}
          className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 hover:bg-zinc-800 hover:scale-110 active:scale-95 transition-all shadow-lg"
          aria-label="Like"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
