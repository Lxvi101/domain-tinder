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

  const handleStart = useCallback((clientX: number) => {
    startX.current = clientX;
    setIsDragging(true);
  }, []);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
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

  const rotation = offset * 0.06;
  const cardOpacity = Math.max(0, 1 - Math.abs(offset) / 500);
  const stampOpacity = Math.min(1, Math.abs(offset) / SWIPE_THRESHOLD);

  const [name, ...tldParts] = domain.split(".");
  const tld = tldParts.join(".");

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center ${
        isTop ? "z-10" : "z-0"
      }`}
      style={{
        transform: isTop
          ? `translateX(${offset}px) rotate(${rotation}deg)`
          : "scale(0.95) translateY(10px)",
        opacity: isTop ? cardOpacity : 0.5,
        transition: isDragging
          ? "none"
          : "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s",
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
      <div className="w-[85vw] max-w-[340px] bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative select-none border border-zinc-800">
        {/* Gradient header */}
        <div className="h-28 sm:h-32 bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 flex items-end justify-center relative shrink-0">
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
          <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white/90 text-xs font-semibold tracking-wide border border-white/30 z-10 mb-3">
            VERIFIED AVAILABLE
          </div>
        </div>

        {/* Stamps */}
        {offset > 0 && (
          <div
            className="absolute top-6 left-4 border-4 border-emerald-400 text-emerald-400 font-black text-2xl sm:text-3xl px-2 py-0.5 rounded-lg rotate-[-15deg] z-50 tracking-widest uppercase"
            style={{ opacity: stampOpacity }}
          >
            LIKE
          </div>
        )}
        {offset < 0 && (
          <div
            className="absolute top-6 right-4 border-4 border-rose-500 text-rose-500 font-black text-2xl sm:text-3xl px-2 py-0.5 rounded-lg rotate-[15deg] z-50 tracking-widest uppercase"
            style={{ opacity: stampOpacity }}
          >
            NOPE
          </div>
        )}

        {/* Domain display */}
        <div className="flex-1 flex flex-col justify-center items-center px-5 py-6 text-center bg-zinc-900 min-h-0">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white break-all leading-tight tracking-tight">
            {name}
          </h2>
          <span className="text-2xl sm:text-3xl text-rose-400 font-bold mt-1 opacity-90">
            .{tld}
          </span>

          <div className="mt-5 flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-700/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-zinc-300 text-xs font-medium">
              Ready to register
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
