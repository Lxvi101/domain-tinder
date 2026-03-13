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
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <main className="min-h-dvh bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-white">DomainTinder</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowLiked(!showLiked); setShowPrefs(false); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showLiked
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            Liked ({liked.length})
          </button>
          <button
            onClick={() => { setShowPrefs(!showPrefs); setShowLiked(false); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showPrefs
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            Prefs
          </button>
          <button
            onClick={() => signOut().then(() => router.push("/login"))}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-400"
          >
            Out
          </button>
        </div>
      </header>

      {/* Preferences panel */}
      {showPrefs && (
        <div className="px-4 py-4 border-b border-zinc-800 space-y-4 animate-in slide-in-from-top">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider">
              TLDs
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {TLD_OPTIONS.map((tld) => (
                <button
                  key={tld}
                  onClick={() => toggleTld(tld)}
                  className={`px-3 py-1.5 rounded-full text-sm font-mono transition-colors ${
                    selectedTlds.includes(tld)
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {tld}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider">
              Mode
            </label>
            <button
              onClick={toggleMode}
              className="mt-2 block w-full text-left px-4 py-3 bg-zinc-800 rounded-xl text-white"
            >
              <span className="font-semibold">
                {mode === "bidomainial" ? "Bidomainial" : "Polydomainial"}
              </span>
              <span className="text-zinc-500 text-sm block">
                {mode === "bidomainial"
                  ? "Short, punchy 1-2 word domains"
                  : "Creative multi-word compound domains"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Liked panel */}
      {showLiked && (
        <div className="px-4 py-4 border-b border-zinc-800 max-h-[50vh] overflow-y-auto">
          {liked.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-4">
              No matches yet. Start swiping!
            </p>
          ) : (
            <ul className="space-y-2">
              {liked.map((domain) => (
                <li
                  key={domain}
                  className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3"
                >
                  <span className="text-white font-mono text-sm">{domain}</span>
                  <span className="text-emerald-400 text-xs">matched</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Topic input */}
      <div className="px-4 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateDomains()}
            placeholder="Enter topic or idea..."
            className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            onClick={generateDomains}
            disabled={generating || !topic.trim()}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            {generating ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Generate"
            )}
          </button>
        </div>
      </div>

      {/* Swipe area */}
      <div className="flex-1 flex items-center justify-center px-4 pb-6">
        {domains.length > 0 ? (
          <SwipeDeck
            domains={domains}
            onSwipe={handleSwipe}
            onEmpty={handleEmpty}
          />
        ) : (
          <div className="text-center text-zinc-600 px-8">
            <div className="text-6xl mb-4">~</div>
            <p className="text-lg">Enter a topic and hit Generate</p>
            <p className="text-sm mt-2">
              AI will create domain ideas, then swipe right to save your
              favorites
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
