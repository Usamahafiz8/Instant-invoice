import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// POST /api/projects/:id/milestones — add a milestone to a project
export async function POST(req: Request, { params }: Params) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: gate.userId },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Milestone name is required" }, { status: 400 });
  }
  const count = await prisma.milestone.count({ where: { projectId: id } });
  const milestone = await prisma.milestone.create({
    data: {
      projectId: id,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      amount: Number(body.amount) || 0,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      sortOrder: count,
    },
  });
  return NextResponse.json(milestone, { status: 201 });
}
