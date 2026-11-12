// Shared option lists and display metadata used across the app.

export type StageType = "open" | "won" | "lost";

// Pipelines are fully customizable, so columns are styled by their *type*
// (open / won / lost) rather than a fixed list of stage names.
export const STAGE_TYPES = [
  { value: "open", label: "Open", color: "bg-slate-100 text-slate-700 border-slate-200", dot: "#6366f1" },
  { value: "won", label: "Won", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "#10b981" },
  { value: "lost", label: "Lost", color: "bg-rose-100 text-rose-700 border-rose-200", dot: "#f43f5e" },
] as const;

export function stageTypeMeta(type: string | null | undefined) {
  return STAGE_TYPES.find((t) => t.value === type) || STAGE_TYPES[0];
}

export const CONTACT_STATUSES = [
  { value: "lead", label: "Lead", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "active", label: "Active", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "customer", label: "Customer", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "inactive", label: "Inactive", color: "bg-slate-100 text-slate-500 border-slate-200" },
] as const;

export const TASK_PRIORITIES = [
  { value: "low", label: "Low", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "high", label: "High", color: "bg-rose-100 text-rose-700 border-rose-200" },
] as const;

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;

export const INVOICE_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "sent", label: "Sent", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "paid", label: "Paid", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "overdue", label: "Overdue", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { value: "void", label: "Void", color: "bg-slate-100 text-slate-500 border-slate-200" },
] as const;

export const NOTE_ENTITY_TYPES = ["contact", "company", "deal"] as const;
export const TASK_ENTITY_TYPES = [
  { value: "contact", label: "Contact" },
  { value: "company", label: "Company" },
  { value: "deal", label: "Deal" },
] as const;

export function invoiceStatusMeta(value: string | null | undefined) {
  return INVOICE_STATUSES.find((s) => s.value === value) || INVOICE_STATUSES[0];
}
export function statusMeta(value: string | null | undefined) {
  return CONTACT_STATUSES.find((s) => s.value === value) || CONTACT_STATUSES[0];
}
export function priorityMeta(value: string | null | undefined) {
  return TASK_PRIORITIES.find((p) => p.value === value) || TASK_PRIORITIES[1];
}

/** Sentinel used by selects for "no value" (Radix Select items cannot be empty strings). */
export const NONE = "__none__";
export const ALL = "__all__";

/** Rows per page on the paginated tables. */
export const PAGE_SIZE = 25;
