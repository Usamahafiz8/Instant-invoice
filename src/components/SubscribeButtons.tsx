"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type Plan = "monthly" | "yearly";

export default function SubscribeButtons({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState<Plan | null>(null);
  const [error, setError] = useState("");

  const priceMonthly = process.env.NEXT_PUBLIC_PRICE_MONTHLY;
  const priceYearly = process.env.NEXT_PUBLIC_PRICE_YEARLY;

  async function subscribe(plan: Plan) {
    setError("");
    setLoading(plan);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        setError(data?.error ?? "Could not start checkout. Try again.");
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not start checkout. Try again.");
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Monthly */}
        <button
          onClick={() => subscribe("monthly")}
          disabled={disabled || loading !== null}
          className="flex flex-col items-start gap-1 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-indigo-400 disabled:opacity-60 dark:border-white/10"
        >
          <span className="text-sm font-semibold">Monthly</span>
          {priceMonthly && (
            <span className="text-2xl font-bold tracking-tight">
              {priceMonthly}
              <span className="text-sm font-medium text-slate-400">/mo</span>
            </span>
          )}
          <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
            {loading === "monthly" && <Loader2 className="h-4 w-4 animate-spin" />}
            Subscribe monthly
          </span>
        </button>

        {/* Yearly */}
        <button
          onClick={() => subscribe("yearly")}
          disabled={disabled || loading !== null}
          className="relative flex flex-col items-start gap-1 rounded-2xl border border-indigo-300 bg-white p-5 text-left transition hover:border-indigo-500 disabled:opacity-60 dark:border-indigo-500/40"
        >
          <span className="absolute right-3 top-3 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Best value
          </span>
          <span className="text-sm font-semibold">Yearly</span>
          {priceYearly && (
            <span className="text-2xl font-bold tracking-tight">
              {priceYearly}
              <span className="text-sm font-medium text-slate-400">/yr</span>
            </span>
          )}
          <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
            {loading === "yearly" && <Loader2 className="h-4 w-4 animate-spin" />}
            Subscribe yearly
          </span>
        </button>
      </div>

      {disabled && (
        <p className="mt-3 text-xs text-amber-600">
          Billing isn’t configured yet — add your Lemon Squeezy keys to enable checkout.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
