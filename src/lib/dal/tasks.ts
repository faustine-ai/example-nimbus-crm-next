import "server-only";

import { getDb } from "@/lib/db";
import type { Task, TaskWithLabel } from "@/lib/types";

import { verifySession } from "./auth";

export type TaskFilter = "open" | "completed" | "all";

/** Tasks filtered by status, each with a human-friendly label of the record it is linked to. */
export async function listTasks(filter: TaskFilter = "all"): Promise<TaskWithLabel[]> {
  await verifySession();
  const db = getDb();

  let rows: Task[];
  if (filter === "open") {
    rows = db.prepare("SELECT * FROM tasks WHERE completed = 0 ORDER BY due_date IS NULL, due_date ASC").all() as Task[];
  } else if (filter === "completed") {
    rows = db.prepare("SELECT * FROM tasks WHERE completed = 1 ORDER BY updated_at DESC").all() as Task[];
  } else {
    rows = db.prepare("SELECT * FROM tasks ORDER BY completed ASC, due_date IS NULL, due_date ASC").all() as Task[];
  }

  // Resolve the label of the linked record (best effort).
  const contact = db.prepare("SELECT first_name, last_name FROM contacts WHERE id = ?");
  const company = db.prepare("SELECT name FROM companies WHERE id = ?");
  const deal = db.prepare("SELECT name FROM deals WHERE id = ?");

  return rows.map((task) => {
    let entity_label: string | null = null;
    if (task.entity_type && task.entity_id) {
      if (task.entity_type === "contact") {
        const c = contact.get(task.entity_id) as { first_name: string; last_name: string } | undefined;
        entity_label = c ? `${c.first_name} ${c.last_name}` : null;
      } else if (task.entity_type === "company") {
        entity_label = (company.get(task.entity_id) as { name: string } | undefined)?.name ?? null;
      } else if (task.entity_type === "deal") {
        entity_label = (deal.get(task.entity_id) as { name: string } | undefined)?.name ?? null;
      }
    }
    return { ...task, entity_label };
  });
}
