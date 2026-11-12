import { Building2, Globe, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CompanyCardActions, NewCompanyButton } from "@/components/companies/company-actions";
import { EmptyState } from "@/components/empty-state";
import { SearchInput, SearchInputFallback } from "@/components/filters/search-input";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listCompanies } from "@/lib/dal/companies";
import { param } from "@/lib/search-params";

export const metadata: Metadata = { title: "Companies" };

export default function CompaniesPage({ searchParams }: PageProps<"/companies">) {
  return (
    <div className="space-y-6">
      <PageHeader title="Companies" description="The organizations you work with.">
        <NewCompanyButton />
      </PageHeader>

      <Suspense fallback={<SearchInputFallback placeholder="Search companies…" className="max-w-md" />}>
        <SearchInput placeholder="Search companies…" className="max-w-md" />
      </Suspense>

      <Suspense fallback={<PageLoader />}>
        <CompanyGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CompanyGrid({ searchParams }: Pick<PageProps<"/companies">, "searchParams">) {
  const search = param((await searchParams).q);
  const companies = await listCompanies({ search });

  if (companies.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No companies found"
        description={search ? "Try a different search." : "Add your first company to get started."}
        action={<NewCompanyButton />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {companies.map((c) => (
        <Card key={c.id} className="group transition-shadow hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <Link href={`/companies/${c.id}`} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent font-semibold text-accent-foreground">
                  {c.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold leading-tight hover:underline">{c.name}</div>
                  {c.industry && <div className="text-xs text-muted-foreground">{c.industry}</div>}
                </div>
              </Link>
              <CompanyCardActions company={c} />
            </div>

            <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              {c.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> {c.location}
                </div>
              )}
              {c.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  <a href={c.website} target="_blank" rel="noreferrer" className="truncate hover:text-primary">
                    {c.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Badge className="border-transparent bg-accent text-accent-foreground">
                {c.contact_count} contact{c.contact_count === 1 ? "" : "s"}
              </Badge>
              {c.size && <Badge className="border-transparent bg-secondary text-secondary-foreground">{c.size}</Badge>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
