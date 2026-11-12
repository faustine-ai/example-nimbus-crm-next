import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function InvoiceNotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-muted-foreground">Invoice not found.</p>
      <Button variant="outline" className="mt-4" asChild>
        <Link href="/invoices">Back to invoices</Link>
      </Button>
    </div>
  );
}
