import "server-only";

import type { StageType } from "@/lib/constants";
import { getDb } from "@/lib/db";
import type { DashboardStats, Pipeline } from "@/lib/types";

import { verifySession } from "./auth";

/** Aggregate counts and rollups for the dashboard. */
export async function getDashboardStats(): Promise<DashboardStats> {
  await verifySession();
  const db = getDb();

  const count = (table: string, where = "") =>
    (db.prepare(`SELECT COUNT(*) AS c FROM ${table} ${where}`).get() as { c: number }).c;

  // Won/lost/open are derived from the stage *type*, not a fixed stage name,
  // so custom pipelines report correctly.
  const byType = (type: StageType, col = "COUNT(*)") =>
    (
      db
        .prepare(`SELECT ${col} AS v FROM deals d JOIN stages s ON s.id = d.stage_id WHERE s.type = ?`)
        .get(type) as { v: number }
    ).v;

  // Invoice rollups: outstanding = unpaid (draft/sent/overdue), plus paid total.
  const invoiceRows = db
    .prepare(
      `SELECT i.status, i.tax_rate,
              (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM invoice_items WHERE invoice_id = i.id) AS subtotal
       FROM invoices i`,
    )
    .all() as { status: string; tax_rate: number; subtotal: number }[];
  let invoiceOutstanding = 0;
  let invoicePaid = 0;
  for (const r of invoiceRows) {
    const total = r.subtotal * (1 + (r.tax_rate || 0) / 100);
    if (r.status === "paid") invoicePaid += total;
    else if (["draft", "sent", "overdue"].includes(r.status)) invoiceOutstanding += total;
  }

  // Pipeline chart: stages of the default (first) pipeline with deal counts.
  const defaultPipeline = db.prepare("SELECT * FROM pipelines ORDER BY position, id LIMIT 1").get() as
    | Pipeline
    | undefined;
  const stages = defaultPipeline
    ? (db
        .prepare(
          `SELECT s.name, s.type,
                  (SELECT COUNT(*) FROM deals WHERE stage_id = s.id) AS count,
                  (SELECT COALESCE(SUM(value),0) FROM deals WHERE stage_id = s.id) AS value
           FROM stages s WHERE s.pipeline_id = ? ORDER BY s.position, s.id`,
        )
        .all(defaultPipeline.id) as DashboardStats["stages"])
    : [];

  return {
    totalContacts: count("contacts"),
    totalCompanies: count("companies"),
    totalDeals: count("deals"),
    openDeals: byType("open"),
    wonDeals: byType("won"),
    lostDeals: byType("lost"),
    openValue: byType("open", "COALESCE(SUM(d.value),0)"),
    wonValue: byType("won", "COALESCE(SUM(d.value),0)"),
    openTasks: count("tasks", "WHERE completed = 0"),
    invoiceOutstanding: Math.round(invoiceOutstanding * 100) / 100,
    invoicePaid: Math.round(invoicePaid * 100) / 100,
    invoiceCount: invoiceRows.length,
    pipelineName: defaultPipeline?.name ?? null,
    stages,
  };
}
