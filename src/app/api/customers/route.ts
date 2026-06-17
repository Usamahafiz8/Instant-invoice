import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

// GET /api/customers — list the signed-in user's customers (newest first)
export async function GET() {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;

  const customers = await prisma.customer.findMany({
    where: { userId: gate.userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { invoices: true } } },
  });
  return NextResponse.json(customers);
}

// POST /api/customers — create a customer
export async function POST(req: Request) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;

  const body = await req.json().catch(() => null);
  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const customer = await prisma.customer.create({
    data: {
      userId: gate.userId,
      name: body.name.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      address: body.address?.trim() || null,
    },
  });
  return NextResponse.json(customer, { status: 201 });
}
