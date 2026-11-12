"use client";

import { useEffect } from "react";

import { toast } from "@/components/ui/sonner";

const COOKIE = "nimbus_flash";

/** Shows the one-shot "Welcome back!" toast the login action leaves in a short-lived cookie. */
export function FlashToast() {
  useEffect(() => {
    if (!document.cookie.split("; ").some((c) => c === `${COOKIE}=welcome`)) return;
    document.cookie = `${COOKIE}=; path=/; max-age=0`;
    toast.success("Welcome back!");
  }, []);
  return null;
}
