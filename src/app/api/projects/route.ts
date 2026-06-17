import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

// GET /api/projects — list the user's projects with customer + milestone summary
export async function GET() {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;

  const projects = await prisma.project.findMany({
    where: { userId: gate.userId },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true } },
      milestones: { select: { amount: true, status: true } },
    },
  });
  return NextResponse.json(projects);
}

// POST /api/projects — create a project (optionally with initial milestones)
export async function POST(req: Request) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { userId } = gate;

  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }
  if (!body?.customerId) {
    return NextResponse.json({ error: "Customer is required" }, { status: 400 });
  }
  const customer = await prisma.customer.findFirst({
    where: { id: body.customerId, userId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const currency = body.currency === "USD" ? "USD" : "PKR";
  const milestones = (Array.isArray(body.milestones) ? body.milestones : [])
    .map((m: { name?: string; description?: string; amount?: number }, i: number) => ({
      name: String(m.name ?? "").trim(),
      description: String(m.description ?? "").trim() || null,
      amount: Number(m.amount) || 0,
      sortOrder: i,
    }))
    .filter((m: { name: string }) => m.name.length > 0);

  const project = await prisma.project.create({
    data: {
      userId,
      name: body.name.trim(),
      customerId: customer.id,
      currency,
      description: body.description?.trim() || null,
      milestones: { create: milestones },
    },
    include: { milestones: true },
  });
  return NextResponse.json(project, { status: 201 });
}
