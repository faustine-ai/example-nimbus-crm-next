"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormAction } from "@/hooks/use-form-action";
import { saveStage } from "@/lib/actions/pipelines";
import { STAGE_TYPES } from "@/lib/constants";
import type { Stage } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The pipeline a new column is added to. */
  pipelineId: number;
  /** The column to edit. Omit to add one. */
  stage?: Stage | null;
}

/**
 * Add a column to a pipeline, or edit an existing one.
 * The column `type` (open/won/lost) drives win/loss reporting.
 */
export function StageFormDialog({ open, onOpenChange, pipelineId, stage }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{stage ? "Edit column" : "Add column"}</DialogTitle>
          <DialogDescription>Columns of type Won / Lost are used for win-rate reporting.</DialogDescription>
        </DialogHeader>
        <StageForm pipelineId={pipelineId} stage={stage} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function StageForm({ pipelineId, stage, onClose }: Pick<Props, "pipelineId" | "stage"> & { onClose: () => void }) {
  const isEdit = Boolean(stage);
  const uid = useId();
  const [state, formAction, pending] = useFormAction(saveStage, {
    success: isEdit ? "Column updated" : "Column added",
    onSuccess: onClose,
  });
  const [type, setType] = useState<string>(stage?.type || "open");

  return (
    <form action={formAction} className="space-y-4">
      {stage ? (
        <input type="hidden" name="id" value={stage.id} />
      ) : (
        <input type="hidden" name="pipeline_id" value={pipelineId} />
      )}
      <input type="hidden" name="type" value={type} />

      <div className="space-y-2">
        <Label htmlFor={`${uid}-name`}>Name</Label>
        <Input
          id={`${uid}-name`}
          name="name"
          defaultValue={state.values?.name ?? stage?.name ?? ""}
          placeholder="e.g. Demo scheduled"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${uid}-type`}>Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id={`${uid}-type`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save" : "Add column"}
        </Button>
      </DialogFooter>
    </form>
  );
}
