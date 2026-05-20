"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import BookIcon from "@/components/BookIcon";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import ColdStartNotice from "@/components/ColdStartNotice";

export default function LoginPage() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await authApi.login(email, password);
      setToken(token);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="nb-enter">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="nb-halo">
          <BookIcon className="h-12 w-12 text-amber-700 dark:text-amber-300" />
        </div>
        <p className="nb-brand text-4xl font-bold tracking-tight">
          NousBooks
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Your reading, distilled.</p>
      </div>
    <div className="nb-surface rounded-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">Welcome back</h1>

      <ColdStartNotice />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Email</label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="nb-input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="nb-input"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="nb-btn-primary mt-1 rounded-lg py-2.5 text-sm font-semibold tracking-tight disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* Divider + Google sign-in */}
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-zinc-400">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-300 to-transparent dark:via-zinc-700" />
        <span>or</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-300 to-transparent dark:via-zinc-700" />
      </div>
      <GoogleSignInButton />

      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No account?{" "}
        <Link href="/register" className="font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-400">
          Create one
        </Link>
      </p>
    </div>
    </div>
  );
}
