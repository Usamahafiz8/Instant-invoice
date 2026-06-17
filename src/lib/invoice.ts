import type { Currency } from "./format";

export type InvoiceItemData = {
  description: string;
  project?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  status?: string;
  currency: Currency;
  issueDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  footerNote?: string | null;
  from?: {
    name: string;
    title?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  bank?: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban?: string | null;
    branch?: string | null;
    swift?: string | null;
  } | null;
  projectName?: string | null;
  milestones?: {
    name: string;
    amount: number;
    status: string; // "PAID" | "PENDING"
    onThisInvoice?: boolean;
  }[] | null;
  items: InvoiceItemData[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
};
