"use client";

import { useId, useState } from "react";

import { FormFooter } from "@/components/forms/form-footer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/hooks/use-form-action";
import { saveContact } from "@/lib/actions/contacts";
import { CONTACT_STATUSES, NONE } from "@/lib/constants";
import type { CompanyOption, Contact } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The contact to edit. Omit to create one. */
  contact?: Contact | null;
  /** Company preselected for a new contact. */
  defaultCompanyId?: number;
  companies: CompanyOption[];
}

export function ContactFormDialog({ open, onOpenChange, contact, ...rest }: Props) {
  const isEdit = Boolean(contact);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit contact" : "New contact"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the contact details." : "Add a new person to your CRM."}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while the dialog is open, so every open starts from a clean form. */}
        <ContactForm contact={contact} onClose={() => onOpenChange(false)} {...rest} />
      </DialogContent>
    </Dialog>
  );
}

function ContactForm({
  contact,
  defaultCompanyId,
  companies,
  onClose,
}: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const isEdit = Boolean(contact);
  const uid = useId();
  const [state, formAction, pending] = useFormAction(saveContact, {
    success: isEdit ? "Contact updated" : "Contact created",
    onSuccess: onClose,
  });
  const [companyId, setCompanyId] = useState(
    contact?.company_id ? String(contact.company_id) : defaultCompanyId ? String(defaultCompanyId) : NONE,
  );
  const [status, setStatus] = useState(contact?.status || "lead");
  // After a failed submit, keep what the user typed.
  const value = (name: keyof Contact) => state.values?.[name] ?? (contact?.[name] as string | null | undefined) ?? "";

  return (
    <form action={formAction} className="space-y-4">
      {contact && <input type="hidden" name="id" value={contact.id} />}
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="status" value={status} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${uid}-first`}>First name *</Label>
          <Input id={`${uid}-first`} name="first_name" defaultValue={value("first_name")} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${uid}-last`}>Last name *</Label>
          <Input id={`${uid}-last`} name="last_name" defaultValue={value("last_name")} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${uid}-email`}>Email</Label>
          <Input id={`${uid}-email`} name="email" type="email" defaultValue={value("email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${uid}-phone`}>Phone</Label>
          <Input id={`${uid}-phone`} name="phone" defaultValue={value("phone")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${uid}-title`}>Job title</Label>
        <Input id={`${uid}-title`} name="job_title" defaultValue={value("job_title")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${uid}-company`}>Company</Label>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger id={`${uid}-company`}>
              <SelectValue placeholder="Select company" />
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
          <Label htmlFor={`${uid}-status`}>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id={`${uid}-status`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${uid}-notes`}>Notes</Label>
        <Textarea
          id={`${uid}-notes`}
          name="notes"
          defaultValue={value("notes")}
          placeholder="Anything worth remembering…"
        />
      </div>

      <FormFooter
        pending={pending}
        submitLabel={isEdit ? "Save changes" : "Create contact"}
        onCancel={onClose}
      />
    </form>
  );
}
