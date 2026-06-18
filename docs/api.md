# API Reference

REST route handlers live under `src/app/api/`. Unless noted, every endpoint:

- Requires an authenticated session. The first line is `requireUser()`, which
  returns `{ userId }` or a **`401 { error: "Unauthorized" }`** response.
- Reads/writes only records belonging to that `userId`.
- Accepts and returns JSON. Invalid bodies → **`400`**; missing/foreign records → **`404`**.

## Auth

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `*` | `/api/auth/[...nextauth]` | public | Auth.js handler (sign-in, callback, providers, session). `GET /api/auth/providers` lists enabled providers. |
| `POST` | `/api/register` | public | Create a user with email + password. |

**`POST /api/register`** — body `{ name, email, password }`. Validates email,
requires password ≥ 6 chars, rejects duplicate email (`409`-style error), hashes
with bcrypt. Returns `201 { ok: true }`. (Sign-in is then performed client-side via
the Credentials provider.)

## Customers

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `GET` | `/api/customers` | — | List of customers (with invoice counts) |
| `POST` | `/api/customers` | `{ name*, email?, phone?, address? }` | `201` created customer |
| `GET` | `/api/customers/[id]` | — | Single customer |
| `PUT` | `/api/customers/[id]` | `{ name*, email?, phone?, address? }` | Updated customer |
| `DELETE` | `/api/customers/[id]` | — | `{ ok: true }` (cascades to their invoices) |

## Bank accounts

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `GET` | `/api/banks` | — | List of bank accounts |
| `POST` | `/api/banks` | `{ bankName*, accountTitle*, accountNumber*, iban?, branch?, swift? }` | `201` created |
| `PUT` | `/api/banks/[id]` | same as POST | Updated |
| `DELETE` | `/api/banks/[id]` | — | `{ ok: true }` |

## Projects

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `GET` | `/api/projects` | — | Projects (with customer + milestone summaries) |
| `POST` | `/api/projects` | `{ name*, customerId*, currency?, description?, milestones?[] }` | `201` created (milestones optional) |
| `GET` | `/api/projects/[id]` | — | Project with milestones + invoices |
| `PUT` | `/api/projects/[id]` | `{ name*, description?, currency? }` | Updated |
| `DELETE` | `/api/projects/[id]` | — | `{ ok: true }` |
| `POST` | `/api/projects/[id]/milestones` | `{ name*, description?, amount? }` | `201` created milestone |
| `POST` | `/api/projects/[id]/invoice` | `{ milestoneIds: string[] }` | `201 { id }` — new invoice billing the selected milestones |

## Milestones

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `PUT` | `/api/milestones/[id]` | `{ name*, description?, amount?, status? }` | Updated (used to toggle PAID/PENDING) |
| `DELETE` | `/api/milestones/[id]` | — | `{ ok: true }` |
| `POST` | `/api/milestones/[id]/invoice` | — | `201 { id, existing }` — invoice this single milestone (idempotent: returns existing invoice if already billed) |

## Invoices

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `GET` | `/api/invoices` | — | Invoices (with customer + item counts) |
| `POST` | `/api/invoices` | see below | `201` created invoice |
| `GET` | `/api/invoices/[id]` | — | Full invoice (customer, items, bank, project) |
| `PUT` | `/api/invoices/[id]` | same shape as POST | Replaces items/fields, recomputes totals |
| `PATCH` | `/api/invoices/[id]` | `{ status }` | Update just the status (`DRAFT`/`SENT`/`PAID`/`OVERDUE`) |
| `DELETE` | `/api/invoices/[id]` | — | `{ ok: true }` |

**Create/update body:**
```jsonc
{
  "customerId": "…",          // required, must belong to the user
  "bankAccountId": "…",       // optional, must belong to the user
  "projectId": "…",           // optional, must belong to the user
  "currency": "PKR" | "USD",  // default PKR
  "status": "DRAFT",          // optional, default DRAFT
  "dueDate": "2026-07-01",    // optional ISO date
  "notes": "…",               // optional
  "taxRate": 0,               // percent
  "discount": 0,              // absolute amount
  "items": [                  // ≥ 1 item with a non-empty description required
    { "description": "Website design", "project": "…?", "quantity": 1, "unitPrice": 40000 }
  ]
}
```
On create the server assigns the next `invoiceNumber`, validates ownership of any
referenced customer/bank/project, computes `subtotal`/`taxAmount`/`total` via
`computeTotals`, and stores per-item totals (`quantity × unitPrice`).

## Conventions

- **Status codes:** `200` ok, `201` created, `400` validation, `401` unauthenticated,
  `404` not found / not owned.
- **Ownership = security:** every query filters by `userId`; a record owned by
  another user reads as `404`, never leaks.
- **PDF generation is client-side** (`@react-pdf/renderer`) from the invoice view —
  there is no PDF API endpoint.
