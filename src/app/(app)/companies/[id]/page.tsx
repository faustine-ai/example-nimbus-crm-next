import { ArrowLeft, Briefcase, Globe, MapPin, Users2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { CompanyDetailActions } from "@/components/companies/company-actions";
import { NewContactButton } from "@/components/contacts/contact-actions";
import { NotesPanel } from "@/components/notes-panel";
import { StageBadge, StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompany, listCompanyOptions } from "@/lib/dal/companies";
import { formatCurrency, initials } from "@/lib/format";
import { idParam } from "@/lib/search-params";

// Shared by generateMetadata and the page: one query per request.
const loadCompany = cache(async (rawId: string) => {
  const id = idParam(rawId);
  return id ? getCompany(id) : null;
});

export async function generateMetadata({ params }: PageProps<"/companies/[id]">): Promise<Metadata> {
  const company = await loadCompany((await params).id);
  return { title: company?.name ?? "Company not found" };
}

export default async function CompanyPage({ params }: PageProps<"/companies/[id]">) {
  const { id } = await params;
  const company = await loadCompany(id);
  if (!company) notFound();

  const companies = await listCompanyOptions();

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href="/companies">
          <ArrowLeft className="h-4 w-4" /> Companies
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-xl font-bold text-accent-foreground">
            {company.name[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {company.industry && <span>{company.industry}</span>}
              {company.size && (
                <Badge className="border-transparent bg-secondary text-secondary-foreground">{company.size}</Badge>
              )}
            </div>
          </div>
        </div>
        <CompanyDetailActions company={company} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-sm">
              {company.website && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <a href={company.website} target="_blank" rel="noreferrer" className="hover:text-primary">
                    {company.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {company.location || "—"}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users2 className="h-4 w-4" /> {company.contacts.length} contacts
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" /> {company.deals.length} deals
              </div>
            </CardContent>
          </Card>

          {company.notes && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap pt-0 text-sm text-muted-foreground">
                {company.notes}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Contacts</CardTitle>
              <NewContactButton
                companies={companies}
                defaultCompanyId={company.id}
                label="Add contact"
                variant="outline"
                size="sm"
              />
            </CardHeader>
            <CardContent className="pt-0">
              {company.contacts.length ? (
                <div className="space-y-2">
                  {company.contacts.map((c) => (
                    <Link
                      key={c.id}
                      href={`/contacts/${c.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{initials(c.first_name, c.last_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">
                            {c.first_name} {c.last_name}
                          </div>
                          {c.job_title && <div className="text-xs text-muted-foreground">{c.job_title}</div>}
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No contacts yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deals</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {company.deals.length ? (
                <div className="space-y-2">
                  {company.deals.map((d) => (
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
                <p className="text-sm text-muted-foreground">No deals yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <NotesPanel entityType="company" entityId={company.id} notes={company.note_entries} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
