import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function CompanyNotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-muted-foreground">Company not found.</p>
      <Button variant="outline" className="mt-4" asChild>
        <Link href="/companies">Back to companies</Link>
      </Button>
    </div>
  );
}
