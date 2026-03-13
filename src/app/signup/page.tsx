import { AuthForm } from "@/components/auth-form";
import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-white mb-2">Join DomainTinder</h1>
      <p className="text-zinc-500 mb-8">Swipe your way to the perfect domain</p>
      <AuthForm mode="signup" />
      <p className="mt-6 text-zinc-500 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-emerald-400 hover:underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
