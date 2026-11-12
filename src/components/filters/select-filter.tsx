"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL } from "@/lib/constants";

/** Dropdown filter bound to a search param (e.g. `status`). "All" removes the param. */
export function SelectFilter({
  param,
  allLabel,
  options,
  className,
}: {
  param: string;
  allLabel: string;
  options: readonly { value: string; label: string }[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const current = searchParams.get(param);
  const value = options.some((o) => o.value === current) ? (current as string) : ALL;

  function onValueChange(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next === ALL) params.delete(param);
    else params.set(param, next);
    params.delete("page");
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className} aria-label={allLabel}>
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
