"use server";

import { redirect } from "next/navigation";

import { logActivity } from "@/lib/activity";
import { verifySession } from "@/lib/dal/auth";
import { getDb } from "@/lib/db";
import { publish } from "@/lib/events";
import { revalidateAreas } from "@/lib/revalidate";
import type { ActionResult, Contact, FormState } from "@/lib/types";
import { contactSchema, formError, idSchema, validationError } from "@/lib/validation";

function revalidate() {
  // Contact names also show up on company pages, deal cards, tasks and invoices.
  revalidateAreas("contacts", "companies", "deals", "tasks", "invoices", "dashboard");
}

/** Create a contact, or update it when the form carries an `id`. */
export async function saveContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await verifySession();

  const parsed = contactSchema.safeParse({
    first_name: formData.get("first_name") ?? "",
    last_name: formData.get("last_name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    job_title: formData.get("job_title") ?? "",
    company_id: formData.get("company_id") ?? "",
    status: formData.get("status") ?? "lead",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return validationError(parsed.error, formData);
  const data = parsed.data;
  const db = getDb();

  const rawId = formData.get("id");
  if (rawId) {
    const id = idSchema.safeParse(rawId);
    const existing = id.success ? db.prepare("SELECT id FROM contacts WHERE id = ?").get(id.data) : null;
    if (!id.success || !existing) return formError("Contact not found", formData);

    db.prepare(
      `UPDATE contacts SET first_name = ?, last_name = ?, email = ?, phone = ?, job_title = ?,
         company_id = ?, status = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(
      data.first_name,
      data.last_name,
      data.email,
      data.phone,
      data.job_title,
      data.company_id,
      data.status,
      data.notes,
      id.data,
    );
    publish("contact.updated", id.data);
    logActivity({
      type: "contact.updated",
      message: `Contact "${data.first_name} ${data.last_name}" was updated`,
      entityType: "contact",
      entityId: id.data,
      actorId: user.id,
    });
  } else {
    const info = db
      .prepare(
        `INSERT INTO contacts (first_name, last_name, email, phone, job_title, company_id, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        data.first_name,
        data.last_name,
        data.email,
        data.phone,
        data.job_title,
        data.company_id,
        data.status,
        data.notes,
      );
    publish("contact.created", info.lastInsertRowid);
    logActivity({
      type: "contact.created",
      message: `Contact "${data.first_name} ${data.last_name}" was created`,
      entityType: "contact",
      entityId: info.lastInsertRowid,
      actorId: user.id,
    });
  }

  revalidate();
  return { ok: true };
}

/**
 * Delete a contact. With `redirectToList` (used on the contact's own page) the
 * action finishes by navigating to the contact list.
 */
export async function deleteContact(contactId: number, redirectToList = false): Promise<ActionResult> {
  const { user } = await verifySession();

  const id = idSchema.safeParse(contactId);
  const db = getDb();
  const existing = id.success
    ? (db.prepare("SELECT * FROM contacts WHERE id = ?").get(id.data) as Contact | undefined)
    : undefined;
  if (!existing) return { ok: false, error: "Contact not found" };

  db.prepare("DELETE FROM contacts WHERE id = ?").run(existing.id);
  publish("contact.deleted", existing.id);
  logActivity({
    type: "contact.deleted",
    message: `Contact "${existing.first_name} ${existing.last_name}" was deleted`,
    entityType: "contact",
    entityId: existing.id,
    actorId: user.id,
  });

  revalidate();
  if (redirectToList) redirect("/contacts");
  return { ok: true };
}
