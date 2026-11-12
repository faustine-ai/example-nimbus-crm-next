import { Briefcase, Building2, CheckSquare, FileText, LayoutDashboard, Settings, Users } from "lucide-react";

export const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/deals", label: "Deals", icon: Briefcase },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function isActive(item: (typeof NAV)[number], pathname: string) {
  return "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
