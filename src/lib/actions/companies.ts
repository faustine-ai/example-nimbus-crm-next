"use server";

import { redirect } from "next/navigation";

import { logActivity } from "@/lib/activity";
import { verifySession } from "@/lib/dal/auth";
import { getDb } from "@/lib/db";
import { publish } from "@/lib/events";
import { revalidateAreas } from "@/lib/revalidate";
import type { ActionResult, Company, FormState } from "@/lib/types";
import { companySchema, formError, idSchema, validationError } from "@/lib/validation";

function revalidate() {
  // Company names also show up on contacts, deal cards, tasks and invoices.
  revalidateAreas("companies", "contacts", "deals", "tasks", "invoices", "dashboard");
}

/** Create a company, or update it when the form carries an `id`. */
export async function saveCompany(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await verifySession();

  const parsed = companySchema.safeParse({
    name: formData.get("name") ?? "",
    website: formData.get("website") ?? "",
    industry: formData.get("industry") ?? "",
    size: formData.get("size") ?? "",
    location: formData.get("location") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return validationError(parsed.error, formData);
  const data = parsed.data;
  const db = getDb();

  const rawId = formData.get("id");
  if (rawId) {
    const id = idSchema.safeParse(rawId);
    const existing = id.success ? db.prepare("SELECT id FROM companies WHERE id = ?").get(id.data) : null;
    if (!id.success || !existing) return formError("Company not found", formData);

    db.prepare(
      `UPDATE companies SET name = ?, website = ?, industry = ?, size = ?, location = ?, notes = ?,
         updated_at = datetime('now') WHERE id = ?`,
    ).run(data.name, data.website, data.industry, data.size, data.location, data.notes, id.data);
    publish("company.updated", id.data);
    logActivity({
      type: "company.updated",
      message: `Company "${data.name}" was updated`,
      entityType: "company",
      entityId: id.data,
      actorId: user.id,
    });
  } else {
    const info = db
      .prepare("INSERT INTO companies (name, website, industry, size, location, notes) VALUES (?, ?, ?, ?, ?, ?)")
      .run(data.name, data.website, data.industry, data.size, data.location, data.notes);
    publish("company.created", info.lastInsertRowid);
    logActivity({
      type: "company.created",
      message: `Company "${data.name}" was created`,
      entityType: "company",
      entityId: info.lastInsertRowid,
      actorId: user.id,
    });
  }

  revalidate();
  return { ok: true };
}

/**
 * Delete a company. With `redirectToList` (used on the company's own page) the
 * action finishes by navigating to the company list.
 */
export async function deleteCompany(companyId: number, redirectToList = false): Promise<ActionResult> {
  const { user } = await verifySession();

  const id = idSchema.safeParse(companyId);
  const db = getDb();
  const existing = id.success
    ? (db.prepare("SELECT * FROM companies WHERE id = ?").get(id.data) as Company | undefined)
    : undefined;
  if (!existing) return { ok: false, error: "Company not found" };

  db.prepare("DELETE FROM companies WHERE id = ?").run(existing.id);
  publish("company.deleted", existing.id);
  logActivity({
    type: "company.deleted",
    message: `Company "${existing.name}" was deleted`,
    entityType: "company",
    entityId: existing.id,
    actorId: user.id,
  });

  revalidate();
  if (redirectToList) redirect("/companies");
  return { ok: true };
}
