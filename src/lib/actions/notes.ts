"use server";

import { verifySession } from "@/lib/dal/auth";
import { getDb } from "@/lib/db";
import { publish } from "@/lib/events";
import { revalidateAreas } from "@/lib/revalidate";
import type { ActionResult, Note } from "@/lib/types";
import { idSchema, noteSchema } from "@/lib/validation";

function revalidate(entityType: string) {
  if (entityType === "contact") revalidateAreas("contacts");
  else if (entityType === "company") revalidateAreas("companies");
  else revalidateAreas("deals");
}

/** Add a note to a contact, company or deal. The author is the signed-in user. */
export async function addNote(entityType: string, entityId: number, body: string): Promise<ActionResult> {
  const { user } = await verifySession();

  const parsed = noteSchema.safeParse({ body, entity_type: entityType, entity_id: entityId });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "body, entity_type and entity_id are required" };
  }
  const data = parsed.data;

  const info = getDb()
    .prepare("INSERT INTO notes (body, entity_type, entity_id, author_id) VALUES (?, ?, ?, ?)")
    .run(data.body, data.entity_type, data.entity_id, user.id);
  publish("note.created", info.lastInsertRowid);

  revalidate(data.entity_type);
  return { ok: true };
}

export async function deleteNote(noteId: number): Promise<ActionResult> {
  await verifySession();

  const id = idSchema.safeParse(noteId);
  const db = getDb();
  const existing = id.success
    ? (db.prepare("SELECT * FROM notes WHERE id = ?").get(id.data) as Note | undefined)
    : undefined;
  if (!existing) return { ok: false, error: "Note not found" };

  db.prepare("DELETE FROM notes WHERE id = ?").run(existing.id);
  publish("note.deleted", existing.id);

  revalidate(existing.entity_type);
  return { ok: true };
}
