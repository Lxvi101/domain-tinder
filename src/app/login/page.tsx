import { AuthForm } from "@/components/auth-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
      <p className="text-zinc-500 mb-8">Find your perfect domain match</p>
      <AuthForm mode="login" />
      <p className="mt-6 text-zinc-500 text-sm">
        No account?{" "}
        <Link href="/signup" className="text-emerald-400 hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
