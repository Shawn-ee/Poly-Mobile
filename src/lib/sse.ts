import { NextRequest } from "next/server";

export type SseEventLike = {
  id?: string | number | null;
  sequence?: string | number | null;
  type?: string | null;
};

export const encodeSseEvent = (params: {
  id?: string | number | null;
  event?: string | null;
  data: unknown;
}) => {
  const lines: string[] = [];

  if (params.id !== undefined && params.id !== null) {
    lines.push(`id: ${params.id}`);
  }
  if (params.event) {
    lines.push(`event: ${params.event}`);
  }
  lines.push(`data: ${JSON.stringify(params.data)}`);
  return `${lines.join("\n")}\n\n`;
};

export const parseLastEventId = (request: NextRequest) => {
  const raw = request.headers.get("last-event-id") ?? request.headers.get("Last-Event-ID");
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const createCanonicalSseStream = <
  TEvent extends SseEventLike,
  TBootstrapEvent extends SseEventLike = TEvent,
>(params: {
  request: NextRequest;
  heartbeatMs?: number;
  pollIntervalMs: number;
  getBootstrapEvent: () => Promise<TBootstrapEvent | null>;
  getReplayEvents: (lastEventId: string) => Promise<TEvent[]>;
  subscribe: (listener: (event: TEvent) => void) => () => void;
}) => {
  const encoder = new TextEncoder();
  const heartbeatMs = params.heartbeatMs ?? 15_000;
  const initialLastEventId = parseLastEventId(params.request);

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let lastSeenId = initialLastEventId;

      const write = (event: SseEventLike) => {
        const eventId = event.id ?? event.sequence ?? null;
        if (eventId !== null && lastSeenId !== null) {
          try {
            if (BigInt(eventId) <= BigInt(lastSeenId)) {
              return;
            }
          } catch {
            return;
          }
        }

        if (eventId !== null) {
          lastSeenId = String(eventId);
        }
        controller.enqueue(
          encoder.encode(
            encodeSseEvent({
              id: eventId,
              event: event.type ?? "message",
              data: event,
            })
          )
        );
      };

      const emitReplay = async () => {
        if (!lastSeenId) {
          const bootstrap = await params.getBootstrapEvent();
          if (bootstrap) {
            write(bootstrap);
          }
          return;
        }

        const replay = await params.getReplayEvents(lastSeenId);
        for (const event of replay) {
          write(event);
        }
      };

      await emitReplay().catch(() => undefined);

      const unsubscribe = params.subscribe((event) => {
        if (!closed) {
          write(event);
        }
      });

      const poller = setInterval(() => {
        if (closed || !lastSeenId) {
          if (!closed && !lastSeenId) {
            emitReplay().catch(() => undefined);
          }
          return;
        }

        params
          .getReplayEvents(lastSeenId)
          .then((events) => {
            for (const event of events) {
              write(event);
            }
          })
          .catch(() => undefined);
      }, params.pollIntervalMs);

      const heartbeat = setInterval(() => {
        if (!closed) {
          controller.enqueue(encoder.encode(`:\n\n`));
        }
      }, heartbeatMs);

      const onAbort = () => {
        closed = true;
        clearInterval(heartbeat);
        clearInterval(poller);
        unsubscribe();
        controller.close();
      };

      params.request.signal.addEventListener("abort", onAbort);
    },
  });
};
