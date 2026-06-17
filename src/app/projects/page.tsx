"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney, type Currency } from "@/lib/format";

type Customer = { id: string; name: string };
type MilestoneLite = { amount: string | number; status: string };
type Project = {
  id: string;
  name: string;
  currency: Currency;
  customer: { id: string; name: string };
  milestones: MilestoneLite[];
};
type NewMilestone = { name: string; description: string; amount: string };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [currency, setCurrency] = useState<Currency>("PKR");
  const [description, setDescription] = useState("");
  const [milestones, setMilestones] = useState<NewMilestone[]>([
    { name: "", description: "", amount: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/projects");
    setProjects(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    fetch("/api/customers")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Customer[]) => setCustomers(d));
  }, []);

  function setMs(i: number, patch: Partial<NewMilestone>) {
    setMilestones((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Project name is required");
    if (!customerId) return setError("Pick a customer");
    setSaving(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        customerId,
        currency,
        description,
        milestones: milestones
          .filter((m) => m.name.trim())
          .map((m) => ({
            name: m.name.trim(),
            description: m.description.trim(),
            amount: Number(m.amount) || 0,
          })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({})))?.error ?? "Failed to create");
      return;
    }
    setName("");
    setCustomerId("");
    setDescription("");
    setMilestones([{ name: "", description: "", amount: "" }]);
    load();
  }

  const input =
    "w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none dark:focus:ring-indigo-500/20";

  function totals(p: Project) {
    const total = p.milestones.reduce((s, m) => s + Number(m.amount), 0);
    const paid = p.milestones
      .filter((m) => m.status === "PAID")
      .reduce((s, m) => s + Number(m.amount), 0);
    return { total, paid };
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Projects</h1>
      <p className="mt-1 text-sm text-slate-500">
        Break a project into milestones, then invoice each one when it’s due.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-slate-700">New project</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            className={input}
            placeholder="Project name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {customers.length === 0 ? (
            <p className="text-sm text-slate-500">
              No customers yet.{" "}
              <Link href="/customers" className="text-slate-900 underline">
                Add one →
              </Link>
            </p>
          ) : (
            <select
              className={input}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Select customer *</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Currency:</span>
          {(["PKR", "USD"] as Currency[]).map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCurrency(c)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                currency === c
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 hover:bg-slate-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs font-medium text-slate-500">
          Milestones (optional — you can add more later)
        </p>
        <div className="mt-2 space-y-2">
          {milestones.map((m, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <input
                className={`${input} col-span-12 sm:col-span-3`}
                placeholder={`Milestone ${i + 1} name`}
                value={m.name}
                onChange={(e) => setMs(i, { name: e.target.value })}
              />
              <input
                className={`${input} col-span-8 sm:col-span-6`}
                placeholder="Description (optional)"
                value={m.description}
                onChange={(e) => setMs(i, { description: e.target.value })}
              />
              <input
                className={`${input} col-span-3 sm:col-span-2`}
                type="number"
                min="0"
                step="any"
                placeholder={`Amount`}
                value={m.amount}
                onChange={(e) => setMs(i, { amount: e.target.value })}
              />
              <button
                type="button"
                onClick={() =>
                  setMilestones((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)))
                }
                className="col-span-1 flex items-center justify-center text-slate-400 hover:text-red-600"
                aria-label="Remove milestone"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setMilestones((p) => [...p, { name: "", description: "", amount: "" }])
          }
          className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          + Add milestone
        </button>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create project"}
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-slate-500">No projects yet.</p>
        ) : (
          projects.map((p) => {
            const { total, paid } = totals(p);
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-slate-500">{p.customer.name}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {p.milestones.length} milestone{p.milestones.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-slate-500">
                    Paid {formatMoney(paid, p.currency)}
                  </span>
                  <span className="font-medium">
                    {formatMoney(total, p.currency)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${total > 0 ? (paid / total) * 100 : 0}%` }}
                  />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
