import { ArrowLeft, Building2, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { InvoiceDetailActions } from "@/components/invoices/invoice-actions";
import { InvoiceStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listCompanyOptions } from "@/lib/dal/companies";
import { listContactOptions } from "@/lib/dal/contacts";
import { getInvoice } from "@/lib/dal/invoices";
import { formatCurrency, formatDate } from "@/lib/format";
import { idParam } from "@/lib/search-params";

// Shared by generateMetadata and the page: one query per request.
const loadInvoice = cache(async (rawId: string) => {
  const id = idParam(rawId);
  return id ? getInvoice(id) : null;
});

export async function generateMetadata({ params }: PageProps<"/invoices/[id]">): Promise<Metadata> {
  const invoice = await loadInvoice((await params).id);
  return { title: invoice?.number ?? "Invoice not found" };
}

export default async function InvoicePage({ params }: PageProps<"/invoices/[id]">) {
  const { id } = await params;
  const invoice = await loadInvoice(id);
  if (!invoice) notFound();

  const [companies, contacts] = await Promise.all([listCompanyOptions(), listContactOptions()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" /> Invoices
          </Link>
        </Button>
        <InvoiceDetailActions invoice={invoice} companies={companies} contacts={contacts} />
      </div>

      {/* Invoice document */}
      <Card className="mx-auto w-full max-w-3xl">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                N
              </div>
              <div className="mt-2 text-sm text-muted-foreground">Nimbus CRM</div>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold tracking-tight">{invoice.number}</h1>
              <div className="mt-2">
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bill to</div>
              {invoice.company ? (
                <Link
                  href={`/companies/${invoice.company.id}`}
                  className="mt-1 flex items-center gap-1.5 font-medium hover:text-primary print:text-foreground"
                >
                  <Building2 className="h-4 w-4" /> {invoice.company.name}
                </Link>
              ) : (
                <div className="mt-1 text-muted-foreground">—</div>
              )}
              {invoice.contact && (
                <Link
                  href={`/contacts/${invoice.contact.id}`}
                  className="mt-1 flex items-center gap-1.5 text-muted-foreground hover:text-primary print:text-muted-foreground"
                >
                  <User className="h-3.5 w-3.5" /> {invoice.contact.first_name} {invoice.contact.last_name}
                </Link>
              )}
              {invoice.contact?.email && <div className="text-muted-foreground">{invoice.contact.email}</div>}
            </div>
            <div className="text-right">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <span className="text-muted-foreground">Issue date</span>
                <span className="font-medium">{formatDate(invoice.issue_date)}</span>
                <span className="text-muted-foreground">Due date</span>
                <span className="font-medium">{formatDate(invoice.due_date)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium">{it.description}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{it.quantity}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(it.unit_price)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(it.quantity * it.unit_price)}
                    </TableCell>
                  </TableRow>
                ))}
                {invoice.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No line items.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({invoice.tax_rate || 0}%)</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-8 border-t pt-4 text-sm">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</div>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
