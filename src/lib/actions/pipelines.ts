"use server";

import { verifySession } from "@/lib/dal/auth";
import { getDb } from "@/lib/db";
import { publish } from "@/lib/events";
import { revalidateAreas } from "@/lib/revalidate";
import type { ActionResult, FormState, Pipeline, Stage } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { formError, idSchema, pipelineSchema, stageSchema, validationError } from "@/lib/validation";

function revalidate() {
  // Stage names and types drive the badges on contact/company pages and the dashboard chart.
  revalidateAreas("deals", "contacts", "companies", "dashboard");
}

const STARTER_STAGES = [
  { name: "New", type: "open" },
  { name: "In Progress", type: "open" },
  { name: "Won", type: "won" },
  { name: "Lost", type: "lost" },
];

/**
 * Create a pipeline (with a starter set of columns), or rename it when the
 * form carries an `id`. Returns the slug to navigate to in `data.slug`.
 */
export async function savePipeline(_prev: FormState, formData: FormData): Promise<FormState> {
  await verifySession();

  const parsed = pipelineSchema.safeParse({ name: formData.get("name") ?? "" });
  if (!parsed.success) return validationError(parsed.error, formData);
  const { name } = parsed.data;
  const db = getDb();

  const rawId = formData.get("id");
  if (rawId) {
    const id = idSchema.safeParse(rawId);
    const existing = id.success ? db.prepare("SELECT id FROM pipelines WHERE id = ?").get(id.data) : null;
    if (!id.success || !existing) return formError("Pipeline not found", formData);

    db.prepare("UPDATE pipelines SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name, id.data);
    publish("pipeline.changed", id.data);
  } else {
    const nextPos =
      (db.prepare("SELECT COALESCE(MAX(position), -1) AS m FROM pipelines").get() as { m: number }).m + 1;
    db.transaction(() => {
      const id = db.prepare("INSERT INTO pipelines (name, position) VALUES (?, ?)").run(name, nextPos).lastInsertRowid;
      STARTER_STAGES.forEach((s, i) =>
        db.prepare("INSERT INTO stages (pipeline_id, name, type, position) VALUES (?, ?, ?, ?)").run(id, s.name, s.type, i),
      );
      publish("pipeline.changed", id);
    })();
  }

  revalidate();
  return { ok: true, data: { slug: slugify(name) } };
}

/** Delete a pipeline. Refused for the last pipeline and for pipelines that still hold deals. */
export async function deletePipeline(pipelineId: number): Promise<ActionResult> {
  await verifySession();

  const id = idSchema.safeParse(pipelineId);
  const db = getDb();
  const existing = id.success
    ? (db.prepare("SELECT * FROM pipelines WHERE id = ?").get(id.data) as Pipeline | undefined)
    : undefined;
  if (!existing) return { ok: false, error: "Pipeline not found" };

  const total = (db.prepare("SELECT COUNT(*) AS c FROM pipelines").get() as { c: number }).c;
  if (total <= 1) return { ok: false, error: "You must keep at least one pipeline" };

  const dealCount = (
    db
      .prepare("SELECT COUNT(*) AS c FROM deals WHERE stage_id IN (SELECT id FROM stages WHERE pipeline_id = ?)")
      .get(existing.id) as { c: number }
  ).c;
  if (dealCount > 0) return { ok: false, error: "Move or delete this pipeline’s deals first" };

  db.prepare("DELETE FROM pipelines WHERE id = ?").run(existing.id); // cascades to stages
  publish("pipeline.changed", existing.id);

  revalidate();
  return { ok: true };
}

/** Add a column to the pipeline in `pipeline_id`, or edit the column in `id` (name and type). */
export async function saveStage(_prev: FormState, formData: FormData): Promise<FormState> {
  await verifySession();

  const parsed = stageSchema.safeParse({
    name: formData.get("name") ?? "",
    type: formData.get("type") ?? "open",
  });
  if (!parsed.success) return validationError(parsed.error, formData);
  const { name, type } = parsed.data;
  const db = getDb();

  const rawId = formData.get("id");
  if (rawId) {
    const id = idSchema.safeParse(rawId);
    const stage = id.success
      ? (db.prepare("SELECT * FROM stages WHERE id = ?").get(id.data) as Stage | undefined)
      : undefined;
    if (!stage) return formError("Column not found", formData);

    db.transaction(() => {
      db.prepare("UPDATE stages SET name = ?, type = ? WHERE id = ?").run(name, type, stage.id);
      // Keep the denormalized name mirror on deals in sync.
      db.prepare("UPDATE deals SET stage = ? WHERE stage_id = ?").run(name, stage.id);
    })();
    publish("pipeline.changed", stage.pipeline_id);
  } else {
    const pipelineId = idSchema.safeParse(formData.get("pipeline_id"));
    const pipeline = pipelineId.success
      ? db.prepare("SELECT id FROM pipelines WHERE id = ?").get(pipelineId.data)
      : null;
    if (!pipelineId.success || !pipeline) return formError("Pipeline not found", formData);

    const nextPos =
      (
        db.prepare("SELECT COALESCE(MAX(position), -1) AS m FROM stages WHERE pipeline_id = ?").get(pipelineId.data) as {
          m: number;
        }
      ).m + 1;
    db.prepare("INSERT INTO stages (pipeline_id, name, type, position) VALUES (?, ?, ?, ?)").run(
      pipelineId.data,
      name,
      type,
      nextPos,
    );
    publish("pipeline.changed", pipelineId.data);
  }

  revalidate();
  return { ok: true };
}

/** Delete a column. Refused for the last column of a pipeline and for columns that still hold deals. */
export async function deleteStage(stageId: number): Promise<ActionResult> {
  await verifySession();

  const id = idSchema.safeParse(stageId);
  const db = getDb();
  const stage = id.success
    ? (db.prepare("SELECT * FROM stages WHERE id = ?").get(id.data) as Stage | undefined)
    : undefined;
  if (!stage) return { ok: false, error: "Column not found" };

  const stageCount = (
    db.prepare("SELECT COUNT(*) AS c FROM stages WHERE pipeline_id = ?").get(stage.pipeline_id) as { c: number }
  ).c;
  if (stageCount <= 1) return { ok: false, error: "A pipeline must have at least one column" };

  const dealCount = (db.prepare("SELECT COUNT(*) AS c FROM deals WHERE stage_id = ?").get(stage.id) as { c: number }).c;
  if (dealCount > 0) return { ok: false, error: "Move this column’s deals elsewhere first" };

  db.prepare("DELETE FROM stages WHERE id = ?").run(stage.id);
  publish("pipeline.changed", stage.pipeline_id);

  revalidate();
  return { ok: true };
}

/** Reorder the columns of a pipeline. `order` is the list of stage ids, left to right. */
export async function reorderStages(pipelineId: number, order: number[]): Promise<ActionResult> {
  await verifySession();

  const id = idSchema.safeParse(pipelineId);
  const db = getDb();
  const pipeline = id.success ? db.prepare("SELECT id FROM pipelines WHERE id = ?").get(id.data) : null;
  if (!id.success || !pipeline) return { ok: false, error: "Pipeline not found" };

  const ids = idSchema.array().max(500).safeParse(order);
  if (!ids.success) return { ok: false, error: "order must be an array of stage ids" };

  const valid = new Set(
    (db.prepare("SELECT id FROM stages WHERE pipeline_id = ?").all(id.data) as { id: number }[]).map((s) => s.id),
  );
  const update = db.prepare("UPDATE stages SET position = ? WHERE id = ? AND pipeline_id = ?");
  db.transaction(() => {
    ids.data.forEach((stageId, index) => {
      if (valid.has(stageId)) update.run(index, stageId, id.data);
    });
  })();
  publish("pipeline.changed", id.data);

  revalidate();
  return { ok: true };
}
