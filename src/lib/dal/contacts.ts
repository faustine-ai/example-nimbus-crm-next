import "server-only";

import { PAGE_SIZE } from "@/lib/constants";
import { getDb } from "@/lib/db";
import type { ContactDetail, ContactOption, ContactWithCompany, DealWithStage, Note, Paginated } from "@/lib/types";

import { verifySession } from "./auth";

const SELECT_WITH_COMPANY = `
  SELECT c.*, co.name AS company_name
  FROM contacts c
  LEFT JOIN companies co ON co.id = c.company_id
`;

/** Contacts with their company name: optional search (name/email) and status filter, newest first. */
export async function listContacts({
  search = "",
  status = "",
  page = 1,
}: { search?: string; status?: string; page?: number } = {}): Promise<Paginated<ContactWithCompany>> {
  await verifySession();
  const db = getDb();

  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (search) {
    clauses.push("(c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (status) {
    clauses.push("c.status = ?");
    params.push(status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const total = (db.prepare(`SELECT COUNT(*) AS c FROM contacts c ${where}`).get(...params) as { c: number }).c;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pageCount);

  const rows = db
    .prepare(`${SELECT_WITH_COMPANY} ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, PAGE_SIZE, (current - 1) * PAGE_SIZE) as ContactWithCompany[];

  return { rows, total, page: current, pageCount };
}

/** One contact with its deals and notes, or null when it does not exist. */
export async function getContact(id: number): Promise<ContactDetail | null> {
  await verifySession();
  const db = getDb();

  const contact = db.prepare(`${SELECT_WITH_COMPANY} WHERE c.id = ?`).get(id) as ContactWithCompany | undefined;
  if (!contact) return null;

  const deals = db
    .prepare(
      `SELECT d.*, s.name AS stage_name, s.type AS stage_type
       FROM deals d LEFT JOIN stages s ON s.id = d.stage_id
       WHERE d.contact_id = ? ORDER BY d.created_at DESC`,
    )
    .all(contact.id) as DealWithStage[];
  const note_entries = db
    .prepare("SELECT * FROM notes WHERE entity_type = 'contact' AND entity_id = ? ORDER BY created_at DESC")
    .all(contact.id) as Note[];

  return { ...contact, deals, note_entries };
}

/** Id and name of every contact, for the selects in the form dialogs. */
export async function listContactOptions(): Promise<ContactOption[]> {
  await verifySession();
  return getDb()
    .prepare("SELECT id, first_name, last_name FROM contacts ORDER BY created_at DESC")
    .all() as ContactOption[];
}
