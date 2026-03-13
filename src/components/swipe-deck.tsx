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

  const handleButtonSwipe = useCallback(
    (direction: "left" | "right") => {
      handleSwipe(direction);
    },
    [handleSwipe]
  );

  if (currentIndex >= domains.length) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500 text-center px-4">
        <p>No more domains! Generate more ideas above.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col items-center">
      <div className="relative w-full h-[60vh] max-h-96">
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
      <div className="flex gap-8 mt-6">
        <button
          onClick={() => handleButtonSwipe("left")}
          className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-red-500 flex items-center justify-center text-red-500 text-2xl active:scale-90 transition-transform"
          aria-label="Pass"
        >
          X
        </button>
        <button
          onClick={() => handleButtonSwipe("right")}
          className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-green-500 flex items-center justify-center text-green-500 text-2xl active:scale-90 transition-transform"
          aria-label="Like"
        >
          &hearts;
        </button>
      </div>

      <div className="mt-4 text-zinc-600 text-sm">
        {currentIndex + 1} / {domains.length}
      </div>
    </div>
  );
}
