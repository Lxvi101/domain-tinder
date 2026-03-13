import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl font-bold text-white mb-2">
        Domain<span className="text-emerald-400">Tinder</span>
      </div>
      <p className="text-zinc-400 text-lg max-w-md mb-10">
        Swipe right on your perfect domain. AI-powered suggestions, only
        available domains.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/signup"
          className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-center transition-colors"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="block w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl text-center transition-colors"
        >
          Log In
        </Link>
      </div>
    </main>
  );
}
