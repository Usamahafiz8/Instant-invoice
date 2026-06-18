# Data Model

Source of truth: [`prisma/schema.prisma`](../prisma/schema.prisma). Database is
PostgreSQL. Money is stored as `Decimal(12,2)`; tax rate as `Decimal(5,2)`.

## Enums

| Enum | Values |
| --- | --- |
| `Currency` | `PKR`, `USD` |
| `InvoiceStatus` | `DRAFT`, `SENT`, `PAID`, `OVERDUE` |
| `MilestoneStatus` | `PENDING`, `PAID` |

## Auth.js models

- **User** — `id`, `name`, `email` (unique), `emailVerified`, `image`, `password`
  (bcrypt hash; null for OAuth-only users). Owns everything below.
- **Account** — linked OAuth accounts (e.g. Google). Cascade-deleted with the user.
- **Session** — DB sessions (the app uses JWT, but the adapter keeps the table).
- **VerificationToken** — standard Auth.js token table.

## Application models

All app models carry a `userId` (directly or via a parent) and are always queried
scoped to the signed-in user.

### Customer
`id, userId, name, email?, phone?, address?, createdAt, updatedAt`
Relations: → many `Invoice`, → many `Project`. Indexed on `userId`, `name`.

### Project
`id, userId, name, customerId, currency (default PKR), description?, createdAt, updatedAt`
Relations: belongs to `Customer`; → many `Milestone`; → many `Invoice`.

### Milestone
`id, projectId, name, description?, amount (Decimal, default 0), status (PENDING|PAID),
dueDate?, sortOrder, invoiceId?, createdAt`
Relations: belongs to `Project`; optionally linked to one `Invoice` (set null on
invoice delete). `invoiceId` is how a milestone is marked "billed".

### BankAccount
`id, userId, bankName, accountTitle, accountNumber, iban?, branch?, swift?, createdAt, updatedAt`
Relations: → many `Invoice`. Attached to an invoice as the "how to pay me" block.

### Invoice
`id, userId, invoiceNumber, customerId, bankAccountId?, projectId?, currency,
status (default DRAFT), issueDate (default now), dueDate?, notes?,
subtotal, taxRate, taxAmount, discount, total, createdAt, updatedAt`
Relations: belongs to `Customer`; optional `BankAccount` and `Project`;
→ many `InvoiceItem`; → many `Milestone` (the milestones billed on it).
Constraints: `@@unique([userId, invoiceNumber])`; indexed on `userId`, `customerId`, `status`.

### InvoiceItem
`id, invoiceId, description, project?, quantity (default 1), unitPrice (default 0), total`
Line items. `total` is `quantity × unitPrice` (rounded to 2 dp).

### BusinessProfile
`id, userId (unique → one per user), name, title?, phone?, email?, footerNote?, updatedAt`
The sender identity printed as the **FROM** block and footer on every invoice/PDF.

## Relationship overview

```
User
 ├─ BusinessProfile        (1:1)
 ├─ Customer  (1:n) ────────┐
 ├─ BankAccount (1:n)       │
 ├─ Project  (1:n) ──┐      │
 │     └─ Milestone (1:n)   │   (Milestone.invoiceId ─▶ Invoice, optional)
 └─ Invoice (1:n)           │
       ├─ InvoiceItem (1:n) │
       ├─ customer ─────────┘
       ├─ bankAccount? (n:1)
       ├─ project? (n:1)
       └─ milestones (1:n, back-ref)
```

## Totals & numbering

- **Invoice number** — sequential per user: `INV-` + zero-padded `(count + 1)`,
  e.g. `INV-0001`. Computed server-side at create time.
- **Totals** — `computeTotals(items, taxRate, discount)` in `lib/format.ts` derives
  `subtotal`, `taxAmount`, and `total`; stored on the invoice so they're stable
  even if inputs change later.
- **Money formatting** — `formatMoney(amount, currency)` renders `PKR`/`USD` values
  consistently across the UI and PDF.
