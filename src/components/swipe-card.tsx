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

const SWIPE_THRESHOLD = 90;

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

  const rotation = offset * 0.05;
  const stampOpacity = Math.min(1, Math.abs(offset) / SWIPE_THRESHOLD);

  const [name, ...tldParts] = domain.split(".");
  const tld = tldParts.join(".");

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center ${
        isTop ? "z-10" : "z-0 pointer-events-none"
      }`}
      style={{
        transform: isTop
          ? `translateX(${offset}px) rotate(${rotation}deg)`
          : "scale(0.92) translateY(8px)",
        opacity: isTop ? 1 : 0.4,
        transition: isDragging
          ? "none"
          : "transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.35s",
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
      <div className="w-full max-w-sm mx-4 aspect-[3/4] max-h-[70vh] rounded-2xl overflow-hidden flex flex-col relative select-none border border-white/5 bg-black shadow-2xl shadow-black/50">
        {/* Full-bleed gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-600/30 via-transparent to-black/80" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-br from-rose-500/20 via-purple-500/10 to-transparent" />

        {/* Stamps */}
        {offset > 0 && (
          <div
            className="absolute top-8 left-6 border-4 border-emerald-400 text-emerald-400 font-black text-3xl px-3 py-1 rounded-xl rotate-[-12deg] z-50 tracking-widest"
            style={{ opacity: stampOpacity }}
          >
            LIKE
          </div>
        )}
        {offset < 0 && (
          <div
            className="absolute top-8 right-6 border-4 border-rose-500 text-rose-500 font-black text-3xl px-3 py-1 rounded-xl rotate-[12deg] z-50 tracking-widest"
            style={{ opacity: stampOpacity }}
          >
            NOPE
          </div>
        )}

        {/* Content */}
        <div className="relative flex-1 flex flex-col justify-center items-center px-6 text-center z-10">
          {/* Verified badge */}
          <div className="mb-6 flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-white/70 text-xs font-medium">
              Verified available
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-white break-all leading-none tracking-tight">
            {name}
          </h2>
          <span className="text-3xl sm:text-4xl text-rose-400 font-black mt-2">
            .{tld}
          </span>
        </div>

        {/* Bottom gradient fade */}
        <div className="relative z-10 px-6 pb-6 pt-4 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>Swipe right to save</span>
            <span className="font-mono">.{tld}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
