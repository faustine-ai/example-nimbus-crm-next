import "server-only";

import { PAGE_SIZE } from "@/lib/constants";
import { getDb } from "@/lib/db";
import { invoiceTotals, round2 } from "@/lib/invoice-math";
import type { Invoice, InvoiceDetail, InvoiceItem, InvoiceListItem, Paginated } from "@/lib/types";

import { verifySession } from "./auth";

/** Invoices with company name and computed totals: search on number/company and status filter. */
export async function listInvoices({
  search = "",
  status = "",
  page = 1,
}: { search?: string; status?: string; page?: number } = {}): Promise<Paginated<InvoiceListItem>> {
  await verifySession();
  const db = getDb();

  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (search) {
    clauses.push("(i.number LIKE ? OR co.name LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    clauses.push("i.status = ?");
    params.push(status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const from = "FROM invoices i LEFT JOIN companies co ON co.id = i.company_id";

  const total = (db.prepare(`SELECT COUNT(*) AS c ${from} ${where}`).get(...params) as { c: number }).c;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pageCount);

  const rows = db
    .prepare(
      `SELECT i.*, co.name AS company_name,
              (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM invoice_items WHERE invoice_id = i.id) AS subtotal
       ${from} ${where}
       ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, PAGE_SIZE, (current - 1) * PAGE_SIZE) as (Invoice & { company_name: string | null; subtotal: number })[];

  // Line items travel with each row so an invoice can be edited straight from the list.
  const itemsOf = db.prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position, id");

  return {
    rows: rows.map((r) => {
      const subtotal = round2(r.subtotal);
      const tax = round2((subtotal * (r.tax_rate || 0)) / 100);
      return { ...r, subtotal, tax, total: round2(subtotal + tax), items: itemsOf.all(r.id) as InvoiceItem[] };
    }),
    total,
    page: current,
    pageCount,
  };
}

/** One invoice with its company, contact, line items and totals, or null when it does not exist. */
export async function getInvoice(id: number): Promise<InvoiceDetail | null> {
  await verifySession();
  const db = getDb();

  const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id) as Invoice | undefined;
  if (!invoice) return null;

  const company = invoice.company_id
    ? ((db.prepare("SELECT id, name FROM companies WHERE id = ?").get(invoice.company_id) as InvoiceDetail["company"]) ?? null)
    : null;
  const contact = invoice.contact_id
    ? ((db
        .prepare("SELECT id, first_name, last_name, email FROM contacts WHERE id = ?")
        .get(invoice.contact_id) as InvoiceDetail["contact"]) ?? null)
    : null;
  const items = db
    .prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position, id")
    .all(invoice.id) as InvoiceItem[];

  return { ...invoice, company, contact, items, ...invoiceTotals(items, invoice.tax_rate) };
}
