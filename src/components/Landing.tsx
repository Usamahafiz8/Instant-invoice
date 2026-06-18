import Link from "next/link";
import {
  Zap,
  FileText,
  FolderKanban,
  Wallet,
  Moon,
  Globe,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "Invoices in seconds",
    desc: "Pick a customer, add line items, preview and download a polished PDF.",
    tint: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
  {
    icon: FolderKanban,
    title: "Projects & milestones",
    desc: "Split work into milestones and bill them — track paid vs pending.",
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  },
  {
    icon: Globe,
    title: "PKR & USD",
    desc: "Bill in the currency your client expects, with clean formatting.",
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  },
  {
    icon: Wallet,
    title: "Bank details",
    desc: "Attach your account so customers know exactly how to pay you.",
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    icon: Moon,
    title: "Dark & light",
    desc: "A modern glass interface that looks great in either theme.",
    tint: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70",
  },
  {
    icon: Zap,
    title: "Private to you",
    desc: "Your data is tied to your account — nobody else can see it.",
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* backdrop */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-gray-50 via-slate-50 to-indigo-50/60 dark:from-[#08070f] dark:via-[#0a091b] dark:to-[#080710]" />
      <div className="animate-float-slow pointer-events-none fixed -top-[15%] right-[-6%] -z-10 h-[42vw] w-[42vw] rounded-full bg-violet-400/15 blur-[130px] dark:bg-violet-600/12" />
      <div className="animate-float pointer-events-none fixed bottom-[-18%] left-[-6%] -z-10 h-[40vw] w-[40vw] rounded-full bg-blue-400/12 blur-[120px] dark:bg-blue-700/10" />

      {/* nav */}
      <header className="sticky top-0 z-20 border-b border-black/[0.05] bg-white/60 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0b0a14]/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm text-white shadow-sm">
              ⚡
            </span>
            <span className="text-sm font-bold tracking-tight">Instant Invoice</span>
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/signin"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-black/[0.04] dark:text-white/60 dark:hover:bg-white/[0.06]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-16 text-center sm:pt-24">
        <div
          className="animate-rise mx-auto inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-white/70"
          style={{ animationDelay: "0ms" }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-emerald-500" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Free • email or Google sign-in
        </div>

        <h1
          className="animate-rise mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl"
          style={{ animationDelay: "80ms" }}
        >
          Invoices, done in{" "}
          <span className="animate-gradient bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            seconds
          </span>
          .
        </h1>

        <p
          className="animate-rise mx-auto mt-5 max-w-xl text-base text-slate-500 dark:text-white/55 sm:text-lg"
          style={{ animationDelay: "160ms" }}
        >
          Manage customers, projects and milestones, then send polished PDF
          invoices in PKR or USD — all in one beautifully simple workspace.
        </p>

        <div
          className="animate-rise mt-8 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <Link
            href="/signup"
            className="group inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Get started free{" "}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/signin"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-700 backdrop-blur transition hover:bg-white dark:bg-transparent dark:text-white/70 dark:hover:bg-white/[0.05]"
          >
            Sign in
          </Link>
        </div>

        {/* floating invoice mockup */}
        <div
          className="animate-rise mt-16 flex justify-center"
          style={{ animationDelay: "320ms" }}
        >
          <div className="animate-float w-full max-w-md rounded-2xl border border-black/[0.06] bg-white/80 p-6 text-left shadow-2xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.05]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold">INVOICE</p>
                <p className="text-xs text-slate-400">INV-0001</p>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                PAID
              </span>
            </div>
            <div className="mt-5 space-y-2.5">
              {[
                ["Website design", "40,000"],
                ["Hosting (1 yr)", "12,000"],
                ["Maintenance", "8,000"],
              ].map(([label, amt]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm dark:border-white/[0.06]"
                >
                  <span className="text-slate-600 dark:text-white/70">{label}</span>
                  <span className="font-medium">{amt} PKR</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3 dark:bg-indigo-500/10">
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                Total Due
              </span>
              <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                60,000 PKR
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Everything you need to get paid
        </h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-slate-500 dark:text-white/55">
          Built for freelancers and small teams who want it simple.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="animate-rise group rounded-2xl border border-black/[0.06] bg-white/70 p-5 shadow-sm backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:shadow-md dark:border-white/[0.07] dark:bg-white/[0.04]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${f.tint}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-white/55">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="animate-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-6 py-14 text-center shadow-2xl ring-1 ring-white/10 sm:py-20 dark:from-indigo-700 dark:via-indigo-900 dark:to-violet-950 dark:ring-white/[0.08]">
          {/* animated glow blobs */}
          <div className="animate-float pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl dark:bg-indigo-400/15" />
          <div className="animate-float-slow pointer-events-none absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-fuchsia-400/25 blur-3xl dark:bg-fuchsia-500/15" />
          {/* subtle grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "34px 34px",
              maskImage:
                "radial-gradient(ellipse at center, #000 30%, transparent 75%)",
            }}
          />

          {/* eyebrow */}
          <span className="relative inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Set up in under a minute
          </span>

          <h2 className="relative mx-auto mt-5 max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to send your first invoice?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-base text-indigo-100">
            Create an account in seconds — no credit card, no setup.
          </p>

          <div className="relative mt-8 flex justify-center">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-indigo-700 shadow-lg shadow-indigo-950/30 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* trust row */}
          <div className="relative mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-indigo-100">
            {["No credit card", "Free forever", "PDF export"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3 w-3" />
                </span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-sm text-slate-400 dark:text-white/40">
        <p>© 2026 Instant Invoice. Built for simple, fast invoicing.</p>
      </footer>
    </div>
  );
}
