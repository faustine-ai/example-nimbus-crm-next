"use client";

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAction } from "@/hooks/use-action";
import { deleteCompany } from "@/lib/actions/companies";
import type { Company } from "@/lib/types";

import { CompanyFormDialog } from "./company-form-dialog";

/** "New company" button with its dialog. */
export function NewCompanyButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New company
      </Button>
      <CompanyFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

/** The "…" menu of a company card (shown on hover): edit and delete. */
export function CompanyCardActions({ company }: { company: Company }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [run] = useAction();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${company.name}`}
            className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
          >
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

      <CompanyFormDialog open={editOpen} onOpenChange={setEditOpen} company={company} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete company?"
        description={`This will permanently remove ${company.name}.`}
        onConfirm={() => run(() => deleteCompany(company.id), { success: "Company deleted" })}
      />
    </>
  );
}

/** Edit / Delete buttons on the company page. */
export function CompanyDetailActions({ company }: { company: Company }) {
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

      <CompanyFormDialog open={editOpen} onOpenChange={setEditOpen} company={company} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete company?"
        description={`This will permanently remove ${company.name}.`}
        // The action redirects to the company list when it is done.
        onConfirm={() => run(() => deleteCompany(company.id, true), { success: "Company deleted" })}
      />
    </div>
  );
}
