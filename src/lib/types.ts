import type { StageType } from "@/lib/constants";

export type UserRole = "admin" | "member";

/** The signed-in user as exposed to the UI (never includes the password hash). */
export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Company {
  id: number;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyListItem extends Company {
  contact_count: number;
}

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  company_id: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactWithCompany extends Contact {
  company_name: string | null;
}

export interface Stage {
  id: number;
  pipeline_id: number;
  name: string;
  type: StageType;
  position: number;
  created_at: string;
}

export interface Pipeline {
  id: number;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface PipelineWithStages extends Pipeline {
  stages: Stage[];
}

export interface Deal {
  id: number;
  name: string;
  company_id: number | null;
  contact_id: number | null;
  value: number;
  stage: string;
  stage_id: number | null;
  close_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** A deal with its stage name/type, as listed on contact and company pages. */
export interface DealWithStage extends Deal {
  stage_name: string | null;
  stage_type: StageType | null;
}

/** A deal as shown on the board. */
export interface DealWithRelations extends DealWithStage {
  company_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  pipeline_id: number | null;
}

export type TaskEntityType = "contact" | "company" | "deal";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  completed: number;
  entity_type: TaskEntityType | null;
  entity_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskWithLabel extends Task {
  entity_label: string | null;
}

export type NoteEntityType = "contact" | "company" | "deal";

export interface Note {
  id: number;
  body: string;
  entity_type: NoteEntityType;
  entity_id: number;
  author_id: number | null;
  created_at: string;
}

export interface Activity {
  id: number;
  type: string;
  message: string;
  entity_type: string | null;
  entity_id: number | null;
  actor_id: number | null;
  created_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  position: number;
}

export interface Invoice {
  id: number;
  number: string;
  company_id: number | null;
  contact_id: number | null;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  tax_rate: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export interface InvoiceListItem extends Invoice, InvoiceTotals {
  company_name: string | null;
  items: InvoiceItem[];
}

export interface InvoiceDetail extends Invoice, InvoiceTotals {
  company: { id: number; name: string } | null;
  contact: { id: number; first_name: string; last_name: string; email: string | null } | null;
  items: InvoiceItem[];
}

export interface ContactDetail extends ContactWithCompany {
  deals: DealWithStage[];
  note_entries: Note[];
}

export interface CompanyDetail extends Company {
  contacts: Contact[];
  deals: DealWithStage[];
  note_entries: Note[];
}

export interface DashboardStats {
  totalContacts: number;
  totalCompanies: number;
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  openValue: number;
  wonValue: number;
  openTasks: number;
  invoiceOutstanding: number;
  invoicePaid: number;
  invoiceCount: number;
  pipelineName: string | null;
  stages: { name: string; type: StageType; count: number; value: number }[];
}

/** Minimal option lists for the selects inside the form dialogs. */
export interface CompanyOption {
  id: number;
  name: string;
}
export interface ContactOption {
  id: number;
  first_name: string;
  last_name: string;
}
export interface DealOption {
  id: number;
  name: string;
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageCount: number;
}

/** Result of a Server Action invoked from an event handler. */
export type ActionResult = { ok: true } | { ok: false; error: string };

/** State returned by form Server Actions (used with useActionState). */
export interface FormState {
  ok: boolean;
  /** Error summary to show the user. */
  error?: string;
  /** Per-field validation messages. */
  fieldErrors?: Record<string, string[] | undefined>;
  /** Submitted values, echoed back so the form keeps them after an error. */
  values?: Record<string, string>;
  /** Extra data for the caller on success (e.g. the slug to navigate to). */
  data?: Record<string, string | number>;
}
