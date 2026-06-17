"use client";

import { useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, X, Loader2, ExternalLink } from "lucide-react";
import InvoicePdfDocument from "./InvoicePdfDocument";
import type { InvoiceData } from "@/lib/invoice";

export default function InvoicePdfPreview({
  data,
  onClose,
}: {
  data: InvoiceData;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileName = `${data.invoiceNumber.replace(/\s+/g, "-")}.pdf`;

  // Render the PDF to a Blob URL once when opened — far more reliable than
  // <PDFViewer>, which can render blank under React 19 / Turbopack.
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    (async () => {
      try {
        const blob = await pdf(<InvoicePdfDocument data={data} />).toBlob();
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "Could not render the PDF");
        }
      }
    })();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // Capture the data at open time only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900/70 p-3 backdrop-blur-sm sm:p-8">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-2xl dark:border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold">Invoice PDF</h2>
          <div className="flex items-center gap-2">
            {url && (
              <>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open tab
                </a>
                <a
                  href={url}
                  download={fileName}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" /> Close
            </button>
          </div>
        </div>

        <div className="relative flex-1 bg-slate-100 dark:bg-[#0d0c17]">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
              <p className="text-sm font-medium text-red-600">
                Couldn’t render the PDF
              </p>
              <p className="max-w-md text-xs text-slate-500">{error}</p>
            </div>
          ) : !url ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Generating preview…</p>
            </div>
          ) : (
            <iframe
              src={url}
              title="Invoice PDF preview"
              className="h-full w-full"
              style={{ border: "none" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
