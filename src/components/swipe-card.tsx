"use client";

import {
  useRef,
  useState,
  useCallback,
  memo,
  type TouchEvent,
  type MouseEvent,
} from "react";

interface SwipeCardProps {
  domain: string;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}

const SWIPE_THRESHOLD = 100;

export const SwipeCard = memo(function SwipeCard({
  domain,
  onSwipe,
  isTop,
}: SwipeCardProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleStart = useCallback((clientX: number) => {
    startX.current = clientX;
    currentX.current = clientX;
    setIsDragging(true);
  }, []);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      currentX.current = clientX;
      setOffset(clientX - startX.current);
    },
    [isDragging]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      onSwipe(offset > 0 ? "right" : "left");
    } else {
      setOffset(0);
    }
  }, [offset, onSwipe]);

  const onTouchStart = useCallback(
    (e: TouchEvent) => handleStart(e.touches[0].clientX),
    [handleStart]
  );
  const onTouchMove = useCallback(
    (e: TouchEvent) => handleMove(e.touches[0].clientX),
    [handleMove]
  );
  const onMouseDown = useCallback(
    (e: MouseEvent) => handleStart(e.clientX),
    [handleStart]
  );
  const onMouseMove = useCallback(
    (e: MouseEvent) => handleMove(e.clientX),
    [handleMove]
  );

  const rotation = offset * 0.1;
  const opacity = Math.max(0, 1 - Math.abs(offset) / 300);

  const tld = domain.split(".").slice(1).join(".");

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center ${
        isTop ? "z-10" : "z-0"
      }`}
      style={{
        transform: isTop
          ? `translateX(${offset}px) rotate(${rotation}deg)`
          : "scale(0.95) translateY(10px)",
        opacity: isTop ? opacity : 0.5,
        transition: isDragging ? "none" : "all 0.3s ease-out",
        touchAction: "none",
      }}
      onTouchStart={isTop ? onTouchStart : undefined}
      onTouchMove={isTop ? onTouchMove : undefined}
      onTouchEnd={isTop ? handleEnd : undefined}
      onMouseDown={isTop ? onMouseDown : undefined}
      onMouseMove={isTop ? onMouseMove : undefined}
      onMouseUp={isTop ? handleEnd : undefined}
      onMouseLeave={isTop && isDragging ? handleEnd : undefined}
    >
      <div className="w-[85vw] max-w-sm h-[60vh] max-h-96 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl shadow-2xl border border-zinc-700 flex flex-col items-center justify-center p-6 select-none">
        {/* Swipe indicators */}
        {offset > 30 && (
          <div className="absolute top-6 left-6 border-3 border-green-500 text-green-500 font-bold text-2xl px-4 py-2 rounded-xl rotate-[-15deg]">
            MATCH
          </div>
        )}
        {offset < -30 && (
          <div className="absolute top-6 right-6 border-3 border-red-500 text-red-500 font-bold text-2xl px-4 py-2 rounded-xl rotate-[15deg]">
            NOPE
          </div>
        )}

        <div className="text-zinc-500 text-sm uppercase tracking-widest mb-4">
          Available Domain
        </div>
        <div className="text-3xl sm:text-4xl font-bold text-white text-center break-all leading-tight">
          {domain.split(".")[0]}
        </div>
        <div className="text-xl text-emerald-400 font-mono mt-2">.{tld}</div>
        <div className="mt-8 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-sm">Available</span>
        </div>
      </div>
    </div>
  );
});
