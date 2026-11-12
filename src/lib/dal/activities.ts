import "server-only";

import { getDb } from "@/lib/db";
import type { Activity } from "@/lib/types";

import { verifySession } from "./auth";

/** Recent activity feed, most recent first (at most 100 rows). */
export async function listActivities(limit = 20): Promise<Activity[]> {
  await verifySession();
  const capped = Math.min(Number(limit) || 20, 100);
  return getDb()
    .prepare("SELECT * FROM activities ORDER BY created_at DESC, id DESC LIMIT ?")
    .all(capped) as Activity[];
}
