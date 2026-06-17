"use client";

import { useEffect, useState } from "react";

const EMPTY = {
  name: "",
  title: "",
  phone: "",
  email: "",
  footerNote: "Payment is due within 7 days. Thank you for your business.",
};

export default function SettingsPage() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p) {
          setForm({
            name: p.name ?? "",
            title: p.title ?? "",
            phone: p.phone ?? "",
            email: p.email ?? "",
            footerNote: p.footerNote ?? EMPTY.footerNote,
          });
        }
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Your name is required");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({})))?.error ?? "Failed to save");
      return;
    }
    setSaved(true);
  }

  const input =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none";

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Your details</h1>
      <p className="mt-1 text-sm text-slate-500">
        This appears as the <strong>FROM</strong> on every invoice and PDF.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading…</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Name *
              </label>
              <input
                className={input}
                placeholder="e.g. Muhammad Osama"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Title / role
                </label>
                <input
                  className={input}
                  placeholder="e.g. Software Engineer"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Phone
                </label>
                <input
                  className={input}
                  placeholder="e.g. +92 332 6551460"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Email
              </label>
              <input
                className={input}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Invoice footer note
              </label>
              <textarea
                className={input}
                rows={2}
                value={form.footerNote}
                onChange={(e) => setForm({ ...form, footerNote: e.target.value })}
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {saved && <p className="mt-3 text-sm text-green-600">Saved ✓</p>}
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save details"}
          </button>
        </form>
      )}
    </div>
  );
}
