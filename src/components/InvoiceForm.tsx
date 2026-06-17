"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  Save,
  Users,
  ListChecks,
  SlidersHorizontal,
} from "lucide-react";
import { computeTotals, formatMoney, type Currency } from "@/lib/format";
import type { InvoiceData } from "@/lib/invoice";

const InvoicePdfPreview = dynamic(
  () => import("@/components/InvoicePdfPreview"),
  { ssr: false },
);

type Customer = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};
type Bank = {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string | null;
  branch?: string | null;
  swift?: string | null;
};
type Project = {
  id: string;
  name: string;
  customerId: string;
  currency: Currency;
};
type Profile = {
  name: string;
  title?: string | null;
  phone?: string | null;
  email?: string | null;
  footerNote?: string | null;
} | null;
type Item = {
  description: string;
  project: string;
  quantity: string;
  unitPrice: string;
};

export type InitialInvoice = {
  id: string;
  customerId: string;
  bankAccountId: string | null;
  projectId: string | null;
  currency: Currency;
  status: string;
  taxRate: number;
  discount: number;
  dueDate: string | null; // yyyy-mm-dd
  notes: string | null;
  items: {
    description: string;
    project: string | null;
    quantity: number;
    unitPrice: number;
  }[];
};

const blankItem: Item = { description: "", project: "", quantity: "1", unitPrice: "" };

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none dark:focus:ring-indigo-500/20";

