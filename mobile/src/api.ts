import type { EventDetail, EventSummary, Market, Quote } from "./types";

const trimSlash = (value: string) => value.replace(/\/+$/, "");

export class PolyApi {
  baseUrl: string;
  apiKey: string;

  constructor(baseUrl: string, apiKey = "") {
    this.baseUrl = trimSlash(baseUrl || "http://127.0.0.1:3000");
    this.apiKey = apiKey.trim();
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/json");
    if (this.apiKey) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }
    if (init?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        payload?.error?.message ?? payload?.error ?? `Request failed with ${response.status}`;
      throw new Error(String(message));
    }
    return payload as T;
  }

  listWorldCupEvents(search = "") {
    const params = new URLSearchParams({
      category: "sports",
      sportKey: "soccer",
      leagueKey: "world_cup",
    });
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.set("search", "World Cup");
    }
    return this.request<{ events: EventSummary[] }>(`/api/events?${params.toString()}`);
  }

  getEvent(slug: string) {
    return this.request<EventDetail>(`/api/events/${encodeURIComponent(slug)}`);
  }

  getMarket(id: string) {
    return this.request<{ market: Market }>(`/api/markets/${encodeURIComponent(id)}`);
  }

  getMarketQuote(marketId: string, outcomeId?: string) {
    const params = new URLSearchParams();
    if (outcomeId) params.set("outcomeId", outcomeId);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return this.request<{ marketId: string; quotes: Quote[] }>(
      `/api/markets/${encodeURIComponent(marketId)}/quote${suffix}`,
    );
  }

  placeLimitOrder(input: {
    marketId: string;
    outcomeId: string;
    side: "BUY" | "SELL";
    price: string;
    size: string;
  }) {
    const clientOrderId = `mobile-${Date.now()}`;
    return this.request(`/api/orders`, {
      method: "POST",
      headers: {
        "Idempotency-Key": clientOrderId,
      },
      body: JSON.stringify({
        ...input,
        type: "LIMIT",
        clientOrderId,
      }),
    });
  }
}
