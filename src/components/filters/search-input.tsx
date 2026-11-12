"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Spinner } from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Search box bound to the `q` search param. Typing updates the URL (debounced)
 * and the server re-renders the list for the new query.
 */
export function SearchInput({ placeholder, className }: { placeholder: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function onChange(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (next.trim()) params.set("q", next.trim());
      else params.delete("q");
      params.delete("page");
      const query = params.toString();
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
    }, 250);
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
      {pending && <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />}
    </div>
  );
}

/** Same footprint without the URL binding: the fallback while the search box loads. */
export function SearchInputFallback({ placeholder, className }: { placeholder: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" aria-label={placeholder} placeholder={placeholder} disabled className="pl-9" />
    </div>
  );
}
