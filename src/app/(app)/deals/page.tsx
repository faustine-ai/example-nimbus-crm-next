import { Briefcase } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageLoader } from "@/components/spinner";
import { getDefaultPipelineSlug } from "@/lib/dal/pipelines";

export const metadata: Metadata = { title: "Deals" };

// /deals has no board of its own: it forwards to the last pipeline viewed
// (or the first one), so the selected funnel is always part of the URL.
export default function DealsIndexPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ForwardToPipeline />
    </Suspense>
  );
}

async function ForwardToPipeline() {
  const slug = await getDefaultPipelineSlug();
  if (slug) redirect(`/deals/${slug}`);

  return <EmptyState icon={Briefcase} title="No pipelines yet" description="There is no pipeline to show." />;
}
