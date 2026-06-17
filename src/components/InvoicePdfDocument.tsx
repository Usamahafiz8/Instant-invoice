"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatAmount } from "@/lib/format";
import type { InvoiceData } from "@/lib/invoice";

const ACCENT = "#4f46e5"; // indigo-600
const ACCENT_SOFT = "#eef2ff"; // indigo-50
const INK = "#0f172a"; // slate-900
const MUTED = "#64748b"; // slate-500
const LINE = "#e2e8f0"; // slate-200

const statusColors: Record<string, { bg: string; fg: string }> = {
  DRAFT: { bg: "#e2e8f0", fg: "#475569" },
  SENT: { bg: "#dbeafe", fg: "#1d4ed8" },
  PAID: { bg: "#dcfce7", fg: "#15803d" },
  OVERDUE: { bg: "#fee2e2", fg: "#b91c1c" },
};

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    color: INK,
    fontFamily: "Helvetica",
    paddingBottom: 56,
  },

  // header band
  header: {
    backgroundColor: INK,
    paddingHorizontal: 40,
    paddingTop: 34,
    paddingBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  accentBar: { height: 4, backgroundColor: ACCENT },
  title: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 2,
  },
  fromName: { color: "#cbd5e1", fontSize: 10, marginTop: 8 },
  fromLine: { color: "#94a3b8", fontSize: 9, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  invNo: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 13 },
  headerMeta: { color: "#94a3b8", fontSize: 9, marginTop: 6 },
  headerMetaVal: { color: "#e2e8f0", fontFamily: "Helvetica-Bold" },
  badge: {
    marginTop: 10,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 10,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },

  body: { paddingHorizontal: 40, paddingTop: 26 },

  // parties
  parties: { flexDirection: "row", gap: 14, marginBottom: 8 },
  party: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 8,
    padding: 14,
  },
  partyLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    letterSpacing: 1,
    marginBottom: 6,
  },
  partyName: { fontFamily: "Helvetica-Bold", fontSize: 12, marginBottom: 2 },
  partyLine: { color: MUTED, marginBottom: 1 },

  // items
  tableHead: {
    flexDirection: "row",
    backgroundColor: ACCENT,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 22,
  },
  th: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 9 },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  rowAlt: { backgroundColor: "#f8fafc" },
  cDesc: { flex: 5 },
  cProject: { flex: 2.4, textAlign: "center", color: MUTED },
  cAmount: { flex: 2.2, textAlign: "right" },
  descMain: { fontFamily: "Helvetica-Bold" },
  descSub: { color: MUTED, fontSize: 8, marginTop: 2 },

  // totals
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16 },
  totals: { width: 240 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: ACCENT_SOFT,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  grandLabel: { fontFamily: "Helvetica-Bold", fontSize: 12, color: ACCENT },
  grandValue: { fontFamily: "Helvetica-Bold", fontSize: 14, color: ACCENT },

  // payment
  payCard: {
    marginTop: 28,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 10,
    color: INK,
  },
  payGrid: { flexDirection: "row", flexWrap: "wrap" },
  payItem: { width: "50%", marginBottom: 8 },
  payLabel: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  payValue: { fontFamily: "Helvetica-Bold", fontSize: 10 },

  // milestones
  msCard: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 8,
    padding: 16,
  },
  msHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  msRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  msLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  msDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  msName: { fontSize: 10 },
  msTag: {
    marginLeft: 6,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    backgroundColor: ACCENT_SOFT,
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  msRight: { flexDirection: "row", alignItems: "center" },
  msAmount: { fontSize: 10, color: MUTED, marginRight: 8 },
  msBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },

  notes: { marginTop: 18, color: MUTED, fontSize: 9, lineHeight: 1.4 },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: LINE,
    color: MUTED,
    fontSize: 9,
    textAlign: "center",
  },
});

function PayItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.payItem}>
      <Text style={styles.payLabel}>{label}</Text>
      <Text style={styles.payValue}>{value}</Text>
    </View>
  );
}

