import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

async function nextInvoiceNumber(userId: string) {
  const count = await prisma.invoice.count({ where: { userId } });
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

// POST /api/projects/:id/invoice — create ONE invoice from selected milestones
// body: { milestoneIds: string[] }
export async function POST(req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { userId } = gate;
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const milestoneIds: string[] = Array.isArray(body?.milestoneIds)
    ? body.milestoneIds
    : [];
  if (milestoneIds.length === 0) {
    return NextResponse.json(
      { error: "Select at least one milestone" },
      { status: 400 },
    );
  }

  // Only this project's, not-yet-invoiced milestones are billable.
  const milestones = await prisma.milestone.findMany({
    where: { id: { in: milestoneIds }, projectId: id, invoiceId: null },
    orderBy: { sortOrder: "asc" },
  });
  if (milestones.length === 0) {
    return NextResponse.json(
      { error: "Selected milestones are not billable" },
      { status: 400 },
    );
  }

  const total = milestones.reduce((s, m) => s + Number(m.amount), 0);

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        userId,
        invoiceNumber: await nextInvoiceNumber(userId),
        customerId: project.customerId,
        projectId: project.id,
        currency: project.currency,
        status: "DRAFT",
        subtotal: total,
        total,
        items: {
          create: milestones.map((m) => ({
            description: m.name,
            project: project.name,
            quantity: 1,
            unitPrice: Number(m.amount),
            total: Number(m.amount),
          })),
        },
      },
    });
    await tx.milestone.updateMany({
      where: { id: { in: milestones.map((m) => m.id) } },
      data: { invoiceId: inv.id },
    });
    return inv;
  });

  return NextResponse.json({ id: invoice.id }, { status: 201 });
}
