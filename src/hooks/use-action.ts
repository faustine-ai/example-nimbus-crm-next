"use client";

import { useTransition } from "react";

import { toast } from "@/components/ui/sonner";
import type { ActionResult } from "@/lib/types";

/**
 * Run a Server Action from an event handler inside a transition, with a toast
 * for the outcome. Returns `[run, pending]`.
 */
export function useAction() {
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>, { success }: { success?: string } = {}) {
    startTransition(async () => {
      const result = await action();
      // An action that ends in redirect() never resolves to a result here.
      if (!result) return;
      if (result.ok) {
        if (success) toast.success(success);
      } else {
        toast.error(result.error);
      }
    });
  }

  return [run, pending] as const;
}
