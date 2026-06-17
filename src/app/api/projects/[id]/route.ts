import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/projects/:id — full project with milestones + linked invoices
export async function GET(_req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: gate.userId },
    include: {
      customer: true,
      milestones: {
        orderBy: { sortOrder: "asc" },
        include: {
          invoice: { select: { id: true, invoiceNumber: true, status: true } },
        },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          currency: true,
        },
      },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(project);
}

// PUT /api/projects/:id — update project fields (name, currency, description)
export async function PUT(req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }
  const result = await prisma.project.updateMany({
    where: { id, userId: gate.userId },
    data: {
      name: body.name.trim(),
      currency: body.currency === "USD" ? "USD" : "PKR",
      description: body.description?.trim() || null,
    },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const project = await prisma.project.findUnique({ where: { id } });
  return NextResponse.json(project);
}

// DELETE /api/projects/:id
export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const result = await prisma.project.deleteMany({
    where: { id, userId: gate.userId },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
