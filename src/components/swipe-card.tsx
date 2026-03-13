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

const SWIPE_THRESHOLD = 120; // Slightly higher threshold for a more deliberate swipe

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

  // Math for the Tinder feel
  const rotation = offset * 0.08; // Subtle tilt
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
          : "scale(0.95) translateY(16px)",
        opacity: isTop ? cardOpacity : 0.6,
        transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s",
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
      <div className="w-[90vw] max-w-[340px] h-[65vh] max-h-[500px] bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative select-none group border border-zinc-800">
        
        {/* Playful top section / "Profile Pic" abstract area */}
        <div className="h-2/5 bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 p-6 flex items-end justify-center relative">
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white/90 text-sm font-semibold tracking-wide border border-white/30 z-10">
              AVAILABLE NOW
            </div>
        </div>

        {/* Tinder Stamps */}
        {offset > 0 && (
          <div 
            className="absolute top-10 left-6 border-[5px] border-emerald-400 text-emerald-400 font-black text-4xl px-3 py-1 rounded-lg rotate-[-15deg] z-50 tracking-widest uppercase"
            style={{ opacity: stampOpacity }}
          >
            LIKE
          </div>
        )}
        {offset < 0 && (
          <div 
            className="absolute top-10 right-6 border-[5px] border-rose-500 text-rose-500 font-black text-4xl px-3 py-1 rounded-lg rotate-[15deg] z-50 tracking-widest uppercase"
            style={{ opacity: stampOpacity }}
          >
            NOPE
          </div>
        )}

        {/* Card Content */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 text-center bg-zinc-900">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white break-all leading-none tracking-tight">
            {name}
          </h2>
          <span className="text-3xl text-rose-400 font-bold mt-1 opacity-90">.{tld}</span>
          
          <div className="mt-8 flex items-center gap-2 bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-700/50">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-300 text-sm font-medium">Ready to register</span>
          </div>
        </div>
      </div>
    </div>
  );
});
