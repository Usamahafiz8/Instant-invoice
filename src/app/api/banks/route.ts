import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

// GET /api/banks — list the user's bank accounts
export async function GET() {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;

  const banks = await prisma.bankAccount.findMany({
    where: { userId: gate.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(banks);
}

// POST /api/banks — create a bank account
export async function POST(req: Request) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;

  const body = await req.json().catch(() => null);
  if (!body?.bankName?.trim()) {
    return NextResponse.json({ error: "Bank name is required" }, { status: 400 });
  }
  if (!body?.accountTitle?.trim()) {
    return NextResponse.json({ error: "Account title is required" }, { status: 400 });
  }
  if (!body?.accountNumber?.trim()) {
    return NextResponse.json({ error: "Account number is required" }, { status: 400 });
  }
  const bank = await prisma.bankAccount.create({
    data: {
      userId: gate.userId,
      bankName: body.bankName.trim(),
      accountTitle: body.accountTitle.trim(),
      accountNumber: body.accountNumber.trim(),
      iban: body.iban?.trim() || null,
      branch: body.branch?.trim() || null,
      swift: body.swift?.trim() || null,
    },
  });
  return NextResponse.json(bank, { status: 201 });
}
