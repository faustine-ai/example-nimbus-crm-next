import { z } from "zod";

import {
  COMPANY_SIZES,
  CONTACT_STATUSES,
  INVOICE_STATUSES,
  NONE,
  NOTE_ENTITY_TYPES,
  STAGE_TYPES,
  TASK_PRIORITIES,
} from "@/lib/constants";
import type { FormState } from "@/lib/types";

// --- Field helpers -----------------------------------------------------------

const values = <T extends readonly { value: string }[]>(list: T) =>
  list.map((item) => item.value) as [T[number]["value"], ...T[number]["value"][]];

/** Trimmed text; "" becomes null. */
const optionalText = (max = 5000) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

/** A positive integer id; "", the "none" sentinel and null all mean "no record". */
const optionalId = z
  .union([z.string(), z.number(), z.null()])
  .transform((v) => (v === null || v === "" || v === NONE ? null : Number(v)))
  .refine((v) => v === null || (Number.isInteger(v) && v > 0), "Invalid record");

/** "YYYY-MM-DD" or empty. */
const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Invalid date")
  .transform((v) => (v === "" ? null : v));

/** A non-negative number; empty or invalid input counts as 0. */
const amount = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v) || 0)
  .refine((v) => v >= 0, "Must be zero or more");

export const idSchema = z.coerce.number().int().positive();

// --- Schemas -----------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email and password are required"),
  password: z.string().min(1, "Email and password are required"),
});

export const contactSchema = z.object({
  first_name: z.string().trim().min(1, "First name and last name are required").max(200),
  last_name: z.string().trim().min(1, "First name and last name are required").max(200),
  email: z
    .string()
    .trim()
    .max(320)
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+$/.test(v), "Enter a valid email address")
    .transform((v) => (v === "" ? null : v)),
  phone: optionalText(100),
  job_title: optionalText(200),
  company_id: optionalId,
  status: z.enum(values(CONTACT_STATUSES)).catch("lead"),
  notes: optionalText(),
});

export const companySchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(200),
  website: optionalText(500),
  industry: optionalText(200),
  size: z
    .string()
    .transform((v) => (v === "" || v === NONE ? null : v))
    .refine((v) => v === null || (COMPANY_SIZES as readonly string[]).includes(v), "Invalid size"),
  location: optionalText(200),
  notes: optionalText(),
});

export const dealSchema = z.object({
  name: z.string().trim().min(1, "Deal name is required").max(200),
  company_id: optionalId,
  contact_id: optionalId,
  value: amount,
  stage_id: optionalId,
  close_date: optionalDate,
  notes: optionalText(),
});

export const pipelineSchema = z.object({
  name: z.string().trim().min(1, "Pipeline name is required").max(200),
});

export const stageSchema = z.object({
  name: z.string().trim().min(1, "Column name is required").max(200),
  type: z.enum(values(STAGE_TYPES)).catch("open"),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(500),
  description: optionalText(),
  due_date: optionalDate,
  priority: z.enum(values(TASK_PRIORITIES)).catch("medium"),
  entity_type: z
    .string()
    .transform((v) => (v === "" || v === NONE ? null : v))
    .refine((v) => v === null || (NOTE_ENTITY_TYPES as readonly string[]).includes(v), "Invalid record type"),
  entity_id: optionalId,
});

export const invoiceStatusSchema = z.enum(values(INVOICE_STATUSES), "Invalid status");

export const invoiceSchema = z.object({
  number: z.string().trim().max(50),
  company_id: optionalId,
  contact_id: optionalId,
  status: invoiceStatusSchema.catch("draft"),
  issue_date: optionalDate,
  due_date: optionalDate,
  tax_rate: amount,
  notes: optionalText(),
  items: z
    .array(
      z.object({
        description: z.string().trim().max(500),
        quantity: amount,
        unit_price: amount,
      }),
    )
    // Lines without a description are dropped, like blank rows in the form.
    .transform((items) => items.filter((it) => it.description !== ""))
    .refine((items) => items.length > 0, "Add at least one line item"),
});

export const noteSchema = z.object({
  body: z.string().trim().min(1, "Write something first").max(5000),
  entity_type: z.enum(NOTE_ENTITY_TYPES, "Invalid entity_type"),
  entity_id: idSchema,
});

// --- Form state helpers ------------------------------------------------------

/** Text fields of a submitted form, echoed back so the inputs keep their values after an error. */
export function formValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && key !== "password" && !key.startsWith("$")) out[key] = value;
  }
  return out;
}

/** Build the error state for a form action from a failed zod parse. */
export function validationError(error: z.ZodError, formData: FormData): FormState {
  const fieldErrors = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const first = error.issues[0]?.message || "Please check the form and try again.";
  return { ok: false, error: first, fieldErrors, values: formValues(formData) };
}

/** Build an error state for a form action. */
export function formError(message: string, formData: FormData): FormState {
  return { ok: false, error: message, values: formValues(formData) };
}
