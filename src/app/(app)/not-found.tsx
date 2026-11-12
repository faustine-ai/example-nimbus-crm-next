import { SearchX } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Page not found"
      description="The page you are looking for does not exist or was removed."
      action={
        <Button asChild>
          <Link href="/">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
