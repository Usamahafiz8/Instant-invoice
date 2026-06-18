"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { InvoiceData } from "@/lib/invoice";

const InvoicePdfPreview = dynamic(
  () => import("@/components/InvoicePdfPreview"),
  { ssr: false },
);

const STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE"];

export default function InvoiceActions({
  id,
  status,
  pdfData,
}: {
  id: string;
  status: string;
  pdfData: InvoiceData;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  async function changeStatus(next: string) {
    setBusy(true);
    setCurrent(next);
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this invoice?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    router.push("/dashboard/invoices");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={current}
        disabled={busy}
        onChange={(e) => changeStatus(e.target.value)}
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-900 focus:outline-none"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        onClick={() => setShowPreview(true)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
      >
        Preview / Download PDF
      </button>
      <button
        onClick={remove}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Delete
      </button>

      {showPreview && (
        <InvoicePdfPreview
          data={{ ...pdfData, status: current }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
