# Cycle S23CASHOUTNOW2 - Spain vs. France Cashout Reproof

Date: 2026-07-13 local / 2026-07-14 UTC

Device: Samsung S23 `SM-S911U1`, adb `172.16.200.27:44029`

Scope: internal tester mobile trading flow for the backend-owned Odds API Spain vs. France event, with emphasis on Portfolio cashout closing an existing position instead of reopening a generic buy/sell ticket.

## Result

Pass.

Fresh S23 proof confirmed:

- Home shows the backend-owned Spain vs. France event.
- Event Detail loads backend markets and opens the selected totals line.
- Buy flow submits and reaches Portfolio.
- Portfolio Cash out opens close-position ticket mode.
- Cashout Max uses owned position shares only, not wallet balance.
- Cashout ticket hides the Yes/No selector.
- Cashout sell submits.
- Portfolio/history updates after the sell.

## Evidence

- Summary: `docs/mobile/harness/cycle-S23CASHOUTNOW2-spain-france-cashout/cycle-S23CASHOUTNOW2-odds-api-s23-visible-flow.json`
- Cashout ticket XML: `docs/mobile/harness/cycle-S23CASHOUTNOW2-spain-france-cashout/cycle-S23CASHOUTNOW2-cashout-ticket-ready.xml`
- Cashout ticket screenshot: `docs/mobile/screenshots/cycle-S23CASHOUTNOW2-spain-france-cashout/cycle-S23CASHOUTNOW2-cashout-ticket-ready.png`
- Portfolio history screenshot: `docs/mobile/screenshots/cycle-S23CASHOUTNOW2-spain-france-cashout/cycle-S23CASHOUTNOW2-portfolio-history.png`

Key XML markers from the S23 cashout ticket:

- `cashout-mode-active-true`
- `cashout-source-position-present`
- `cashout-ticket-side-sell`
- `cashout-effective-side-sell`
- `cashout-available-shares-46.300000`
- `cashout-sell-price-0.58`
- `cashout-max-owned-shares`
- `cashout-ticket-no-yes-no-selector`

The visible ticket displayed `46.3` with `SHARES`, showed `Odds 58% | 46.3 shares available`, and estimated proceeds as `$26.85`. This directly disproves the prior wallet-sized Max bug for the current S23 runtime path.

## Validation

- Backend health: pass, `GET /api/health` returned `200` with DB connected.
- Mobile typecheck: pass, `npm --prefix mobile run typecheck`.
- Root typecheck: pass, `npx tsc --noEmit --pretty false --incremental false`.
- Focused cashout/portfolio/backend tests:
  - `src/__tests__/cash-out.service.test.ts`: pass.
  - `src/__tests__/portfolio.open-orders.route.test.ts`: pass.
  - `src/__tests__/mobile.the-odds-api-single-event.contract.test.ts`: pass.
  - `src/server/services/__tests__/canonical_order_submission.phase5.test.ts`: pass after loading local `DATABASE_URL`.

## Remaining Gaps

- P0: none for the tested Spain vs. France local internal cashout path.
- P1: provider freshness can still age out in cached/no-quota runtime mode; use the live-provider runtime command only when fresh mobile odds are needed.
- P2: visual polish of the close-position ticket can continue later, but it is not blocking internal tester trading.
