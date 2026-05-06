"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import BookIcon from "@/components/BookIcon";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import ColdStartNotice from "@/components/ColdStartNotice";

export default function RegisterPage() {
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
      const { token } = await authApi.register(email, password);
      setToken(token);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError("This email is already registered.");
        } else if (err.status === 400) {
          const body = err.body as { errors?: Record<string, string> };
          const messages = Object.values(body.errors ?? {}).join(" ");
          setError(messages || "Check your input and try again.");
        } else {
          setError("Something went wrong. Try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-center gap-2">
        <BookIcon className="h-10 w-10 text-zinc-700 dark:text-zinc-200" />
        <p className="text-3xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
          NousBooks
        </p>
      </div>
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-600 dark:text-zinc-200">
        Create account
      </h1>

      <ColdStartNotice />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-700"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-700"
          />
          <p className="text-xs text-zinc-400">At least 8 characters</p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      {/* Divider + Google sign-in (same flow as login: account is created on
          first Google sign-in if it doesn't exist yet) */}
      <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        <span>or</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <GoogleSignInButton />

      <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          Sign in
        </Link>
      </p>
    </div>
    </div>
  );
}
