# Cycle KS - Event Detail Line Options UI Wiring

Status: Pass for focused backend/data-contract scope.

Scope:

- Visible Event Detail/Game Lines line and period chips.
- Backend-owned compact `markets[]` from event hydration/catalog routes.
- Minimal mobile event type contract needed for clean backend rule fields.
- No visual redesign, order book, chat, live stats product work, deposit, or withdraw changes.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Event Detail line chips are backend-driven | Pass | `EventDetail` now derives Spread/Totals period and line options with `periodOptionsFor(event.markets, ...)` and `lineOptionsFor(event.markets, ...)`. |
| Unsupported line/period chips are not invented | Pass | Static spread/totals chip arrays were removed from the committed component path; empty or missing backend options stay empty. |
| Selected backend line market uses the shared matcher | Pass | Spread, Totals, and Team Total backend market selection uses `matchingBackendLineMarket(event.markets, ...)`. |
| Game-rule event fields are committed in mobile types | Pass | `worldCup.ts` now declares `EventMarketProfile`, `EventResultMode`, `EventMarketType`, `event.marketProfile`, `event.resultMode`, `event.gameRules`, and `event.supportedMarketTypes` so clean typecheck covers the route contract. |

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/marketLineOptionsService.test.ts mobile/src/__tests__/eventMarketCatalogService.test.ts mobile/src/__tests__/api.test.ts` - pass, 21 tests.
- `npm run typecheck --prefix mobile` - pass.
- `npx tsx scripts/prove_mobile_line_options_contract.ts` - pass.
- `npx tsx scripts/prove_mobile_event_detail_line_options_ui_wiring.ts` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/check-mobile-audit-gate.ps1 -Cycle "Cycle KS"` - pass.

## Remaining P1

- Optional Android visual proof if visual proof becomes required again.
- Production real-provider breadth remains under provider mapping/provider refresh lanes.
