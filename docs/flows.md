# User Flows

Every step-by-step path through the app. Pages live under `/dashboard`; the API
calls behind them are documented in [api.md](./api.md).

## 0. New-user walkthrough (onboarding)

On first sign-in the dashboard shows a **Getting Started** card
(`components/Onboarding.tsx`) that tracks real progress and links into each step:

1. **Add your business details** → `/dashboard/settings` (done when a profile name exists)
2. **Add your first customer** → `/dashboard/customers` (done when ≥ 1 customer)
3. **Add a bank account** → `/dashboard/banks` (done when ≥ 1 bank)
4. **Create your first invoice** → `/dashboard/invoices/new` (done when ≥ 1 invoice)

The card shows a progress bar, highlights the next action, and **auto-hides** once
all steps are complete. Users can dismiss it early (remembered via `localStorage`
key `ii-onboarding-dismissed`).

## 1. Sign up / sign in

- **`/signup`** — name, email, password (with show/hide). Posts to `/api/register`,
  then auto-signs-in via the Credentials provider and redirects to `/dashboard`.
- **`/signin`** — email + password via the Credentials provider; redirects to the
  `callbackUrl` (default `/dashboard`).
- **Google** — "Sign in / Sign up with Google" runs the Auth.js Google flow.
  Requires `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` configured (see
  [architecture.md](./architecture.md#environment-variables-env)).
- Signed-in users hitting `/signin` or `/signup` are redirected to `/dashboard`;
  signed-out users hitting any `/dashboard/*` route are sent to `/signin`.

## 2. Business profile (the invoice FROM)

`/dashboard/settings` → name, title, phone, email, and a default footer note.
Saved via `PUT /api/settings`. This block is printed as the sender on every
invoice and PDF.

## 3. Customers

`/dashboard/customers` — add/edit/delete customers (name, email, phone, address).
Inline form + table. Each row can jump straight to "new invoice for this customer".
Deleting a customer cascades to their invoices.

## 4. Bank accounts

`/dashboard/banks` — add/edit/delete accounts (bank name, account title, number,
optional IBAN/branch/SWIFT). Any one can be attached to an invoice as the payment
block.

## 5. Projects & milestones

- **Create** — `/dashboard/projects`: name, customer, currency, optional starting
  milestones. (`POST /api/projects`.)
- **Detail** — `/dashboard/projects/[id]`:
  - Summary strip: Total / Invoiced / Paid / Remaining.
  - **Milestones** list — add milestones, toggle each **Paid/Pending**
    (`PUT /api/milestones/[id]`), or delete.
  - **Bill milestones** — tick one or more *unbilled* milestones and
    "Create invoice from selected" (`POST /api/projects/[id]/invoice`), which
    generates one invoice covering them and links them back. You're redirected to
    the new invoice.
  - **Project invoices** — list of invoices tied to the project, plus a "manual
    invoice" shortcut.

## 6. Invoices

- **Create** — `/dashboard/invoices/new` (`components/InvoiceForm.tsx`):
  pick a customer, optionally a bank account and project tag, set currency, add
  line items (description, qty, unit price), tax %, discount, due date, notes.
  Live totals; submits to `POST /api/invoices`. Server assigns the next
  `INV-####` number and computes/stores totals.
- **View** — `/dashboard/invoices/[id]`: full invoice document — FROM (your
  profile), BILL TO (customer), line items, totals, linked project milestones
  (with paid progress), payment/bank details, and notes.
- **Actions** (`invoices/[id]/actions.tsx`):
  - **Change status** — Draft → Sent → Paid → Overdue (`PATCH /api/invoices/[id]`).
  - **Download PDF** — rendered client-side with `@react-pdf/renderer`.
  - **Delete** — removes the invoice (`DELETE /api/invoices/[id]`).
- **Edit** — `/dashboard/invoices/[id]/edit`: same form, `PUT /api/invoices/[id]`
  replaces items/fields and recomputes totals.

## 7. Dashboard home

`/dashboard` — greeting, the onboarding walkthrough (until complete), a stat strip
(Invoices / Paid / Customers / Projects), an outstanding-balance line (summed per
currency for unpaid invoices), and the 5 most recent invoices.

## Status lifecycle

```
DRAFT ──▶ SENT ──▶ PAID
              └──▶ OVERDUE
```
Status is set manually via the invoice actions. Outstanding totals on the
dashboard count everything that isn't `PAID`.
