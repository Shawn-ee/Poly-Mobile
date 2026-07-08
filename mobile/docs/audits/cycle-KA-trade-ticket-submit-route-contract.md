# Cycle KA - Trade Ticket Submit Route Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Mobile `submitTicketOrder()` server-mode submit path.
- Real HTTP `POST /api/orders` route with canonical auth and internal trading beta gate.
- Provider-backed accepting quote guard.
- Portfolio open-order hydration through `/api/portfolio`.
- No Trade Ticket visual redesign and no edits to dirty Trade Ticket/Event Detail UI files.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Mobile ticket submit reaches `POST /api/orders` in server mode | Pass | `docs/mobile/harness/cycle-KA-trade-ticket-submit-route-contract/cycle-KA-trade-ticket-submit-route-contract.json`. |
| Route requires internal trading gate before submission | Pass | KA proof passes the gate for an admin proof actor; `src/__tests__/orders.internal-trading-gate.route.test.ts` covers blocked and allowed paths. |
| Provider-backed market requires accepting quote data | Pass | KA proof seeds accepting provider quote snapshots and proves successful route submit. |
| Submitted order appears in Portfolio open orders | Pass | KA proof reads `/api/portfolio` after submit and finds the new open order. |
| Selection identity survives submit and Portfolio hydration | Pass | KA proof verifies totals market/outcome/line/period/provider token identity in order result and Portfolio open order. |

## Change Notes

- Added a focused proof for the mobile Trade Ticket submit service using the real `POST /api/orders` route.
- The proof mimics `PolyApi.placeLimitOrder()` by adding `type=LIMIT`, a client order id, and idempotency key before route submission.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/api.test.ts` - pass.
- `npx jest --runInBand --detectOpenHandles src/__tests__/orders.internal-trading-gate.route.test.ts` - pass.
- `npx tsx scripts/prove_mobile_trade_ticket_submit_route_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle KA"` - pass.

## Remaining P1

- Android proof that the visible Trade Ticket submit gesture uses this HTTP route in server mode after dirty UI churn is reconciled.
- Broader provider-family submit breadth if future gates require it.
