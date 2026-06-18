import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, type Currency } from "@/lib/format";
import { Users, FileText, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  PAID: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

export default async function AdminOverview() {
  const [userCount, invoiceGroups, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.invoice.groupBy({
      by: ["status", "currency"],
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { invoices: true } },
      },
    }),
  ]);

  const totalInvoices = invoiceGroups.reduce((s, g) => s + g._count._all, 0);

  // Revenue by currency
  const revenue: Record<string, number> = {};
  for (const g of invoiceGroups) {
    revenue[g.currency] = (revenue[g.currency] ?? 0) + Number(g._sum.total ?? 0);
  }

  // Invoice counts by status
  const byStatus: Record<string, number> = {};
  for (const g of invoiceGroups) {
    byStatus[g.status] = (byStatus[g.status] ?? 0) + g._count._all;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-white/40">
          Platform-wide data — visible only to you.
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Users"
          value={userCount.toLocaleString()}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Total Invoices"
          value={totalInvoices.toLocaleString()}
          icon={<FileText className="h-4 w-4" />}
        />
        {Object.entries(revenue).map(([currency, amount]) => (
          <StatCard
            key={currency}
            label={`Revenue (${currency})`}
            value={formatMoney(amount, currency as Currency)}
          />
        ))}
      </div>

      {/* Invoice status breakdown */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-white/70">
          Invoices by status
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(byStatus).map(([status, count]) => (
            <span
              key={status}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[status] ?? "bg-slate-100 text-slate-600"}`}
            >
              {STATUS_LABEL[status] ?? status}
              <span className="opacity-70">·</span>
              {count}
            </span>
          ))}
        </div>
      </section>

      {/* Recent sign-ups */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-white/70">
            Recent sign-ups
          </h2>
          <Link
            href="/dashboard/admin/users"
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            All users <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white/70 backdrop-blur dark:border-white/[0.07] dark:bg-white/[0.03]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.05] dark:border-white/[0.06]">
                <th className={th}>User</th>
                <th className={th}>Joined</th>
                <th className={`${th} text-right`}>Invoices</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-black/[0.04] last:border-0 dark:border-white/[0.05]"
                >
                  <td className={td}>
                    <Link
                      href={`/dashboard/admin/users/${u.id}`}
                      className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {u.name ?? "—"}
                    </Link>
                    <span className="ml-2 text-xs text-slate-400 dark:text-white/30">
                      {u.email}
                    </span>
                  </td>
                  <td className={td}>
                    {new Date(u.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className={`${td} text-right`}>{u._count.invoices}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white/70 p-4 backdrop-blur dark:border-white/[0.07] dark:bg-white/[0.03]">
      {icon && (
        <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          {icon}
        </div>
      )}
      <p className="text-xs text-slate-500 dark:text-white/40">{label}</p>
      <p className="mt-0.5 text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}

const th =
  "px-4 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-white/40";
const td = "px-4 py-3 text-slate-700 dark:text-white/70";
