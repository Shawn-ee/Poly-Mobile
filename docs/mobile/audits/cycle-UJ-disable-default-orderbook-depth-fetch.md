# Cycle UJ - Disable Default Orderbook Depth Fetch

Status: source/data-contract cleanup pass; no visible UI change.

## Scope

Keep the Local MVP retail flow focused on Home -> Event Detail -> line market -> simple ticket -> fake-token order -> Portfolio/history by preventing the default mobile Event Detail path from calling order-book depth routes.

Out of scope: order book UI parity, chat, live stats, backend schema changes, ticket redesign, provider market import, and visible layout polish.

## Reference Direction

Product steering says order book is not a primary user-facing MVP feature. Existing order-book backend/routes/tests can remain as internal infrastructure, but the default app path should not spend cycles or route calls on order-book breadth unless it directly supports ticket pricing or Portfolio lifecycle.

## Implementation

- Added `SHOW_ORDERBOOK_DEBUG` in `mobile/App.tsx`.
- Gated the automatic `loadMarketDepthState()` Event Detail effect behind `EXPO_PUBLIC_SHOW_ORDERBOOK=1`.
- Passed `requestMarketDepth` to `EventDetail` only when the same debug flag is enabled.
- Kept quote loading (`loadMarketQuotesById`) unchanged because quote/probability display supports the Local MVP ticket flow.
- Kept the existing internal order-book component code behind the existing `EventDetail` debug flag rather than deleting internal infrastructure.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| UJ-P0-01 | P0 | Default server-mode Event Detail must not fetch order-book depth. | Pass |
| UJ-P0-02 | P0 | Quote/probability refresh must remain available for ticket pricing. | Pass |
| UJ-P0-03 | P0 | Internal order-book debug path remains available only when explicitly enabled. | Pass |
| UJ-P0-04 | P0 | No backend route/schema/order changes are introduced. | Pass |

## Proof

- Source contract: `src/__tests__/mobile.local-mvp-orderbook-debug-gate.test.ts`.
- Android proof: not run. No device is attached and there is no visible UI change; the next visible Local MVP cycle must still use real Android proof.

## Remaining Gaps

- P1: Full S23 Local MVP journey reproof after the next visible change.
- P1: Real provider-backed current-match Spread/Totals/Team Total rows remain unavailable from the Polymarket-first scans.
