import "server-only";

import { EventEmitter } from "node:events";

/**
 * In-process event hub behind the live feed.
 *
 * Server Actions publish an event after every write; the streaming route
 * handler (app/api/events/route.ts) forwards them to the connected browsers as
 * Server-Sent Events. Events only say *what changed*, never the data itself:
 * the browser reacts by re-rendering the Server Components on screen.
 */
export interface LiveEvent {
  /** e.g. "contact.created", "deal.updated", "activity.created". */
  type: string;
  /** Id of the affected record, when there is one. */
  id?: number;
}

const globalForEvents = globalThis as unknown as { __nimbusEvents?: EventEmitter };

function emitter() {
  if (!globalForEvents.__nimbusEvents) {
    globalForEvents.__nimbusEvents = new EventEmitter();
    globalForEvents.__nimbusEvents.setMaxListeners(0);
  }
  return globalForEvents.__nimbusEvents;
}

/** Broadcast an event to every connected client. */
export function publish(type: string, id?: number | bigint) {
  const event: LiveEvent = { type, ...(id == null ? {} : { id: Number(id) }) };
  emitter().emit("event", event);
}

/** Listen to all events. Returns an unsubscribe function. */
export function subscribe(listener: (event: LiveEvent) => void) {
  emitter().on("event", listener);
  return () => {
    emitter().off("event", listener);
  };
}
