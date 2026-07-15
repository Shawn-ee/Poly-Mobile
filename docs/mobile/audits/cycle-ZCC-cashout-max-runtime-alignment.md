# Cycle ZCC - Cashout Max Runtime Alignment

## Scope

Fix and validate the real cashout ticket path so Portfolio Cash out cannot use wallet-sized or stale estimate-sized values for Max.

This cycle is focused on the internal tester mobile trading flow for the current Odds API event (`Spain vs. France`). It does not add new markets, change schemas, call provider APIs, expose order book UI, or broaden runtime/operator infrastructure.

## Issue

Manual S23 testing showed Portfolio -> Cash out -> Max could still display a large dollar/balance-like value, around `$9000`, then fail order submission.

The source path already built a close-position ticket, but the mobile app trusted the backend cashout estimate `quantity` over the position row's owned shares. If the estimate response is stale, mismatched, or unexpectedly large, the ticket's close-position `availableShares` can exceed the position the user actually tapped.

## Changes

- Added `resolveClosePositionAvailableShares(position, serverEstimateShares)` in `mobile/src/services/positionCloseService.ts`.
- Updated `mobile/App.tsx` so close-position tickets use the smaller of:
  - Portfolio-owned position shares, and
  - backend cashout estimate quantity.
- Kept invalid or missing estimate fallback to Portfolio-owned shares.
- Updated cashout contract tests to assert the new guarded path.
- Updated `scripts/prove_mobile_odds_api_s23_visible_flow.ps1` so the S23 proof fails if cashout available shares are wallet-sized/stale-sized. The one-event proof now has `MaxExpectedCashoutShares` and records the observed cashout shares in the redacted summary.
- Hardened `scripts/manage_holiwyn_internal_tester_runtime.ps1` so replacing an external Expo listener tolerates a Windows `taskkill` child-process warning when the original port owner is no longer running or no longer owns the port.
- Added `mobile/scripts/connect-s23-wireless-debug.ps1` and `npm --prefix mobile run connect:s23 -- -Address <ip:port>` so a fresh S23 wireless-debugging endpoint can be connected and verified without touching app/runtime logic.

## Frontend Path

1. `Portfolio.tsx` Cash out button calls `openPositionTrade(position, "sell")`.
2. `App.tsx` loads optional cashout estimate and quote data.
3. `App.tsx` resolves close-position shares with `resolveClosePositionAvailableShares`.
4. `TradeTicket.tsx` receives:
   - `sourcePositionId`
   - `side="sell"`
   - `closePosition.availableShares`
   - `closePosition.sellPrice`
5. `TradeTicket.tsx` enters close-position mode, hides the Yes/No selector, labels amount as shares, and Max uses close-position shares.
6. Submit sends `side=SELL`, owned `marketId`, owned `outcomeId`, explicit `sizeShares`, and close price.

## Backend/API Contract

- `GET /api/portfolio` remains the source of visible owned position shares.
- `GET /api/portfolio/cash-out/estimate?marketId=&outcomeId=` remains an optional estimate source for close price and position quantity.
- `POST /api/orders` remains the SELL submission route.
- Mobile must not allow the estimate route to inflate sellable quantity above the currently visible owned position shares.

## Validation

Passed:

- Root typecheck: `npx tsc --noEmit --pretty false --incremental false`
- Mobile typecheck: `npm --prefix mobile run typecheck`
- Focused mobile cashout tests:
  - `mobile/src/__tests__/positionCloseService.test.ts`
  - `mobile/src/__tests__/cashoutGenericSellOnlyContract.test.ts`
  - `mobile/src/__tests__/portfolioPositionTradeContract.test.ts`
  - `mobile/src/__tests__/orderService.test.ts`
- Backend cashout tests:
  - `src/__tests__/cash-out.service.test.ts`
  - `src/__tests__/portfolio.cash-out-estimate.route.test.ts`
- Root CI suite: `npm run test:ci`
- Runtime status:
  - backend healthy on `3002`
  - Postgres healthy
  - Expo manager-owned and server-mode verified on `8081`
  - supervisor running
  - result poller running
  - no quota-spending provider loop running
