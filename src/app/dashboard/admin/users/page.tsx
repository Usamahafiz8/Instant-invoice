import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, type Currency } from "@/lib/format";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const SUB_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  on_trial: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  expired: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
  past_due: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
};

export default async function AdminUsersPage() {
  const [users, revenueRows] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        subscription: { select: { status: true } },
        _count: { select: { invoices: true, customers: true } },
      },
    }),
    prisma.invoice.groupBy({
      by: ["userId", "currency"],
      _sum: { total: true },
    }),
  ]);

  // Build a revenue map: userId → { PKR: n, USD: n }
  const revenueMap: Record<string, Record<string, number>> = {};
  for (const row of revenueRows) {
    if (!revenueMap[row.userId]) revenueMap[row.userId] = {};
    revenueMap[row.userId][row.currency] =
      (revenueMap[row.userId][row.currency] ?? 0) + Number(row._sum.total ?? 0);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/admin"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:text-white/40 dark:hover:text-white/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Admin
        </Link>
        <span className="text-slate-300 dark:text-white/20">/</span>
        <h1 className="text-xl font-bold tracking-tight">All Users</h1>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-white/[0.07] dark:text-white/50">
          {users.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white/70 backdrop-blur dark:border-white/[0.07] dark:bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/[0.05] dark:border-white/[0.06]">
              <th className={th}>User</th>
              <th className={th}>Joined</th>
              <th className={th}>Subscription</th>
              <th className={`${th} text-right`}>Invoices</th>
              <th className={`${th} text-right`}>Customers</th>
              <th className={`${th} text-right`}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const rev = revenueMap[u.id] ?? {};
              const subStatus = u.subscription?.status ?? null;

              return (
                <tr
                  key={u.id}
                  className="border-b border-black/[0.04] last:border-0 dark:border-white/[0.05]"
                >
                  <td className={td}>
                    <Link
                      href={`/dashboard/admin/users/${u.id}`}
                      className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {u.name ?? <span className="text-slate-400">No name</span>}
                    </Link>
                    <div className="text-xs text-slate-400 dark:text-white/30">
                      {u.email}
                    </div>
                  </td>
                  <td className={td}>
                    {new Date(u.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className={td}>
                    {subStatus ? (
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${SUB_BADGE[subStatus] ?? "bg-slate-100 text-slate-500"}`}
                      >
                        {subStatus.replace("_", " ")}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-white/30">
                        none
                      </span>
                    )}
                  </td>
                  <td className={`${td} text-right`}>{u._count.invoices}</td>
                  <td className={`${td} text-right`}>{u._count.customers}</td>
                  <td className={`${td} text-right`}>
                    {Object.keys(rev).length === 0 ? (
                      <span className="text-slate-400 dark:text-white/30">—</span>
                    ) : (
                      <div className="space-y-0.5">
                        {Object.entries(rev).map(([cur, amt]) => (
                          <div key={cur} className="whitespace-nowrap">
                            {formatMoney(amt, cur as Currency)}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th =
  "px-4 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-white/40";
const td = "px-4 py-3 align-top text-slate-700 dark:text-white/70";
