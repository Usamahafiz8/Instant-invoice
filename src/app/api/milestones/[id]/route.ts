import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// Confirm the milestone belongs to a project owned by this user.
async function ownsMilestone(milestoneId: string, userId: string) {
  const m = await prisma.milestone.findFirst({
    where: { id: milestoneId, project: { userId } },
    select: { id: true },
  });
  return Boolean(m);
}

// PUT /api/milestones/:id — update a milestone (name, amount, status, dueDate)
export async function PUT(req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { id } = await params;
  if (!(await ownsMilestone(id, gate.userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Milestone name is required" }, { status: 400 });
  }
  const status = body.status === "PAID" ? "PAID" : "PENDING";
  const milestone = await prisma.milestone.update({
    where: { id },
    data: {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      amount: Number(body.amount) || 0,
      status,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  });
  return NextResponse.json(milestone);
}

// DELETE /api/milestones/:id
export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { id } = await params;
  if (!(await ownsMilestone(id, gate.userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.milestone.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
