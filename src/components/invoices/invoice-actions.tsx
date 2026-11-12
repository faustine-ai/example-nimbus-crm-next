"use client";

import { ChevronDown, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAction } from "@/hooks/use-action";
import { deleteInvoice, setInvoiceStatus } from "@/lib/actions/invoices";
import { INVOICE_STATUSES } from "@/lib/constants";
import type { CompanyOption, ContactOption } from "@/lib/types";

import { InvoiceFormDialog, type EditableInvoice } from "./invoice-form-dialog";

interface Options {
  companies: CompanyOption[];
  contacts: ContactOption[];
}

/** "New invoice" button with its dialog. */
export function NewInvoiceButton({ companies, contacts }: Options) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New invoice
      </Button>
      <InvoiceFormDialog open={open} onOpenChange={setOpen} companies={companies} contacts={contacts} />
    </>
  );
}

/** The "…" menu of an invoice row: edit and delete. */
export function InvoiceRowActions({ invoice, companies, contacts }: { invoice: EditableInvoice } & Options) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [run] = useAction();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${invoice.number}`}>
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

      <InvoiceFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        invoice={invoice}
        companies={companies}
        contacts={contacts}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete invoice?"
        description={`This will permanently remove ${invoice.number}.`}
        onConfirm={() => run(() => deleteInvoice(invoice.id), { success: "Invoice deleted" })}
      />
    </>
  );
}

/** Status / Print / Edit / Delete buttons on the invoice page. */
export function InvoiceDetailActions({ invoice, companies, contacts }: { invoice: EditableInvoice } & Options) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [run, pending] = useAction();

  return (
    <div className="flex flex-wrap gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={pending}>
            Status <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {INVOICE_STATUSES.map((s) => (
            <DropdownMenuItem
              key={s.value}
              disabled={s.value === invoice.status}
              onSelect={() => run(() => setInvoiceStatus(invoice.id, s.value), { success: `Marked as ${s.value}` })}
            >
              Mark as {s.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" onClick={() => window.print()}>
        Print
      </Button>
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

      <InvoiceFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        invoice={invoice}
        companies={companies}
        contacts={contacts}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete invoice?"
        description={`This will permanently remove ${invoice.number}.`}
        // The action redirects to the invoice list when it is done.
        onConfirm={() => run(() => deleteInvoice(invoice.id, true), { success: "Invoice deleted" })}
      />
    </div>
  );
}
