"use client";

import { Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";

import { FormFooter } from "@/components/forms/form-footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/hooks/use-form-action";
import { saveInvoice } from "@/lib/actions/invoices";
import { INVOICE_STATUSES, NONE } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { CompanyOption, ContactOption, Invoice, InvoiceItem } from "@/lib/types";

/** The invoice being edited: the row plus, when known, its line items. */
export type EditableInvoice = Invoice & { items?: InvoiceItem[] };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The invoice to edit. Omit to create one. */
  invoice?: EditableInvoice | null;
  companies: CompanyOption[];
  contacts: ContactOption[];
}

export function InvoiceFormDialog({ open, onOpenChange, invoice, ...rest }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{invoice ? `Edit ${invoice.number}` : "New invoice"}</DialogTitle>
          <DialogDescription>
            {invoice
              ? "Update the invoice details and line items."
              : "Create an invoice with line items. The number is generated automatically."}
          </DialogDescription>
        </DialogHeader>
        <InvoiceForm invoice={invoice} onClose={() => onOpenChange(false)} {...rest} />
      </DialogContent>
    </Dialog>
  );
}

interface ItemDraft {
  /** Stable React key for the row (not sent to the server). */
  key: number;
  description: string;
  quantity: string;
  unit_price: string;
}

const blankItem = (key: number): ItemDraft => ({ key, description: "", quantity: "1", unit_price: "0" });

function InvoiceForm({
  invoice,
  companies,
  contacts,
  onClose,
}: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const isEdit = Boolean(invoice);
  const uid = useId();
  const [state, formAction, pending] = useFormAction(saveInvoice, {
    success: isEdit ? "Invoice updated" : "Invoice created",
    onSuccess: onClose,
  });

  const [items, setItems] = useState<ItemDraft[]>(() =>
    invoice?.items?.length
      ? invoice.items.map((it, key) => ({
          key,
          description: it.description,
          quantity: String(it.quantity),
          unit_price: String(it.unit_price),
        }))
      : [blankItem(0)],
  );
  const [status, setStatus] = useState(invoice?.status || "draft");
  const [companyId, setCompanyId] = useState(invoice?.company_id ? String(invoice.company_id) : NONE);
  const [contactId, setContactId] = useState(invoice?.contact_id ? String(invoice.contact_id) : NONE);
  const [taxRate, setTaxRate] = useState(invoice?.tax_rate != null ? String(invoice.tax_rate) : "0");
  const value = (name: "number" | "issue_date" | "due_date" | "notes") =>
    state.values?.[name] ?? invoice?.[name] ?? "";

  const setItem = (key: number, field: keyof Omit<ItemDraft, "key">, next: string) =>
    setItems((list) => list.map((it) => (it.key === key ? { ...it, [field]: next } : it)));

  // Live totals while editing. The stored totals are always computed on the server.
  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
  const tax = (subtotal * (Number(taxRate) || 0)) / 100;
  const total = subtotal + tax;

  return (
    <form action={formAction} className="space-y-4">
      {invoice && <input type="hidden" name="id" value={invoice.id} />}
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="contact_id" value={contactId} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor={`${uid}-number`}>Number</Label>
          <Input id={`${uid}-number`} name="number" defaultValue={value("number")} placeholder="Auto" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${uid}-status`}>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id={`${uid}-status`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${uid}-issue`}>Issue date</Label>
          <Input id={`${uid}-issue`} name="issue_date" type="date" defaultValue={value("issue_date")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${uid}-due`}>Due date</Label>
          <Input id={`${uid}-due`} name="due_date" type="date" defaultValue={value("due_date")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${uid}-company`}>Company</Label>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger id={`${uid}-company`}>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No company</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${uid}-contact`}>Contact</Label>
          <Select value={contactId} onValueChange={setContactId}>
            <SelectTrigger id={`${uid}-contact`}>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No contact</SelectItem>
              {contacts.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.first_name} {c.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-2">
        <Label>Line items</Label>
        <div className="space-y-2">
          <div className="hidden grid-cols-12 gap-2 px-1 text-xs text-muted-foreground sm:grid">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-3 text-right">Unit price</div>
            <div className="col-span-1" />
          </div>
          {items.map((it, i) => (
            <div key={it.key} className="grid grid-cols-12 gap-2">
              <Input
                className="col-span-12 sm:col-span-6"
                name="item_description"
                aria-label={`Line ${i + 1} description`}
                placeholder="Description"
                value={it.description}
                onChange={(e) => setItem(it.key, "description", e.target.value)}
              />
              <Input
                className="col-span-4 text-right sm:col-span-2"
                name="item_quantity"
                aria-label={`Line ${i + 1} quantity`}
                type="number"
                min="0"
                step="1"
                value={it.quantity}
                onChange={(e) => setItem(it.key, "quantity", e.target.value)}
              />
              <Input
                className="col-span-6 text-right sm:col-span-3"
                name="item_unit_price"
                aria-label={`Line ${i + 1} unit price`}
                type="number"
                min="0"
                step="0.01"
                value={it.unit_price}
                onChange={(e) => setItem(it.key, "unit_price", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setItems((list) => list.filter((row) => row.key !== it.key))}
                className="col-span-2 flex items-center justify-center text-muted-foreground hover:text-destructive sm:col-span-1"
                aria-label="Remove line"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setItems((list) => [...list, blankItem(Math.max(-1, ...list.map((it) => it.key)) + 1)])}>
          <Plus className="h-4 w-4" /> Add line
        </Button>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-56 space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              Tax
              <Input
                className="h-6 w-14 px-1 text-right text-xs"
                name="tax_rate"
                aria-label="Tax rate"
                type="number"
                min="0"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
              %
            </span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 font-semibold text-foreground">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${uid}-notes`}>Notes</Label>
        <Textarea
          id={`${uid}-notes`}
          name="notes"
          defaultValue={value("notes")}
          placeholder="Payment terms, PO number, etc."
        />
      </div>

      <FormFooter pending={pending} submitLabel={isEdit ? "Save changes" : "Create invoice"} onCancel={onClose} />
    </form>
  );
}
