"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { SwipeDeck } from "@/components/swipe-deck";
import { useStreamingDomains } from "@/lib/use-streaming-domains";
import { INTEREST_POOLS, TLD_OPTIONS } from "@/lib/constants";

type Tab = "discover" | "foryou" | "profile";

export default function SwipePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("discover");

  // Discover state
  const [topic, setTopic] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const discover = useStreamingDomains();
  const discoverTopic = useRef("");

  // For You state
  const forYou = useStreamingDomains();
  const forYouStarted = useRef(false);

  // Profile state
  const [liked, setLiked] = useState<string[]>([]);
  const [selectedTlds, setSelectedTlds] = useState<string[]>([".com"]);
  const [mode, setMode] = useState<"bidomainial" | "polydomainial">("bidomainial");
  const [profileTab, setProfileTab] = useState<"matches" | "prefs">("matches");

  useEffect(() => {
    if (!isPending && !session) router.push("/login");
  }, [session, isPending, router]);

  // Load preferences and likes
  useEffect(() => {
    if (!session) return;
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.tlds) setSelectedTlds(data.tlds.split(","));
        if (data.mode) setMode(data.mode);
        if (data.interests) setSelectedInterests(data.interests.split(",").filter(Boolean));
      });
    fetch("/api/domains/swipe")
      .then((r) => r.json())
      .then((data) => {
        if (data.domains) setLiked(data.domains);
      });
  }, [session]);

  // Auto-start For You when tab is selected
  useEffect(() => {
    if (tab === "foryou" && !forYouStarted.current && !forYou.isStreaming && forYou.domains.length === 0) {
      forYouStarted.current = true;
      forYou.startStream("", "for-you");
    }
  }, [tab, forYou]);

  const savePrefs = useCallback(
    async (updates: { tlds?: string; mode?: string; interests?: string }) => {
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    },
    []
  );

  const toggleInterest = useCallback(
    (slug: string) => {
      setSelectedInterests((prev) => {
        const next = prev.includes(slug)
          ? prev.filter((s) => s !== slug)
          : [...prev, slug];
        savePrefs({ interests: next.join(",") });
        return next;
      });
    },
    [savePrefs]
  );

  const startDiscover = useCallback(() => {
    if (!topic.trim() && selectedInterests.length === 0) return;
    discoverTopic.current = topic.trim();
    discover.startStream(topic.trim(), "discover");
  }, [topic, selectedInterests, discover]);

  const handleDiscoverSwipe = useCallback(
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

  const handleForYouSwipe = useCallback(
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

  const handleDiscoverLow = useCallback(() => {
    if (!discover.isStreaming && discoverTopic.current) {
      discover.appendMore(discoverTopic.current, "discover");
    }
  }, [discover]);

  const handleForYouLow = useCallback(() => {
    if (!forYou.isStreaming) {
      forYou.appendMore("", "for-you");
    }
  }, [forYou]);

  const toggleTld = useCallback(
    (tld: string) => {
      setSelectedTlds((prev) => {
        const next = prev.includes(tld) ? prev.filter((t) => t !== tld) : [...prev, tld];
        if (next.length === 0) return prev;
        savePrefs({ tlds: next.join(",") });
        return next;
      });
    },
    [savePrefs]
  );

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "bidomainial" ? "polydomainial" : "bidomainial";
      savePrefs({ mode: next });
      return next;
    });
  }, [savePrefs]);

  const removeMatch = useCallback(async (domain: string) => {
    setLiked((prev) => prev.filter((d) => d !== domain));
    await fetch("/api/domains/swipe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });
  }, []);

  if (isPending) {
    return (
      <div className="h-dvh bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!session) return null;

  return (
    <main className="h-dvh bg-black flex flex-col overflow-hidden">
      {/* Content area */}
      <div className="flex-1 min-h-0 relative">
        {/* ====== DISCOVER TAB ====== */}
        {tab === "discover" && (
          <div className="h-full flex flex-col">
            {/* Top bar with interests */}
            <div className="shrink-0 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 bg-black/90 backdrop-blur-md z-20">
              {/* Search row */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startDiscover()}
                  placeholder="What are you building?"
                  className="flex-1 min-w-0 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-rose-500/50"
                />
                <button
                  onClick={startDiscover}
                  disabled={discover.isStreaming}
                  className="px-4 py-2 bg-rose-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl active:scale-95 transition-transform shrink-0"
                >
                  {discover.isStreaming ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Go"
                  )}
                </button>
              </div>
              {/* Interest pills */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {INTEREST_POOLS.map((pool) => (
                  <button
                    key={pool.slug}
                    onClick={() => toggleInterest(pool.slug)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                      selectedInterests.includes(pool.slug)
                        ? "bg-rose-500 text-white"
                        : "bg-white/5 text-white/50 border border-white/10"
                    }`}
                  >
                    {pool.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Swipe area */}
            <div className="flex-1 min-h-0">
              {discover.ready ? (
                <SwipeDeck
                  domains={discover.domains}
                  onSwipe={handleDiscoverSwipe}
                  onRunningLow={handleDiscoverLow}
                  isStreaming={discover.isStreaming}
                />
              ) : discover.isStreaming ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-white/40 text-sm animate-pulse">Generating domains...</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <span className="text-3xl">🔥</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Discover Domains
                  </h3>
                  <p className="text-white/40 text-sm max-w-[240px]">
                    Enter what you&apos;re building or pick interests above
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== FOR YOU TAB ====== */}
        {tab === "foryou" && (
          <div className="h-full flex flex-col">
            <div className="shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 bg-black/90 backdrop-blur-md z-20">
              <h2 className="text-base font-bold text-white">For You</h2>
              <p className="text-xs text-white/40">Based on your matches</p>
            </div>

            <div className="flex-1 min-h-0">
              {forYou.error === "no-likes" ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">No matches yet</h3>
                  <p className="text-white/40 text-sm max-w-[240px] mb-4">
                    Like some domains first and we&apos;ll find more like them
                  </p>
                  <button
                    onClick={() => setTab("discover")}
                    className="px-6 py-2.5 bg-rose-500 text-white text-sm font-bold rounded-xl active:scale-95 transition-transform"
                  >
                    Start Discovering
                  </button>
                </div>
              ) : forYou.ready ? (
                <SwipeDeck
                  domains={forYou.domains}
                  onSwipe={handleForYouSwipe}
                  onRunningLow={handleForYouLow}
                  isStreaming={forYou.isStreaming}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-white/40 text-sm animate-pulse">Curating your feed...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== PROFILE TAB ====== */}
        {tab === "profile" && (
          <div className="h-full flex flex-col overflow-y-auto">
            {/* User header */}
            <div className="shrink-0 flex flex-col items-center pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 px-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-white font-black text-2xl mb-3">
                {session.user.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <h2 className="text-lg font-bold text-white">
                {session.user.name}
              </h2>
              <p className="text-white/40 text-sm">{session.user.email}</p>
              <div className="flex gap-6 mt-3 text-center">
                <div>
                  <div className="text-lg font-bold text-white">{liked.length}</div>
                  <div className="text-xs text-white/40">Matches</div>
                </div>
                <div className="w-px bg-white/10" />
                <div>
                  <div className="text-lg font-bold text-white">{selectedTlds.length}</div>
                  <div className="text-xs text-white/40">TLDs</div>
                </div>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-white/10 px-4 shrink-0">
              <button
                onClick={() => setProfileTab("matches")}
                className={`flex-1 py-2.5 text-xs font-bold text-center transition-colors ${
                  profileTab === "matches"
                    ? "text-white border-b-2 border-rose-500"
                    : "text-white/40"
                }`}
              >
                Matches
              </button>
              <button
                onClick={() => setProfileTab("prefs")}
                className={`flex-1 py-2.5 text-xs font-bold text-center transition-colors ${
                  profileTab === "prefs"
                    ? "text-white border-b-2 border-rose-500"
                    : "text-white/40"
                }`}
              >
                Preferences
              </button>
            </div>

            <div className="flex-1 px-4 py-3 pb-4">
              {profileTab === "matches" && (
                <>
                  {liked.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-white/40 text-sm">No matches yet</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {liked.map((domain) => (
                        <li
                          key={domain}
                          className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 shrink-0 flex items-center justify-center text-white font-bold text-xs">
                            {domain.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-semibold text-sm truncate">
                              {domain}
                            </div>
                            <div className="text-emerald-400 text-xs">Available</div>
                          </div>
                          <button
                            onClick={() => removeMatch(domain)}
                            className="w-7 h-7 flex items-center justify-center rounded-full text-white/20 active:text-rose-500 transition-colors shrink-0"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {profileTab === "prefs" && (
                <div className="space-y-5">
                  {/* TLDs */}
                  <div>
                    <label className="text-xs text-white/40 font-bold uppercase tracking-wider mb-2 block">
                      TLDs
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {TLD_OPTIONS.map((tld) => (
                        <button
                          key={tld}
                          onClick={() => toggleTld(tld)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                            selectedTlds.includes(tld)
                              ? "bg-rose-500 text-white"
                              : "bg-white/5 text-white/40 border border-white/10"
                          }`}
                        >
                          {tld}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="text-xs text-white/40 font-bold uppercase tracking-wider mb-2 block">
                      Interests
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {INTEREST_POOLS.map((pool) => (
                        <button
                          key={pool.slug}
                          onClick={() => toggleInterest(pool.slug)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                            selectedInterests.includes(pool.slug)
                              ? "bg-rose-500 text-white"
                              : "bg-white/5 text-white/40 border border-white/10"
                          }`}
                        >
                          {pool.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mode */}
                  <div>
                    <label className="text-xs text-white/40 font-bold uppercase tracking-wider mb-2 block">
                      Style
                    </label>
                    <button
                      onClick={toggleMode}
                      className="w-full text-left px-4 py-3 bg-white/5 rounded-xl text-white border border-white/5 active:bg-white/10 transition-colors"
                    >
                      <span className="font-bold text-sm text-rose-400">
                        {mode === "bidomainial" ? "Short & Punchy" : "Compound & Creative"}
                      </span>
                      <span className="text-white/40 text-xs block mt-0.5">
                        {mode === "bidomainial"
                          ? "e.g. stripe.com, figma.com"
                          : "e.g. mailchimp.com, cloudflare.com"}
                      </span>
                    </button>
                  </div>

                  {/* Account */}
                  <div>
                    <label className="text-xs text-white/40 font-bold uppercase tracking-wider mb-2 block">
                      Account
                    </label>
                    <div className="bg-white/5 rounded-xl border border-white/5 divide-y divide-white/5">
                      <div className="px-4 py-2.5 flex justify-between items-center">
                        <span className="text-xs text-white/40">Name</span>
                        <span className="text-xs text-white font-medium">{session.user.name}</span>
                      </div>
                      <div className="px-4 py-2.5 flex justify-between items-center">
                        <span className="text-xs text-white/40">Email</span>
                        <span className="text-xs text-white font-medium truncate ml-4">{session.user.email}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => signOut().then(() => router.push("/login"))}
                    className="w-full py-2.5 text-rose-500 font-bold text-sm bg-white/5 rounded-xl border border-white/5 active:bg-white/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ====== BOTTOM TAB BAR ====== */}
      <nav className="shrink-0 border-t border-white/5 bg-black/95 backdrop-blur-md pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-around py-1.5">
          <button
            onClick={() => setTab("discover")}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
              tab === "discover" ? "text-white" : "text-white/30"
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={tab === "discover" ? 2.5 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[10px] font-semibold">Discover</span>
          </button>

          <button
            onClick={() => setTab("foryou")}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
              tab === "foryou" ? "text-white" : "text-white/30"
            }`}
          >
            <svg className="w-6 h-6" fill={tab === "foryou" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={tab === "foryou" ? 0 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <span className="text-[10px] font-semibold">For You</span>
          </button>

          <button
            onClick={() => setTab("profile")}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
              tab === "profile" ? "text-white" : "text-white/30"
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={tab === "profile" ? 2.5 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className="text-[10px] font-semibold">Profile</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
