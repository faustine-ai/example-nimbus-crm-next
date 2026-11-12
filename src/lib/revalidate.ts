import "server-only";

import { revalidatePath } from "next/cache";

type Area = "dashboard" | "contacts" | "companies" | "deals" | "tasks" | "invoices";

// Every route that renders data of each area. CRM data is never cached on the
// server (it has to be fresh for every user), so this is about the *client*:
// revalidating a path re-renders it for the user who made the change and
// drops the copies the browser kept from earlier navigations.
const ROUTES: Record<Area, [path: string, type?: "page" | "layout"][]> = {
  dashboard: [["/"]],
  contacts: [["/contacts"], ["/contacts/[id]", "page"]],
  companies: [["/companies"], ["/companies/[id]", "page"]],
  deals: [["/deals/[slug]", "page"]],
  tasks: [["/tasks"]],
  invoices: [["/invoices"], ["/invoices/[id]", "page"]],
};

/** Revalidate every route that shows data of the given areas. */
export function revalidateAreas(...areas: Area[]) {
  for (const area of new Set(areas)) {
    for (const [path, type] of ROUTES[area]) {
      revalidatePath(path, type);
    }
  }
}
