import { ArrowLeft, Briefcase, Building2, Mail, Phone, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { AddContactTaskButton, ContactDetailActions } from "@/components/contacts/contact-actions";
import { NotesPanel } from "@/components/notes-panel";
import { StageBadge, StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { listCompanyOptions } from "@/lib/dal/companies";
import { getContact, listContactOptions } from "@/lib/dal/contacts";
import { listDealOptions } from "@/lib/dal/deals";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { idParam } from "@/lib/search-params";

// Shared by generateMetadata and the page: one query per request.
const loadContact = cache(async (rawId: string) => {
  const id = idParam(rawId);
  return id ? getContact(id) : null;
});

export async function generateMetadata({ params }: PageProps<"/contacts/[id]">): Promise<Metadata> {
  const contact = await loadContact((await params).id);
  return { title: contact ? `${contact.first_name} ${contact.last_name}` : "Contact not found" };
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="w-24 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export default async function ContactPage({ params }: PageProps<"/contacts/[id]">) {
  const { id } = await params;
  const contact = await loadContact(id);
  if (!contact) notFound();

  const [companies, contacts, deals] = await Promise.all([
    listCompanyOptions(),
    listContactOptions(),
    listDealOptions(),
  ]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href="/contacts">
          <ArrowLeft className="h-4 w-4" /> Contacts
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 text-base">
            <AvatarFallback>{initials(contact.first_name, contact.last_name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {contact.first_name} {contact.last_name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={contact.status} />
              {contact.company_name && <span className="text-sm text-muted-foreground">{contact.company_name}</span>}
            </div>
          </div>
        </div>
        <ContactDetailActions contact={contact} companies={companies} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InfoRow icon={Mail} label="Email" value={contact.email} />
              <Separator />
              <InfoRow icon={Phone} label="Phone" value={contact.phone} />
              <Separator />
              <InfoRow icon={Briefcase} label="Title" value={contact.job_title} />
              <Separator />
              <InfoRow
                icon={Building2}
                label="Company"
                value={
                  contact.company_id ? (
                    <Link className="text-primary hover:underline" href={`/companies/${contact.company_id}`}>
                      {contact.company_name}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <Separator />
              <InfoRow icon={Briefcase} label="Added" value={formatDate(contact.created_at)} />
            </CardContent>
          </Card>

          {contact.notes && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap pt-0 text-sm text-muted-foreground">
                {contact.notes}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Deals</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {contact.deals.length ? (
                <div className="space-y-2">
                  {contact.deals.map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="text-sm font-medium">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{formatCurrency(d.value)}</div>
                      </div>
                      <StageBadge stage={d.stage_name || d.stage} type={d.stage_type} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No deals linked to this contact.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Notes &amp; Activity</CardTitle>
              <AddContactTaskButton contactId={contact.id} options={{ contacts, companies, deals }} />
            </CardHeader>
            <CardContent className="pt-0">
              <NotesPanel entityType="contact" entityId={contact.id} notes={contact.note_entries} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
