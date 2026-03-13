"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { SwipeDeck } from "@/components/swipe-deck";

export default function SwipePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const activeTopic = useRef("");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  const fetchDomains = useCallback(
    async (topicStr: string, append = false) => {
      if (append && fetchingMore) return;
      if (append) setFetchingMore(true);
      else setGenerating(true);

      try {
        const res = await fetch("/api/domains/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: topicStr }),
        });
        const data = await res.json();
        if (data.domains?.length) {
          setDomains((prev) => {
            if (append) {
              // Deduplicate
              const existing = new Set(prev);
              const newOnes = data.domains.filter(
                (d: string) => !existing.has(d)
              );
              return [...prev, ...newOnes];
            }
            return data.domains;
          });
        }
      } finally {
        if (append) setFetchingMore(false);
        else setGenerating(false);
      }
    },
    [fetchingMore]
  );

  const generateDomains = useCallback(async () => {
    if (!topic.trim()) return;
    activeTopic.current = topic.trim();
    await fetchDomains(topic.trim(), false);
  }, [topic, fetchDomains]);

  const handleRunningLow = useCallback(() => {
    if (activeTopic.current && !fetchingMore) {
      fetchDomains(activeTopic.current, true);
    }
  }, [fetchDomains, fetchingMore]);

  const handleSwipe = useCallback(
    async (domain: string, direction: "left" | "right") => {
      await fetch("/api/domains/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, direction }),
      });
    },
    []
  );

  if (isPending) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <main className="h-dvh bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-20 shrink-0">
        <h1 className="text-lg font-black bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent flex items-center gap-1">
          <svg
            className="w-5 h-5 text-rose-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.5 12.4c-1.5-2-4-3-4-5.4 0-1.8 1.1-3.6 2.8-4.4-.8-.4-1.8-.6-2.8-.6-4.4 0-8 3.6-8 8 0 1.5.4 2.9 1.1 4.1-1.8 1.5-3 3.8-3 6.3 0 .4 0 .8.1 1.2 2.3-1.6 5-2.6 7.9-2.6 1.7 0 3.3.3 4.9.9 2.1-1.6 3.4-4 3.4-6.8 0-.2 0-.4-.1-.7z" />
          </svg>
          DomainTinder
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/profile")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 active:scale-90 transition-all"
            aria-label="Profile"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>
          <button
            onClick={() => signOut().then(() => router.push("/login"))}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 active:scale-90 transition-all"
            aria-label="Sign out"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Swipe area */}
      <div className="flex-1 flex items-center justify-center px-3 relative min-h-0">
        {domains.length > 0 ? (
          <div className="w-full">
            <SwipeDeck
              domains={domains}
              onSwipe={handleSwipe}
              onRunningLow={handleRunningLow}
            />
            {fetchingMore && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <span className="text-xs text-zinc-600 animate-pulse">
                  Loading more...
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center px-4">
            <div className="relative flex items-center justify-center w-24 h-24 mb-6">
              {generating && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-20" />
                  <div className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-20 [animation-delay:500ms]" />
                </>
              )}
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 p-0.5">
                <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🔥</span>
                </div>
              </div>
            </div>

            {generating ? (
              <p className="text-base font-medium text-rose-400 animate-pulse">
                Finding domains near you...
              </p>
            ) : (
              <>
                <h3 className="text-xl font-bold text-white mb-1">
                  Start Swiping
                </h3>
                <p className="text-zinc-500 text-sm max-w-[260px]">
                  Tell us what you&apos;re building below
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Topic input */}
      <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent shrink-0">
        <div className="flex gap-2 max-w-lg mx-auto bg-zinc-900 p-1.5 rounded-full border border-zinc-800 shadow-xl">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateDomains()}
            placeholder="I'm building a..."
            className="flex-1 min-w-0 px-3 bg-transparent text-white text-sm placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={generateDomains}
            disabled={generating || !topic.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 disabled:opacity-50 text-white text-sm font-bold rounded-full transition-transform active:scale-95 whitespace-nowrap shrink-0"
          >
            {generating ? "..." : "Go"}
          </button>
        </div>
      </div>
    </main>
  );
}
