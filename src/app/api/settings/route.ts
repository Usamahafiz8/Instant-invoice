import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

// GET /api/settings — this user's business/sender profile (FROM on invoices)
export async function GET() {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: gate.userId },
  });
  return NextResponse.json(profile);
}

// PUT /api/settings — upsert this user's profile
export async function PUT(req: Request) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;

  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Your name is required" }, { status: 400 });
  }
  const data = {
    name: body.name.trim(),
    title: body.title?.trim() || null,
    phone: body.phone?.trim() || null,
    email: body.email?.trim() || null,
    footerNote: body.footerNote?.trim() || null,
  };
  const profile = await prisma.businessProfile.upsert({
    where: { userId: gate.userId },
    update: data,
    create: { userId: gate.userId, ...data },
  });
  return NextResponse.json(profile);
}