export default function InvoicePdfDocument({ data }: { data: InvoiceData }) {
  const fmt = (n: number) => formatAmount(n, data.currency);
  const cust = data.customer;
  const from = data.from;
  const bank = data.bank;
  const sc = statusColors[data.status ?? "DRAFT"] ?? statusColors.DRAFT;

  return (
    <Document title={data.invoiceNumber}>
      <Page size="A4" style={styles.page}>
        {/* header band */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            {from ? (
              <>
                <Text style={styles.fromName}>{from.name}</Text>
                {from.title ? <Text style={styles.fromLine}>{from.title}</Text> : null}
              </>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invNo}>{data.invoiceNumber}</Text>
            {data.issueDate ? (
              <Text style={styles.headerMeta}>
                Date: <Text style={styles.headerMetaVal}>{data.issueDate}</Text>
              </Text>
            ) : null}
            {data.dueDate ? (
              <Text style={styles.headerMeta}>
                Due: <Text style={styles.headerMetaVal}>{data.dueDate}</Text>
              </Text>
            ) : null}
            {data.status ? (
              <Text style={[styles.badge, { backgroundColor: sc.bg, color: sc.fg }]}>
                {data.status}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.accentBar} />

        <View style={styles.body}>
          {/* parties */}
          <View style={styles.parties}>
            {from ? (
              <View style={styles.party}>
                <Text style={styles.partyLabel}>FROM</Text>
                <Text style={styles.partyName}>{from.name}</Text>
                {from.title ? <Text style={styles.partyLine}>{from.title}</Text> : null}
                {from.phone ? <Text style={styles.partyLine}>{from.phone}</Text> : null}
                {from.email ? <Text style={styles.partyLine}>{from.email}</Text> : null}
              </View>
            ) : null}
            <View style={styles.party}>
              <Text style={styles.partyLabel}>BILLED TO</Text>
              <Text style={styles.partyName}>{cust.name || "—"}</Text>
              {cust.email ? <Text style={styles.partyLine}>{cust.email}</Text> : null}
              {cust.phone ? <Text style={styles.partyLine}>{cust.phone}</Text> : null}
              {cust.address ? <Text style={styles.partyLine}>{cust.address}</Text> : null}
            </View>
          </View>

          {/* items */}
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.cDesc]}>Description</Text>
            <Text style={[styles.th, styles.cProject, { color: "#ffffff" }]}>
              Project
            </Text>
            <Text style={[styles.th, styles.cAmount]}>Amount ({data.currency})</Text>
          </View>
          {data.items.map((it, i) => (
            <View
              style={[styles.row, ...(i % 2 === 1 ? [styles.rowAlt] : [])]}
              key={i}
            >
              <View style={styles.cDesc}>
                <Text style={styles.descMain}>{it.description}</Text>
                {it.quantity && it.quantity !== 1 ? (
                  <Text style={styles.descSub}>
                    {it.quantity} × {fmt(it.unitPrice)}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.cProject}>{it.project || "—"}</Text>
              <Text style={[styles.cAmount, styles.descMain]}>{fmt(it.total)}</Text>
            </View>
          ))}

          {/* totals */}
          <View style={styles.totalsWrap}>
            <View style={styles.totals}>
              <View style={styles.totalsRow}>
                <Text style={{ color: MUTED }}>Subtotal</Text>
                <Text>{fmt(data.subtotal)}</Text>
              </View>
              {data.discount > 0 ? (
                <View style={styles.totalsRow}>
                  <Text style={{ color: MUTED }}>Discount</Text>
                  <Text>- {fmt(data.discount)}</Text>
                </View>
              ) : null}
              {data.taxAmount > 0 ? (
                <View style={styles.totalsRow}>
                  <Text style={{ color: MUTED }}>Tax ({data.taxRate}%)</Text>
                  <Text>{fmt(data.taxAmount)}</Text>
                </View>
              ) : null}
              <View style={styles.grandRow}>
                <Text style={styles.grandLabel}>Total Due</Text>
                <Text style={styles.grandValue}>{fmt(data.total)}</Text>
              </View>
            </View>
          </View>

          {/* project milestones (paid / pending) */}
          {data.milestones && data.milestones.length > 0 ? (
            <View style={styles.msCard}>
              <View style={styles.msHeadRow}>
                <Text style={styles.sectionTitle}>
                  Project Milestones
                  {data.projectName ? ` — ${data.projectName}` : ""}
                </Text>
                <Text style={{ fontSize: 9, color: MUTED }}>
                  {data.milestones.filter((m) => m.status === "PAID").length} of{" "}
                  {data.milestones.length} paid
                </Text>
              </View>
              {data.milestones.map((m, i) => {
                const paid = m.status === "PAID";
                return (
                  <View style={styles.msRow} key={i}>
                    <View style={styles.msLeft}>
                      <View
                        style={[
                          styles.msDot,
                          { backgroundColor: paid ? "#16a34a" : "#cbd5e1" },
                        ]}
                      />
                      <Text style={styles.msName}>{m.name}</Text>
                      {m.onThisInvoice ? (
                        <Text style={styles.msTag}>THIS INVOICE</Text>
                      ) : null}
                    </View>
                    <View style={styles.msRight}>
                      <Text style={styles.msAmount}>{fmt(m.amount)}</Text>
                      <Text
                        style={[
                          styles.msBadge,
                          paid
                            ? { backgroundColor: "#dcfce7", color: "#15803d" }
                            : { backgroundColor: "#f1f5f9", color: "#475569" },
                        ]}
                      >
                        {paid ? "PAID" : "PENDING"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          {/* payment details */}
          {bank || from?.phone ? (
            <View style={styles.payCard}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <View style={styles.payGrid}>
                {bank ? (
                  <>
                    <PayItem label="Bank" value={bank.bankName} />
                    <PayItem label="Account Title" value={bank.accountTitle} />
                    <PayItem label="Account No." value={bank.accountNumber} />
                    {bank.iban ? <PayItem label="IBAN" value={bank.iban} /> : null}
                    {bank.branch ? <PayItem label="Branch" value={bank.branch} /> : null}
                    {bank.swift ? <PayItem label="SWIFT / BIC" value={bank.swift} /> : null}
                  </>
                ) : null}
                {from?.phone ? <PayItem label="Phone" value={from.phone} /> : null}
              </View>
            </View>
          ) : null}

          {data.notes ? <Text style={styles.notes}>{data.notes}</Text> : null}
        </View>

        {data.footerNote ? (
          <Text style={styles.footer} fixed>
            {data.footerNote}
          </Text>
        ) : null}
      </Page>
    </Document>
  );
}