export default function InvoiceForm({
  initial,
  presetCustomerId,
  presetProjectId,
}: {
  initial?: InitialInvoice;
  presetCustomerId?: string;
  presetProjectId?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMilestones, setProjectMilestones] = useState<
    { name: string; amount: number; status: string }[]
  >([]);
  const [profile, setProfile] = useState<Profile>(null);

  const [customerId, setCustomerId] = useState(
    initial?.customerId ?? presetCustomerId ?? "",
  );
  const [projectId, setProjectId] = useState(
    initial?.projectId ?? presetProjectId ?? "",
  );
  const [bankId, setBankId] = useState(initial?.bankAccountId ?? "");
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? "PKR");
  const [items, setItems] = useState<Item[]>(
    initial
      ? initial.items.map((it) => ({
          description: it.description,
          project: it.project ?? "",
          quantity: String(it.quantity),
          unitPrice: String(it.unitPrice),
        }))
      : [{ ...blankItem }],
  );
  const [taxRate, setTaxRate] = useState(String(initial?.taxRate ?? 0));
  const [discount, setDiscount] = useState(String(initial?.discount ?? 0));
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Customer[]) => setCustomers(data));
    fetch("/api/banks")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Bank[]) => setBanks(data));
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Project[]) => {
        setProjects(data);
        if (presetProjectId && !initial) {
          const p = data.find((x) => x.id === presetProjectId);
          if (p) {
            setCustomerId(p.customerId);
            setCurrency(p.currency);
          }
        }
      });
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((p: Profile) => setProfile(p));
  }, [presetProjectId, initial]);

  // Load the selected project's milestones (so the preview/PDF can show them).
  useEffect(() => {
    if (!projectId) {
      setProjectMilestones([]);
      return;
    }
    let active = true;
    fetch(`/api/projects/${projectId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!active || !p) return;
        setProjectMilestones(
          (p.milestones ?? []).map(
            (m: { name: string; amount: number; status: string }) => ({
              name: m.name,
              amount: Number(m.amount),
              status: m.status,
            }),
          ),
        );
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  function chooseProject(pid: string) {
    setProjectId(pid);
    const p = projects.find((x) => x.id === pid);
    if (p) {
      setCustomerId(p.customerId);
      setCurrency(p.currency);
    }
  }

  const totals = useMemo(
    () =>
      computeTotals(
        items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
        })),
        Number(taxRate) || 0,
        Number(discount) || 0,
      ),
    [items, taxRate, discount],
  );

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedBank = banks.find((b) => b.id === bankId);

  const previewData: InvoiceData = useMemo(() => {
    const lineItems = items
      .filter((it) => it.description.trim())
      .map((it) => {
        const quantity = Number(it.quantity) || 0;
        const unitPrice = Number(it.unitPrice) || 0;
        return {
          description: it.description.trim(),
          project: it.project.trim() || null,
          quantity,
          unitPrice,
          total: Math.round(quantity * unitPrice * 100) / 100,
        };
      });
    return {
      invoiceNumber: initial?.id ? "INVOICE" : "PREVIEW",
      status: initial?.status ?? "DRAFT",
      currency,
      issueDate: new Date().toLocaleDateString(),
      dueDate: dueDate ? new Date(dueDate).toLocaleDateString() : null,
      notes: notes || null,
      footerNote: profile?.footerNote ?? null,
      from: profile
        ? {
            name: profile.name,
            title: profile.title,
            phone: profile.phone,
            email: profile.email,
          }
        : null,
      customer: {
        name: selectedCustomer?.name ?? "—",
        email: selectedCustomer?.email,
        phone: selectedCustomer?.phone,
        address: selectedCustomer?.address,
      },
      bank: selectedBank
        ? {
            bankName: selectedBank.bankName,
            accountTitle: selectedBank.accountTitle,
            accountNumber: selectedBank.accountNumber,
            iban: selectedBank.iban,
            branch: selectedBank.branch,
            swift: selectedBank.swift,
          }
        : null,
      projectName: projects.find((p) => p.id === projectId)?.name ?? null,
      milestones: projectMilestones.length > 0 ? projectMilestones : null,
      items: lineItems,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxRate: Number(taxRate) || 0,
      taxAmount: totals.taxAmount,
      total: totals.total,
    };
  }, [
    items,
    currency,
    dueDate,
    notes,
    profile,
    selectedCustomer,
    selectedBank,
    projects,
    projectId,
    projectMilestones,
    totals,
    taxRate,
    initial,
  ]);

  function openPreview() {
    setError("");
    if (previewData.items.length === 0) {
      setError("Add at least one line item to preview");
      return;
    }
    setShowPreview(true);
  }

  function updateItem(i: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { ...blankItem }]);
  }
  function removeItem(i: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!customerId) return setError("Pick a customer");
    const validItems = items.filter((it) => it.description.trim());
    if (validItems.length === 0) return setError("Add at least one line item");

    setSaving(true);
    const res = await fetch(
      isEdit ? `/api/invoices/${initial!.id}` : "/api/invoices",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          bankAccountId: bankId || null,
          projectId: projectId || null,
          currency,
          taxRate: Number(taxRate) || 0,
          discount: Number(discount) || 0,
          dueDate: dueDate || null,
          notes,
          items: validItems.map((it) => ({
            description: it.description.trim(),
            project: it.project.trim() || null,
            quantity: Number(it.quantity) || 0,
            unitPrice: Number(it.unitPrice) || 0,
          })),
        }),
      },
    );
    setSaving(false);
    if (!res.ok) {
      setError(
        (await res.json().catch(() => ({})))?.error ?? "Failed to save invoice",
      );
      return;
    }
    const invoice = await res.json();
    router.push(`/invoices/${invoice.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href={isEdit ? `/invoices/${initial!.id}` : "/invoices"}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {isEdit ? "Back to invoice" : "All invoices"}
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {isEdit ? "Edit invoice" : "New invoice"}
          </h1>
        </div>
      </div>

      {!profile && (
        <p className="mt-4 flex flex-wrap items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
          <span>Add your name in</span>
          <Link href="/settings" className="font-semibold underline">
            Settings
          </Link>
          <span>so it shows as the “FROM” on the invoice.</span>
        </p>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Left: form sections */}
        <div className="space-y-5 lg:col-span-2">
          {/* Step 1 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle n={1} icon={Users}>
              Customer &amp; currency
            </SectionTitle>

            {projects.length > 0 && (
              <div className="mb-3">
                <Label>
                  Project{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </Label>
                <select
                  className={inputCls}
                  value={projectId}
                  onChange={(e) => chooseProject(e.target.value)}
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {projectId && (
                  <p className="mt-1 text-xs text-slate-400">
                    Customer &amp; currency follow the project.
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Customer</Label>
                {customers.length === 0 ? (
                  <p className="py-2 text-sm text-slate-500">
                    No customers yet.{" "}
                    <Link href="/customers" className="font-medium text-indigo-600 underline">
                      Add one →
                    </Link>
                  </p>
                ) : (
                  <select
                    className={inputCls}
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  >
                    <option value="">Select a customer…</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <Label>Currency</Label>
                <div className="inline-flex rounded-lg border border-slate-300 p-0.5">
                  {(["PKR", "USD"] as Currency[]).map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`rounded-md px-5 py-1.5 text-sm font-semibold transition ${
                        currency === c
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <Label>
                Bank account{" "}
                <span className="font-normal text-slate-400">
                  (shown on the invoice)
                </span>
              </Label>
              {banks.length === 0 ? (
                <p className="py-2 text-sm text-slate-500">
                  No bank accounts yet.{" "}
                  <Link href="/banks" className="font-medium text-indigo-600 underline">
                    Add one →
                  </Link>
                </p>
              ) : (
                <select
                  className={inputCls}
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                >
                  <option value="">No bank / not specified</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} — {b.accountTitle} ({b.accountNumber})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </section>

          {/* Step 2 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle n={2} icon={ListChecks}>
              Line items
            </SectionTitle>

            <div className="hidden grid-cols-12 gap-2 px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
              <span className="col-span-4">Description</span>
              <span className="col-span-3">Project</span>
              <span className="col-span-2 text-right">Qty</span>
              <span className="col-span-2 text-right">Unit price</span>
              <span className="col-span-1" />
            </div>

            <div className="space-y-2">
              {items.map((it, i) => {
                const amount =
                  (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
                return (
                  <div
                    key={i}
                    className="grid grid-cols-12 items-center gap-2 rounded-xl border border-slate-200/70 p-2 sm:border-0 sm:p-0"
                  >
                    <input
                      className={`${inputCls} col-span-12 sm:col-span-4`}
                      placeholder="Item description"
                      value={it.description}
                      onChange={(e) => updateItem(i, { description: e.target.value })}
                    />
                    <input
                      className={`${inputCls} col-span-12 sm:col-span-3`}
                      placeholder="Project (optional)"
                      value={it.project}
                      onChange={(e) => updateItem(i, { project: e.target.value })}
                    />
                    <input
                      className={`${inputCls} col-span-4 text-right sm:col-span-2`}
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => updateItem(i, { quantity: e.target.value })}
                    />
                    <input
                      className={`${inputCls} col-span-5 text-right sm:col-span-2`}
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Price"
                      value={it.unitPrice}
                      onChange={(e) => updateItem(i, { unitPrice: e.target.value })}
                    />
                    <div className="col-span-3 flex items-center justify-end gap-1 sm:col-span-1">
                      <span className="hidden text-xs font-medium text-slate-500 lg:inline">
                        {formatMoney(amount, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        disabled={items.length === 1}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600"
            >
              <Plus className="h-4 w-4" /> Add line item
            </button>
          </section>

          {/* Step 3 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle n={3} icon={SlidersHorizontal}>
              Tax, discount &amp; notes
            </SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Tax %</Label>
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  step="any"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </div>
              <div>
                <Label>Discount ({currency})</Label>
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  step="any"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div>
                <Label>Due date</Label>
                <input
                  className={inputCls}
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <textarea
                  className={inputCls}
                  rows={2}
                  placeholder="Payment terms, thank-you note…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right: sticky summary */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-sm font-semibold text-slate-800">Summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="Subtotal" value={formatMoney(totals.subtotal, currency)} />
              <Row
                label="Discount"
                value={`− ${formatMoney(totals.discount, currency)}`}
              />
              <Row
                label={`Tax (${Number(taxRate) || 0}%)`}
                value={formatMoney(totals.taxAmount, currency)}
              />
              <div className="mt-3 flex items-center justify-between rounded-xl bg-indigo-50 px-3 py-3 dark:bg-indigo-500/10">
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  Total
                </span>
                <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                  {formatMoney(totals.total, currency)}
                </span>
              </div>
            </dl>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={openPreview}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Eye className="h-4 w-4" /> Preview PDF
            </button>
            <button
              type="submit"
              disabled={saving}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create invoice"}
            </button>
          </div>
        </div>
      </div>

      {showPreview && (
        <InvoicePdfPreview
          data={previewData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </form>
  );
}

function SectionTitle({
  n,
  icon: Icon,
  children,
}: {
  n: number;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
        <Icon className="h-4 w-4" />
      </span>
      <h2 className="text-sm font-semibold text-slate-800">{children}</h2>
      <span className="ml-auto text-xs font-medium text-slate-300">Step {n}</span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-slate-600">
      {children}
    </label>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}
