import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

// Lemon Squeezy posts subscription events here. Excluded from the auth proxy
// (see src/proxy.ts) because Lemon Squeezy is not a signed-in user.
//
// Configure the webhook in the LS dashboard pointing at:
//   https://YOUR_DOMAIN/api/webhooks/lemonsqueezy
// with the same signing secret as LEMONSQUEEZY_WEBHOOK_SECRET.

export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const toDate = (v: unknown) => (v ? new Date(String(v)) : null);

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: { user_id?: string } };
    data?: { id?: string; attributes?: Record<string, unknown> };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.meta?.event_name ?? "";
  const userId = payload.meta?.custom_data?.user_id;
  const lemonSqueezyId = payload.data?.id;
  const attr = payload.data?.attributes ?? {};

  // We only care about subscription lifecycle events.
  if (!event.startsWith("subscription_") || !lemonSqueezyId) {
    return NextResponse.json({ ok: true, ignored: event });
  }

  const urls = (attr.urls as Record<string, string> | undefined) ?? {};
  const data = {
    status: String(attr.status ?? "active"),
    orderId: attr.order_id != null ? String(attr.order_id) : null,
    customerId: attr.customer_id != null ? String(attr.customer_id) : null,
    productId: attr.product_id != null ? String(attr.product_id) : null,
    variantId: attr.variant_id != null ? String(attr.variant_id) : null,
    cardBrand: (attr.card_brand as string) ?? null,
    cardLastFour: (attr.card_last_four as string) ?? null,
    renewsAt: toDate(attr.renews_at),
    endsAt: toDate(attr.ends_at),
    trialEndsAt: toDate(attr.trial_ends_at),
    portalUrl: urls.customer_portal ?? null,
  };

  // Prefer linking by our own user_id (sent at checkout). Fall back to the LS id
  // for events where custom_data is absent (e.g. updates).
  const existing = await prisma.subscription.findUnique({
    where: { lemonSqueezyId: String(lemonSqueezyId) },
  });

  if (existing) {
    await prisma.subscription.update({
      where: { lemonSqueezyId: String(lemonSqueezyId) },
      data,
    });
  } else if (userId) {
    await prisma.subscription.upsert({
      where: { userId },
      create: { userId, lemonSqueezyId: String(lemonSqueezyId), ...data },
      update: { lemonSqueezyId: String(lemonSqueezyId), ...data },
    });
  } else {
    // No way to attribute this subscription to a user — acknowledge but skip.
    return NextResponse.json({ ok: true, unlinked: true });
  }

  return NextResponse.json({ ok: true });
}
