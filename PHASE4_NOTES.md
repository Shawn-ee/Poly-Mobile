# Phase 4 Notes

## Canonical Bot Routes

Bot-facing canonical routes remain:
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `DELETE /api/orders/:id`
- `GET /api/fills`
- `GET /api/account/balance`
- `GET /api/account/positions`
- `GET /api/account/ledger`

Public market discovery routes stay public:
- `GET /api/markets`
- `GET /api/markets/:id`
- `GET /api/markets/:id/quote`

## API Key Controls

API keys now support optional per-credential controls:
- `isDisabled`
- `readOnly`
- `maxOrderSize`
- `maxOrderNotional`
- `maxOpenOrders`
- `maxDailySubmittedNotional`
- `allowedMarketIds`

Write enforcement currently applies to:
- `POST /api/orders`
- `DELETE /api/orders/:id`

Daily submitted notional uses a UTC day window and counts successful canonical order submissions for that API key.

## Rate Limits

Canonical bot routes now use API-key-aware rate limiting.

Current implementation is intentionally isolated and additive, but it is in-memory only in this phase:
- safe for single-process deployments
- not multi-instance safe
- should be replaced with a shared store before horizontally scaled bot traffic

Session-authenticated browser traffic keeps the existing behavior.

## Audit Trail

Successful canonical requests authenticated with API keys now write a lightweight usage log with:
- `apiCredentialId`
- `userId`
- `method`
- `routeId`
- `path`
- `responseStatus`
- `resultCode`
- optional `orderId`

Raw API secrets are never logged.

## API Key Management

Session-authenticated users can now manage key policy with:
- `PATCH /api/account/api-keys/:id`

Supported updates:
- `name`
- `isDisabled`
- `readOnly`
- `maxOrderSize`
- `maxOrderNotional`
- `maxOpenOrders`
- `maxDailySubmittedNotional`
- `allowedMarketIds`
