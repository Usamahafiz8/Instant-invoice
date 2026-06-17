import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/:id
export async function GET(_req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, userId: gate.userId },
    include: { invoices: { orderBy: { createdAt: "desc" } } },
  });
  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(customer);
}

// PUT /api/customers/:id — update
export async function PUT(req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const result = await prisma.customer.updateMany({
    where: { id, userId: gate.userId },
    data: {
      name: body.name.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      address: body.address?.trim() || null,
    },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const customer = await prisma.customer.findUnique({ where: { id } });
  return NextResponse.json(customer);
}

// DELETE /api/customers/:id — also removes the customer's invoices (cascade)
export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const result = await prisma.customer.deleteMany({
    where: { id, userId: gate.userId },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
