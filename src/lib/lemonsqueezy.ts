// Thin Lemon Squeezy API helper (no SDK dependency — just fetch).
// Docs: https://docs.lemonsqueezy.com/api

const LS_API = "https://api.lemonsqueezy.com/v1";

export type Plan = "monthly" | "yearly";

export const PLANS: Record<Plan, { label: string; variantEnv: string }> = {
  monthly: { label: "Monthly", variantEnv: "LEMONSQUEEZY_VARIANT_MONTHLY" },
  yearly: { label: "Yearly", variantEnv: "LEMONSQUEEZY_VARIANT_YEARLY" },
};

// Subscription statuses that grant access to the app.
const ACTIVE_STATUSES = new Set(["active", "on_trial", "past_due"]);

export function isActiveStatus(status?: string | null): boolean {
  return !!status && ACTIVE_STATUSES.has(status);
}

export function variantIdFor(plan: Plan): string | undefined {
  return process.env[PLANS[plan].variantEnv] || undefined;
}

function apiHeaders() {
  return {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY ?? ""}`,
  };
}

export function lemonSqueezyConfigured(): boolean {
  return Boolean(
    process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID,
  );
}

/**
 * Create a hosted checkout for a plan and return its URL.
 * The user's id is attached as custom data so the webhook can link the
 * resulting subscription back to the account.
 */
export async function createCheckoutUrl(opts: {
  plan: Plan;
  userId: string;
  email?: string | null;
  redirectUrl: string;
}): Promise<string> {
  const variantId = variantIdFor(opts.plan);
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!variantId || !storeId) {
    throw new Error("Lemon Squeezy is not configured (missing variant/store id).");
  }

  const res = await fetch(`${LS_API}/checkouts`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: opts.email ?? undefined,
            custom: { user_id: opts.userId },
          },
          product_options: {
            redirect_url: opts.redirectUrl,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: String(storeId) } },
          variant: { data: { type: "variants", id: String(variantId) } },
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Lemon Squeezy checkout failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const url = json?.data?.attributes?.url;
  if (!url) throw new Error("Lemon Squeezy did not return a checkout URL.");
  return url as string;
}
