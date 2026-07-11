# Cycle WA - Unavailable Order Server Guard

Date: 2026-07-11

## Scope

Close the Local MVP parity gap where the mobile ticket could visibly disable an unavailable market, but a forced backend order request did not have a stable canonical `MARKET_UNAVAILABLE` guard before matching.

Path protected:

Event Detail -> unavailable/suspended line market -> Trade Ticket disabled state -> forced `/api/orders` request -> stored failed order response.

Out of scope:

- Order book UI
- Chat/social/live stats
- Provider import breadth
- Deposit/withdraw

## Acceptance Criteria

P0:

- A non-`LIVE`, canceled, unlisted, inactive, or untradable market/outcome is rejected by canonical order submission before matching.
- The API response uses stable code `MARKET_UNAVAILABLE`.
- The failed request is stored in `ApiOrderRequest` with `status=FAILED`, `responseStatus=409`, and `errorCode=MARKET_UNAVAILABLE`.
- No `Order` row is created for the unavailable market.
- S23 unavailable ticket proof still shows the disabled UI state.

P1:

- Add broader route proof for every unavailable family/status when production-like provider examples exist.

## Implementation

- Added `assertMarketAcceptsOrders()` in `src/server/services/canonicalOrderSubmission.ts`.
- Added integration coverage in `src/server/services/__tests__/canonical_order_submission.phase5.test.ts`.
- No mobile UI component was changed.

## Evidence

- Backend test: `npx jest src/server/services/__tests__/canonical_order_submission.phase5.test.ts --runInBand`
- S23 proof:
  - screenshot: `docs/mobile/screenshots/cycle-WA-unavailable-order-server-guard/cycle-VX-unavailable-ticket.png`
  - XML: `docs/mobile/harness/cycle-WA-unavailable-order-server-guard/cycle-VX-unavailable-ticket.xml`

Device:

- `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- `SM-S911U1`

## Audit Result

Gate status: Pass

Unresolved P0: none for unavailable local/mobile order rejection.

Remaining P1:

- Real provider-backed line markets remain unavailable from Polymarket Gamma for the checked World Cup event.
