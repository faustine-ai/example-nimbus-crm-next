"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

import { Sidebar } from "./sidebar";

/** Hamburger button + slide-over sidebar for small screens. */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 border-r bg-card">
              <Sidebar onNavigate={() => setOpen(false)} />
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
