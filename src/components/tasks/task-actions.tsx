"use client";

import { Calendar, Link2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { startTransition, useOptimistic, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PriorityBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { useAction } from "@/hooks/use-action";
import { deleteTask, setTaskCompleted } from "@/lib/actions/tasks";
import { formatDate } from "@/lib/format";
import type { TaskWithLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

import { TaskFormDialog, type TaskRecordOptions } from "./task-form-dialog";

/** "New task" button with its dialog. */
export function NewTaskButton({ options }: { options: TaskRecordOptions }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New task
      </Button>
      <TaskFormDialog open={open} onOpenChange={setOpen} options={options} />
    </>
  );
}

/** One row of the task list: checkbox (optimistic), details, priority and the "…" menu. */
export function TaskRow({
  task,
  overdue,
  options,
}: {
  task: TaskWithLabel;
  /** Open and past its due date (decided on the server). */
  overdue: boolean;
  options: TaskRecordOptions;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [run] = useAction();
  // Flip the checkbox right away; the server state replaces it when the action is done.
  const [completed, setOptimisticCompleted] = useOptimistic(Boolean(task.completed));

  function toggle() {
    const next = !completed;
    startTransition(async () => {
      setOptimisticCompleted(next);
      const result = await setTaskCompleted(task.id, next);
      if (!result.ok) toast.error(result.error);
      else if (next) toast.success("Task completed");
    });
  }

  return (
    <div className="flex items-center gap-3 p-4">
      <Checkbox checked={completed} onCheckedChange={toggle} aria-label={`Complete "${task.title}"`} />
      <div className="min-w-0 flex-1">
        <div className={cn("font-medium", completed && "text-muted-foreground line-through")}>{task.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {task.due_date && (
            <span className={cn("flex items-center gap-1", overdue && !completed && "font-medium text-destructive")}>
              <Calendar className="h-3 w-3" /> {formatDate(task.due_date)}
            </span>
          )}
          {task.entity_label && (
            <span className="flex items-center gap-1">
              <Link2 className="h-3 w-3" /> {task.entity_label}
            </span>
          )}
        </div>
      </div>
      <PriorityBadge priority={task.priority} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for "${task.title}"`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TaskFormDialog open={editOpen} onOpenChange={setEditOpen} task={task} options={options} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete task?"
        description={`This will permanently remove "${task.title}".`}
        onConfirm={() => run(() => deleteTask(task.id), { success: "Task deleted" })}
      />
    </div>
  );
}
