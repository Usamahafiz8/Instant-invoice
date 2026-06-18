import Link from "next/link";
import { FileText, Globe, FolderKanban, Lock, Sparkles } from "lucide-react";

const FEATURES = [
  { icon: FileText, title: "Invoices in seconds", desc: "From customer to PDF in a few clicks." },
  { icon: Globe, title: "PKR & USD", desc: "Bill in the currency your client expects." },
  { icon: FolderKanban, title: "Projects & milestones", desc: "Track work and invoice each milestone." },
  { icon: Lock, title: "Private to you", desc: "Your data is tied to your account only." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      {/* themed backdrop */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-gray-50 via-slate-50 to-indigo-50/60 dark:from-[#08070f] dark:via-[#0a091b] dark:to-[#080710]" />
      <div className="pointer-events-none fixed -top-[15%] right-[10%] -z-10 h-[40vw] w-[40vw] rounded-full bg-violet-400/15 blur-[140px] dark:bg-violet-600/12" />
      <div className="pointer-events-none fixed bottom-[-15%] left-[-5%] -z-10 h-[40vw] w-[40vw] rounded-full bg-blue-400/12 blur-[120px] dark:bg-blue-700/10" />

      {/* Brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 lg:flex lg:flex-col lg:justify-between lg:p-12 dark:from-indigo-700 dark:via-indigo-900 dark:to-violet-950">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl dark:bg-indigo-400/15" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl dark:bg-fuchsia-500/15" />
        {/* subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            maskImage:
              "radial-gradient(ellipse at center, #000 25%, transparent 75%)",
          }}
        />

        <Link href="/" className="relative flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg ring-1 ring-white/20 backdrop-blur">
            ⚡
          </span>
          <span className="text-lg font-bold tracking-tight">Instant Invoice</span>
        </Link>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Invoicing, simplified
          </span>
          <h2 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl">
            Get paid faster,
            <br />
            with less hassle.
          </h2>
          <p className="mt-3 max-w-sm text-indigo-100">
            Customers, projects, milestones and polished PDF invoices — all in one
            simple workspace.
          </p>

          <ul className="mt-8 space-y-2">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <li
                  key={f.title}
                  className="animate-rise group flex items-start gap-3 rounded-xl p-2 transition hover:bg-white/[0.07]"
                  style={{ animationDelay: `${120 + i * 80}ms` }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/15 backdrop-blur transition-transform duration-200 group-hover:scale-110">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-sm text-indigo-100">{f.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs text-indigo-200">© 2026 Instant Invoice</p>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full items-center justify-center px-4 py-10 lg:w-1/2">
        {/* soft glow behind the card */}
        <div className="pointer-events-none absolute h-80 w-80 rounded-full bg-indigo-400/20 blur-[110px] dark:bg-indigo-600/20" />

        {/* gradient-ring card */}
        <div className="animate-rise relative w-full max-w-sm rounded-3xl bg-gradient-to-br from-indigo-500/40 via-white/10 to-violet-500/40 p-px shadow-2xl dark:from-indigo-400/25 dark:via-white/5 dark:to-violet-400/25">
          <div className="rounded-[calc(1.5rem-1px)] border border-white/50 bg-white/80 p-8 backdrop-blur-2xl dark:border-white/[0.06] dark:bg-[#0d0c17]/85">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-lg text-white">
                ⚡
              </span>
              <span className="text-lg font-bold tracking-tight">
                Instant Invoice
              </span>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
