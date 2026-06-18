import { redirect } from "next/navigation";
import { Check, ExternalLink, Sparkles, CreditCard } from "lucide-react";
import { getUserId } from "@/lib/auth-helpers";
import { getAccess } from "@/lib/subscription";
import { lemonSqueezyConfigured } from "@/lib/lemonsqueezy";
import SubscribeButtons from "@/components/SubscribeButtons";

export const dynamic = "force-dynamic";

const FEATURES = [
  "Unlimited invoices & customers",
  "Projects & milestones",
  "Polished PDF export",
  "Bill in PKR or USD",
  "Bank details on every invoice",
  "Light & dark workspace",
];

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  on_trial: "On trial",
  past_due: "Past due",
  paused: "Paused",
  unpaid: "Unpaid",
  cancelled: "Cancelled",
  expired: "Expired",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/signin");

  const { success } = await searchParams;
  const access = await getAccess(userId);
  const sub = access.subscription;
  const configured = lemonSqueezyConfigured();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="animate-rise">
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-white/50">
          Manage your Instant Invoice subscription.
        </p>
      </div>

      {success && (
        <div className="animate-rise rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700 dark:border-green-500/25 dark:bg-green-500/10">
          🎉 Thanks for subscribing! Your plan is being activated — it may take a
          few seconds to appear here.
        </div>
      )}

      {access.isSubscribed && sub ? (
        /* ---- Active subscriber ---- */
        <div
          className="animate-rise relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10"
          style={{ animationDelay: "60ms" }}
        >
          <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-indigo-400/15 blur-2xl dark:bg-indigo-500/20" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <CreditCard className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">Pro plan</p>
                <p className="text-sm text-slate-500 dark:text-white/50">
                  {STATUS_LABEL[sub.status] ?? sub.status}
                  {sub.cardLastFour && ` · ${sub.cardBrand ?? "card"} •••• ${sub.cardLastFour}`}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
              {STATUS_LABEL[sub.status] ?? sub.status}
            </span>
          </div>

          <dl className="relative mt-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {sub.status === "cancelled" ? (
              <Row label="Access until" value={fmtDate(sub.endsAt)} />
            ) : (
              <Row label="Renews on" value={fmtDate(sub.renewsAt)} />
            )}
            {sub.trialEndsAt && sub.status === "on_trial" && (
              <Row label="Trial ends" value={fmtDate(sub.trialEndsAt)} />
            )}
          </dl>

          {sub.portalUrl && (
            <a
              href={sub.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative mt-5 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/15"
            >
              Manage subscription <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <p className="relative mt-2 text-xs text-slate-400">
            Update payment method, change plan, or cancel via the customer portal.
          </p>
        </div>
      ) : (
        /* ---- Trial / expired: show plans ---- */
        <>
          <div
            className={`animate-rise rounded-2xl border px-5 py-4 text-sm ${
              access.isTrial
                ? "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-200"
                : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200"
            }`}
            style={{ animationDelay: "60ms" }}
          >
            {access.isTrial ? (
              <>
                You’re on a free trial —{" "}
                <strong>
                  {access.daysLeftInTrial} day{access.daysLeftInTrial === 1 ? "" : "s"} left
                </strong>
                . Subscribe any time to keep your workspace after it ends.
              </>
            ) : (
              <>Your free trial has ended. Subscribe to continue using Instant Invoice.</>
            )}
          </div>

          {/* Upgrade hero */}
          <div className="animate-rise text-center" style={{ animationDelay: "120ms" }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" /> Upgrade to Pro
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need to{" "}
              <span className="animate-gradient bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                get paid
              </span>
            </h2>
            <ul className="mx-auto mt-4 grid max-w-md gap-x-6 gap-y-2 text-left text-sm text-slate-600 sm:grid-cols-2 dark:text-white/70">
              {FEATURES.map((f, i) => (
                <li
                  key={f}
                  className="animate-rise flex items-center gap-2"
                  style={{ animationDelay: `${160 + i * 60}ms` }}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                    <Check className="h-3 w-3" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <SubscribeButtons disabled={!configured} />
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
