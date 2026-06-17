import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  CheckCircle2,
  Users,
  FolderKanban,
  Plus,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-helpers";
import { auth } from "@/auth";
import { formatMoney, type Currency } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusStyle: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export default async function DashboardHome() {
  const userId = await getUserId();
  if (!userId) redirect("/signin");
  const session = await auth();

  const [customerCount, projectCount, invoices] = await Promise.all([
    prisma.customer.count({ where: { userId } }),
    prisma.project.count({ where: { userId } }),
    prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
  ]);

  const outstanding: Record<string, number> = {};
  let paidCount = 0;
  for (const inv of invoices) {
    if (inv.status === "PAID") paidCount++;
    else
      outstanding[inv.currency] =
        (outstanding[inv.currency] ?? 0) + Number(inv.total);
  }
  const outstandingParts = Object.entries(outstanding)
    .filter(([, v]) => v > 0)
    .map(([c, v]) => formatMoney(v, c as Currency));

  const firstName = (session?.user?.name ?? "there").split(" ")[0];
  const recent = invoices.slice(0, 5);

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-6 shadow-sm sm:p-8 dark:border-white/[0.08]">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-100">Welcome back</p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-indigo-100">
              Here’s your invoicing at a glance.
            </p>
          </div>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
          >
            <Plus className="h-4 w-4" /> New invoice
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Invoices"
          value={String(invoices.length)}
          href="/invoices"
          icon={FileText}
          tint="indigo"
        />
        <Stat
          label="Paid"
          value={`${paidCount}/${invoices.length}`}
          href="/invoices"
          icon={CheckCircle2}
          tint="green"
        />
        <Stat
          label="Customers"
          value={String(customerCount)}
          href="/customers"
          icon={Users}
          tint="blue"
        />
        <Stat
          label="Projects"
          value={String(projectCount)}
          href="/projects"
          icon={FolderKanban}
          tint="violet"
        />
      </div>

      {/* Outstanding */}
      <div className="mt-3 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15">
          <Wallet className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Outstanding
          </p>
          <p className="mt-0.5 text-xl font-bold text-amber-600">
            {outstandingParts.length
              ? outstandingParts.join("  ·  ")
              : "All settled 🎉"}
          </p>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <span className="text-sm font-semibold text-slate-800">
            Recent invoices
          </span>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15">
              <FileText className="h-6 w-6" />
            </span>
            <p className="text-sm text-slate-500">No invoices yet.</p>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Create your first invoice
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center gap-3 px-5 py-3.5 text-sm transition hover:bg-slate-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <FileText className="h-4 w-4" />
                </span>
                <Link
                  href={`/invoices/${inv.id}`}
                  className="font-semibold text-slate-900 hover:text-indigo-600"
                >
                  {inv.invoiceNumber}
                </Link>
                <span className="min-w-0 flex-1 truncate text-slate-500">
                  {inv.customer.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusStyle[inv.status] ?? ""
                  }`}
                >
                  {inv.status}
                </span>
                <span className="w-24 text-right font-semibold text-slate-800">
                  {formatMoney(Number(inv.total), inv.currency as Currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const tints: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
  green: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
};

function Stat({
  label,
  value,
  href,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string;
  href: string;
  icon: React.ElementType;
  tint: keyof typeof tints | string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${tints[tint] ?? tints.indigo}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </Link>
  );
}
