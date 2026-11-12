"use client";

import { useRouter } from "next/navigation";
import { createContext, startTransition, useContext, useEffect, useState } from "react";

const LiveContext = createContext({ connected: false });

/**
 * Keeps one Server-Sent Events connection to /api/events open for the whole
 * signed-in session. Whenever anyone changes something, the server sends a
 * small event and the router re-renders the Server Components on screen with
 * fresh data (router.refresh()). Client state, open dialogs and form input are
 * preserved.
 */
export function LiveProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let source: EventSource | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    function connect() {
      source = new EventSource("/api/events");
      source.onopen = () => setConnected(true);
      source.onerror = () => {
        setConnected(false);
        // The browser reconnects on its own after a dropped connection. It
        // gives up when the server answers with an error, so retry by hand.
        if (source?.readyState === EventSource.CLOSED && !stopped) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };
      source.addEventListener("change", () => {
        // A single write usually emits two events (the change + its activity).
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => startTransition(() => router.refresh()), 80);
      });
    }

    connect();
    return () => {
      stopped = true;
      clearTimeout(refreshTimer);
      clearTimeout(reconnectTimer);
      source?.close();
    };
  }, [router]);

  return <LiveContext value={{ connected }}>{children}</LiveContext>;
}

/** Whether the live connection is up. */
export function useLive() {
  return useContext(LiveContext);
}
