import { AuthForm } from "@/components/auth-form";
import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-orange-400 rounded-2xl -rotate-12 flex items-center justify-center mb-8 shadow-xl shadow-rose-500/20">
         <svg className="w-8 h-8 text-white rotate-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
         </svg>
      </div>

      <h1 className="text-4xl font-black text-white mb-2 tracking-tight z-10 text-center">Start Swiping</h1>
      <p className="text-zinc-400 mb-10 z-10 text-center font-medium">Create an account to save your domain matches.</p>
      
      <AuthForm mode="signup" />
      
      <p className="mt-8 text-zinc-500 text-sm font-medium z-10">
        Already have an account?{" "}
        <Link href="/login" className="text-rose-400 hover:text-rose-300 transition-colors font-bold underline decoration-rose-500/30 underline-offset-4">
          Log in
        </Link>
      </p>
    </main>
  );
}
