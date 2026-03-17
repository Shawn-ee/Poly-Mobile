export const backoffMs = (attempt: number, base = 250, max = 10_000) => {
  const power = Math.max(0, attempt - 1);
  return Math.min(max, base * 2 ** power);
};

type SourceLike = {
  close: () => void;
  onopen: ((this: unknown, ev: Event) => unknown) | null;
  onerror: ((this: unknown, ev: Event) => unknown) | null;
};

export const connectSseWithBackoff = (params: {
  create: () => SourceLike;
  onConnect?: () => void;
  onDisconnect?: () => void;
}) => {
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let source: SourceLike | null = null;
  let closed = false;

  const open = () => {
    if (closed) return;
    source = params.create();
    source.onopen = () => {
      attempt = 0;
      params.onConnect?.();
    };
    source.onerror = () => {
      params.onDisconnect?.();
      source?.close();
      source = null;
      attempt += 1;
      const wait = backoffMs(attempt);
      timer = setTimeout(open, wait);
    };
  };

  open();

  return () => {
    closed = true;
    if (timer) clearTimeout(timer);
    source?.close();
  };
};
