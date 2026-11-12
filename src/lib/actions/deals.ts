"use server";

import { logActivity } from "@/lib/activity";
import { verifySession } from "@/lib/dal/auth";
import { getDb } from "@/lib/db";
import { publish } from "@/lib/events";
import { revalidateAreas } from "@/lib/revalidate";
import type { ActionResult, Deal, FormState, Stage } from "@/lib/types";
import { dealSchema, formError, idSchema, validationError } from "@/lib/validation";

function revalidate() {
  // Deals are listed on contact and company pages and counted on the dashboard.
  revalidateAreas("deals", "contacts", "companies", "tasks", "dashboard");
}

const getStage = (id: number) => getDb().prepare("SELECT * FROM stages WHERE id = ?").get(id) as Stage | undefined;
const firstStage = () =>
  getDb()
    .prepare(
      "SELECT s.* FROM stages s JOIN pipelines p ON p.id = s.pipeline_id ORDER BY p.position, p.id, s.position LIMIT 1",
    )
    .get() as Stage | undefined;

/** Create a deal, or update it when the form carries an `id`. */
export async function saveDeal(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await verifySession();

  const parsed = dealSchema.safeParse({
    name: formData.get("name") ?? "",
    company_id: formData.get("company_id") ?? "",
    contact_id: formData.get("contact_id") ?? "",
    value: formData.get("value") ?? "",
    stage_id: formData.get("stage_id") ?? "",
    close_date: formData.get("close_date") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return validationError(parsed.error, formData);
  const data = parsed.data;
  const db = getDb();

  const rawId = formData.get("id");
  if (rawId) {
    const id = idSchema.safeParse(rawId);
    const existing = id.success
      ? (db.prepare("SELECT * FROM deals WHERE id = ?").get(id.data) as Deal | undefined)
      : undefined;
    if (!existing) return formError("Deal not found", formData);

    let nextStageId = existing.stage_id;
    let nextStageName = existing.stage;
    if (data.stage_id !== null && data.stage_id !== existing.stage_id) {
      const stage = getStage(data.stage_id);
      if (!stage) return formError("Invalid stage", formData);
      nextStageId = stage.id;
      nextStageName = stage.name;
    }

    db.prepare(
      `UPDATE deals SET name = ?, company_id = ?, contact_id = ?, value = ?, stage = ?, stage_id = ?,
         close_date = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(
      data.name,
      data.company_id,
      data.contact_id,
      data.value,
      nextStageName,
      nextStageId,
      data.close_date,
      data.notes,
      existing.id,
    );
    publish("deal.updated", existing.id);

    if (nextStageId !== existing.stage_id) {
      logActivity({
        type: "deal.stage_changed",
        message: `Deal "${data.name}" moved to ${nextStageName}`,
        entityType: "deal",
        entityId: existing.id,
        actorId: user.id,
      });
    } else {
      logActivity({
        type: "deal.updated",
        message: `Deal "${data.name}" was updated`,
        entityType: "deal",
        entityId: existing.id,
        actorId: user.id,
      });
    }
  } else {
    let stage = data.stage_id !== null ? getStage(data.stage_id) : undefined;
    if (data.stage_id !== null && !stage) return formError("Invalid stage", formData);
    if (!stage) stage = firstStage();
    if (!stage) return formError("No pipeline stages exist yet", formData);

    const info = db
      .prepare(
        `INSERT INTO deals (name, company_id, contact_id, value, stage, stage_id, close_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(data.name, data.company_id, data.contact_id, data.value, stage.name, stage.id, data.close_date, data.notes);
    publish("deal.created", info.lastInsertRowid);
    logActivity({
      type: "deal.created",
      message: `Deal "${data.name}" was created`,
      entityType: "deal",
      entityId: info.lastInsertRowid,
      actorId: user.id,
    });
  }

  revalidate();
  return { ok: true };
}

/** Move a deal to another column (the board's drag and drop). */
export async function moveDeal(dealId: number, stageId: number): Promise<ActionResult> {
  const { user } = await verifySession();

  const ids = { deal: idSchema.safeParse(dealId), stage: idSchema.safeParse(stageId) };
  const db = getDb();
  const existing = ids.deal.success
    ? (db.prepare("SELECT * FROM deals WHERE id = ?").get(ids.deal.data) as Deal | undefined)
    : undefined;
  if (!existing) return { ok: false, error: "Deal not found" };
  const stage = ids.stage.success ? getStage(ids.stage.data) : undefined;
  if (!stage) return { ok: false, error: "Invalid stage" };

  db.prepare("UPDATE deals SET stage = ?, stage_id = ?, updated_at = datetime('now') WHERE id = ?").run(
    stage.name,
    stage.id,
    existing.id,
  );
  publish("deal.updated", existing.id);

  if (stage.id !== existing.stage_id) {
    logActivity({
      type: "deal.stage_changed",
      message: `Deal "${existing.name}" moved to ${stage.name}`,
      entityType: "deal",
      entityId: existing.id,
      actorId: user.id,
    });
  }

  revalidate();
  return { ok: true };
}

export async function deleteDeal(dealId: number): Promise<ActionResult> {
  const { user } = await verifySession();

  const id = idSchema.safeParse(dealId);
  const db = getDb();
  const existing = id.success
    ? (db.prepare("SELECT * FROM deals WHERE id = ?").get(id.data) as Deal | undefined)
    : undefined;
  if (!existing) return { ok: false, error: "Deal not found" };

  db.prepare("DELETE FROM deals WHERE id = ?").run(existing.id);
  publish("deal.deleted", existing.id);
  logActivity({
    type: "deal.deleted",
    message: `Deal "${existing.name}" was deleted`,
    entityType: "deal",
    entityId: existing.id,
    actorId: user.id,
  });

  revalidate();
  return { ok: true };
}
