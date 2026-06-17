export type Currency = "PKR" | "USD";

export const CURRENCIES: Currency[] = ["PKR", "USD"];

export function formatMoney(amount: number | string, currency: Currency) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat(currency === "PKR" ? "en-PK" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(isFinite(value) ? value : 0);
}

// Sample-invoice style: "18,000 PKR" / "1,200.50 USD" (suffix, decimals only when needed)
export function formatAmount(amount: number | string, currency: Currency) {
  const value = Number(amount);
  const n = isFinite(value) ? value : 0;
  const hasCents = Math.round(n * 100) % 100 !== 0;
  const num = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);
  return `${num} ${currency}`;
}

export type LineItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export function computeTotals(
  items: LineItemInput[],
  taxRate: number,
  discount: number,
) {
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0,
  );
  const safeDiscount = Math.min(Number(discount) || 0, subtotal);
  const taxable = subtotal - safeDiscount;
  const taxAmount = taxable * ((Number(taxRate) || 0) / 100);
  const total = taxable + taxAmount;
  return {
    subtotal: round2(subtotal),
    discount: round2(safeDiscount),
    taxAmount: round2(taxAmount),
    total: round2(total),
  };
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
