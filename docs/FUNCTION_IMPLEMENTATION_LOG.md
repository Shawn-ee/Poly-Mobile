# Function Implementation Log

## Cycle FM - Local MVP Ticket Clarity

- Feature/page: Buy/Sell trade ticket in the Local MVP flow.
- Frontend components touched: `src/components/TradeTicket.tsx`.
- Important functions/services touched: no backend/provider service changes; the ticket still calls `placeOrder(amount, side, contractSide)` and the app-level order path still uses `submitTicketOrder`.
- User interactions supported: selected outcome opens the ticket, user selects Yes/No, enters amount or presets, reviews market type/line/period/price/shares/payout, then uses the swipe-style submit control.
- State transitions: `ticket` open state remains unchanged; `amount`, `side`, `activeContractSide`, `slippage`, and `showDetails` remain local ticket state. The new visible review is derived from existing ticket state and does not create a second source of order truth.
- Known limitations: Android visual proof must confirm the review card fits on the physical tablet viewport and remains readable for long line labels.

## Cycle FN - Local MVP Submit To Portfolio Proof

- Feature/page: Event Detail spread line ticket through fake-token submit into Portfolio/history.
- Frontend components touched: no UI component changed in this cycle; `scripts/smoke.ps1` proof expectations were tightened for the existing ticket and Portfolio flow.
- Important functions/services touched: no backend/provider service changes. The flow continues through `TradeTicket -> App.placeOrder -> submitTicketOrder -> Portfolio`.
- User interactions supported: user selects the `MEX -2.5 1H` spread line, opens the ticket, enters 25 USDT with presets, reviews price/shares/payout, submits with the swipe-style control, and lands on Portfolio.
- State transitions: `ticket` closes, `selectedEvent` clears, `mainTab` becomes `portfolio`, fake balance decreases by 25 USDT, one position is added, `latestOrder` is set, and recent activity receives a filled buy activity.
- Known limitations: this cycle proves mock/fake-token mode only. Server-backed order and portfolio sync remain covered by separate server-mode cycles.

## Cycle FO - Polymarket-Like Place Order Sheet

- Feature/page: place order ticket sheet for Event Detail markets.
- Frontend components touched: `src/components/TradeTicket.tsx`.
- Important functions/services touched: no backend/provider service changes. `submitTicketOrder` and Portfolio handoff remain unchanged.
- User interactions supported: close/settings, selected event/outcome header, large amount display, compact Yes/No toggle, odds/balance line, +5/+10/Max presets, sparse numeric keypad, and blue swipe-up submit area.
- State transitions: unchanged from the existing ticket flow. The visible order review card was removed from the user-facing layout, but contract-shaped line/period/shares/payout identity remains in the accessibility hierarchy for proof and downstream Portfolio handoff.
- Known limitations: the current blue submit area is a flat color instead of Polymarket's exact blue gradient.

## Cycle FP - Full-Screen Place Order Sheet

- Feature/page: Event Detail place-order screen.
- Frontend components touched: `src/components/TradeTicket.tsx`.
- Important functions/services touched: no backend/provider service changes. The ticket still calls `placeOrder(amount, side, contractSide)` and keeps the same selection/order identity.
- User interactions supported: the order ticket now presents as a full-screen mobile order surface with no Event Detail content peeking behind it, while preserving close/settings, event/outcome header, amount keypad, Yes/No selector, presets, odds/balance line, and swipe-up submit.
- State transitions: unchanged from Cycle FO. The modal presentation changed from bottom-sheet height to full-screen; `amount`, `side`, `activeContractSide`, details expansion, order error, and submit behavior remain local ticket state.
- Known limitations: exact Polymarket blur/gradient transition polish remains P2; this cycle closes the P0 issue that the order page still looked like a partial sheet instead of a dedicated place-order page.

## Cycle FQ - Portfolio Reference Layout

- Feature/page: Portfolio.
- Frontend components touched: `src/components/Portfolio.tsx`.
- Important functions/services touched: no backend/provider service changes. Portfolio still consumes the existing balance, positions, open orders, latest order, and activity props populated by local fake-token state or server sync.
- User interactions supported: profile/value header, performance chart, range selector, visual Deposit/Withdraw placeholders, Positions/Orders/History tabs, compact position rows, Cash out, plus/buy-more action, no-open-orders empty state, and simplified history rows.
- State transitions: added local `activeTab` state for `positions`, `orders`, and `history`. Existing expanded row state and close/trade/cancel callbacks are preserved.
- Known limitations: chart is a deterministic visual sparkline, not yet real portfolio history from backend. Deposit/Withdraw are visual placeholders only for MVP.

