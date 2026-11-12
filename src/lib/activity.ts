import "server-only";

import { getDb } from "@/lib/db";
import { publish } from "@/lib/events";

interface ActivityInput {
  type: string;
  message: string;
  entityType?: string | null;
  entityId?: number | bigint | null;
  actorId?: number | null;
}

/**
 * Record an activity row and announce it on the live feed.
 * Centralizing this keeps activity logging consistent across actions.
 */
export function logActivity({ type, message, entityType = null, entityId = null, actorId = null }: ActivityInput) {
  const info = getDb()
    .prepare("INSERT INTO activities (type, message, entity_type, entity_id, actor_id) VALUES (?, ?, ?, ?, ?)")
    .run(type, message, entityType, entityId, actorId);
  publish("activity.created", info.lastInsertRowid);
}
