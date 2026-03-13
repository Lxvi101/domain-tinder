import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 flex flex-col items-center">
        <div className="flex items-center gap-2 text-6xl font-black text-white mb-4 tracking-tight">
          <svg className="w-12 h-12 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
             <path d="M17.5 12.4c-1.5-2-4-3-4-5.4 0-1.8 1.1-3.6 2.8-4.4-.8-.4-1.8-.6-2.8-.6-4.4 0-8 3.6-8 8 0 1.5.4 2.9 1.1 4.1-1.8 1.5-3 3.8-3 6.3 0 .4 0 .8.1 1.2 2.3-1.6 5-2.6 7.9-2.6 1.7 0 3.3.3 4.9.9 2.1-1.6 3.4-4 3.4-6.8 0-.2 0-.4-.1-.7z"/>
          </svg>
          Domain<span className="bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent">Tinder</span>
        </div>
        
        <h2 className="text-zinc-300 text-xl max-w-md mb-2 font-medium">
          Swipe right on your perfect domain.
        </h2>
        <p className="text-zinc-500 text-base max-w-sm mb-12">
          Stop staring at endless lists. Let our AI find available domains, you just swipe until you feel a spark.
        </p>
        
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Link
            href="/signup"
            className="block w-full py-4 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold text-lg rounded-full text-center shadow-lg hover:scale-[1.02] transition-transform"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="block w-full py-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold text-lg rounded-full text-center transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
