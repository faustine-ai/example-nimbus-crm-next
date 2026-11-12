import { subscribe } from "@/lib/events";
import { readSession } from "@/lib/session";

/**
 * Live feed: a Server-Sent Events stream.
 *
 * This is the one Route Handler in the app. Server Actions cannot push to
 * other browsers, so this endpoint keeps a response open and writes one small
 * event per change ({ type, id }). It carries no CRM data: on each event the
 * browser asks the router to re-render the Server Components on screen.
 */
export async function GET(request: Request) {
  const session = await readSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };

      const unsubscribe = subscribe((event) => send(`event: change\ndata: ${JSON.stringify(event)}\n\n`));
      // Comment lines keep proxies from closing an idle connection.
      const heartbeat = setInterval(() => send(": ping\n\n"), 25_000);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      request.signal.addEventListener("abort", cleanup);

      send("retry: 2000\n\n");
      send(`event: connected\ndata: {"ok":true}\n\n`);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
