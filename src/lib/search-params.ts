// Helpers to read search params on the server.

type Raw = string | string[] | undefined;

/** First value of a search param as a trimmed string ("" when absent). */
export function param(value: Raw) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** A search param restricted to a set of allowed values ("" otherwise). */
export function oneOf<const T extends string>(value: Raw, allowed: readonly T[]): T | "" {
  const v = param(value);
  return (allowed as readonly string[]).includes(v) ? (v as T) : "";
}

/** The `page` search param as a positive integer (1 when absent or invalid). */
export function pageParam(value: Raw) {
  const n = Number.parseInt(param(value), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** A dynamic route segment as a positive integer id, or null. */
export function idParam(value: string) {
  return /^\d+$/.test(value) ? Number(value) : null;
}
