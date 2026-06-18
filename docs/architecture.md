# Architecture

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, `src/` directory) |
| UI | React 19, Tailwind CSS v4, `lucide-react` icons |
| Auth | Auth.js / NextAuth v5 (Credentials + optional Google), JWT sessions |
| Database | PostgreSQL via Prisma 6 |
| PDF | `@react-pdf/renderer` |
| Theming | `next-themes` (class strategy) |
| Misc | `nextjs-toploader` (route progress), `bcryptjs` (password hashing) |

> **Note:** this Next.js version has breaking changes vs. older releases. The
> edge middleware file is named **`proxy.ts`** (not `middleware.ts`), and route
> types are generated (`next typegen`). When in doubt, read the bundled guides in
> `node_modules/next/dist/docs/`.

## Project structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout: <html>, providers, top-loader
│   ├── page.tsx                # "/" → marketing Landing (public)
│   ├── globals.css             # Tailwind + the glass theming layer + animations
│   ├── signin/page.tsx         # "/signin"
│   ├── signup/page.tsx         # "/signup"
│   ├── dashboard/              # Authenticated app (wrapped by dashboard/layout.tsx)
│   │   ├── layout.tsx          # Auth guard + DashboardShell (sidebar chrome)
│   │   ├── page.tsx            # "/dashboard" home: stats, outstanding, recent, walkthrough
│   │   ├── invoices/           # list, new, [id] view, [id]/edit
│   │   ├── customers/page.tsx
│   │   ├── projects/           # list + [id] detail (milestones, billing)
│   │   ├── banks/page.tsx
│   │   └── settings/page.tsx   # business profile
│   └── api/                    # REST route handlers (see api.md)
├── components/                 # Landing, DashboardShell, Onboarding, InvoiceForm,
│                               # AuthLayout, GoogleSignIn, PDF components, ThemeProvider
├── lib/                        # prisma client, auth-helpers, format/totals, invoice utils
├── auth.ts                     # NextAuth instance (providers, adapter, callbacks)
├── auth.config.ts              # Edge-safe config: route authorization rules
├── proxy.ts                    # Edge middleware ("proxy") that runs the auth gate
└── types/next-auth.d.ts        # Session type augmentation (user.id)
```

## Routing map

| Path | Access | What |
| --- | --- | --- |
| `/` | Public | Marketing landing page |
| `/signin`, `/signup` | Public (redirects to `/dashboard` if already signed in) | Auth forms |
| `/dashboard` | Authenticated | Home: stats, outstanding, recent invoices, walkthrough |
| `/dashboard/invoices` | Authenticated | Invoice list |
| `/dashboard/invoices/new` | Authenticated | Create invoice |
| `/dashboard/invoices/[id]` | Authenticated | Invoice view + actions (PDF, status) |
| `/dashboard/invoices/[id]/edit` | Authenticated | Edit invoice |
| `/dashboard/customers` | Authenticated | Customers CRUD |
| `/dashboard/projects` | Authenticated | Projects list + create |
| `/dashboard/projects/[id]` | Authenticated | Milestones, mark paid, bill into invoice |
| `/dashboard/banks` | Authenticated | Bank accounts CRUD |
| `/dashboard/settings` | Authenticated | Business profile (invoice FROM) |
| `/api/*` | Mixed | REST endpoints (see [api.md](./api.md)) |

## Authentication & route protection

Auth is split into an **edge-safe config** and a **full server instance** so the
middleware can run without Prisma/bcrypt:

- **`auth.config.ts`** — `pages.signIn = "/signin"` and an `authorized` callback:
  - `/` is always public.
  - `/signin` & `/signup` are public, but signed-in users are bounced to `/dashboard`.
  - Everything else requires a session.
- **`proxy.ts`** — the edge middleware. Runs `authorized` for every request
  (matcher excludes `api/auth`, `api/register`, static assets, images).
- **`auth.ts`** — the full NextAuth instance: `PrismaAdapter`, `session.strategy = "jwt"`,
  a **Credentials** provider (email + bcrypt-checked password) and an **optional
  Google** provider (only registered when `AUTH_GOOGLE_ID` is set to a real value).
- **`dashboard/layout.tsx`** — a second guard: server-side `auth()` check that
  redirects to `/signin` if there's no user, then renders `DashboardShell`.

Helpers in `lib/auth-helpers.ts`:
- `getUserId()` → the signed-in user's id or `null` (for pages).
- `requireUser()` → `{ userId }` or a `401` response (for API routes).

## Theming & styling

Tailwind v4 with a custom **glass theming layer** in `globals.css`. Rather than
adding dark variants to every element, the app uses plain slate/white utilities and
the stylesheet remaps them:

- `.bg-white` → frosted glass (translucent + blur); darker in dark mode.
- `.text-slate-900…400` → a white-alpha ramp in dark mode.
- `.border-slate-*`, status badge colors, inputs, shadows → dark-aware overrides.
- Primary buttons (`.bg-slate-900`) → a unified indigo→violet gradient.

Animations (also in `globals.css`, all disabled under `prefers-reduced-motion`):
`animate-rise`, `animate-in`, `animate-float`, `animate-float-slow`,
`animate-gradient`, `animate-ping-soft`.

## Local development

```bash
# 1. Install
npm install

# 2. Configure .env (see below)

# 3. Database
npx prisma migrate dev      # or: npx prisma db push
npx prisma generate

# 4. Run
npm run dev                 # http://localhost:3000
```

Scripts: `dev`, `build`, `start`, `lint`.

### Environment variables (`.env`)

| Var | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | Auth.js session/JWT signing secret |
| `AUTH_TRUST_HOST` | yes (local) | Trust the host header (set `true` for localhost) |
| `AUTH_GOOGLE_ID` | optional | Google OAuth client ID — enables the Google button |
| `AUTH_GOOGLE_SECRET` | optional | Google OAuth client secret |

Google sign-in is **off** until `AUTH_GOOGLE_ID` holds a real value (not a `YOUR_…`
placeholder). Register `http://localhost:3000/api/auth/callback/google` as an
authorized redirect URI in Google Cloud Console, then restart the dev server.
