"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, X, Rocket } from "lucide-react";

export type OnboardingStep = {
  key: string;
  title: string;
  desc: string;
  href: string;
  cta: string;
  done: boolean;
};

const STORAGE_KEY = "ii-onboarding-dismissed";

export default function Onboarding({ steps }: { steps: OnboardingStep[] }) {
  // Start hidden to avoid a flash before we can read localStorage.
  const [hidden, setHidden] = useState(true);

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const nextIdx = steps.findIndex((s) => !s.done);
  const pct = Math.round((doneCount / steps.length) * 100);

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (allDone || hidden) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setHidden(true);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition hover:bg-black/[0.04] hover:text-slate-600 dark:hover:bg-white/[0.06]"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
          <Rocket className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Getting started</h2>
          <p className="text-xs text-slate-500 dark:text-white/50">
            {doneCount} of {steps.length} steps complete
          </p>
        </div>
      </div>

      {/* progress */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* steps */}
      <ol className="mt-4 space-y-2">
        {steps.map((s, i) => {
          const isNext = i === nextIdx;
          return (
            <li
              key={s.key}
              className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 dark:border-white/[0.06]"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  s.done
                    ? "bg-green-100 text-green-700"
                    : isNext
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    s.done ? "text-slate-400 line-through dark:text-white/40" : ""
                  }`}
                >
                  {s.title}
                </p>
                {!s.done && (
                  <p className="text-xs text-slate-500 dark:text-white/50">{s.desc}</p>
                )}
              </div>

              {!s.done && (
                <Link
                  href={s.href}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isNext
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white hover:opacity-90"
                      : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:text-white/60"
                  }`}
                >
                  {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
