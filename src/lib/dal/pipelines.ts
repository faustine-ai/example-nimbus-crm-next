import "server-only";

import { cookies } from "next/headers";

import { getDb } from "@/lib/db";
import { PIPELINE_COOKIE } from "@/lib/pipeline-cookie";
import type { Pipeline, PipelineWithStages, Stage } from "@/lib/types";

import { slugify } from "@/lib/utils";

import { verifySession } from "./auth";

/** Every pipeline (funnel) with its ordered stages (columns). */
export async function listPipelines(): Promise<PipelineWithStages[]> {
  await verifySession();
  const db = getDb();
  const pipelines = db.prepare("SELECT * FROM pipelines ORDER BY position, id").all() as Pipeline[];
  const stages = db.prepare("SELECT * FROM stages WHERE pipeline_id = ? ORDER BY position, id");
  return pipelines.map((p) => ({ ...p, stages: stages.all(p.id) as Stage[] }));
}

/**
 * The slug of the pipeline the deals page should open on: the last one the
 * user viewed (remembered in a cookie) or the first one. Null when there are
 * no pipelines.
 */
export async function getDefaultPipelineSlug(): Promise<string | null> {
  const pipelines = await listPipelines();
  if (!pipelines.length) return null;
  const rememberedId = Number((await cookies()).get(PIPELINE_COOKIE)?.value);
  const target = pipelines.find((p) => p.id === rememberedId) || pipelines[0];
  return slugify(target.name);
}
