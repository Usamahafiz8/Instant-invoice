"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";

function NewInvoice() {
  const params = useSearchParams();
  return (
    <InvoiceForm
      presetCustomerId={params.get("customer") ?? undefined}
      presetProjectId={params.get("project") ?? undefined}
    />
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <NewInvoice />
    </Suspense>
  );
}