## Cycle FR - Portfolio Shell Parity

- Feature/page: Portfolio app shell.
- Frontend components touched: `App.tsx`.
- Important functions/services touched: no backend/provider service changes.
- User interactions supported: Portfolio now opens as a full-screen account/value page without the global Holiwyn promo/header above it, while preserving bottom tab navigation and Portfolio's own settings control.
- State transitions: unchanged. The render condition for the shared `Header` now excludes `mainTab === "portfolio"`.
- Known limitations: Home/Live/Search/Account still use the shared header; this cycle intentionally scopes only the Portfolio reference mismatch.

## Cycle FS - Portfolio Range Selector Interaction

- Feature/page: Portfolio performance chart range selector.
- Frontend components touched: `src/components/Portfolio.tsx`.
- Important functions/services touched: no backend/provider service changes.
- User interactions supported: `1D`, `1W`, `1M`, and `All` are now tappable controls with selected state, and the performance chart exposes the active range in its proof label.
- State transitions: added local `activeRange` state. Tapping a range updates `activeRange` and the deterministic chart variant.
- Known limitations: range selection does not yet fetch real portfolio history. A backend time-series route remains needed for true chart data.

## Cycle FT - Portfolio Value History Contract

- Feature/page: Portfolio performance chart data contract.
- Frontend components touched: `src/components/Portfolio.tsx`.
- Important functions/services touched: `src/api.ts`, `src/types.ts`, `src/services/portfolioValueHistoryService.ts`.
- User interactions supported: range selection now feeds a backend-shaped chart history object with range, source, status, timestamps, and value points. Android proof checks the selected `1W` range uses `deterministic-mobile-fallback` with ready status and seven points.
- State transitions: `activeRange` remains local UI state. The derived chart history object changes when the selected range changes.
- Known limitations: the real backend route `GET /api/portfolio/value-history?range={range}` is documented and typed in mobile, but not implemented in this mobile repo.

## Cycle FU - Backend Route Available, Mobile Wiring Pending

- Feature/page: Portfolio performance chart backend dependency.
- Frontend components touched: documentation only in standalone mobile repo.
- Important functions/services touched: no standalone mobile code changed. The main Holiwyn backend now exposes `GET /api/portfolio/value-history?range=1D|1W|1M|All` with the same `PortfolioValueHistory` payload shape typed in mobile.
- User interactions supported: no new mobile interaction in this documentation-only mobile cycle.
- State transitions: unchanged. `Portfolio` still uses deterministic fallback chart data until a mobile wiring cycle fetches the backend route in server mode.
- Known limitations: Android still needs proof that server mode switches the chart source from `deterministic-mobile-fallback` to `portfolio-value-history-route`.

## Cycle FV - Portfolio Value History Server Wiring

- Feature/page: Portfolio performance chart data source.
- Frontend components touched: `App.tsx`, `src/components/Portfolio.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: `PolyApi.getPortfolioValueHistory(range)` is now passed into `Portfolio` in server mode. `Portfolio` fetches the active chart range and falls back to deterministic chart data if the route is unavailable.
- User interactions supported: opening Portfolio in server mode now loads route-backed chart history; changing the chart range requests that range from the backend.
- State transitions: `activeRange` remains local to `Portfolio`; `serverValueHistory` updates asynchronously after each range change. If the server request fails, `serverValueHistory` clears and the chart uses deterministic fallback.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/api.test.ts src/__tests__/portfolioValueHistoryService.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-home-route-server-filled-proof.ps1 -Port 8232 -BackendBaseUrl http://172.16.200.14:3002`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-FI-home-route-server-filled\cycle-FI-home-route-server-filled-portfolio.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-FI-home-route-server-filled\cycle-FI-home-route-server-filled-portfolio.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-FI-home-route-server-filled\cycle-FI-home-route-server-filled-proof.json`.
- Known limitations: exact persisted account-value snapshots remain backend P2. The current route reconstructs from existing account/market snapshot data.
