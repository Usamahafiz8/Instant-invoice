# Instant Invoice

A fast, modern invoicing app — create professional invoices in a few simple steps, with customers, projects & milestones, bank details, and polished PDF export.

## Features

- 🔐 **Email + password auth** (NextAuth v5) — each account's data is private
- 👥 **Customers** — full CRUD
- 📁 **Projects & milestones** — break work into milestones and bill one or many into a single invoice; track paid vs pending
- 🧾 **Invoices** — create / edit, line items, tax & discount, **PKR / USD**
- 🏦 **Bank accounts** — attach payment details to invoices
- 📄 **PDF preview & download** — milestone status included on project invoices
- 🌗 **Dark / light mode** with a glassy, modern UI
- ⚙️ **Settings** — your "FROM" identity on every invoice

## Tech stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** + **Tailwind CSS v4**
- **Prisma 6** + **PostgreSQL**
- **NextAuth v5** (Auth.js) — credentials provider
- **@react-pdf/renderer** for PDF generation
- `next-themes`, `lucide-react`

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment — create .env
DATABASE_URL="postgresql://USER@localhost:5432/instant_invoice?schema=public"
AUTH_SECRET="<run: openssl rand -base64 33>"
AUTH_TRUST_HOST=true

# 3. Create the database schema
npx prisma db push

# 4. Run
npm run dev
```

Open http://localhost:3000, create an account, and start invoicing.

> Optional: set `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` in `.env` to also enable Google sign-in.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npx prisma studio` | Browse the database |
