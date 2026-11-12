import { Plus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ContactRowActions, NewContactButton } from "@/components/contacts/contact-actions";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/filters/pagination";
import { SearchInput, SearchInputFallback } from "@/components/filters/search-input";
import { SelectFilter } from "@/components/filters/select-filter";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/spinner";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CONTACT_STATUSES } from "@/lib/constants";
import { listCompanyOptions } from "@/lib/dal/companies";
import { listContacts } from "@/lib/dal/contacts";
import { formatDate, initials } from "@/lib/format";
import { oneOf, pageParam, param } from "@/lib/search-params";

export const metadata: Metadata = { title: "Contacts" };

const STATUS_VALUES = CONTACT_STATUSES.map((s) => s.value);

export default function ContactsPage({ searchParams }: PageProps<"/contacts">) {
  return (
    <div className="space-y-6">
      <PageHeader title="Contacts" description="Manage the people in your network.">
        <Suspense
          fallback={
            <Button disabled>
              <Plus className="h-4 w-4" /> New contact
            </Button>
          }
        >
          <NewContact />
        </Suspense>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Suspense fallback={<SearchInputFallback placeholder="Search by name or email…" className="flex-1" />}>
          <SearchInput placeholder="Search by name or email…" className="flex-1" />
          <SelectFilter param="status" allLabel="All statuses" options={CONTACT_STATUSES} className="sm:w-48" />
        </Suspense>
      </div>

      <Suspense fallback={<PageLoader />}>
        <ContactList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewContact() {
  const companies = await listCompanyOptions();
  return <NewContactButton companies={companies} />;
}

async function ContactList({ searchParams }: Pick<PageProps<"/contacts">, "searchParams">) {
  const params = await searchParams;
  const search = param(params.q);
  const status = oneOf(params.status, STATUS_VALUES);

  const [contacts, companies] = await Promise.all([
    listContacts({ search, status, page: pageParam(params.page) }),
    listCompanyOptions(),
  ]);

  if (contacts.rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No contacts found"
        description={
          search || status ? "Try adjusting your search or filters." : "Get started by adding your first contact."
        }
        action={<NewContactButton companies={companies} />}
      />
    );
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Company</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden xl:table-cell">Added</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/contacts/${c.id}`} className="flex items-center gap-3 hover:underline">
                    <Avatar>
                      <AvatarFallback>{initials(c.first_name, c.last_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {c.first_name} {c.last_name}
                      </div>
                      {c.job_title && <div className="text-xs text-muted-foreground">{c.job_title}</div>}
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{c.company_name || "—"}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{c.email || "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">{formatDate(c.created_at)}</TableCell>
                <TableCell>
                  <ContactRowActions contact={c} companies={companies} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Pagination
        pathname="/contacts"
        params={{ q: search, status }}
        page={contacts.page}
        pageCount={contacts.pageCount}
        total={contacts.total}
      />
    </>
  );
}
