"use client";

import { useId, useState } from "react";

import { FormFooter } from "@/components/forms/form-footer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/hooks/use-form-action";
import { saveDeal } from "@/lib/actions/deals";
import { NONE } from "@/lib/constants";
import type { CompanyOption, ContactOption, Deal, Stage } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The deal to edit. Omit to create one. */
  deal?: Deal | null;
  /** The columns of the current pipeline. */
  stages: Stage[];
  /** The column a new deal should land in (e.g. the column whose "+" was clicked). */
  defaultStageId?: number | null;
  companies: CompanyOption[];
  contacts: ContactOption[];
}

export function DealFormDialog({ open, onOpenChange, deal, ...rest }: Props) {
  const isEdit = Boolean(deal);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit deal" : "New deal"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update the deal details." : "Add a deal to your pipeline."}</DialogDescription>
        </DialogHeader>
        <DealForm deal={deal} onClose={() => onOpenChange(false)} {...rest} />
      </DialogContent>
    </Dialog>
  );
}

function DealForm({
  deal,
  stages,
  defaultStageId,
  companies,
  contacts,
  onClose,
}: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const isEdit = Boolean(deal);
  const uid = useId();
  const [state, formAction, pending] = useFormAction(saveDeal, {
    success: isEdit ? "Deal updated" : "Deal created",
    onSuccess: onClose,
  });
  const firstStageId = stages[0] ? String(stages[0].id) : "";
  const [stageId, setStageId] = useState(
    deal?.stage_id ? String(deal.stage_id) : defaultStageId ? String(defaultStageId) : firstStageId,
  );
  const [companyId, setCompanyId] = useState(deal?.company_id ? String(deal.company_id) : NONE);
  const [contactId, setContactId] = useState(deal?.contact_id ? String(deal.contact_id) : NONE);
  const value = (name: "name" | "close_date" | "notes") => state.values?.[name] ?? deal?.[name] ?? "";

  return (
    <form action={formAction} className="space-y-4">
      {deal && <input type="hidden" name="id" value={deal.id} />}
      <input type="hidden" name="stage_id" value={stageId} />
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="contact_id" value={contactId} />

      <div className="space-y-2">
        <Label htmlFor={`${uid}-name`}>Deal name *</Label>
        <Input id={`${uid}-name`} name="name" defaultValue={value("name")} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${uid}-value`}>Value (USD)</Label>
          <Input
            id={`${uid}-value`}
            name="value"
            type="number"
            min="0"
            step="100"
            defaultValue={state.values?.value ?? (deal?.value != null ? String(deal.value) : "")}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${uid}-stage`}>Stage</Label>
          <Select value={stageId} onValueChange={setStageId}>
            <SelectTrigger id={`${uid}-stage`}>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      <div className="space-y-2">
        <Label htmlFor={`${uid}-close`}>Expected close date</Label>
        <Input id={`${uid}-close`} name="close_date" type="date" defaultValue={value("close_date")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${uid}-notes`}>Notes</Label>
        <Textarea id={`${uid}-notes`} name="notes" defaultValue={value("notes")} />
      </div>

      <FormFooter pending={pending} submitLabel={isEdit ? "Save changes" : "Create deal"} onCancel={onClose} />
    </form>
  );
}
