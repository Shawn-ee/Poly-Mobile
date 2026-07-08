# Cycle JS - Cashout Route Sell Safety

Status: Pass for focused backend/data-contract scope.

Scope:

- Server-mode cashout/sell safety through the canonical order submission path backing `POST /api/orders`.
- Mobile close-position guard for non-finite share values.
- No Portfolio redesign, orderbook, chat, live stats, deposits, or withdraw changes.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| No-position cashout/sell is rejected by backend | Pass | `docs/mobile/harness/cycle-JS-cashout-route-sell-safety/cycle-JS-cashout-route-sell-safety.json` shows a no-position `SELL` rejected with `409` and `INSUFFICIENT_BALANCE`. |
| Oversell/cashout beyond available shares is rejected by backend | Pass | Same proof shows a `SELL` for `3` shares against `2` owned shares rejected with `409`, `INSUFFICIENT_BALANCE`, and no order created. |
| Failed sell attempts are stored for auditability | Pass | Same proof and `src/server/services/__tests__/canonical_order_submission.phase5.test.ts` show failed `ApiOrderRequest` rows with `responseStatus=409`. |
| Valid full-position sell can proceed | Pass | Same proof shows a valid `SELL` for the full `2` shares returns `200` and an open sell order with reserved shares. |
| Mobile does not submit non-finite cashout shares | Pass | `mobile/src/__tests__/positionCloseService.test.ts` covers `NaN` and `Infinity` shares as unavailable and verifies no backend call for invalid server cashout. |

## Change Notes

- `src/lib/canonicalApi.ts` now maps `Insufficient available shares` to `INSUFFICIENT_BALANCE` instead of generic `CONFLICT`.
- `mobile/src/services/positionCloseService.ts` now requires finite positive shares before formatting full-position cashout size.
- The proof uses existing public orderbook collateral minting for valid shares instead of hand-seeded unbalanced positions.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/positionCloseService.test.ts` - pass, 12 tests.
- `npx jest --runInBand --detectOpenHandles src/server/services/__tests__/canonical_order_submission.phase5.test.ts` - pass, 11 tests.
- `npx tsx scripts/prove_mobile_cashout_route_sell_safety.ts` - pass.

## Remaining P1

- Full external HTTP `POST /api/orders` auth-stack smoke can still be added later when the harness needs end-to-end API-key proof. Cycle JS proves the canonical route submission service that the route calls and the stored response shape consumed by mobile.
