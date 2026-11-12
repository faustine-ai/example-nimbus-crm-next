import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";

// Link-based tabs: the selected tab lives in the URL, so the list is plain
// server-rendered markup with the look of the tab primitives.

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className)}
      {...props}
    />
  );
}

function TabsLink({
  className,
  active,
  ...props
}: React.ComponentProps<typeof Link> & { active: boolean }) {
  return (
    <Link
      role="tab"
      aria-selected={active}
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

export { TabsList, TabsLink };
