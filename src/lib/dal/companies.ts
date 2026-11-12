import "server-only";

import { getDb } from "@/lib/db";
import type { Company, CompanyDetail, CompanyListItem, CompanyOption, Contact, DealWithStage, Note } from "@/lib/types";

import { verifySession } from "./auth";

/** Companies with a contact count: optional search on name, industry and location, newest first. */
export async function listCompanies({ search = "" }: { search?: string } = {}): Promise<CompanyListItem[]> {
  await verifySession();
  const db = getDb();

  const select = `
    SELECT co.*, (SELECT COUNT(*) FROM contacts WHERE company_id = co.id) AS contact_count
    FROM companies co`;
  if (search) {
    const like = `%${search}%`;
    return db
      .prepare(
        `${select} WHERE co.name LIKE ? OR co.industry LIKE ? OR co.location LIKE ?
         ORDER BY co.created_at DESC`,
      )
      .all(like, like, like) as CompanyListItem[];
  }
  return db.prepare(`${select} ORDER BY co.created_at DESC`).all() as CompanyListItem[];
}

/** One company with its contacts, deals and notes, or null when it does not exist. */
export async function getCompany(id: number): Promise<CompanyDetail | null> {
  await verifySession();
  const db = getDb();

  const company = db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as Company | undefined;
  if (!company) return null;

  const contacts = db
    .prepare("SELECT * FROM contacts WHERE company_id = ? ORDER BY created_at DESC")
    .all(company.id) as Contact[];
  const deals = db
    .prepare(
      `SELECT d.*, s.name AS stage_name, s.type AS stage_type
       FROM deals d LEFT JOIN stages s ON s.id = d.stage_id
       WHERE d.company_id = ? ORDER BY d.created_at DESC`,
    )
    .all(company.id) as DealWithStage[];
  const note_entries = db
    .prepare("SELECT * FROM notes WHERE entity_type = 'company' AND entity_id = ? ORDER BY created_at DESC")
    .all(company.id) as Note[];

  return { ...company, contacts, deals, note_entries };
}

/** Id and name of every company, for the selects in the form dialogs. */
export async function listCompanyOptions(): Promise<CompanyOption[]> {
  await verifySession();
  return getDb().prepare("SELECT id, name FROM companies ORDER BY created_at DESC").all() as CompanyOption[];
}
