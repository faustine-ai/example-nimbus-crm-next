"use client";

import { useId, useState } from "react";

import { FormFooter } from "@/components/forms/form-footer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/hooks/use-form-action";
import { saveTask } from "@/lib/actions/tasks";
import { NONE, TASK_ENTITY_TYPES, TASK_PRIORITIES } from "@/lib/constants";
import type { CompanyOption, ContactOption, DealOption, Task, TaskEntityType } from "@/lib/types";

/** The records a task can be linked to, per entity type. */
export interface TaskRecordOptions {
  contacts: ContactOption[];
  companies: CompanyOption[];
  deals: DealOption[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The task to edit. Omit to create one. */
  task?: Task | null;
  /** Pre-link a new task to a record (from a detail page). */
  link?: { type: TaskEntityType; id: number };
  options: TaskRecordOptions;
}

export function TaskFormDialog({ open, onOpenChange, task, ...rest }: Props) {
  const isEdit = Boolean(task);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the task." : "Create a task and optionally link it to a record."}
          </DialogDescription>
        </DialogHeader>
        <TaskForm task={task} onClose={() => onOpenChange(false)} {...rest} />
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({ task, link, options, onClose }: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const isEdit = Boolean(task);
  const uid = useId();
  const [state, formAction, pending] = useFormAction(saveTask, {
    success: isEdit ? "Task updated" : "Task created",
    onSuccess: onClose,
  });
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [entityType, setEntityType] = useState<string>(task?.entity_type || link?.type || NONE);
  const [entityId, setEntityId] = useState(
    task?.entity_id ? String(task.entity_id) : link ? String(link.id) : NONE,
  );
  const value = (name: "title" | "description" | "due_date") => state.values?.[name] ?? task?.[name] ?? "";

  // The option list for the selected entity type.
  const records =
    entityType === "contact"
      ? options.contacts.map((c) => ({ id: c.id, label: `${c.first_name} ${c.last_name}` }))
      : entityType === "company"
        ? options.companies.map((c) => ({ id: c.id, label: c.name }))
        : entityType === "deal"
          ? options.deals.map((d) => ({ id: d.id, label: d.name }))
          : [];

  return (
    <form action={formAction} className="space-y-4">
      {task && <input type="hidden" name="id" value={task.id} />}
      <input type="hidden" name="priority" value={priority} />
      <input type="hidden" name="entity_type" value={entityType} />
      <input type="hidden" name="entity_id" value={entityId} />

      <div className="space-y-2">
        <Label htmlFor={`${uid}-title`}>Title *</Label>
        <Input id={`${uid}-title`} name="title" defaultValue={value("title")} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${uid}-description`}>Description</Label>
        <Textarea id={`${uid}-description`} name="description" defaultValue={value("description")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${uid}-due`}>Due date</Label>
          <Input id={`${uid}-due`} name="due_date" type="date" defaultValue={value("due_date")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${uid}-priority`}>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger id={`${uid}-priority`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${uid}-entity-type`}>Related to</Label>
          <Select
            value={entityType}
            onValueChange={(v) => {
              setEntityType(v);
              setEntityId(NONE);
            }}
          >
            <SelectTrigger id={`${uid}-entity-type`}>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nothing</SelectItem>
              {TASK_ENTITY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${uid}-entity-id`}>Record</Label>
          <Select value={entityId} onValueChange={setEntityId} disabled={entityType === NONE}>
            <SelectTrigger id={`${uid}-entity-id`}>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {records.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <FormFooter pending={pending} submitLabel={isEdit ? "Save changes" : "Create task"} onCancel={onClose} />
    </form>
  );
}
