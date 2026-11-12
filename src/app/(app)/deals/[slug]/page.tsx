import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DealsBoard } from "@/components/deals/deals-board";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/spinner";
import { listCompanyOptions } from "@/lib/dal/companies";
import { listContactOptions } from "@/lib/dal/contacts";
import { listDeals } from "@/lib/dal/deals";
import { getDefaultPipelineSlug, listPipelines } from "@/lib/dal/pipelines";
import { slugify } from "@/lib/utils";

export const metadata: Metadata = { title: "Deals" };

export default function DealsPage({ params }: PageProps<"/deals/[slug]">) {
  return (
    // data-full-width: the board uses the whole page width (see the app layout).
    <div data-full-width className="flex min-h-0 flex-1 flex-col gap-6">
      <Suspense
        fallback={
          <>
            <PageHeader title="Deals" description="Customize columns, reorder them, and switch between funnels." />
            <PageLoader />
          </>
        }
      >
        <Board params={params} />
      </Suspense>
    </div>
  );
}

async function Board({ params }: Pick<PageProps<"/deals/[slug]">, "params">) {
  const { slug } = await params;
  const pipelines = await listPipelines();
  const pipeline = pipelines.find((p) => slugify(p.name) === slug);

  // Keep the URL pointing at a real pipeline: forward when the slug does not
  // match one (anymore), e.g. after a rename or a delete.
  if (!pipeline) {
    const fallback = await getDefaultPipelineSlug();
    redirect(fallback && fallback !== slug ? `/deals/${fallback}` : "/");
  }

  const [deals, companies, contacts] = await Promise.all([
    listDeals({ pipelineId: pipeline.id }),
    listCompanyOptions(),
    listContactOptions(),
  ]);

  return (
    <DealsBoard
      // A different pipeline is a different board: start with clean client state.
      key={pipeline.id}
      pipelines={pipelines}
      pipeline={pipeline}
      deals={deals}
      companies={companies}
      contacts={contacts}
    />
  );
}
