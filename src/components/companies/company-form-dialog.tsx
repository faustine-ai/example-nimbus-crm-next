"use client";

import { useId, useState } from "react";

import { FormFooter } from "@/components/forms/form-footer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/hooks/use-form-action";
import { saveCompany } from "@/lib/actions/companies";
import { COMPANY_SIZES, NONE } from "@/lib/constants";
import type { Company } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The company to edit. Omit to create one. */
  company?: Company | null;
}

export function CompanyFormDialog({ open, onOpenChange, company }: Props) {
  const isEdit = Boolean(company);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit company" : "New company"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update the company details." : "Add a company to your CRM."}</DialogDescription>
        </DialogHeader>
        <CompanyForm company={company} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CompanyForm({ company, onClose }: { company?: Company | null; onClose: () => void }) {
  const isEdit = Boolean(company);
  const uid = useId();
  const [state, formAction, pending] = useFormAction(saveCompany, {
    success: isEdit ? "Company updated" : "Company created",
    onSuccess: onClose,
  });
  const [size, setSize] = useState(company?.size || NONE);
  const value = (name: "name" | "website" | "industry" | "location" | "notes") =>
    state.values?.[name] ?? company?.[name] ?? "";

  return (
    <form action={formAction} className="space-y-4">
      {company && <input type="hidden" name="id" value={company.id} />}
      <input type="hidden" name="size" value={size} />

      <div className="space-y-2">
        <Label htmlFor={`${uid}-name`}>Name *</Label>
        <Input id={`${uid}-name`} name="name" defaultValue={value("name")} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${uid}-website`}>Website</Label>
          <Input id={`${uid}-website`} name="website" defaultValue={value("website")} placeholder="https://…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${uid}-industry`}>Industry</Label>
          <Input id={`${uid}-industry`} name="industry" defaultValue={value("industry")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${uid}-size`}>Size</Label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger id={`${uid}-size`}>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Unspecified</SelectItem>
              {COMPANY_SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s} employees
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${uid}-location`}>Location</Label>
          <Input id={`${uid}-location`} name="location" defaultValue={value("location")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${uid}-notes`}>Notes</Label>
        <Textarea id={`${uid}-notes`} name="notes" defaultValue={value("notes")} />
      </div>

      <FormFooter pending={pending} submitLabel={isEdit ? "Save changes" : "Create company"} onCancel={onClose} />
    </form>
  );
}
