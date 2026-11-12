"use client";

import { GripVertical, MoreHorizontal, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useOptimistic, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { useAction } from "@/hooks/use-action";
import { deleteDeal, moveDeal } from "@/lib/actions/deals";
import { deletePipeline, deleteStage, reorderStages } from "@/lib/actions/pipelines";
import { stageTypeMeta } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { PIPELINE_COOKIE } from "@/lib/pipeline-cookie";
import type { CompanyOption, ContactOption, DealWithRelations, PipelineWithStages, Stage } from "@/lib/types";
import { cn, slugify } from "@/lib/utils";

import { DealFormDialog } from "./deal-form-dialog";
import { PipelineFormDialog } from "./pipeline-form-dialog";
import { StageFormDialog } from "./stage-form-dialog";

type Drag = { type: "card" | "col"; id: number } | null;

function DealCard({
  deal,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  deal: DealWithRelations;
  onEdit: (deal: DealWithRelations) => void;
  onDelete: (deal: DealWithRelations) => void;
  onDragStart: (e: React.DragEvent, deal: DealWithRelations) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      data-deal-id={deal.id}
      onDragStart={(e) => onDragStart(e, deal)}
      onDragEnd={onDragEnd}
      className="group cursor-grab rounded-lg border bg-card p-3 shadow-xs transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium leading-tight">{deal.name}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={`Actions for ${deal.name}`}
              className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(deal)}>
              <Pencil className="h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDelete(deal)}>
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {deal.company_name && <div className="mt-0.5 text-xs text-muted-foreground">{deal.company_name}</div>}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{formatCurrency(deal.value)}</span>
        {deal.close_date && <span className="text-xs text-muted-foreground">{formatDate(deal.close_date)}</span>}
      </div>
      {(deal.contact_first_name || deal.contact_last_name) && (
        <div className="mt-1 text-xs text-muted-foreground">
          {deal.contact_first_name} {deal.contact_last_name}
        </div>
      )}
    </div>
  );
}

/**
 * The deals page: pipeline switcher and the Kanban board.
 *
 * Everything arrives from the server as props. Dragging a card or a column
 * updates the board optimistically while the Server Action runs; the server
 * render that follows replaces the optimistic state.
 */
