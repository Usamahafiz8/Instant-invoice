import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTotals } from "@/lib/format";
import { requireUser } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/invoices/:id — full invoice with customer + items
export async function GET(_req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: gate.userId },
    include: { customer: true, items: true },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(invoice);
}

// PUT /api/invoices/:id — full update (customer, bank, currency, items, totals)
export async function PUT(req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { userId } = gate;
  const { id } = await params;

  const existing = await prisma.invoice.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.customerId) {
    return NextResponse.json({ error: "customerId is required" }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: { id: body.customerId, userId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  let bankAccountId: string | null = null;
  if (body.bankAccountId) {
    const bank = await prisma.bankAccount.findFirst({
      where: { id: body.bankAccountId, userId },
    });
    if (!bank) {
      return NextResponse.json({ error: "Bank account not found" }, { status: 404 });
    }
    bankAccountId = bank.id;
  }

  let projectId: string | null = null;
  if (body.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: body.projectId, userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    projectId = project.id;
  }

  const currency = body.currency === "USD" ? "USD" : "PKR";
  const status = ["DRAFT", "SENT", "PAID", "OVERDUE"].includes(body.status)
    ? body.status
    : existing.status;

  const items = (Array.isArray(body.items) ? body.items : [])
    .map((it: { description?: string; project?: string; quantity?: number; unitPrice?: number }) => ({
      description: String(it.description ?? "").trim(),
      project: String(it.project ?? "").trim() || null,
      quantity: Number(it.quantity) || 0,
      unitPrice: Number(it.unitPrice) || 0,
    }))
    .filter((it: { description: string }) => it.description.length > 0);

  if (items.length === 0) {
    return NextResponse.json(
      { error: "At least one line item is required" },
      { status: 400 },
    );
  }

  const taxRate = Number(body.taxRate) || 0;
  const discount = Number(body.discount) || 0;
  const totals = computeTotals(items, taxRate, discount);

  // Replace items wholesale, then update the invoice fields.
  const invoice = await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
    return tx.invoice.update({
      where: { id },
      data: {
        customerId: customer.id,
        bankAccountId,
        projectId,
        currency,
        status,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes?.trim() || null,
        taxRate,
        discount: totals.discount,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        items: {
          create: items.map(
            (it: { description: string; project: string | null; quantity: number; unitPrice: number }) => ({
              description: it.description,
              project: it.project,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              total: Math.round(it.quantity * it.unitPrice * 100) / 100,
            }),
          ),
        },
      },
      include: { customer: true, items: true, bankAccount: true },
    });
  });

  return NextResponse.json(invoice);
}

// PATCH /api/invoices/:id — update status only (quick action)
export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!["DRAFT", "SENT", "PAID", "OVERDUE"].includes(body?.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const result = await prisma.invoice.updateMany({
    where: { id, userId: gate.userId },
    data: { status: body.status },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Keep linked milestones in sync: paid invoice → paid milestones, and back.
  await prisma.milestone.updateMany({
    where: { invoiceId: id },
    data: { status: body.status === "PAID" ? "PAID" : "PENDING" },
  });
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  return NextResponse.json(invoice);
}

// DELETE /api/invoices/:id
export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const result = await prisma.invoice.deleteMany({
    where: { id, userId: gate.userId },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
