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
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-4">
      {mode === "signup" && (
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
      >
        {loading ? "..." : mode === "signup" ? "Sign Up" : "Log In"}
      </button>
    </form>
  );
}
