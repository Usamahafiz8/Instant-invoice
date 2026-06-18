import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-helpers";
import { auth } from "@/auth";
import { formatMoney, type Currency } from "@/lib/format";
import Onboarding, { type OnboardingStep } from "@/components/Onboarding";

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

  const [customerCount, projectCount, bankCount, profile, invoices] =
    await Promise.all([
      prisma.customer.count({ where: { userId } }),
      prisma.project.count({ where: { userId } }),
      prisma.bankAccount.count({ where: { userId } }),
      prisma.businessProfile.findUnique({ where: { userId } }),
      prisma.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { name: true } } },
      }),
    ]);

  const onboardingSteps: OnboardingStep[] = [
    {
      key: "profile",
      title: "Add your business details",
      desc: "Your name & contact — shown as the FROM on every invoice.",
      href: "/dashboard/settings",
      cta: "Set up",
      done: Boolean(profile?.name),
    },
    {
      key: "customer",
      title: "Add your first customer",
      desc: "The people or companies you bill.",
      href: "/dashboard/customers",
      cta: "Add",
      done: customerCount > 0,
    },
    {
      key: "bank",
      title: "Add a bank account",
      desc: "So clients know exactly where to pay you.",
      href: "/dashboard/banks",
      cta: "Add",
      done: bankCount > 0,
    },
    {
      key: "invoice",
      title: "Create your first invoice",
      desc: "Pick a customer, add line items, export a polished PDF.",
      href: "/dashboard/invoices/new",
      cta: "Create",
      done: invoices.length > 0,
    },
  ];

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hi, {firstName}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-white/50">
            Here’s your invoicing at a glance.
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New invoice
        </Link>
      </div>

      {/* New-user walkthrough — auto-hides when complete or dismissed */}
      <Onboarding steps={onboardingSteps} />

      {/* Stats — one flat divided strip */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-4 dark:border-white/10 dark:bg-white/10">
        <Stat label="Invoices" value={String(invoices.length)} href="/dashboard/invoices" />
        <Stat label="Paid" value={`${paidCount}/${invoices.length}`} href="/dashboard/invoices" />
        <Stat label="Customers" value={String(customerCount)} href="/dashboard/customers" />
        <Stat label="Projects" value={String(projectCount)} href="/dashboard/projects" />
      </div>

      {/* Outstanding — one line */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm">
        <span className="text-slate-500 dark:text-white/50">Outstanding</span>
        <span className="font-semibold">
          {outstandingParts.length ? outstandingParts.join("  ·  ") : "All settled"}
        </span>
      </div>

      {/* Recent invoices */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <span className="text-sm font-semibold">Recent invoices</span>
          <Link
            href="/dashboard/invoices"
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-white/50">
            No invoices yet.{" "}
            <Link
              href="/dashboard/invoices/new"
              className="font-medium text-indigo-600 hover:underline"
            >
              Create one
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <Link
                  href={`/dashboard/invoices/${inv.id}`}
                  className="font-medium hover:text-indigo-600"
                >
                  {inv.invoiceNumber}
                </Link>
                <span className="min-w-0 flex-1 truncate text-slate-500 dark:text-white/50">
                  {inv.customer.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusStyle[inv.status] ?? ""
                  }`}
                >
                  {inv.status}
                </span>
                <span className="font-semibold">
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

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href} className="bg-white p-4 transition hover:bg-slate-50">
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-white/50">
        {label}
      </p>
    </Link>
  );
}
