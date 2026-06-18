"use client";

import { useEffect, useState } from "react";

type Bank = {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string | null;
  branch: string | null;
  swift: string | null;
};

const EMPTY = {
  bankName: "",
  accountTitle: "",
  accountNumber: "",
  iban: "",
  branch: "",
  swift: "",
};

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/banks");
    setBanks(res.ok ? await res.json() : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bankName.trim() || !form.accountTitle.trim() || !form.accountNumber.trim()) {
      setError("Bank name, account title and account number are required");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch(
      editingId ? `/api/banks/${editingId}` : "/api/banks",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({})))?.error ?? "Failed to save");
      return;
    }
    resetForm();
    load();
  }

  function startEdit(b: Bank) {
    setEditingId(b.id);
    setForm({
      bankName: b.bankName,
      accountTitle: b.accountTitle,
      accountNumber: b.accountNumber,
      iban: b.iban ?? "",
      branch: b.branch ?? "",
      swift: b.swift ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(b: Bank) {
    if (!confirm(`Delete ${b.bankName} — ${b.accountTitle}?`)) return;
    await fetch(`/api/banks/${b.id}`, { method: "DELETE" });
    if (editingId === b.id) resetForm();
    load();
  }

  const input =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none";

  return (
    <div>
      <h1 className="text-2xl font-bold">Bank accounts</h1>
      <p className="mt-1 text-sm text-slate-500">
        Save bank details once, then attach one to any invoice so customers can pay you.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2 className="text-sm font-semibold text-slate-700">
          {editingId ? "Edit bank account" : "Add a bank account"}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            className={input}
            placeholder="Bank name * (e.g. Meezan Bank)"
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
          />
          <input
            className={input}
            placeholder="Account title * (holder name)"
            value={form.accountTitle}
            onChange={(e) => setForm({ ...form, accountTitle: e.target.value })}
          />
          <input
            className={input}
            placeholder="Account number *"
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
          />
          <input
            className={input}
            placeholder="IBAN"
            value={form.iban}
            onChange={(e) => setForm({ ...form, iban: e.target.value })}
          />
          <input
            className={input}
            placeholder="Branch"
            value={form.branch}
            onChange={(e) => setForm({ ...form, branch: e.target.value })}
          />
          <input
            className={input}
            placeholder="SWIFT / BIC"
            value={form.swift}
            onChange={(e) => setForm({ ...form, swift: e.target.value })}
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : editingId ? "Update bank" : "Add bank"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : banks.length === 0 ? (
          <p className="text-sm text-slate-500">
            No bank accounts yet. Add your first one above.
          </p>
        ) : (
          banks.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{b.bankName}</p>
                  <p className="text-sm text-slate-500">{b.accountTitle}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(b)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(b)}
                    className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <dl className="mt-3 space-y-1 text-sm text-slate-600">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Account #</dt>
                  <dd className="text-right">{b.accountNumber}</dd>
                </div>
                {b.iban && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400">IBAN</dt>
                    <dd className="text-right">{b.iban}</dd>
                  </div>
                )}
                {b.branch && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400">Branch</dt>
                    <dd className="text-right">{b.branch}</dd>
                  </div>
                )}
                {b.swift && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400">SWIFT</dt>
                    <dd className="text-right">{b.swift}</dd>
                  </div>
                )}
              </dl>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
