import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground shadow-lg">
        N
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">The page you are looking for does not exist.</p>
      </div>
      <Button asChild>
        <Link href="/">Back to Nimbus CRM</Link>
      </Button>
    </div>
  );
}
