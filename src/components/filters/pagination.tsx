import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Previous / next links for a paginated list. The page number lives in the
 * `page` search param. Renders nothing when everything fits on one page.
 */
export function Pagination({
  pathname,
  params,
  page,
  pageCount,
  total,
}: {
  pathname: string;
  /** The other search params to keep on the links (search, filters). */
  params: Record<string, string | undefined>;
  page: number;
  pageCount: number;
  total: number;
}) {
  if (pageCount <= 1) return null;

  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <nav className="flex items-center justify-between text-sm text-muted-foreground" aria-label="Pagination">
      <span>
        Page {page} of {pageCount} · {total} results
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={href(page - 1)} scroll={false}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
        )}
        {page < pageCount ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={href(page + 1)} scroll={false}>
              Next <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </nav>
  );
}
