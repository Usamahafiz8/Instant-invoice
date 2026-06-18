"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleSignIn from "@/components/GoogleSignIn";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Wrong email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-white/50">
        Sign in to your Instant Invoice workspace.
      </p>

      <div className="mt-8">
        <GoogleSignIn callbackUrl={callbackUrl} label="Sign in with Google" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Email</label>
          <div className={fieldClass}>
            <Mail className={iconClass} />
            <input
              className={inputClass}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Password</label>
          <div className={fieldClass}>
            <Lock className={iconClass} />
            <input
              className={`${inputClass} pr-10`}
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:text-slate-600 dark:hover:text-white/70"
            >
              {showPw ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-white/50">
        New here?{" "}
        <Link
          href="/signup"
          className="font-medium text-indigo-600 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}

const labelClass =
  "mb-1.5 block text-xs font-medium text-slate-600 dark:text-white/60";
const fieldClass =
  "relative flex items-center rounded-lg border border-slate-300 bg-white/60 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:bg-white/[0.03]";
const iconClass =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400";
const inputClass =
  "w-full bg-transparent py-2.5 pl-10 pr-3.5 text-sm placeholder:text-slate-400 focus:outline-none dark:placeholder:text-white/30";

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
