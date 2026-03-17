# Phase 3 Notes

## Bot Authentication

Canonical agent-facing routes now support either:
- browser session auth via the existing session cookie, or
- API key auth via `Authorization: Bearer <keyId>.<secret>`

Examples:
- `Authorization: Bearer pk_live_abcd1234.secretvalue`

## Auth Precedence

If both session auth and API key auth are present:
- API key auth takes precedence.
- If the API key is invalid or revoked, the request fails and does not fall back to session auth.

This keeps explicit bot credentials unambiguous.

## Scope Model

Supported API key scopes:
- `orders:read`
- `orders:write`
- `fills:read`
- `account:read`
- `markets:read`

Current canonical route protection:
- `POST /api/orders` -> `orders:write`
- `GET /api/orders` -> `orders:read`
- `GET /api/orders/:id` -> `orders:read`
- `DELETE /api/orders/:id` -> `orders:write`
- `GET /api/fills` -> `fills:read`
- `GET /api/account/balance` -> `account:read`
- `GET /api/account/positions` -> `account:read`
- `GET /api/account/ledger` -> `account:read`

Public quote and public market discovery routes remain unchanged in this phase.

## API Key Management

Session-authenticated users can manage their own keys with:
- `POST /api/account/api-keys`
- `GET /api/account/api-keys`
- `DELETE /api/account/api-keys/:id`

Creation returns the full token once.
Listing returns metadata only.
Delete revokes the key and does not return the secret.
