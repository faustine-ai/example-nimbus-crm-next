"use client";

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { TaskFormDialog, type TaskRecordOptions } from "@/components/tasks/task-form-dialog";
import { Button, type ButtonProps } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAction } from "@/hooks/use-action";
import { deleteContact } from "@/lib/actions/contacts";
import type { CompanyOption, Contact } from "@/lib/types";

import { ContactFormDialog } from "./contact-form-dialog";

/** "New contact" button with its dialog. */
export function NewContactButton({
  companies,
  defaultCompanyId,
  label = "New contact",
  ...buttonProps
}: {
  companies: CompanyOption[];
  defaultCompanyId?: number;
  label?: string;
} & ButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} {...buttonProps}>
        <Plus className="h-4 w-4" /> {label}
      </Button>
      <ContactFormDialog open={open} onOpenChange={setOpen} companies={companies} defaultCompanyId={defaultCompanyId} />
    </>
  );
}

/** The "…" menu of a contact row: edit and delete. */
export function ContactRowActions({ contact, companies }: { contact: Contact; companies: CompanyOption[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [run] = useAction();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${contact.first_name} ${contact.last_name}`}>
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

      <ContactFormDialog open={editOpen} onOpenChange={setEditOpen} contact={contact} companies={companies} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete contact?"
        description={`This will permanently remove ${contact.first_name} ${contact.last_name}.`}
        onConfirm={() => run(() => deleteContact(contact.id), { success: "Contact deleted" })}
      />
    </>
  );
}

/** Edit / Delete buttons on the contact page. */
export function ContactDetailActions({ contact, companies }: { contact: Contact; companies: CompanyOption[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [run, pending] = useAction();

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setEditOpen(true)}>
        <Pencil className="h-4 w-4" /> Edit
      </Button>
      <Button
        variant="outline"
        className="text-destructive hover:text-destructive"
        disabled={pending}
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="h-4 w-4" /> Delete
      </Button>

      <ContactFormDialog open={editOpen} onOpenChange={setEditOpen} contact={contact} companies={companies} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete contact?"
        description={`This will permanently remove ${contact.first_name} ${contact.last_name}.`}
        // The action redirects to the contact list when it is done.
        onConfirm={() => run(() => deleteContact(contact.id, true), { success: "Contact deleted" })}
      />
    </div>
  );
}

/** "Add task" button on the contact page: opens the task form linked to this contact. */
export function AddContactTaskButton({ contactId, options }: { contactId: number; options: TaskRecordOptions }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add task
      </Button>
      <TaskFormDialog open={open} onOpenChange={setOpen} link={{ type: "contact", id: contactId }} options={options} />
    </>
  );
}
