"use client";

import { useState, useCallback } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        if (mode === "signup") {
          const res = await signUp.email({
            email,
            password,
            name,
          });
          if (res.error) {
            setError(res.error.message || "Sign up failed");
          } else {
            router.push("/swipe");
          }
        } else {
          const res = await signIn.email({
            email,
            password,
          });
          if (res.error) {
            setError(res.error.message || "Login failed");
          } else {
            router.push("/swipe");
          }
        }
      } catch {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [email, password, name, mode, router]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto flex flex-col gap-4 relative z-10">
      {mode === "signup" && (
        <div className="relative">
          <input
            type="text"
            placeholder="First Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-6 py-4 bg-zinc-900 border-2 border-transparent focus:border-rose-500 rounded-full text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
          />
        </div>
      )}
      <div className="relative">
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-6 py-4 bg-zinc-900 border-2 border-transparent focus:border-rose-500 rounded-full text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
        />
      </div>
      <div className="relative">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-6 py-4 bg-zinc-900 border-2 border-transparent focus:border-rose-500 rounded-full text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
        />
      </div>
      
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-sm px-4 py-3 rounded-2xl text-center font-medium animate-in fade-in slide-in-from-bottom-2">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-4 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 disabled:opacity-50 text-white font-bold text-lg rounded-full shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {mode === "signup" ? "Creating Profile..." : "Logging In..."}
          </span>
        ) : mode === "signup" ? (
          "Create Account"
        ) : (
          "Log In"
        )}
      </button>
    </form>
  );
}
