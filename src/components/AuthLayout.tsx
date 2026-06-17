import Link from "next/link";

const FEATURES = [
  { icon: "🧾", title: "Invoices in seconds", desc: "From customer to PDF in a few clicks." },
  { icon: "💱", title: "PKR & USD", desc: "Bill in the currency your client expects." },
  { icon: "📁", title: "Projects & milestones", desc: "Track work and invoice each milestone." },
  { icon: "🔒", title: "Private to you", desc: "Your data is tied to your account only." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      {/* themed backdrop */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-gray-50 via-slate-50 to-indigo-50/60 dark:from-[#08070f] dark:via-[#0a091b] dark:to-[#080710]" />
      <div className="pointer-events-none fixed -top-[15%] right-[10%] -z-10 h-[40vw] w-[40vw] rounded-full bg-violet-400/15 blur-[140px] dark:bg-violet-600/12" />
      <div className="pointer-events-none fixed bottom-[-15%] left-[-5%] -z-10 h-[40vw] w-[40vw] rounded-full bg-blue-400/12 blur-[120px] dark:bg-blue-700/10" />

      {/* Brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-lg backdrop-blur">
            ⚡
          </span>
          <span className="text-lg font-bold tracking-tight">Instant Invoice</span>
        </Link>

        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Get paid faster,
            <br />
            with less hassle.
          </h2>
          <p className="mt-3 max-w-sm text-indigo-100">
            Customers, projects, milestones and polished PDF invoices — all in one
            simple workspace.
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-base backdrop-blur">
                  {f.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-indigo-100">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-indigo-200">© 2026 Instant Invoice</p>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-white/70 p-8 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04]">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-lg text-white">
              ⚡
            </span>
            <span className="text-lg font-bold tracking-tight">Instant Invoice</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
