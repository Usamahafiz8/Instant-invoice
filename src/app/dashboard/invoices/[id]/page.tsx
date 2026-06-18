import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-helpers";
import { formatMoney, type Currency } from "@/lib/format";
import InvoiceActions from "./actions";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/signin");
  const { id } = await params;
  const [invoice, profile] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, userId },
      include: {
        customer: true,
        items: true,
        bankAccount: true,
        project: {
          select: {
            id: true,
            name: true,
            milestones: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                name: true,
                amount: true,
                status: true,
                invoiceId: true,
              },
            },
          },
        },
      },
    }),
    prisma.businessProfile.findUnique({ where: { userId } }),
  ]);
  if (!invoice) notFound();

  const currency = invoice.currency as Currency;
  const fmt = (n: unknown) => formatMoney(Number(n), currency);

  // Linked project milestones (paid vs pending).
  const milestones = invoice.project?.milestones ?? [];
  const msTotal = milestones.reduce((s, m) => s + Number(m.amount), 0);
  const msPaid = milestones
    .filter((m) => m.status === "PAID")
    .reduce((s, m) => s + Number(m.amount), 0);
  const msPaidCount = milestones.filter((m) => m.status === "PAID").length;

  const pdfData = {
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    currency,
    issueDate: invoice.issueDate.toLocaleDateString(),
    dueDate: invoice.dueDate ? invoice.dueDate.toLocaleDateString() : null,
    notes: invoice.notes,
    footerNote: profile?.footerNote ?? null,
    from: profile
      ? {
          name: profile.name,
          title: profile.title,
          phone: profile.phone,
          email: profile.email,
        }
      : null,
    customer: {
      name: invoice.customer.name,
      email: invoice.customer.email,
      phone: invoice.customer.phone,
      address: invoice.customer.address,
    },
    bank: invoice.bankAccount
      ? {
          bankName: invoice.bankAccount.bankName,
          accountTitle: invoice.bankAccount.accountTitle,
          accountNumber: invoice.bankAccount.accountNumber,
          iban: invoice.bankAccount.iban,
          branch: invoice.bankAccount.branch,
          swift: invoice.bankAccount.swift,
        }
      : null,
    projectName: invoice.project?.name ?? null,
    milestones:
      milestones.length > 0
        ? milestones.map((m) => ({
            name: m.name,
            amount: Number(m.amount),
            status: m.status,
            onThisInvoice: m.invoiceId === invoice.id,
          }))
        : null,
    items: invoice.items.map((it) => ({
      description: it.description,
      project: it.project,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      total: Number(it.total),
    })),
    subtotal: Number(invoice.subtotal),
    discount: Number(invoice.discount),
    taxRate: Number(invoice.taxRate),
    taxAmount: Number(invoice.taxAmount),
    total: Number(invoice.total),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex items-center justify-between gap-2">
        <Link href="/dashboard/invoices" className="text-sm text-slate-500 hover:underline">
          ← All invoices
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/invoices/${invoice.id}/edit`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
          >
            Edit
          </Link>
          <InvoiceActions id={invoice.id} status={invoice.status} pdfData={pdfData} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Issued {invoice.issueDate.toLocaleDateString()}
              {invoice.dueDate && ` · Due ${invoice.dueDate.toLocaleDateString()}`}
            </p>
            {invoice.project && (
              <Link
                href={`/dashboard/projects/${invoice.project.id}`}
                className="mt-2 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 hover:underline"
              >
                {invoice.project.name}
              </Link>
            )}
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {invoice.status}
          </span>
        </div>

        <div className="mt-6 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Bill to
          </p>
          <p className="mt-1 font-semibold">{invoice.customer.name}</p>
          {invoice.customer.email && (
            <p className="text-slate-500">{invoice.customer.email}</p>
          )}
          {invoice.customer.phone && (
            <p className="text-slate-500">{invoice.customer.phone}</p>
          )}
          {invoice.customer.address && (
            <p className="text-slate-500">{invoice.customer.address}</p>
          )}
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items.map((it) => (
              <tr key={it.id}>
                <td className="py-2">{it.description}</td>
                <td className="py-2 text-right">{Number(it.quantity)}</td>
                <td className="py-2 text-right">{fmt(it.unitPrice)}</td>
                <td className="py-2 text-right">{fmt(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 text-sm">
          <Row label="Subtotal" value={fmt(invoice.subtotal)} />
          <Row label="Discount" value={`− ${fmt(invoice.discount)}`} />
          <Row
            label={`Tax (${Number(invoice.taxRate)}%)`}
            value={fmt(invoice.taxAmount)}
          />
          <div className="border-t border-slate-200 pt-2">
            <Row label="Total" value={fmt(invoice.total)} bold />
          </div>
          <p className="pt-1 text-right text-xs text-slate-400">
            Currency: {currency}
          </p>
        </div>

        {invoice.project && milestones.length > 0 && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Project milestones
                </p>
                <Link
                  href={`/dashboard/projects/${invoice.project.id}`}
                  className="text-sm font-semibold text-slate-800 hover:underline"
                >
                  {invoice.project.name}
                </Link>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {msPaidCount}/{milestones.length} paid ·{" "}
                {fmt(msPaid)} of {fmt(msTotal)}
              </span>
            </div>

            {/* progress */}
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${msTotal > 0 ? (msPaid / msTotal) * 100 : 0}%` }}
              />
            </div>

            <ul className="mt-3 space-y-1.5">
              {milestones.map((m) => {
                const paid = m.status === "PAID";
                const onThis = m.invoiceId === invoice.id;
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {paid ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-slate-300" />
                      )}
                      <span
                        className={`truncate ${
                          paid ? "text-slate-700" : "text-slate-500"
                        }`}
                      >
                        {m.name}
                      </span>
                      {onThis && (
                        <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-700">
                          This invoice
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-slate-500">
                        {fmt(m.amount)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          paid
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {paid ? "Paid" : "Pending"}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {invoice.bankAccount && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Payment details
            </p>
            <div className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              <Row label="Bank" value={invoice.bankAccount.bankName} />
              <Row label="Account title" value={invoice.bankAccount.accountTitle} />
              <Row label="Account #" value={invoice.bankAccount.accountNumber} />
              {invoice.bankAccount.iban && (
                <Row label="IBAN" value={invoice.bankAccount.iban} />
              )}
              {invoice.bankAccount.branch && (
                <Row label="Branch" value={invoice.bankAccount.branch} />
              )}
              {invoice.bankAccount.swift && (
                <Row label="SWIFT / BIC" value={invoice.bankAccount.swift} />
              )}
            </div>
          </div>
        )}

        {invoice.notes && (
          <div className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-600">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Notes
            </p>
            <p className="mt-1 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-semibold" : "text-slate-500"}>{label}</span>
      <span className={bold ? "text-base font-bold" : ""}>{value}</span>
    </div>
  );
}
