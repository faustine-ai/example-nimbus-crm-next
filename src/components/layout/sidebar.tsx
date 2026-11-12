"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { NAV, isActive } from "./nav";

/** Brand, navigation and footer of the sidebar. `pathname` decides the active item. */
export function SidebarView({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
          N
        </div>
        <span className="text-lg font-bold tracking-tight">Nimbus CRM</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = pathname !== null && isActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 text-xs text-muted-foreground">v1.0 · Demo workspace</div>
    </div>
  );
}

/** The sidebar with the current route highlighted. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <SidebarView pathname={pathname} onNavigate={onNavigate} />;
}

/** Title of the current section, shown in the top bar. */
export function TopbarTitle() {
  const pathname = usePathname();
  const current = NAV.find((item) => isActive(item, pathname));
  return <h2 className="text-base font-semibold">{current?.label || "Dashboard"}</h2>;
}
