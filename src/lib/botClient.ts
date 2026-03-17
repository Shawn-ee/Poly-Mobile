export type BotClientOptions = {
  baseUrl: string;
  apiToken: string;
  fetchImpl?: typeof fetch;
};

export type PlaceLimitOrderInput = {
  marketId: string;
  outcomeId: string;
  side: "BUY" | "SELL";
  type?: "LIMIT";
  price: string;
  size: string;
  clientOrderId?: string;
  idempotencyKey?: string;
};

export type QuoteResponse = {
  marketId: string;
  quotes: Array<{
    outcomeId: string;
    outcomeName: string;
    bestBid: string | null;
    bestAsk: string | null;
    midPrice: string | null;
    lastPrice: string | null;
    lastTradeAt: string | null;
  }>;
};

const buildUrl = (baseUrl: string, path: string, query?: Record<string, string | number | null | undefined>) => {
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
};

export const buildBotAuthHeaders = (params: {
  apiToken: string;
  idempotencyKey?: string | null;
}) => {
  const headers = new Headers({
    Authorization: `Bearer ${params.apiToken}`,
    Accept: "application/json",
  });

  if (params.idempotencyKey) {
    headers.set("Idempotency-Key", params.idempotencyKey);
  }

  return headers;
};

export class CanonicalBotClient {
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: BotClientOptions) {
    this.baseUrl = options.baseUrl;
    this.apiToken = options.apiToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getQuote(marketId: string, outcomeId?: string) {
    return this.request<QuoteResponse>(
      "GET",
      `/api/markets/${marketId}/quote`,
      undefined,
      outcomeId ? { outcomeId } : undefined
    );
  }

  async getOrders(params?: {
    marketId?: string;
    status?: string;
    cursor?: string;
    limit?: number;
  }) {
    return this.request("GET", "/api/orders", undefined, params);
  }

  async getBalance() {
    return this.request("GET", "/api/account/balance");
  }

  async placeLimitOrder(input: PlaceLimitOrderInput) {
    const idempotencyKey = input.idempotencyKey ?? input.clientOrderId ?? null;
    return this.request(
      "POST",
      "/api/orders",
      {
        marketId: input.marketId,
        outcomeId: input.outcomeId,
        side: input.side,
        type: "LIMIT",
        price: input.price,
        size: input.size,
        clientOrderId: input.clientOrderId,
      },
      undefined,
      idempotencyKey
    );
  }

  async cancelOrder(orderId: string) {
    return this.request("DELETE", `/api/orders/${orderId}`);
  }

  connectEventStream(path: string, params?: { lastEventId?: string | null; signal?: AbortSignal }) {
    const headers = buildBotAuthHeaders({ apiToken: this.apiToken });
    if (params?.lastEventId) {
      headers.set("Last-Event-ID", params.lastEventId);
    }

    return this.fetchImpl(buildUrl(this.baseUrl, path), {
      method: "GET",
      headers,
      signal: params?.signal,
    });
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | null | undefined>,
    idempotencyKey?: string | null
  ) {
    const response = await this.fetchImpl(buildUrl(this.baseUrl, path, query), {
      method,
      headers: (() => {
        const headers = buildBotAuthHeaders({
          apiToken: this.apiToken,
          idempotencyKey: idempotencyKey ?? undefined,
        });
        if (body) {
          headers.set("Content-Type", "application/json");
        }
        return headers;
      })(),
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw payload ?? new Error(`Request failed with status ${response.status}`);
    }

    return payload as T;
  }
}
