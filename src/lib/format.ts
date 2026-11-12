import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

/** Format a number as USD currency without decimals. */
export function formatCurrency(value: number | string | null | undefined) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value: string | null | undefined) {
  if (!value) return null;
  // Date-only values ("2026-07-15") are calendar dates: parse them as local
  // midnight so they never shift a day with the time zone.
  if (DATE_ONLY.test(value)) {
    const d = parseISO(value);
    return isValid(d) ? d : null;
  }
  // SQLite returns UTC as "YYYY-MM-DD HH:MM:SS"; normalize to ISO for parsing.
  const iso = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  const d = parseISO(iso);
  return isValid(d) ? d : null;
}

/** Format a date as e.g. "Jun 16, 2026". */
export function formatDate(value: string | null | undefined) {
  const d = toDate(value);
  return d ? format(d, "MMM d, yyyy") : "—";
}

/** Relative time, e.g. "3 hours ago". */
export function formatRelative(value: string | null | undefined) {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : "";
}

/** Today's date as "YYYY-MM-DD" in the local time zone. */
export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

/** True when a date-only value is strictly before today. */
export function isPastDate(value: string | null | undefined, today: string) {
  return Boolean(value) && String(value).slice(0, 10) < today;
}

/** Initials from a first/last pair. */
export function initials(first: string | null | undefined = "", last: string | null | undefined = "") {
  return `${(first?.[0] || "").toUpperCase()}${(last?.[0] || "").toUpperCase()}` || "?";
}

/** Initials from a full name ("Admin User" -> "AU"). */
export function nameInitials(name: string | null | undefined) {
  const [first, last] = String(name || "").split(" ");
  return initials(first, last);
}
