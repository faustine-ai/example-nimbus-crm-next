"use server";

import { logActivity } from "@/lib/activity";
import { verifySession } from "@/lib/dal/auth";
import { getDb } from "@/lib/db";
import { publish } from "@/lib/events";
import { revalidateAreas } from "@/lib/revalidate";
import type { ActionResult, FormState, Task } from "@/lib/types";
import { formError, idSchema, taskSchema, validationError } from "@/lib/validation";

function revalidate() {
  revalidateAreas("tasks", "dashboard");
}

/** Create a task, or update it when the form carries an `id`. */
export async function saveTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await verifySession();

  const parsed = taskSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    due_date: formData.get("due_date") ?? "",
    priority: formData.get("priority") ?? "medium",
    entity_type: formData.get("entity_type") ?? "",
    entity_id: formData.get("entity_id") ?? "",
  });
  if (!parsed.success) return validationError(parsed.error, formData);
  const data = parsed.data;
  // A link needs both halves: a type without a record is stored as given, like the form allows.
  const entityId = data.entity_type ? data.entity_id : null;
  const db = getDb();

  const rawId = formData.get("id");
  if (rawId) {
    const id = idSchema.safeParse(rawId);
    const existing = id.success ? db.prepare("SELECT id FROM tasks WHERE id = ?").get(id.data) : null;
    if (!id.success || !existing) return formError("Task not found", formData);

    db.prepare(
      `UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ?, entity_type = ?,
         entity_id = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(data.title, data.description, data.due_date, data.priority, data.entity_type, entityId, id.data);
    publish("task.updated", id.data);
  } else {
    const info = db
      .prepare(
        `INSERT INTO tasks (title, description, due_date, priority, entity_type, entity_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(data.title, data.description, data.due_date, data.priority, data.entity_type, entityId);
    publish("task.created", info.lastInsertRowid);
    logActivity({
      type: "task.created",
      message: `Task "${data.title}" was created`,
      entityType: data.entity_type,
      entityId,
      actorId: user.id,
    });
  }

  revalidate();
  return { ok: true };
}

/** Mark a task as completed or open again (the checkbox on the task list). */
export async function setTaskCompleted(taskId: number, completed: boolean): Promise<ActionResult> {
  const { user } = await verifySession();

  const id = idSchema.safeParse(taskId);
  const db = getDb();
  const existing = id.success
    ? (db.prepare("SELECT * FROM tasks WHERE id = ?").get(id.data) as Task | undefined)
    : undefined;
  if (!existing) return { ok: false, error: "Task not found" };

  const next = completed === true ? 1 : 0;
  db.prepare("UPDATE tasks SET completed = ?, updated_at = datetime('now') WHERE id = ?").run(next, existing.id);
  publish("task.updated", existing.id);

  // Log a completion activity when a task transitions to done.
  if (existing.completed === 0 && next === 1) {
    logActivity({
      type: "task.completed",
      message: `Task "${existing.title}" was completed`,
      entityType: existing.entity_type,
      entityId: existing.entity_id,
      actorId: user.id,
    });
  }

  revalidate();
  return { ok: true };
}

export async function deleteTask(taskId: number): Promise<ActionResult> {
  await verifySession();

  const id = idSchema.safeParse(taskId);
  const db = getDb();
  const existing = id.success ? db.prepare("SELECT id FROM tasks WHERE id = ?").get(id.data) : null;
  if (!id.success || !existing) return { ok: false, error: "Task not found" };

  db.prepare("DELETE FROM tasks WHERE id = ?").run(id.data);
  publish("task.deleted", id.data);

  revalidate();
  return { ok: true };
}
