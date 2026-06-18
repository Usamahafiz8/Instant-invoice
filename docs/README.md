# Instant Invoice — Documentation

A simple, fast invoicing app for freelancers and small teams. Manage customers,
projects and milestones, then send polished PDF invoices in PKR or USD — all in
one private workspace.

This folder documents the whole platform: how it's built, how data flows, the
API surface, and every user flow.

## Contents

| Doc | What's inside |
| --- | --- |
| [architecture.md](./architecture.md) | Tech stack, project structure, routing, auth, theming, dev setup |
| [data-model.md](./data-model.md) | Prisma schema, every model, relations, enums |
| [api.md](./api.md) | All REST endpoints, methods, payloads, responses |
| [flows.md](./flows.md) | Step-by-step user flows (onboarding, invoicing, projects…) |
| [billing.md](./billing.md) | Subscriptions & trial via Lemon Squeezy — setup + flow |

## Product at a glance

- **Auth** — email + password, plus optional Google sign-in (Auth.js / NextAuth v5).
- **Customers** — the people/companies you bill.
- **Bank accounts** — saved once, attached to invoices so clients know where to pay.
- **Projects & milestones** — break work into milestones, mark them paid, and bill
  one or many milestones into a single invoice.
- **Invoices** — line items, tax, discount, notes, status (Draft / Sent / Paid /
  Overdue), sequential numbering (`INV-0001`), and a downloadable PDF.
- **Business profile** — your name/contact, shown as the **FROM** on every invoice.
- **Dashboard** — at-a-glance stats, outstanding totals, recent invoices, and a
  **Getting Started walkthrough** that tracks real setup progress for new users.
- **Theming** — light/dark glass UI via `next-themes`.

## Core concept: everything is scoped to a user

Every record (customers, banks, projects, milestones, invoices, profile) carries a
`userId` and is filtered by the signed-in user on every read and write. Users only
ever see their own data. See [data-model.md](./data-model.md) and the
`requireUser()` gate described in [api.md](./api.md).

## The happy path

```
Sign up ─▶ Add business details ─▶ Add a customer ─▶ Add a bank account
        ─▶ (optional) Create a project + milestones
        ─▶ Create an invoice ─▶ Mark Sent / Paid ─▶ Download PDF
```

This is exactly the sequence the in-app **Getting Started** walkthrough guides new
users through. Full detail in [flows.md](./flows.md).
