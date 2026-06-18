import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney, type Currency } from "@/lib/format";
import { ArrowLeft, Mail, CalendarDays, FileText, Users, FolderKanban } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  PAID: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
};

const SUB_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  on_trial: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  expired: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
};

export default async function AdminUserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, invoices, customers, projects] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: { subscription: true },
    }),
    prisma.invoice.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
    prisma.customer.findMany({
      where: { userId: id },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
  ]);

  if (!user) notFound();

  const totalByCurrency: Record<string, number> = {};
  for (const inv of invoices) {
    totalByCurrency[inv.currency] =
      (totalByCurrency[inv.currency] ?? 0) + Number(inv.total);
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-white/40">
        <Link href="/dashboard/admin" className="hover:text-slate-800 dark:hover:text-white/80">
          Admin
        </Link>
        <span>/</span>
        <Link href="/dashboard/admin/users" className="hover:text-slate-800 dark:hover:text-white/80">
          Users
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-white/70">{user.name ?? user.email}</span>
      </div>

      {/* User card */}
      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-black/[0.06] bg-white/70 p-5 backdrop-blur dark:border-white/[0.07] dark:bg-white/[0.03]">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white">
          {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
        </span>
        <div className="flex-1 space-y-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight">{user.name ?? "No name"}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-white/40">
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Joined{" "}
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          {user.subscription && (
            <div className="pt-1">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  SUB_BADGE[user.subscription.status] ?? "bg-slate-100 text-slate-500"
                }`}
              >
                {user.subscription.status.replace("_", " ")}
              </span>
            </div>
          )}
        </div>

        {/* Revenue summary */}
        {Object.keys(totalByCurrency).length > 0 && (
          <div className="shrink-0 space-y-0.5 text-right">
            <p className="text-xs text-slate-400 dark:text-white/30">Total revenue</p>
            {Object.entries(totalByCurrency).map(([cur, amt]) => (
              <p key={cur} className="font-bold">
                {formatMoney(amt, cur as Currency)}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      <Section
        title="Invoices"
        icon={<FileText className="h-4 w-4" />}
        count={invoices.length}
      >
        {invoices.length === 0 ? (
          <Empty text="No invoices yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.05] dark:border-white/[0.06]">
                <th className={th}>Invoice #</th>
                <th className={th}>Customer</th>
                <th className={th}>Status</th>
                <th className={th}>Date</th>
                <th className={`${th} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-black/[0.04] last:border-0 dark:border-white/[0.05]"
                >
                  <td className={td}>
                    <span className="font-mono text-xs">{inv.invoiceNumber}</span>
                  </td>
                  <td className={td}>{inv.customer.name}</td>
                  <td className={td}>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        STATUS_COLOR[inv.status] ?? ""
                      }`}
                    >
                      {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className={td}>
                    {new Date(inv.issueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className={`${td} text-right font-medium`}>
                    {formatMoney(Number(inv.total), inv.currency as Currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Customers */}
      <Section
        title="Customers"
        icon={<Users className="h-4 w-4" />}
        count={customers.length}
      >
        {customers.length === 0 ? (
          <Empty text="No customers yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.05] dark:border-white/[0.06]">
                <th className={th}>Name</th>
                <th className={th}>Email</th>
                <th className={th}>Phone</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-black/[0.04] last:border-0 dark:border-white/[0.05]"
                >
                  <td className={`${td} font-medium`}>{c.name}</td>
                  <td className={td}>{c.email ?? "—"}</td>
                  <td className={td}>{c.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Projects */}
      <Section
        title="Projects"
        icon={<FolderKanban className="h-4 w-4" />}
        count={projects.length}
      >
        {projects.length === 0 ? (
          <Empty text="No projects yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.05] dark:border-white/[0.06]">
                <th className={th}>Project</th>
                <th className={th}>Customer</th>
                <th className={th}>Currency</th>
                <th className={th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-black/[0.04] last:border-0 dark:border-white/[0.05]"
                >
                  <td className={`${td} font-medium`}>{p.name}</td>
                  <td className={td}>{p.customer.name}</td>
                  <td className={td}>{p.currency}</td>
                  <td className={td}>
                    {new Date(p.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-white/70">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-white/[0.07] dark:text-white/40">
          {count}
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white/70 backdrop-blur dark:border-white/[0.07] dark:bg-white/[0.03]">
        {children}
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="px-4 py-6 text-center text-sm text-slate-400 dark:text-white/30">{text}</p>
  );
}

const th =
  "px-4 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-white/40";
const td = "px-4 py-3 text-slate-700 dark:text-white/70";
