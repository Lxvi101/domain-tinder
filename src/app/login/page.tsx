import { AuthForm } from "@/components/auth-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-orange-400 rounded-2xl rotate-12 flex items-center justify-center mb-8 shadow-xl shadow-rose-500/20">
         <svg className="w-8 h-8 text-white -rotate-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.5 12.4c-1.5-2-4-3-4-5.4 0-1.8 1.1-3.6 2.8-4.4-.8-.4-1.8-.6-2.8-.6-4.4 0-8 3.6-8 8 0 1.5.4 2.9 1.1 4.1-1.8 1.5-3 3.8-3 6.3 0 .4 0 .8.1 1.2 2.3-1.6 5-2.6 7.9-2.6 1.7 0 3.3.3 4.9.9 2.1-1.6 3.4-4 3.4-6.8 0-.2 0-.4-.1-.7z"/>
         </svg>
      </div>

      <h1 className="text-4xl font-black text-white mb-2 tracking-tight z-10 text-center">Welcome Back</h1>
      <p className="text-zinc-400 mb-10 z-10 text-center font-medium">Ready to find your perfect match?</p>
      
      <AuthForm mode="login" />
      
      <p className="mt-8 text-zinc-500 text-sm font-medium z-10">
        New here?{" "}
        <Link href="/signup" className="text-rose-400 hover:text-rose-300 transition-colors font-bold underline decoration-rose-500/30 underline-offset-4">
          Create an account
        </Link>
      </p>
    </main>
  );
}
