"use client";

import { useId } from "react";

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
import { useFormAction } from "@/hooks/use-form-action";
import { savePipeline } from "@/lib/actions/pipelines";
import type { Pipeline } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The pipeline to rename. Omit to create one. */
  pipeline?: Pipeline | null;
  /** Called with the slug of the saved pipeline. */
  onSaved: (slug: string) => void;
}

/** Create or rename a pipeline (funnel). */
export function PipelineFormDialog({ open, onOpenChange, pipeline, onSaved }: Props) {
  const isEdit = Boolean(pipeline);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Rename pipeline" : "New pipeline"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Give this funnel a new name."
              : "A new funnel starts with a few default columns you can customize."}
          </DialogDescription>
        </DialogHeader>
        <PipelineForm pipeline={pipeline} onSaved={onSaved} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function PipelineForm({ pipeline, onSaved, onClose }: Pick<Props, "pipeline" | "onSaved"> & { onClose: () => void }) {
  const isEdit = Boolean(pipeline);
  const uid = useId();
  const [state, formAction, pending] = useFormAction(savePipeline, {
    success: isEdit ? "Pipeline renamed" : "Pipeline created",
    onSuccess: (result) => {
      onClose();
      onSaved(String(result.data?.slug ?? ""));
    },
  });

  return (
    <form action={formAction} className="space-y-4">
      {pipeline && <input type="hidden" name="id" value={pipeline.id} />}
      <div className="space-y-2">
        <Label htmlFor={`${uid}-name`}>Name</Label>
        <Input
          id={`${uid}-name`}
          name="name"
          defaultValue={state.values?.name ?? pipeline?.name ?? ""}
          placeholder="e.g. Onboarding"
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}
