# Billing & Subscriptions (Lemon Squeezy)

Instant Invoice uses **Lemon Squeezy** for subscriptions. The model is:

- **Every new account gets a 7-day free trial** of the whole app (starts at sign-up).
- After the trial, the app requires an **active subscription** (Monthly or Yearly).
- Trial state is computed from `User.createdAt`; subscription state is mirrored
  from Lemon Squeezy into the `Subscription` table by a webhook.

## How access is decided

`lib/subscription.ts → getAccess(userId)` returns:

| Field | Meaning |
| --- | --- |
| `hasAccess` | `true` if subscribed **or** still in trial |
| `isSubscribed` | active / on_trial / past_due subscription, or cancelled-but-not-yet-ended |
| `isTrial` | within the 7-day window and not subscribed |
| `daysLeftInTrial` | countdown shown in the trial banner |
| `subscription` | the row from the `Subscription` table (or `null`) |

Enforcement is layered:

- **`dashboard/(app)/layout.tsx`** wraps every feature page and redirects to
  `/dashboard/billing` when `hasAccess` is false. The billing page sits **outside**
  this route group, so a locked-out user can still reach it to subscribe.
- **`dashboard/layout.tsx`** shows a "N days left in your trial" banner.

> The billing page and gate are server-rendered, so they always read fresh
> subscription state from the database (no stale-session issues).

## One-time setup in Lemon Squeezy

1. **Create a store** — Lemon Squeezy dashboard → *Settings → Stores*. Note the
   **Store ID** (Settings → Stores, or the number in the store URL).
2. **Create a product** — *Products → New Product*, type **Subscription**.
   Add **two variants**: a **Monthly** price and a **Yearly** price.
   - Open each variant; the **Variant ID** is the number in its URL
     (`/products/.../variants/123456`). You need both.
3. **API key** — *Settings → API → Create API key*. Copy it (shown once).
4. **Webhook** — *Settings → Webhooks → Add endpoint*:
   - **URL:** `https://YOUR_DOMAIN/api/webhooks/lemonsqueezy`
     (for local testing, expose `localhost:3000` with a tunnel such as `ngrok`
     and use that URL).
   - **Signing secret:** make one up (any random string) — it must match
     `LEMONSQUEEZY_WEBHOOK_SECRET`.
   - **Events:** at minimum `subscription_created`, `subscription_updated`,
     `subscription_cancelled`, `subscription_resumed`, `subscription_expired`,
     `subscription_paused`, `subscription_unpaused`.
5. **Test mode** — do all of the above in **Test mode** first; use a test card at
   checkout. Flip to live when ready.

## Environment variables

```bash
LEMONSQUEEZY_API_KEY="…"                 # Settings → API
LEMONSQUEEZY_STORE_ID="12345"            # Settings → Stores
LEMONSQUEEZY_WEBHOOK_SECRET="…"          # must match the webhook's signing secret
LEMONSQUEEZY_VARIANT_MONTHLY="123456"    # Monthly variant id
LEMONSQUEEZY_VARIANT_YEARLY="123457"     # Yearly variant id

# Optional, cosmetic — shown on the billing page:
NEXT_PUBLIC_PRICE_MONTHLY="$9"
NEXT_PUBLIC_PRICE_YEARLY="$90"
```

Restart `next dev` after editing `.env`. Until `LEMONSQUEEZY_API_KEY` and
`LEMONSQUEEZY_STORE_ID` are set, the billing page shows the plans but checkout is
disabled with a notice.

## The flow in code

| Piece | File |
| --- | --- |
| Checkout creation | `POST /api/subscriptions/checkout` → `lib/lemonsqueezy.ts` |
| Webhook (sync) | `POST /api/webhooks/lemonsqueezy` (HMAC-verified, excluded from auth proxy) |
| Access logic | `lib/subscription.ts` |
| Paid gate | `app/dashboard/(app)/layout.tsx` |
| Billing UI | `app/dashboard/billing/page.tsx` + `components/SubscribeButtons.tsx` |
| Schema | `Subscription` model in `prisma/schema.prisma` |

**Checkout:** the route creates a Lemon Squeezy checkout with the user's id in
`checkout_data.custom.user_id` and redirects the browser to the hosted checkout.
On success the user returns to `/dashboard/billing?success=1`.

**Webhook:** Lemon Squeezy posts events signed with `X-Signature` (HMAC-SHA256 of
the raw body). The handler verifies it, reads `meta.custom_data.user_id`, and
upserts the `Subscription` row (status, renews/ends dates, card, customer-portal
URL). The **customer portal** URL is what powers the "Manage subscription" button
(update card / change plan / cancel).

## Statuses

Lemon Squeezy subscription statuses: `on_trial`, `active`, `paused`, `past_due`,
`unpaid`, `cancelled`, `expired`. The app treats `active`, `on_trial`, and
`past_due` as having access; a `cancelled` subscription keeps access until its
`ends_at` date.

## Recommended next steps (production hardening)

- **Gate the API too.** UI is gated by the layout; for defense-in-depth, add an
  access check to the write endpoints (`POST /api/invoices`, `/api/projects`, …).
- Switch from `prisma db push` to a committed **migration** history.
- Add an automated **"trial ending soon"** email.
