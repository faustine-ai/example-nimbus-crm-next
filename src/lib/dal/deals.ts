import "server-only";

import { getDb } from "@/lib/db";
import type { DealOption, DealWithRelations, Note } from "@/lib/types";

import { verifySession } from "./auth";

const SELECT_WITH_RELATIONS = `
  SELECT d.*, co.name AS company_name,
         c.first_name AS contact_first_name, c.last_name AS contact_last_name,
         s.name AS stage_name, s.type AS stage_type, s.pipeline_id AS pipeline_id
  FROM deals d
  LEFT JOIN companies co ON co.id = d.company_id
  LEFT JOIN contacts c ON c.id = d.contact_id
  LEFT JOIN stages s ON s.id = d.stage_id
`;

/** Deals with company, contact and stage, optionally scoped to one pipeline. Newest first. */
export async function listDeals({ pipelineId }: { pipelineId?: number } = {}): Promise<DealWithRelations[]> {
  await verifySession();
  const db = getDb();
  if (pipelineId) {
    return db
      .prepare(`${SELECT_WITH_RELATIONS} WHERE s.pipeline_id = ? ORDER BY d.created_at DESC`)
      .all(pipelineId) as DealWithRelations[];
  }
  return db.prepare(`${SELECT_WITH_RELATIONS} ORDER BY d.created_at DESC`).all() as DealWithRelations[];
}

/** One deal with its notes, or null when it does not exist. */
export async function getDeal(id: number): Promise<(DealWithRelations & { note_entries: Note[] }) | null> {
  await verifySession();
  const db = getDb();
  const deal = db.prepare(`${SELECT_WITH_RELATIONS} WHERE d.id = ?`).get(id) as DealWithRelations | undefined;
  if (!deal) return null;
  const note_entries = db
    .prepare("SELECT * FROM notes WHERE entity_type = 'deal' AND entity_id = ? ORDER BY created_at DESC")
    .all(deal.id) as Note[];
  return { ...deal, note_entries };
}

/** Id and name of every deal, for the "Record" select of the task form. */
export async function listDealOptions(): Promise<DealOption[]> {
  await verifySession();
  return getDb().prepare("SELECT id, name FROM deals ORDER BY created_at DESC").all() as DealOption[];
}
