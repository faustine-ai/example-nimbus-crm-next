import { FileText, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/filters/pagination";
import { SearchInput, SearchInputFallback } from "@/components/filters/search-input";
import { SelectFilter } from "@/components/filters/select-filter";
import { InvoiceRowActions, NewInvoiceButton } from "@/components/invoices/invoice-actions";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/spinner";
import { InvoiceStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { INVOICE_STATUSES } from "@/lib/constants";
import { listCompanyOptions } from "@/lib/dal/companies";
import { listContactOptions } from "@/lib/dal/contacts";
import { listInvoices } from "@/lib/dal/invoices";
import { formatCurrency, formatDate, isPastDate, todayISO } from "@/lib/format";
import { oneOf, pageParam, param } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Invoices" };

const STATUS_VALUES = INVOICE_STATUSES.map((s) => s.value);

export default function InvoicesPage({ searchParams }: PageProps<"/invoices">) {
  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Create, send, and track your invoices.">
        <Suspense
          fallback={
            <Button disabled>
              <Plus className="h-4 w-4" /> New invoice
            </Button>
          }
        >
          <NewInvoice />
        </Suspense>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Suspense fallback={<SearchInputFallback placeholder="Search by number or company…" className="flex-1" />}>
          <SearchInput placeholder="Search by number or company…" className="flex-1" />
          <SelectFilter param="status" allLabel="All statuses" options={INVOICE_STATUSES} className="sm:w-48" />
        </Suspense>
      </div>

      <Suspense fallback={<PageLoader />}>
        <InvoiceList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewInvoice() {
  const [companies, contacts] = await Promise.all([listCompanyOptions(), listContactOptions()]);
  return <NewInvoiceButton companies={companies} contacts={contacts} />;
}

async function InvoiceList({ searchParams }: Pick<PageProps<"/invoices">, "searchParams">) {
  const params = await searchParams;
  const search = param(params.q);
  const status = oneOf(params.status, STATUS_VALUES);

  const [invoices, companies, contacts] = await Promise.all([
    listInvoices({ search, status, page: pageParam(params.page) }),
    listCompanyOptions(),
    listContactOptions(),
  ]);

  if (invoices.rows.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No invoices found"
        description={
          search || status ? "Try adjusting your search or filters." : "Create your first invoice to get started."
        }
        action={<NewInvoiceButton companies={companies} contacts={contacts} />}
      />
    );
  }

  const today = todayISO();

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead className="hidden md:table-cell">Company</TableHead>
              <TableHead className="hidden lg:table-cell">Issued</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.rows.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell>
                  <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline">
                    {inv.number}
                  </Link>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{inv.company_name || "—"}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {formatDate(inv.issue_date)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-muted-foreground",
                    // Unpaid and past its due date.
                    inv.status !== "paid" && isPastDate(inv.due_date, today) && "font-medium text-destructive",
                  )}
                >
                  {formatDate(inv.due_date)}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={inv.status} />
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(inv.total)}</TableCell>
                <TableCell>
                  <InvoiceRowActions invoice={inv} companies={companies} contacts={contacts} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Pagination
        pathname="/invoices"
        params={{ q: search, status }}
        page={invoices.page}
        pageCount={invoices.pageCount}
        total={invoices.total}
      />
    </>
  );
}
