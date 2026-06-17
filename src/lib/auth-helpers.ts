import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Returns the signed-in user's id, or null.
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// For API routes: returns the userId, or a 401 response to return early.
export async function requireUser(): Promise<
  { userId: string } | { response: NextResponse }
> {
  const userId = await getUserId();
  if (!userId) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { userId };
}
