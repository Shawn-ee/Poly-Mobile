# Cycle LT Home To Portfolio Route Journey

Date: 2026-07-08

## Scope

Prove the Local MVP server-backed user journey using the same route sequence the mobile app should follow:

Home -> Event Detail -> line market -> simple Buy ticket -> fake-token/server-backed order -> Portfolio/history.

Out of scope: order book UI, chat, live stats, social features, schema migrations, and visual UI changes.

## Implementation

Added `scripts/prove_mobile_mvp_home_to_portfolio_journey.ts`.

The proof:

1. Reads Home through `GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10`.
2. Selects an event with:
   - `regulationWinner.status=provider-backed`
   - `lineMarkets.status=contract-fixture`
3. Reads Event Detail through `GET /api/mobile/events/:slug/live-detail`.
4. Selects a route-visible contract-fixture line market.
5. Creates deterministic maker liquidity.
6. Submits a fake-token BUY through `/api/orders`.
7. Verifies the filled position in `/api/portfolio`.
8. Verifies the recent trade in `/api/portfolio/history`.
9. Verifies line/source identity is preserved through all steps.

## Acceptance Criteria

| Criterion ID | Priority | Result | Evidence |
| --- | --- | --- | --- |
| LT-FLOW-P0-01 | P0 | Pass | Home route selected `switzerland-vs-colombia` with provider-backed winner and contract-fixture lines. |
| LT-FLOW-P0-02 | P0 | Pass | Event Detail route kept the same source summary. |
| LT-FLOW-P0-03 | P0 | Pass | Selected Spread line `Colombia +1.5` carried market/outcome/source/token identity. |
| LT-FLOW-P0-04 | P0 | Pass | `/api/orders` filled the fake-token BUY. |
| LT-FLOW-P0-05 | P0 | Pass | `/api/portfolio` returned the filled position and `contract-fixture` line summary. |
| LT-FLOW-P0-06 | P0 | Pass | `/api/portfolio/history` returned the recent trade and `contract-fixture` line summary. |
| LT-FLOW-P0-07 | P0 | Partial | S23 is visible again, but this backend route cycle did not run mobile UI proof. |

## Evidence

- `scripts/prove_mobile_mvp_home_to_portfolio_journey.ts`
- `docs/mobile/harness/cycle-LT-home-to-portfolio-route-journey/cycle-LT-home-to-portfolio-route-journey.json`

Validation:

- `npx tsx scripts/prove_mobile_mvp_home_to_portfolio_journey.ts --cycle=LT --baseUrl=http://127.0.0.1:3002 --summaryPath=docs/mobile/harness/cycle-LT-home-to-portfolio-route-journey/cycle-LT-home-to-portfolio-route-journey.json`
- `npx tsc --noEmit --pretty false --skipLibCheck`
- `npm run test:jest -- src/__tests__/mobile-live-event-detail.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.history.route.test.ts src/__tests__/mobile-event-market-rules-contract.test.ts`

Device note:

- ADB sees Samsung S23 `SM_S911U1` as `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Android UI proof should be the next visible Audit Gate cycle.

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| S23 visible proof for the same Home -> Event Detail -> line ticket -> Portfolio/history flow | P0 | Next |
| Real provider-backed line markets | P1 | Open; selected Gamma event exposes none |
| Mobile UI consumption of source summaries | P1 | Open |
