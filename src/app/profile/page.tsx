"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const TLD_OPTIONS = [
  ".com",
  ".de",
  ".io",
  ".dev",
  ".app",
  ".co",
  ".net",
  ".org",
  ".ai",
  ".xyz",
  ".tech",
  ".me",
  ".so",
  ".gg",
  ".sh",
];

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [selectedTlds, setSelectedTlds] = useState<string[]>([".com"]);
  const [mode, setMode] = useState<"bidomainial" | "polydomainial">(
    "bidomainial"
  );
  const [liked, setLiked] = useState<{ domain: string; createdAt: string }[]>(
    []
  );
  const [tab, setTab] = useState<"matches" | "preferences">("matches");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

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
        if (data.domains) {
          setLiked(
            data.domains.map((d: string | { domain: string; createdAt: string }) =>
              typeof d === "string" ? { domain: d, createdAt: "" } : d
            )
          );
        }
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
      const next =
        prev === "bidomainial" ? "polydomainial" : "bidomainial";
      savePrefs(selectedTlds, next);
      return next;
    });
  }, [selectedTlds, savePrefs]);

  const removeMatch = useCallback(
    async (domain: string) => {
      setLiked((prev) => prev.filter((d) => d.domain !== domain));
      await fetch("/api/domains/swipe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
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
    <main className="min-h-dvh bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-20 shrink-0">
        <button
          onClick={() => router.push("/swipe")}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 active:scale-90 transition-all"
          aria-label="Back to swiping"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-lg font-black bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent">
          Profile
        </h1>
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
      </header>

      {/* User info */}
      <div className="flex flex-col items-center pt-6 pb-4 px-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-white font-black text-2xl mb-3">
          {session.user.name?.charAt(0).toUpperCase() || "?"}
        </div>
        <h2 className="text-xl font-bold text-white">{session.user.name}</h2>
        <p className="text-zinc-500 text-sm">{session.user.email}</p>
        <div className="flex gap-6 mt-4 text-center">
          <div>
            <div className="text-xl font-bold text-white">
              {liked.length}
            </div>
            <div className="text-xs text-zinc-500">Matches</div>
          </div>
          <div className="w-px bg-zinc-800" />
          <div>
            <div className="text-xl font-bold text-white">
              {selectedTlds.length}
            </div>
            <div className="text-xs text-zinc-500">TLDs</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-900 px-4">
        <button
          onClick={() => setTab("matches")}
          className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${
            tab === "matches"
              ? "text-rose-500 border-b-2 border-rose-500"
              : "text-zinc-500"
          }`}
        >
          Matches ({liked.length})
        </button>
        <button
          onClick={() => setTab("preferences")}
          className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${
            tab === "preferences"
              ? "text-rose-500 border-b-2 border-rose-500"
              : "text-zinc-500"
          }`}
        >
          Preferences
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        {tab === "matches" && (
          <div className="px-4 py-4">
            {liked.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-zinc-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <p className="text-zinc-500 text-sm">
                  No matches yet. Start swiping!
                </p>
                <button
                  onClick={() => router.push("/swipe")}
                  className="mt-4 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-bold rounded-full active:scale-95 transition-transform"
                >
                  Start Swiping
                </button>
              </div>
            ) : (
              <ul className="space-y-2">
                {liked.map((item) => (
                  <li
                    key={item.domain}
                    className="flex items-center gap-3 bg-zinc-900 rounded-2xl p-3 border border-zinc-800"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-orange-400 shrink-0 flex items-center justify-center text-white font-bold text-sm">
                      {item.domain.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm truncate">
                        {item.domain}
                      </div>
                      <div className="text-emerald-400 text-xs font-semibold">
                        Available
                      </div>
                    </div>
                    <button
                      onClick={() => removeMatch(item.domain)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-600 active:text-rose-500 transition-colors shrink-0"
                      aria-label="Remove match"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "preferences" && (
          <div className="px-4 py-4 space-y-6">
            {/* TLDs */}
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-3 block">
                Preferred TLDs
              </label>
              <div className="flex flex-wrap gap-2">
                {TLD_OPTIONS.map((tld) => (
                  <button
                    key={tld}
                    onClick={() => toggleTld(tld)}
                    className={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
                      selectedTlds.includes(tld)
                        ? "bg-rose-500 text-white"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                    }`}
                  >
                    {tld}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-3 block">
                Domain Style
              </label>
              <button
                onClick={toggleMode}
                className="block w-full text-left px-4 py-3 bg-zinc-900 rounded-2xl text-white border border-zinc-800 active:bg-zinc-800 transition-colors"
              >
                <span className="font-bold text-base text-rose-400">
                  {mode === "bidomainial"
                    ? "Short & Punchy"
                    : "Compound & Creative"}
                </span>
                <span className="text-zinc-500 text-sm block mt-0.5">
                  {mode === "bidomainial"
                    ? "Single-word or two-word domains (e.g., stripe.com)"
                    : "Multi-word combos (e.g., mailchimp.com)"}
                </span>
              </button>
            </div>

            {/* Account section */}
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-3 block">
                Account
              </label>
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 divide-y divide-zinc-800">
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-sm text-zinc-400">Name</span>
                  <span className="text-sm text-white font-medium">
                    {session.user.name}
                  </span>
                </div>
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-sm text-zinc-400">Email</span>
                  <span className="text-sm text-white font-medium truncate ml-4">
                    {session.user.email}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => signOut().then(() => router.push("/login"))}
              className="w-full py-3 text-rose-500 font-bold text-sm bg-zinc-900 rounded-2xl border border-zinc-800 active:bg-zinc-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
