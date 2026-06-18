"use client";

import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";

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

  const plans = [
    {
      id: "monthly" as Plan,
      name: "Monthly",
      price: priceMonthly,
      period: "/mo",
      note: "Flexible — cancel anytime",
      featured: false,
    },
    {
      id: "yearly" as Plan,
      name: "Yearly",
      price: priceYearly,
      period: "/yr",
      note: "Best value — save vs monthly",
      featured: true,
    },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((p, i) => (
          <div
            key={p.id}
            style={{ animationDelay: `${i * 90}ms` }}
            className={`animate-rise group relative overflow-hidden rounded-2xl p-5 transition duration-300 hover:-translate-y-1 ${
              p.featured
                ? "border-2 border-indigo-400/70 bg-white shadow-lg shadow-indigo-500/10 dark:border-indigo-500/50"
                : "border border-slate-200 bg-white hover:border-indigo-300 dark:border-white/10"
            }`}
          >
            {p.featured && (
              <>
                <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-indigo-400/15 blur-2xl transition-opacity duration-300 group-hover:opacity-150 dark:bg-indigo-500/20" />
                <span className="absolute right-3 top-3 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                  Best value
                </span>
              </>
            )}

            <p className="relative text-sm font-semibold">{p.name}</p>

            <p className="relative mt-2 flex items-end gap-1">
              {p.price ? (
                <>
                  <span className="text-3xl font-bold tracking-tight">{p.price}</span>
                  <span className="pb-1 text-sm font-medium text-slate-400">
                    {p.period}
                  </span>
                </>
              ) : (
                <span className="text-sm text-slate-400">Price shown at checkout</span>
              )}
            </p>

            <p className="relative mt-1 text-xs text-slate-500 dark:text-white/50">
              {p.note}
            </p>

            <button
              onClick={() => subscribe(p.id)}
              disabled={disabled || loading !== null}
              className={`relative mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                p.featured
                  ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm hover:shadow-md"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-white/80"
              }`}
            >
              {loading === p.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Subscribe {p.name.toLowerCase()}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        ))}
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
