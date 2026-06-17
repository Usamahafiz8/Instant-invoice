import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

async function nextInvoiceNumber(userId: string) {
  const count = await prisma.invoice.count({ where: { userId } });
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

// POST /api/milestones/:id/invoice — generate a draft invoice from a milestone
export async function POST(_req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { userId } = gate;
  const { id } = await params;

  const milestone = await prisma.milestone.findFirst({
    where: { id, project: { userId } },
    include: { project: true, invoice: true },
  });
  if (!milestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  // Already invoiced — return the existing invoice instead of duplicating.
  if (milestone.invoice) {
    return NextResponse.json(
      { id: milestone.invoice.id, existing: true },
      { status: 200 },
    );
  }

  const amount = Number(milestone.amount) || 0;
  const project = milestone.project;

  const invoice = await prisma.invoice.create({
    data: {
      userId,
      invoiceNumber: await nextInvoiceNumber(userId),
      customerId: project.customerId,
      projectId: project.id,
      currency: project.currency,
      status: "DRAFT",
      subtotal: amount,
      total: amount,
      items: {
        create: [
          {
            description: milestone.name,
            project: project.name,
            quantity: 1,
            unitPrice: amount,
            total: amount,
          },
        ],
      },
    },
  });

  await prisma.milestone.update({
    where: { id },
    data: { invoiceId: invoice.id },
  });

  return NextResponse.json({ id: invoice.id, existing: false }, { status: 201 });
}
