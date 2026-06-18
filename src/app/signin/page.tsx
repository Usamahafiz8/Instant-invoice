"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import GoogleSignIn from "@/components/GoogleSignIn";

const AUTH_ERRORS: Record<string, string> = {
  OAuthCallbackError: "Google sign-in failed. Please try again.",
  OAuthSignin: "Could not start Google sign-in. Please try again.",
  SessionRequired: "Please sign in to continue.",
};

function SignInForm() {
  const params = useSearchParams();

  const raw = params.get("callbackUrl") ?? "";
  const callbackUrl =
    raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";

  const errorCode = params.get("error") ?? "";
  const error = errorCode
    ? (AUTH_ERRORS[errorCode] ?? "Something went wrong. Please try again.")
    : "";

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-white/50">
        Sign in with Google — we&apos;ll create your account automatically if
        you&apos;re new.
      </p>

      <div className="mt-8 space-y-3">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}
        <GoogleSignIn callbackUrl={callbackUrl} label="Continue with Google" />
      </div>
    </AuthLayout>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
