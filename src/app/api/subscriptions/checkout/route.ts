import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { auth } from "@/auth";
import { createCheckoutUrl, lemonSqueezyConfigured, type Plan } from "@/lib/lemonsqueezy";

// POST /api/subscriptions/checkout  body: { plan: "monthly" | "yearly" }
// Returns { url } — the hosted Lemon Squeezy checkout to redirect the user to.
export async function POST(req: Request) {
  const gate = await requireUser();
  if ("response" in gate) return gate.response;

  if (!lemonSqueezyConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured yet." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  const plan: Plan = body?.plan === "yearly" ? "yearly" : "monthly";

  const session = await auth();
  const email = session?.user?.email ?? null;

  try {
    const origin = new URL(req.url).origin;
    const url = await createCheckoutUrl({
      plan,
      userId: gate.userId,
      email,
      redirectUrl: `${origin}/dashboard/billing?success=1`,
    });
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
