"use server";

import { redirect } from "next/navigation";

import { logActivity } from "@/lib/activity";
import { verifySession } from "@/lib/dal/auth";
import { getDb, type DB } from "@/lib/db";
import { publish } from "@/lib/events";
import { revalidateAreas } from "@/lib/revalidate";
import type { ActionResult, FormState, Invoice } from "@/lib/types";
import { formError, idSchema, invoiceSchema, invoiceStatusSchema, validationError } from "@/lib/validation";

function revalidate() {
  revalidateAreas("invoices", "dashboard");
}

/** Generate the next sequential invoice number, e.g. INV-0007. */
function nextNumber(db: DB) {
  const rows = db.prepare("SELECT number FROM invoices").all() as { number: string | null }[];
  let max = 0;
  for (const r of rows) {
    const m = /(\d+)\s*$/.exec(r.number || "");
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `INV-${String(max + 1).padStart(4, "0")}`;
}

function insertItems(
  db: DB,
  invoiceId: number | bigint,
  items: { description: string; quantity: number; unit_price: number }[],
) {
  const stmt = db.prepare(
    "INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, position) VALUES (?, ?, ?, ?, ?)",
  );
  items.forEach((it, i) => stmt.run(invoiceId, it.description, it.quantity, it.unit_price, i));
}

/**
 * Create an invoice, or update it when the form carries an `id`. Line items
 * arrive as parallel `item_description` / `item_quantity` / `item_unit_price`
 * fields and replace the stored ones wholesale.
 */
export async function saveInvoice(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await verifySession();

  const descriptions = formData.getAll("item_description");
  const quantities = formData.getAll("item_quantity");
  const unitPrices = formData.getAll("item_unit_price");

  const parsed = invoiceSchema.safeParse({
    number: formData.get("number") ?? "",
    company_id: formData.get("company_id") ?? "",
    contact_id: formData.get("contact_id") ?? "",
    status: formData.get("status") ?? "draft",
    issue_date: formData.get("issue_date") ?? "",
    due_date: formData.get("due_date") ?? "",
    tax_rate: formData.get("tax_rate") ?? "",
    notes: formData.get("notes") ?? "",
    items: descriptions.slice(0, 200).map((description, i) => ({
      description: typeof description === "string" ? description : "",
      quantity: typeof quantities[i] === "string" ? quantities[i] : "",
      unit_price: typeof unitPrices[i] === "string" ? unitPrices[i] : "",
    })),
  });
  if (!parsed.success) return validationError(parsed.error, formData);
  const data = parsed.data;
  const db = getDb();

  const rawId = formData.get("id");
  if (rawId) {
    const id = idSchema.safeParse(rawId);
    const existing = id.success
      ? (db.prepare("SELECT * FROM invoices WHERE id = ?").get(id.data) as Invoice | undefined)
      : undefined;
    if (!existing) return formError("Invoice not found", formData);

    const number = data.number || existing.number;
    db.transaction(() => {
      db.prepare(
        `UPDATE invoices SET number = ?, company_id = ?, contact_id = ?, status = ?, issue_date = ?,
           due_date = ?, tax_rate = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`,
      ).run(
        number,
        data.company_id,
        data.contact_id,
        data.status,
        data.issue_date,
        data.due_date,
        data.tax_rate,
        data.notes,
        existing.id,
      );
      db.prepare("DELETE FROM invoice_items WHERE invoice_id = ?").run(existing.id);
      insertItems(db, existing.id, data.items);
    })();
    publish("invoice.updated", existing.id);
    logActivity({
      type: "invoice.updated",
      message: `Invoice ${number} was updated`,
      entityType: "invoice",
      entityId: existing.id,
      actorId: user.id,
    });
  } else {
    const created = db.transaction(() => {
      const number = data.number || nextNumber(db);
      const info = db
        .prepare(
          `INSERT INTO invoices (number, company_id, contact_id, status, issue_date, due_date, tax_rate, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          number,
          data.company_id,
          data.contact_id,
          data.status,
          data.issue_date,
          data.due_date,
          data.tax_rate,
          data.notes,
        );
      insertItems(db, info.lastInsertRowid, data.items);
      return { id: info.lastInsertRowid, number };
    })();
    publish("invoice.created", created.id);
    logActivity({
      type: "invoice.created",
      message: `Invoice ${created.number} was created`,
      entityType: "invoice",
      entityId: created.id,
      actorId: user.id,
    });
  }

  revalidate();
  return { ok: true };
}

/** Quick status change (e.g. mark as sent / paid). */
export async function setInvoiceStatus(invoiceId: number, status: string): Promise<ActionResult> {
  const { user } = await verifySession();

  const id = idSchema.safeParse(invoiceId);
  const db = getDb();
  const existing = id.success
    ? (db.prepare("SELECT * FROM invoices WHERE id = ?").get(id.data) as Invoice | undefined)
    : undefined;
  if (!existing) return { ok: false, error: "Invoice not found" };

  const next = invoiceStatusSchema.safeParse(status);
  if (!next.success) return { ok: false, error: "Invalid status" };

  db.prepare("UPDATE invoices SET status = ?, updated_at = datetime('now') WHERE id = ?").run(next.data, existing.id);
  publish("invoice.updated", existing.id);

  if (next.data !== existing.status) {
    logActivity({
      type: "invoice.status_changed",
      message: `Invoice ${existing.number} marked as ${next.data.charAt(0).toUpperCase() + next.data.slice(1)}`,
      entityType: "invoice",
      entityId: existing.id,
      actorId: user.id,
    });
  }

  revalidate();
  return { ok: true };
}

/**
 * Delete an invoice and its line items. With `redirectToList` (used on the
 * invoice's own page) the action finishes by navigating to the invoice list.
 */
export async function deleteInvoice(invoiceId: number, redirectToList = false): Promise<ActionResult> {
  const { user } = await verifySession();

  const id = idSchema.safeParse(invoiceId);
  const db = getDb();
  const existing = id.success
    ? (db.prepare("SELECT * FROM invoices WHERE id = ?").get(id.data) as Invoice | undefined)
    : undefined;
  if (!existing) return { ok: false, error: "Invoice not found" };

  db.prepare("DELETE FROM invoices WHERE id = ?").run(existing.id); // cascades to items
  publish("invoice.deleted", existing.id);
  logActivity({
    type: "invoice.deleted",
    message: `Invoice ${existing.number} was deleted`,
    entityType: "invoice",
    entityId: existing.id,
    actorId: user.id,
  });

  revalidate();
  if (redirectToList) redirect("/invoices");
  return { ok: true };
}
