import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTotals } from "@/lib/format";
import { requireUser } from "@/lib/auth-helpers";

// GET /api/invoices — list the user's invoices with customer + item count
export async function GET() {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;

  const invoices = await prisma.invoice.findMany({
    where: { userId: gate.userId },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
  });
  return NextResponse.json(invoices);
}

// Sequential invoice number per user, e.g. INV-0001
async function nextInvoiceNumber(userId: string) {
  const count = await prisma.invoice.count({ where: { userId } });
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

// POST /api/invoices — create an invoice (with line items) against a customer
export async function POST(req: Request) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { userId } = gate;

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

  // Optional bank account to attach (must belong to the user)
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

  // Optional project tag (must belong to the user)
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
    : "DRAFT";

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items = rawItems
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

  const invoice = await prisma.invoice.create({
    data: {
      userId,
      invoiceNumber: await nextInvoiceNumber(userId),
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
    include: { customer: true, items: true },
  });

  return NextResponse.json(invoice, { status: 201 });
}
