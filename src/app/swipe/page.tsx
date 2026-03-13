"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { SwipeDeck } from "@/components/swipe-deck";

const TLD_OPTIONS = [".com", ".de", ".io", ".dev", ".app", ".co", ".net", ".org", ".ai", ".xyz"];

export default function SwipePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showLiked, setShowLiked] = useState(false);
  const [selectedTlds, setSelectedTlds] = useState<string[]>([".com"]);
  const [mode, setMode] = useState<"bidomainial" | "polydomainial">("bidomainial");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Load preferences and liked domains on mount
  useEffect(() => {
    if (!session) return;
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.tlds) setSelectedTlds(data.tlds.split(","));
        if (data.mode) setMode(data.mode);
      });
    fetch("/api/domains/swipe")
      .then((r) => r.json())
      .then((data) => {
        if (data.domains) setLiked(data.domains);
      });
  }, [session]);

  const savePrefs = useCallback(
    async (tlds: string[], m: "bidomainial" | "polydomainial") => {
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tlds: tlds.join(","), mode: m }),
      });
    },
    []
  );

  const toggleTld = useCallback(
    (tld: string) => {
      setSelectedTlds((prev) => {
        const next = prev.includes(tld)
          ? prev.filter((t) => t !== tld)
          : [...prev, tld];
        if (next.length === 0) return prev;
        savePrefs(next, mode);
        return next;
      });
    },
    [mode, savePrefs]
  );

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "bidomainial" ? "polydomainial" : "bidomainial";
      savePrefs(selectedTlds, next);
      return next;
    });
  }, [selectedTlds, savePrefs]);

  const generateDomains = useCallback(async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/domains/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (data.domains?.length) {
        setDomains(data.domains);
      }
    } finally {
      setGenerating(false);
    }
  }, [topic]);

  const handleSwipe = useCallback(
    async (domain: string, direction: "left" | "right") => {
      if (direction === "right") {
        setLiked((prev) => [domain, ...prev]);
      }
      await fetch("/api/domains/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, direction }),
      });
    },
    []
  );

  const handleEmpty = useCallback(() => {
    setDomains([]);
  }, []);

  if (isPending) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <main className="min-h-dvh bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-20">
        <h1 className="text-xl font-black bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent flex items-center gap-1">
          <svg className="w-6 h-6 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
             <path d="M17.5 12.4c-1.5-2-4-3-4-5.4 0-1.8 1.1-3.6 2.8-4.4-.8-.4-1.8-.6-2.8-.6-4.4 0-8 3.6-8 8 0 1.5.4 2.9 1.1 4.1-1.8 1.5-3 3.8-3 6.3 0 .4 0 .8.1 1.2 2.3-1.6 5-2.6 7.9-2.6 1.7 0 3.3.3 4.9.9 2.1-1.6 3.4-4 3.4-6.8 0-.2 0-.4-.1-.7z"/>
          </svg>
          DomainTinder
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowLiked(!showLiked); setShowPrefs(false); }}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
              showLiked ? "bg-rose-500/10 text-rose-500" : "bg-zinc-900 text-zinc-400"
            }`}
            aria-label="Your matches"
          >
             <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          <button
            onClick={() => { setShowPrefs(!showPrefs); setShowLiked(false); }}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
              showPrefs ? "bg-rose-500/10 text-rose-500" : "bg-zinc-900 text-zinc-400"
            }`}
            aria-label="Preferences"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={() => signOut().then(() => router.push("/login"))}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 transition-all"
            aria-label="Sign out"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Preferences panel */}
      {showPrefs && (
        <div className="px-6 py-6 border-b border-zinc-900 space-y-6 bg-zinc-950/95 absolute w-full z-10 shadow-2xl">
          <div>
            <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-3 block">
              Dealbreakers (TLDs)
            </label>
            <div className="flex flex-wrap gap-2">
              {TLD_OPTIONS.map((tld) => (
                <button
                  key={tld}
                  onClick={() => toggleTld(tld)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    selectedTlds.includes(tld)
                      ? "bg-rose-500 text-white"
                      : "bg-zinc-900 text-zinc-400"
                  }`}
                >
                  {tld}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-3 block">
              Vibe (Mode)
            </label>
            <button
              onClick={toggleMode}
              className="block w-full text-left px-5 py-4 bg-zinc-900 rounded-2xl text-white border border-zinc-800"
            >
              <span className="font-bold text-lg text-rose-400">
                {mode === "bidomainial" ? "Short & Punchy" : "Compound & Creative"}
              </span>
              <span className="text-zinc-500 text-sm block mt-1">
                {mode === "bidomainial"
                  ? "Looking for a 1-2 word commitment."
                  : "Open to fun, multi-word experiments."}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Liked panel */}
      {showLiked && (
        <div className="px-6 py-4 border-b border-zinc-900 absolute w-full bg-zinc-950/95 z-10 max-h-[60vh] overflow-y-auto shadow-2xl">
          <h2 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-4">Your Matches</h2>
          {liked.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">
              No matches yet. Get swiping!
            </p>
          ) : (
            <ul className="space-y-3">
              {liked.map((domain) => (
                <li key={domain} className="flex items-center gap-4 bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
                    {domain.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-bold text-lg">{domain}</div>
                    <div className="text-emerald-400 text-xs font-semibold">Ready to chat</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Swipe area & Empty State */}
      <div className="flex-1 flex items-center justify-center px-4 relative mt-4">
        {domains.length > 0 ? (
          <SwipeDeck
            domains={domains}
            onSwipe={handleSwipe}
            onEmpty={handleEmpty}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
             {/* Tinder-like Radar Animation */}
             <div className="relative flex items-center justify-center w-32 h-32 mb-8">
                {generating && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-20"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-20 delay-500"></div>
                  </>
                )}
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 p-1">
                   <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center">
                     <span className="text-4xl">🔥</span>
                   </div>
                </div>
             </div>
             
             {generating ? (
               <p className="text-lg font-medium text-rose-400 animate-pulse">Finding domains near you...</p>
             ) : (
               <>
                 <h3 className="text-2xl font-bold text-white mb-2">Start Swiping</h3>
                 <p className="text-zinc-500 max-w-xs">
                   Tell us what you&apos;re building, and we&apos;ll find your perfect domain match.
                 </p>
               </>
             )}
          </div>
        )}
      </div>

      {/* Topic input (Fixed at bottom like a chat bar) */}
      <div className="p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
        <div className="flex gap-2 max-w-lg mx-auto bg-zinc-900 p-2 rounded-full border border-zinc-800 shadow-xl">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateDomains()}
            placeholder="I'm building a..."
            className="flex-1 px-4 bg-transparent text-white placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={generateDomains}
            disabled={generating || !topic.trim()}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 disabled:opacity-50 text-white font-bold rounded-full transition-transform active:scale-95 whitespace-nowrap"
          >
            {generating ? "Searching..." : "Find Matches"}
          </button>
        </div>
      </div>
    </main>
  );
}