- S23 proof script parse check: passed.
- S23 reconnect helper parse check: passed.
- Current runtime check at `2026-07-14T16:12:13Z`: backend healthy on `3002`, Postgres healthy, Expo manager-owned and server-mode verified on `8081`, supervisor running, result poller running, no quota-spending provider loop active.
- Follow-up validation at `2026-07-14T16:15Z`: root typecheck passed, focused mobile cashout tests passed, focused backend/cashout/proof-contract tests passed, and runtime status still passed with S23 disconnected.
- Full root CI validation at `2026-07-14T16:16Z`: `npm run test:ci` passed with 35 suites and 179 tests. ADB still listed no devices and no mDNS wireless-debugging service.
- Backend route guard validation after S23 failure: `src/__tests__/public.events.no-leak.test.ts`, root typecheck, and mobile typecheck passed after legacy event routes were changed to serialize only live markets.
- Mobile closed-market guard validation: `npm --prefix mobile run typecheck` passed, and `npx vitest --config vitest.config.ts run mobile/src/__tests__/eventMarketCatalogService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts` passed with 2 files and 16 tests.
- S23 proof at `2026-07-15T05:03Z`: passed on Samsung S23 model `SM-S911U1` using stable ADB device id `172.16.200.27:42495` after the preferred mDNS alias intermittently hung at `getprop`.
  - Summary: `docs/mobile/harness/cycle-ZCC-cashout-max-runtime-alignment/cycle-ZCC-odds-api-s23-visible-flow.json`
  - Screenshots: `docs/mobile/screenshots/cycle-ZCC-cashout-max-runtime-alignment/`
  - XML evidence: `docs/mobile/harness/cycle-ZCC-cashout-max-runtime-alignment/`
  - Observed cashout shares after Max: `43.1`, below proof bound `200`.
  - Cashout ticket used live market `cc4f4d02-4acc-48a8-aaa5-437652454c3c`, not the closed duplicate `78ea76f1-fc8f-419b-ac21-2554d79093f6`.
  - Cashout ticket showed shares, hid the Yes/No selector, submitted SELL, and Portfolio History updated.

Additional runtime fixes made during S23 proof:

- `src/app/api/events/[slug]/route.ts` and `src/app/api/events/route.ts` now serialize only live markets to mobile-facing event payloads while preserving closed-market counts for diagnostics.
- `mobile/src/adapters/worldCupAdapter.ts` and `mobile/src/services/eventMarketCatalogService.ts` now drop closed/resolved/suspended backend markets before Event Detail can render or tap them.
- `scripts/manage_holiwyn_internal_tester_runtime.ps1` can load a backend env file in-process and start local proof backend with explicit `-EnableInternalTradingBeta` without changing default safe runtime settings.

## Acceptance Result

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| ZCC-P0-01 | P0 | Cashout Max uses owned position shares, not wallet balance. | Pass |
| ZCC-P0-02 | P0 | Backend estimate cannot inflate Max above owned shares. | Pass |
| ZCC-P0-03 | P0 | Close-position ticket hides Yes/No selector. | Pass |
| ZCC-P0-04 | P0 | Oversell remains blocked before submit. | Pass |
| ZCC-P0-05 | P0 | Runtime serves verified server-mode Expo bundle. | Pass |
| ZCC-P0-06 | P0 | Real S23 proof confirms no `$9000` Max value. | Pass |
| ZCC-P0-07 | P0 | Fresh S23 reconnect path exists for proof recovery. | Pass |
| ZCC-P0-08 | P0 | Closed provider duplicate market cannot be selected from Event Detail. | Pass |

## Remaining Gaps

- P0: none remaining for this cycle.
- P1: DB-backed canonical order submission test was not rerun after S23 proof because `DATABASE_URL` is absent in the worktree shell. Earlier root CI passed before the final mobile guard; final root validation is still required before commit.
- P1: proof still uses Expo Go; development build/APK remains future proof-stability work.
