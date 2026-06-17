"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, FileText, Check } from "lucide-react";
import { formatMoney, type Currency } from "@/lib/format";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total?: string | number;
  currency?: Currency;
};
type Milestone = {
  id: string;
  name: string;
  description: string | null;
  amount: string | number;
  status: "PENDING" | "PAID";
  dueDate: string | null;
  invoice: Invoice | null;
};
type Project = {
  id: string;
  name: string;
  currency: Currency;
  description: string | null;
  customer: { id: string; name: string };
  milestones: Milestone[];
  invoices: Invoice[];
};

const statusStyle: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [msName, setMsName] = useState("");
  const [msDesc, setMsDesc] = useState("");
  const [msAmount, setMsAmount] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    setProject(res.ok ? await res.json() : null);
    setSelected(new Set());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!msName.trim()) return setError("Milestone name is required");
    setError("");
    setBusy(true);
    await fetch(`/api/projects/${id}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: msName,
        description: msDesc,
        amount: Number(msAmount) || 0,
      }),
    });
    setBusy(false);
    setMsName("");
    setMsDesc("");
    setMsAmount("");
    load();
  }

  async function toggleStatus(m: Milestone) {
    setBusy(true);
    await fetch(`/api/milestones/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: m.name,
        description: m.description,
        amount: Number(m.amount),
        status: m.status === "PAID" ? "PENDING" : "PAID",
      }),
    });
    setBusy(false);
    load();
  }

  async function removeMilestone(m: Milestone) {
    if (!confirm(`Delete milestone “${m.name}”?`)) return;
    await fetch(`/api/milestones/${m.id}`, { method: "DELETE" });
    load();
  }

  function toggleSelect(mId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(mId)) next.delete(mId);
      else next.add(mId);
      return next;
    });
  }

  async function billSelected() {
    if (selected.size === 0) return;
    setBusy(true);
    const res = await fetch(`/api/projects/${id}/invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestoneIds: [...selected] }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/invoices/${data.id}`);
    } else {
      setError((await res.json().catch(() => ({})))?.error ?? "Failed to invoice");
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!project)
    return (
      <p className="text-sm text-slate-500">
        Project not found.{" "}
        <Link href="/projects" className="underline">
          Back to projects
        </Link>
      </p>
    );

  const cur = project.currency;
  const total = project.milestones.reduce((s, m) => s + Number(m.amount), 0);
  const paid = project.milestones
    .filter((m) => m.status === "PAID")
    .reduce((s, m) => s + Number(m.amount), 0);
  const invoiced = project.milestones
    .filter((m) => m.invoice)
    .reduce((s, m) => s + Number(m.amount), 0);
  const selectedTotal = project.milestones
    .filter((m) => selected.has(m.id))
    .reduce((s, m) => s + Number(m.amount), 0);

  const input =
    "w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-900 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none dark:focus:ring-indigo-500/20";
  const primaryBtn =
    "inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50";
  const ghostBtn =
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50";

  return (
    <div>
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>

      <div className="mt-3">
        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {project.customer.name} · {cur}
        </p>
        {project.description && (
          <p className="mt-1.5 text-sm text-slate-600">{project.description}</p>
        )}
      </div>

      {/* summary cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={formatMoney(total, cur)} />
        <Stat label="Invoiced" value={formatMoney(invoiced, cur)} />
        <Stat label="Paid" value={formatMoney(paid, cur)} tone="green" />
        <Stat label="Remaining" value={formatMoney(total - paid, cur)} tone="amber" />
      </div>

      {/* milestones */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-800">Milestones</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Tick unbilled milestones to bill them together into one invoice.
          </p>
        </div>

        {project.milestones.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">
            No milestones yet — add your first one below.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {project.milestones.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="flex min-w-0 items-start gap-3">
                  {!m.invoice && (
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-indigo-600"
                      checked={selected.has(m.id)}
                      onChange={() => toggleSelect(m.id)}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{m.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {m.status}
                      </span>
                      {m.invoice && (
                        <Link
                          href={`/invoices/${m.invoice.id}`}
                          className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:underline"
                        >
                          {m.invoice.invoiceNumber}
                        </Link>
                      )}
                    </div>
                    {m.description && (
                      <p className="mt-0.5 text-sm text-slate-500">{m.description}</p>
                    )}
                    <p className="mt-0.5 text-sm font-medium text-slate-700">
                      {formatMoney(Number(m.amount), cur)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {m.invoice && (
                    <Link href={`/invoices/${m.invoice.id}`} className={ghostBtn}>
                      <FileText className="h-3.5 w-3.5" /> Invoice
                    </Link>
                  )}
                  <button
                    onClick={() => toggleStatus(m)}
                    disabled={busy}
                    className={ghostBtn}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {m.status === "PAID" ? "Pending" : "Paid"}
                  </button>
                  <button
                    onClick={() => removeMilestone(m)}
                    className="inline-flex items-center justify-center rounded-lg border border-red-200 p-1.5 text-red-500 transition hover:bg-red-50"
                    aria-label="Delete milestone"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* bill selected */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-indigo-50 px-5 py-3">
            <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
              {selected.size} selected · {formatMoney(selectedTotal, cur)}
            </span>
            <button onClick={billSelected} disabled={busy} className={primaryBtn}>
              <FileText className="h-4 w-4" />
              {busy ? "Creating…" : "Create invoice from selected"}
            </button>
          </div>
        )}

        {/* add milestone */}
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Add a milestone
          </p>
          <form onSubmit={addMilestone} className="grid gap-2 sm:grid-cols-12">
            <input
              className={`${input} sm:col-span-4`}
              placeholder="Name (e.g. Phase 1)"
              value={msName}
              onChange={(e) => setMsName(e.target.value)}
            />
            <input
              className={`${input} sm:col-span-5`}
              placeholder="Description (optional)"
              value={msDesc}
              onChange={(e) => setMsDesc(e.target.value)}
            />
            <input
              className={`${input} sm:col-span-2`}
              type="number"
              min="0"
              step="any"
              placeholder={`Amount`}
              value={msAmount}
              onChange={(e) => setMsAmount(e.target.value)}
            />
            <button
              type="submit"
              disabled={busy}
              className={`${primaryBtn} sm:col-span-1`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* invoices for this project */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-800">
            Invoices for this project
          </h2>
          <Link href={`/invoices/new?project=${project.id}`} className={ghostBtn}>
            <Plus className="h-3.5 w-3.5" /> Manual invoice
          </Link>
        </div>
        {project.invoices.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">
            No invoices yet. Bill a milestone above, or add a manual one.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {project.invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <Link
                  href={`/invoices/${inv.id}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {inv.invoiceNumber}
                </Link>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      statusStyle[inv.status] ?? ""
                    }`}
                  >
                    {inv.status}
                  </span>
                  <span className="font-medium">
                    {formatMoney(Number(inv.total ?? 0), (inv.currency as Currency) ?? cur)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "amber";
}) {
  const color =
    tone === "green"
      ? "text-green-600"
      : tone === "amber"
        ? "text-amber-600"
        : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
