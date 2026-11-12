"use client";

import { cn } from "@/lib/utils";

import { useLive } from "./live-provider";

/** The "Live / Offline" dot in the top bar. */
export function LiveIndicator() {
  const { connected } = useLive();
  return (
    <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
      <span className={cn("h-2 w-2 rounded-full", connected ? "bg-emerald-500" : "bg-slate-300")} />
      {connected ? "Live" : "Offline"}
    </span>
  );
}

/** The "Real-time connection" row on the settings page. */
export function LiveStatus() {
  const { connected } = useLive();
  return (
    <span className="flex items-center gap-2 font-medium">
      <span className={cn("h-2 w-2 rounded-full", connected ? "bg-emerald-500" : "bg-slate-300")} />
      {connected ? "Connected" : "Disconnected"}
    </span>
  );
}
