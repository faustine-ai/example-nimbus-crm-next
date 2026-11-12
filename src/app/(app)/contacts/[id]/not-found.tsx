import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ContactNotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-muted-foreground">Contact not found.</p>
      <Button variant="outline" className="mt-4" asChild>
        <Link href="/contacts">Back to contacts</Link>
      </Button>
    </div>
  );
}
