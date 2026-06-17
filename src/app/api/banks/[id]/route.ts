import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// PUT /api/banks/:id — update
export async function PUT(req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (
    !body?.bankName?.trim() ||
    !body?.accountTitle?.trim() ||
    !body?.accountNumber?.trim()
  ) {
    return NextResponse.json(
      { error: "Bank name, account title and number are required" },
      { status: 400 },
    );
  }
  const result = await prisma.bankAccount.updateMany({
    where: { id, userId: gate.userId },
    data: {
      bankName: body.bankName.trim(),
      accountTitle: body.accountTitle.trim(),
      accountNumber: body.accountNumber.trim(),
      iban: body.iban?.trim() || null,
      branch: body.branch?.trim() || null,
      swift: body.swift?.trim() || null,
    },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const bank = await prisma.bankAccount.findUnique({ where: { id } });
  return NextResponse.json(bank);
}

// DELETE /api/banks/:id — detaches from any invoices (bankAccountId set null)
export async function DELETE(_req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { id } = await params;

  const result = await prisma.bankAccount.deleteMany({
    where: { id, userId: gate.userId },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