export function DealsBoard({
  pipelines,
  pipeline,
  deals,
  companies,
  contacts,
}: {
  pipelines: PipelineWithStages[];
  /** The pipeline selected by the URL (/deals/<slug>). */
  pipeline: PipelineWithStages;
  deals: DealWithRelations[];
  companies: CompanyOption[];
  contacts: ContactOption[];
}) {
  const router = useRouter();
  const [run] = useAction();

  const [optimisticDeals, moveOptimistic] = useOptimistic(
    deals,
    (current, move: { dealId: number; stageId: number }) =>
      current.map((d) => (d.id === move.dealId ? { ...d, stage_id: move.stageId } : d)),
  );
  const [stages, reorderOptimistic] = useOptimistic(pipeline.stages, (current, order: number[]) =>
    order.flatMap((id, position) => {
      const stage = current.find((s) => s.id === id);
      return stage ? [{ ...stage, position }] : [];
    }),
  );

  // Drag state.
  const [drag, setDrag] = useState<Drag>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Dialog state.
  const [dealForm, setDealForm] = useState<{ open: boolean; deal: DealWithRelations | null; stageId: number | null }>({
    open: false,
    deal: null,
    stageId: null,
  });
  const [pipelineForm, setPipelineForm] = useState<{ open: boolean; pipeline: PipelineWithStages | null }>({
    open: false,
    pipeline: null,
  });
  const [stageForm, setStageForm] = useState<{ open: boolean; stage: Stage | null }>({ open: false, stage: null });
  const [deletingDeal, setDeletingDeal] = useState<DealWithRelations | null>(null);
  const [deletingStage, setDeletingStage] = useState<Stage | null>(null);
  const [deletingPipeline, setDeletingPipeline] = useState(false);

  // Remember the last pipeline viewed: /deals redirects to it.
  useEffect(() => {
    document.cookie = `${PIPELINE_COOKIE}=${pipeline.id}; path=/; max-age=31536000; samesite=lax`;
  }, [pipeline.id]);

  const goToPipeline = (name: string, replace = false) => {
    const href = `/deals/${slugify(name)}`;
    if (replace) router.replace(href);
    else router.push(href);
  };

  // --- Drag handlers ---
  function onCardDragStart(e: React.DragEvent, deal: DealWithRelations) {
    setDrag({ type: "card", id: deal.id });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", deal.name);
  }
  function onColDragStart(e: React.DragEvent, stage: Stage) {
    setDrag({ type: "col", id: stage.id });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", stage.name);
  }
  function clearDrag() {
    setDrag(null);
    setDragOver(null);
  }

  function moveCard(dealId: number, stageId: number) {
    const deal = optimisticDeals.find((d) => d.id === dealId);
    if (!deal || deal.stage_id === stageId) return;
    startTransition(async () => {
      moveOptimistic({ dealId, stageId });
      const result = await moveDeal(dealId, stageId);
      if (!result.ok) toast.error(result.error);
    });
  }

  function reorderColumns(draggedId: number, targetId: number) {
    if (draggedId === targetId) return;
    const ids = stages.map((s) => s.id);
    const from = ids.indexOf(draggedId);
    if (from < 0) return;
    ids.splice(from, 1);
    const insertAt = ids.indexOf(targetId);
    ids.splice(insertAt < 0 ? ids.length : insertAt, 0, draggedId);

    startTransition(async () => {
      reorderOptimistic(ids);
      const result = await reorderStages(pipeline.id, ids);
      if (!result.ok) toast.error(result.error);
    });
  }

  function onColumnDrop(stage: Stage) {
    if (drag?.type === "card") moveCard(drag.id, stage.id);
    else if (drag?.type === "col") reorderColumns(drag.id, stage.id);
    clearDrag();
  }

  function confirmDeletePipeline() {
    startTransition(async () => {
      const result = await deletePipeline(pipeline.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Pipeline deleted");
      const next = pipelines.find((p) => p.id !== pipeline.id);
      if (next) goToPipeline(next.name, true);
    });
  }

  return (
    <>
      <PageHeader title="Deals" description="Customize columns, reorder them, and switch between funnels.">
        <Select
          value={String(pipeline.id)}
          onValueChange={(v) => {
            const target = pipelines.find((p) => p.id === Number(v));
            if (target) goToPipeline(target.name);
          }}
        >
          <SelectTrigger className="w-44" aria-label="Pipeline">
            <SelectValue placeholder="Pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Pipeline actions">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Pipeline</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setPipelineForm({ open: true, pipeline: null })}>
              <Plus className="h-4 w-4" /> New funnel
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPipelineForm({ open: true, pipeline })}>
              <Pencil className="h-4 w-4" /> Rename funnel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setDeletingPipeline(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete funnel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={() => setDealForm({ open: true, deal: null, stageId: stages[0]?.id ?? null })}
          disabled={!stages.length}
        >
          <Plus className="h-4 w-4" /> New deal
        </Button>
      </PageHeader>

      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const items = optimisticDeals.filter((d) => d.stage_id === stage.id);
          const total = items.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
          const meta = stageTypeMeta(stage.type);
          return (
            <div
              key={stage.id}
              data-stage-id={stage.id}
              data-stage-name={stage.name}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(stage.id);
              }}
              onDragLeave={() => setDragOver((s) => (s === stage.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                onColumnDrop(stage);
              }}
              className={cn(
                "flex min-h-0 w-72 shrink-0 flex-col rounded-xl border bg-muted/40 transition-colors",
                dragOver === stage.id && "border-primary bg-accent/60",
              )}
            >
              <div className="flex items-center justify-between gap-1 border-b px-2 py-2.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    draggable
                    data-stage-handle={stage.id}
                    onDragStart={(e) => onColDragStart(e, stage)}
                    onDragEnd={clearDrag}
                    className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
                    title="Drag to reorder"
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <span className={cn("truncate rounded-full border px-2 py-0.5 text-xs font-medium", meta.color)}>
                    {stage.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => setDealForm({ open: true, deal: null, stageId: stage.id })}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    aria-label={`Add deal to ${stage.name}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1 text-muted-foreground hover:text-foreground"
                        aria-label={`Column actions for ${stage.name}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setStageForm({ open: true, stage })}>
                        <Pencil className="h-4 w-4" /> Edit column
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => setDeletingStage(stage)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete column
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="px-3 pb-1 pt-2 text-xs text-muted-foreground">{formatCurrency(total)}</div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 pt-1">
                {items.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onEdit={(d) => setDealForm({ open: true, deal: d, stageId: d.stage_id })}
                    onDelete={setDeletingDeal}
                    onDragStart={onCardDragStart}
                    onDragEnd={clearDrag}
                  />
                ))}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                    Drop deals here
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add column */}
        <button
          onClick={() => setStageForm({ open: true, stage: null })}
          className="flex h-11 w-44 shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" /> Add column
        </button>
      </div>

      <DealFormDialog
        open={dealForm.open}
        onOpenChange={(open) => setDealForm((s) => ({ ...s, open }))}
        deal={dealForm.deal}
        stages={stages}
        defaultStageId={dealForm.stageId}
        companies={companies}
        contacts={contacts}
      />
      <PipelineFormDialog
        open={pipelineForm.open}
        onOpenChange={(open) => setPipelineForm((s) => ({ ...s, open }))}
        pipeline={pipelineForm.pipeline}
        onSaved={(slug) => {
          // A rename changes the slug of the page we are on; a new funnel gets its own page.
          if (slug) router[pipelineForm.pipeline ? "replace" : "push"](`/deals/${slug}`);
        }}
      />
      <StageFormDialog
        open={stageForm.open}
        onOpenChange={(open) => setStageForm((s) => ({ ...s, open }))}
        pipelineId={pipeline.id}
        stage={stageForm.stage}
      />

      <ConfirmDialog
        open={Boolean(deletingDeal)}
        onOpenChange={(open) => !open && setDeletingDeal(null)}
        title="Delete deal?"
        description={deletingDeal ? `This will permanently remove "${deletingDeal.name}".` : ""}
        onConfirm={() => {
          const deal = deletingDeal;
          if (deal) run(() => deleteDeal(deal.id), { success: "Deal deleted" });
        }}
      />
      <ConfirmDialog
        open={Boolean(deletingStage)}
        onOpenChange={(open) => !open && setDeletingStage(null)}
        title="Delete column?"
        description={
          deletingStage
            ? `This will remove the "${deletingStage.name}" column. Columns with deals can't be deleted.`
            : ""
        }
        onConfirm={() => {
          const stage = deletingStage;
          if (stage) run(() => deleteStage(stage.id), { success: "Column deleted" });
        }}
      />
      <ConfirmDialog
        open={deletingPipeline}
        onOpenChange={setDeletingPipeline}
        title="Delete pipeline?"
        description={`This will permanently remove the "${pipeline.name}" pipeline and its columns.`}
        onConfirm={confirmDeletePipeline}
      />
    </>
  );
}
