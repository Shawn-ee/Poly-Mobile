# Legacy Routes

Phase 1 adds a canonical external API layer without removing the current UI-oriented routes.

Canonical routes added:
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `DELETE /api/orders/:id`
- `GET /api/fills`
- `GET /api/account/balance`
- `GET /api/account/positions`
- `GET /api/account/ledger`
- `GET /api/markets/:id/quote`

Current overlapping legacy routes left in place:
- `POST /api/orderbook/place` -> use `POST /api/orders`
- `POST /api/orderbook/cancel` -> use `DELETE /api/orders/:id`
- `GET /api/orderbook/:marketId/orders` -> use `GET /api/orders?marketId=...`
- `POST /api/orderbook/:marketId/orders/place` -> use `POST /api/orders`
- `POST /api/orderbook/:marketId/orders/cancel` -> use `DELETE /api/orders/:id`
- `GET /api/wallet/balance` -> use `GET /api/account/balance`
- `GET /api/portfolio` -> use `GET /api/account/balance` and `GET /api/account/positions`

Notes:
- Legacy routes are intentionally preserved during Phase 1 to avoid breaking the UI.
- New canonical routes return machine-readable error envelopes and serialize monetary values as strings.
- External agent integrations should target the canonical routes only.
- The authoritative bot contract is documented in [docs/AGENT_API_V2.md](/C:/Users/hecto/Desktop/projects/Poly/docs/AGENT_API_V2.md).
- Legacy orderbook and UI account routes are not a stable contract for autonomous agents.
- Canonical bot integrations should also use the canonical stream routes, not legacy UI polling or ad hoc orderbook endpoints.
- Bot integrations should migrate:
  - `POST /api/orderbook/place` -> `POST /api/orders`
  - `POST /api/orderbook/cancel` -> `DELETE /api/orders/:id`
  - `GET /api/orderbook/:marketId/orders` -> `GET /api/orders?marketId=...`
  - `GET /api/wallet/balance` -> `GET /api/account/balance`
  - `GET /api/portfolio` -> `GET /api/account/balance` and `GET /api/account/positions`
  - market/account event consumption -> canonical SSE routes under `/api/stream/**`
