"use client";

import { useActionState } from "react";

import { toast } from "@/components/ui/sonner";
import type { FormState } from "@/lib/types";

const initialState: FormState = { ok: false };

/**
 * useActionState for the form dialogs: runs a form Server Action, shows a
 * toast with the outcome and calls `onSuccess` (usually: close the dialog).
 *
 * Returns `[state, formAction, pending]`. `state.values` holds the submitted
 * values after a failed submit so inputs can keep what the user typed.
 */
export function useFormAction(
  action: (prev: FormState, formData: FormData) => Promise<FormState>,
  { success, onSuccess }: { success: string; onSuccess?: (state: FormState) => void },
) {
  return useActionState(async (prev: FormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.ok) {
      toast.success(success);
      onSuccess?.(result);
    } else if (result.error) {
      toast.error(result.error);
    }
    return result;
  }, initialState);
}
