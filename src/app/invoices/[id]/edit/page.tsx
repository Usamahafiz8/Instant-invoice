import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-helpers";
import InvoiceForm, { type InitialInvoice } from "@/components/InvoiceForm";
import type { Currency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/signin");
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
    include: { items: true },
  });
  if (!invoice) notFound();

  const initial: InitialInvoice = {
    id: invoice.id,
    customerId: invoice.customerId,
    bankAccountId: invoice.bankAccountId,
    projectId: invoice.projectId,
    currency: invoice.currency as Currency,
    status: invoice.status,
    taxRate: Number(invoice.taxRate),
    discount: Number(invoice.discount),
    dueDate: invoice.dueDate
      ? invoice.dueDate.toISOString().slice(0, 10)
      : null,
    notes: invoice.notes,
    items: invoice.items.map((it) => ({
      description: it.description,
      project: it.project,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
    })),
  };

  return <InvoiceForm initial={initial} />;
}
