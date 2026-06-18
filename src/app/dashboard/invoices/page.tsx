import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-helpers";
import { formatMoney, type Currency } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusStyle: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export default async function InvoicesPage() {
  const userId = await getUserId();
  if (!userId) redirect("/signin");

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Link
          href="/dashboard/invoices/new"
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          + New Invoice
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {invoices.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No invoices yet.{" "}
            <Link href="/dashboard/invoices/new" className="text-slate-900 underline">
              Create your first one →
            </Link>
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/invoices/${inv.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{inv.customer.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusStyle[inv.status] ?? ""
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMoney(Number(inv.total), inv.currency as Currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
