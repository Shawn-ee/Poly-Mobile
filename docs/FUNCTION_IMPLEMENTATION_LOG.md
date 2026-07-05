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

## Cycle FW - Data-Driven Portfolio Sparkline

- Feature/page: Portfolio performance chart visual behavior.
- Frontend components touched: `src/components/Portfolio.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no new API service; this uses the existing `PortfolioValueHistory.points` payload from backend route or deterministic fallback.
- User interactions supported: the Portfolio chart now renders plotted points and connecting segments from the active value-history payload instead of a fixed static placeholder. Server-mode proof taps `1W` and verifies the chart remains backend-backed with seven route points.
- State transitions: unchanged from FV. `activeRange` drives the requested value-history range; `PortfolioSparkline` normalizes the returned point values into a visible chart.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/api.test.ts src/__tests__/portfolioValueHistoryService.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-home-route-server-filled-proof.ps1 -Port 8233 -BackendBaseUrl http://172.16.200.14:3002`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-FI-home-route-server-filled\cycle-FI-home-route-server-filled-portfolio-range-1w.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-FI-home-route-server-filled\cycle-FI-home-route-server-filled-portfolio-range-1w.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-FI-home-route-server-filled\cycle-FI-home-route-server-filled-proof.json`.
- Known limitations: the line is still a lightweight React Native approximation, not a high-fidelity native chart with press tooltip behavior.

## Cycle FX - Portfolio Chart Touch Readout

- Feature/page: Portfolio performance chart interaction.
- Frontend components touched: `src/components/Portfolio.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no backend/API changes. The interaction reads the active `PortfolioValueHistory.points` already supplied by route or fallback.
- User interactions supported: tapping the Portfolio chart selects a mid-series point and shows a compact value/range readout. The chart proof label exposes `portfolio-chart-touchable`, `portfolio-chart-readout`, selected index, and selected value.
- State transitions: `PortfolioSparkline` keeps local `selectedIndexOverride`; it resets when range/source/status/point count changes.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/api.test.ts src/__tests__/portfolioValueHistoryService.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-home-route-server-filled-proof.ps1 -Port 8234 -BackendBaseUrl http://172.16.200.14:3002`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-FI-home-route-server-filled\cycle-FI-home-route-server-filled-portfolio-chart-touch.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-FI-home-route-server-filled\cycle-FI-home-route-server-filled-portfolio-chart-touch.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-FI-home-route-server-filled\cycle-FI-home-route-server-filled-proof.json`.
- Known limitations: this is a tap-to-select readout, not a continuous drag/press tooltip.

## Cycle FY - Portfolio Visual Density Parity

- Feature/page: Portfolio positions/orders/history surface.
- Frontend components touched: `src/components/Portfolio.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no backend/API changes. Existing balance, position, open-order, activity, and `PortfolioValueHistory` inputs are preserved.
- User interactions supported: Portfolio still supports range switching, chart touch readout, Positions/Orders/History tabs, Cash out, plus/buy-more, and history row expansion. The default visual row is now simpler: gradient avatar, faint Holiwyn watermark beside ranges, flag-style position/history icon, and hidden internal proof/status details.
- State transitions: unchanged except `PortfolioSparkline` no longer shows the readout until the user touches the chart. `activeRange`, `activeTab`, row expansion, close/trade/cancel callbacks, and server/fallback history behavior remain unchanged.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8236`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-EP-local-mvp-trade-flow\cycle-EP-holiwyn-local-mvp-portfolio.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-EP-local-mvp-trade-flow\cycle-EP-holiwyn-local-mvp-portfolio-orders.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-EP-local-mvp-trade-flow\cycle-EP-holiwyn-local-mvp-portfolio-history.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-EP-local-mvp-trade-flow-proof.json`.
- Known limitations: Deposit/Withdraw remain visual placeholders. Exact native gradient/chart gesture polish remains P2.

## Cycle FZ - Trade Ticket Swipe Confirmation

- Feature/page: Full-screen place-order ticket.
- Frontend components touched: `src/components/TradeTicket.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no backend/API changes. The ticket still calls the existing `placeOrder(amount, side, contractSide)` callback and preserves the same ticket `selection` identity for mock/server order handling.
- User interactions supported: the blue submit footer now exposes swipe gesture state (`idle`, `dragging`, `armed`, `submitting`) and a handle cue. The Local MVP tablet proof submits with an actual upward device swipe instead of tapping the submit node.
- State transitions: `SwipeSubmitControl` now tracks local `swipeProgress` and `isArmed`; release past the upward threshold submits and resets progress after completion. A tap fallback remains for accessibility and existing harness paths.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8239`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-EP-local-mvp-trade-flow\cycle-EP-holiwyn-local-mvp-ticket-ready.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-EP-local-mvp-trade-flow\cycle-EP-holiwyn-local-mvp-ticket-ready.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-EP-local-mvp-trade-flow-proof.json`.
- Known limitations: exact native gesture physics/blur remain P2.

## Cycle GA - Bottom Navigation Portfolio Value

- Feature/page: Bottom navigation shell.
- Frontend components touched: `App.tsx`, `src/components/BottomTabs.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no backend/API changes. `BottomTabs` receives the already-computed `accountPortfolioValue` from `App.tsx`.
- User interactions supported: the Portfolio tab remains tappable as before, but its visible label now shows a compact account value like `$10K`, closer to Polymarket's value-labeled Portfolio tab. Accessibility labels still include `Portfolio`, `holiwyn-portfolio-tab`, and `portfolio-tab-value-*`.
- State transitions: unchanged. The label updates whenever `balance` or `positions` change because it derives from `accountPortfolioValue`.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8240`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-EP-local-mvp-trade-flow\cycle-EP-holiwyn-local-mvp-portfolio.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-EP-local-mvp-trade-flow\cycle-EP-holiwyn-local-mvp-portfolio.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-EP-local-mvp-trade-flow-proof.json`.
- Known limitations: exact Polymarket tab icon/badge animation remains P2.

## Cycle GB - Event Detail Chart Ticket Handoff

- Feature/page: Event Detail probability chart and simple ticket entry.
- Frontend components touched: `src/components/EventDetail.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no backend/API changes. This uses existing selected chart state, `selectedChartTicketSelection`, and `openSelectedChartTicket`.
- User interactions supported: tapping the Target chart point updates the visible chart tooltip and contract rail point readout, then the chart Trade action opens the full-screen ticket while preserving selected market/outcome identity.
- State transitions: `selectedChartPoint` changes from `latest` to `target`; `chartPointMeta` updates the tooltip and contract rail. Ticket open state is unchanged and still receives the current selected market/outcome/selection.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpStatusFlow -Port 8241 -OutputDir docs/mobile/screenshots/cycle-GB-event-detail-chart-ticket-handoff -HierarchyOutputDir docs/mobile/harness/cycle-GB-event-detail-chart-ticket-handoff`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GB-event-detail-chart-ticket-handoff\cycle-GB-holiwyn-event-detail-chart-target.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GB-event-detail-chart-ticket-handoff\cycle-GB-holiwyn-event-detail-chart-target.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GB-event-detail-chart-ticket-handoff\cycle-GB-holiwyn-event-detail-chart-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GB-event-detail-chart-ticket-handoff\cycle-GB-event-detail-chart-ticket-handoff-proof.json`.
- Known limitations: exact Polymarket continuous chart press/drag physics remains P2.

## Cycle GC - Event Detail Prediction-Only MVP

- Feature/page: Event Detail default visible shell.
- Frontend components touched: `src/components/EventDetail.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no backend/API changes. Existing chart, market-line, ticket, and Portfolio handoff state remain unchanged.
- User interactions supported: the default Event Detail route now keeps the user on prediction tasks by showing Game only, without Chat, Share, Live stats, or chat preview entry points. Chart point selection, chart Trade ticket, and market-line selection remain supported.
- State transitions: active ticket, chart point, line selector, and market expansion states are unchanged. Chat/share/live-stats UI is no longer reachable from the default Local MVP Event Detail path.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpStatusFlow -Port 8242 -OutputDir docs/mobile/screenshots/cycle-GC-event-detail-prediction-only -HierarchyOutputDir docs/mobile/harness/cycle-GC-event-detail-prediction-only`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GC-event-detail-prediction-only\cycle-ER-holiwyn-local-mvp-status-top.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GC-event-detail-prediction-only\cycle-ER-holiwyn-local-mvp-status-top.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GC-event-detail-prediction-only\cycle-ER-holiwyn-local-mvp-status-market-lines.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GC-event-detail-prediction-only\cycle-GC-event-detail-prediction-only-proof.json`.
- Known limitations: future social/chat/share parity is intentionally P2/out of current Local MVP scope.

## Cycle GD - Home And Live World Cup Games Focus

- Feature/page: Home and Live event discovery.
- Frontend components touched: `src/components/HomeScreen.tsx`, `src/components/LiveScreen.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no backend/API changes. Home still consumes the existing `events`, `futures`, saved event IDs, query, and route-backed event data.
- User interactions supported: the first Home screen now presents a World Cup games/prediction focus header, hides non-MVP sports and futures promo surfaces, keeps search/filter controls, and still opens route-backed Event Detail and the simple spread ticket. The route-backed Live discovery surface now presents the same World Cup live games focus before opening Event Detail.
- State transitions: unchanged. `homeFilter`, `worldCupTab`, query, saved events, event open, and ticket open behavior remain intact.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpHomeRouteTicketFlow -Port 8243 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-GD-home-world-cup-games-focus -HierarchyOutputDir docs/mobile/harness/cycle-GD-home-world-cup-games-focus`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GD-home-world-cup-games-focus\cycle-FE-home-route-ticket-home.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GD-home-world-cup-games-focus\cycle-FE-home-route-ticket-home.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GD-home-world-cup-games-focus\cycle-FE-home-route-ticket-spread-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GD-home-world-cup-games-focus\cycle-GD-home-world-cup-games-focus-proof.json`.
- Known limitations: the Futures tab remains available behind explicit user selection; this cycle only changes default Home priority.

## Cycle GE - Portfolio Retail MVP Tightening

- Feature/page: Portfolio Positions/Orders/History surface.
- Frontend components touched: `src/components/Portfolio.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no backend/API changes. Existing fake-token Portfolio state, server sync state, and portfolio value-history inputs are preserved.
- User interactions supported: after a fake-token trade, Portfolio still opens to Positions, range switching works, Orders shows the empty state, and History shows the activity row. The default user-facing page hides deposit/withdraw controls and visible sync/debug clutter.
- State transitions: unchanged for trade submission, range selection, tab selection, Cash out, plus/buy-more, and history row expansion. The only new derived state is the visible score label generated from the position event title.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8244 -OutputDir docs/mobile/screenshots/cycle-GE-portfolio-retail-tightening -HierarchyOutputDir docs/mobile/harness/cycle-GE-portfolio-retail-tightening`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GE-portfolio-retail-tightening\cycle-EP-holiwyn-local-mvp-portfolio.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GE-portfolio-retail-tightening\cycle-EP-holiwyn-local-mvp-portfolio.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GE-portfolio-retail-tightening\cycle-EP-holiwyn-local-mvp-portfolio-orders.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GE-portfolio-retail-tightening\cycle-EP-holiwyn-local-mvp-portfolio-history.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GE-portfolio-retail-tightening\cycle-EP-local-mvp-trade-flow-proof.json`.
- Known limitations: exact native chart curve/drag physics and final pixel polish remain P2.

## Cycle GF - Ticket Retail Amount Sheet Tightening

- Feature/page: simple Buy/Sell ticket in the Local MVP trade path.
- Frontend components touched: `src/components/TradeTicket.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no backend/API changes. The ticket still submits through the existing `placeOrder(amount, side, contractSide)` callback and keeps the same `TicketSelection` identity labels.
- User interactions supported: user opens a line-market ticket, sees the amount-first retail ticket, chooses Yes/No, enters amount with presets/keypad, swipes to submit, and lands in Portfolio/history.
- State transitions: unchanged for amount, side, contract side, slippage details, submit state, and Portfolio handoff. The hidden ticket identity node no longer carries old visible review-copy words.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8245 -OutputDir docs/mobile/screenshots/cycle-GF-ticket-retail-amount-sheet -HierarchyOutputDir docs/mobile/harness/cycle-GF-ticket-retail-amount-sheet`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GF-ticket-retail-amount-sheet\cycle-EP-holiwyn-local-mvp-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GF-ticket-retail-amount-sheet\cycle-EP-holiwyn-local-mvp-ticket.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GF-ticket-retail-amount-sheet\cycle-EP-holiwyn-local-mvp-ticket-ready.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GF-ticket-retail-amount-sheet\cycle-EP-holiwyn-local-mvp-ticket-ready.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GF-ticket-retail-amount-sheet\cycle-EP-local-mvp-trade-flow-proof.json`.
- Known limitations: exact native blur and continuous swipe physics remain P2.

## Cycle GG - Discovery Card Retail Outcome Rail

- Feature/page: Home and Live game discovery cards.
- Frontend components touched: `src/components/MarketLists.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no backend/API changes. Cards still receive the same `Event`, first winner `Market`, and `Outcome` data and call existing `openEvent`/`openTicket` callbacks.
- User interactions supported: user sees a route-backed World Cup game card with two large outcome buttons, can tap the card into Event Detail, or tap an outcome rail button into the simple ticket path.
- State transitions: unchanged for route-backed discovery, selected event, ticket open state, selected market/outcome identity, and Portfolio handoff. Volume/liquidity are kept as hidden proof metadata instead of visible user-facing card text.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpHomeRouteTicketFlow -Port 8246 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-GG-discovery-card-retail-outcome-rail -HierarchyOutputDir docs/mobile/harness/cycle-GG-discovery-card-retail-outcome-rail`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GG-discovery-card-retail-outcome-rail\cycle-FE-home-route-ticket-home.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GG-discovery-card-retail-outcome-rail\cycle-FE-home-route-ticket-home.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GG-discovery-card-retail-outcome-rail\cycle-FE-home-route-ticket-spread-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GG-discovery-card-retail-outcome-rail\cycle-GD-home-world-cup-games-focus-proof.json`.
- Known limitations: exact Polymarket card typography/animation remains P2.

## Cycle GH - Discovery Rail Direct Ticket Proof

- Feature/page: Home and Live game discovery card outcome rail.
- Frontend components touched: `src/components/MarketLists.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no backend/API changes. The rail still calls the existing `openTicket(winner, outcome, event)` callback with the same market/outcome/event payload.
- User interactions supported: user can tap the visible outcome rail directly into the simple ticket, close it, then tap the card to continue into Event Detail and the line-market ticket path.
- State transitions: direct rail tap opens `ticket`; ticket close returns to discovery; card tap sets the selected event and opens Event Detail. Old row-style outcome fallback is set to `display: none`.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpHomeRouteTicketFlow -Port 8247 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-GH-discovery-rail-direct-ticket -HierarchyOutputDir docs/mobile/harness/cycle-GH-discovery-rail-direct-ticket`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GH-discovery-rail-direct-ticket\cycle-FE-home-route-ticket-retail-outcome-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GH-discovery-rail-direct-ticket\cycle-FE-home-route-ticket-retail-outcome-ticket.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GH-discovery-rail-direct-ticket\cycle-FE-home-route-ticket-detail-top.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GH-discovery-rail-direct-ticket\cycle-GD-home-world-cup-games-focus-proof.json`.
- Known limitations: exact card animation/typography remains P2.

## Cycle GI - Live Discovery Games First

- Feature/page: Live tab discovery surface.
- Frontend components touched: `src/components/LiveScreen.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no backend/API changes. Live still consumes the same route-backed `events` array and passes it to `MarketList`.
- User interactions supported: user lands on Live, sees the World Cup live games header and game cards without visible market/outcome summary pills, then can use the retail outcome rail or card-to-detail path.
- State transitions: unchanged for refresh, selected event, direct ticket opening, Event Detail navigation, and downstream ticket/order/Portfolio flow. Market/outcome counts remain as hidden proof metadata.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpHomeRouteTicketFlow -Port 8248 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-GI-live-discovery-games-first -HierarchyOutputDir docs/mobile/harness/cycle-GI-live-discovery-games-first`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GI-live-discovery-games-first\cycle-FE-home-route-ticket-home.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GI-live-discovery-games-first\cycle-FE-home-route-ticket-home.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GI-live-discovery-games-first\cycle-FE-home-route-ticket-retail-outcome-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GI-live-discovery-games-first\cycle-GD-home-world-cup-games-focus-proof.json`.
- Known limitations: exact Polymarket Live page animation/polish remains P2.

## Cycle GJ - Home Discovery No Watchlist

- Feature/page: Home discovery default Local MVP surface.
- Frontend components touched: `src/components/HomeScreen.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no backend/API changes. Home still consumes the same event discovery payloads and opens the same ticket/detail callbacks.
- User interactions supported: user sees All/Live/Today discovery filters and game cards without Saved/watchlist controls, then can continue into the existing retail outcome ticket and Event Detail spread ticket path.
- State transitions: `homeFilter`, search query, event open, and ticket open state remain unchanged. Saved state still exists elsewhere for future non-MVP work but is not exposed from Home discovery.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpHomeRouteTicketFlow -Port 8249 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-GJ-home-discovery-no-watchlist -HierarchyOutputDir docs/mobile/harness/cycle-GJ-home-discovery-no-watchlist`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GJ-home-discovery-no-watchlist\cycle-FE-home-route-ticket-home.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GJ-home-discovery-no-watchlist\cycle-FE-home-route-ticket-home.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GJ-home-discovery-no-watchlist\cycle-FE-home-route-ticket-retail-outcome-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GJ-home-discovery-no-watchlist\cycle-FE-home-route-ticket-spread-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GJ-home-discovery-no-watchlist\cycle-GJ-local-mvp-home-route-ticket-flow-proof.json`.
- Known limitations: saved/watchlist features are intentionally out of the active Local MVP betting path.

## Cycle GK - Portfolio Action Ticket Proof

- Feature/page: Portfolio position action row.
- Frontend components touched: `App.tsx`, `src/components/Portfolio.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: `openTicket` now resolves a missing `contractSide` from explicit sell/buy side; `openPositionTrade` now forwards stored position selection identity into the Portfolio-to-ticket handoff; no backend service changed.
- User interactions supported: after placing a fake-token position, the visible plus action opens a Buy ticket and the visible Cash out action opens a Sell/No ticket, then the user can close either ticket and continue to Orders/History.
- State transitions: position -> ticket is now explicit for both add and cash-out paths, with line/period/display label/contract side preserved. Direct close remains available only through the existing hidden close control used by non-MVP/server-close proof paths.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/positionTradeTargetService.test.ts src/__tests__/positionCloseService.test.ts src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8250 -OutputDir docs/mobile/screenshots/cycle-GK-portfolio-action-ticket-proof -HierarchyOutputDir docs/mobile/harness/cycle-GK-portfolio-action-ticket-proof`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GK-portfolio-action-ticket-proof\cycle-GK-holiwyn-local-mvp-portfolio.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GK-portfolio-action-ticket-proof\cycle-GK-holiwyn-local-mvp-portfolio-buy-more-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GK-portfolio-action-ticket-proof\cycle-GK-holiwyn-local-mvp-portfolio-cash-out-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GK-portfolio-action-ticket-proof\cycle-GK-holiwyn-local-mvp-portfolio-history.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GK-portfolio-action-ticket-proof\cycle-GK-local-mvp-trade-flow-proof.json`.
- Known limitations: this cycle proves ticket handoff, not final sell order execution from the cash-out ticket.

## Cycle GL - Portfolio Cash-Out Sell Submit

- Feature/page: Portfolio Cash out -> Sell ticket -> fake-token submit -> Portfolio/history.
- Frontend components touched: `App.tsx`, `src/components/TradeTicket.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: `Ticket` now carries optional `sourcePositionId`; mock `placeOrder` treats `sourcePositionId + sell` as a local cash-out submit by removing the source position and adding Sold history. No backend service changed.
- User interactions supported: user can place a fake-token position, tap visible Cash out, see the Sell/No ticket with line identity preserved, swipe to submit, return to Portfolio with no remaining local position, and see Sold in History.
- State transitions: `position -> cash-out ticket -> latestOrder(sell/no) -> positions(remove source) -> activities(sold)`. Buy-more ticket and normal event-detail buy/sell flows remain unchanged.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/positionTradeTargetService.test.ts src/__tests__/positionCloseService.test.ts src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8251 -OutputDir docs/mobile/screenshots/cycle-GL-portfolio-cashout-sell-submit -HierarchyOutputDir docs/mobile/harness/cycle-GL-portfolio-cashout-sell-submit`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GL-portfolio-cashout-sell-submit\cycle-GL-holiwyn-local-mvp-portfolio-cash-out-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GL-portfolio-cashout-sell-submit\cycle-GL-holiwyn-local-mvp-portfolio-cash-out-submitted.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GL-portfolio-cashout-sell-submit\cycle-GL-holiwyn-local-mvp-portfolio-history.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GL-portfolio-cashout-sell-submit\cycle-GL-local-mvp-trade-flow-proof.json`.
- Known limitations: server-backed close/position lifecycle is unchanged and remains separate from this local fake-token MVP cycle.

## Cycle GM - Portfolio Action Ticket Amount Reset

- Feature/page: Portfolio Buy more/Cash out -> simple Buy/Sell ticket.
- Frontend components touched: `src/components/TradeTicket.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: `TradeTicket` now treats `sourcePositionId` and selection identity as reset triggers, so Portfolio action tickets open at `$0` instead of inheriting a stale prior amount.
- User interactions supported: after the user places a fake-token position, both visible Portfolio actions open a simple ticket with preserved market/line/outcome identity, but the footer stays in `Choose an amount` until the user enters a new amount.
- State transitions: `position -> buy-more ticket` and `position -> cash-out ticket` keep identity unchanged while resetting amount state; fake-token submit behavior is unchanged after an amount is entered.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/positionTradeTargetService.test.ts src/__tests__/positionCloseService.test.ts src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8252 -OutputDir docs/mobile/screenshots/cycle-GM-portfolio-action-ticket-amount-reset -HierarchyOutputDir docs/mobile/harness/cycle-GM-portfolio-action-ticket-amount-reset`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GM-portfolio-action-ticket-amount-reset\cycle-GM-holiwyn-local-mvp-portfolio-buy-more-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GM-portfolio-action-ticket-amount-reset\cycle-GM-holiwyn-local-mvp-portfolio-buy-more-ticket.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GM-portfolio-action-ticket-amount-reset\cycle-GM-holiwyn-local-mvp-portfolio-cash-out-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GM-portfolio-action-ticket-amount-reset\cycle-GM-holiwyn-local-mvp-portfolio-cash-out-ticket.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GM-portfolio-action-ticket-amount-reset\cycle-GM-local-mvp-trade-flow-proof.json`.
- Known limitations: exact Polymarket full-screen ticket background/drag physics remain P1 visual polish.

## Cycle GN - Portfolio Team Flag Identity

- Feature/page: Portfolio Positions and History row leading icon.
- Frontend components touched: `src/components/Portfolio.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: `Portfolio` now derives a team code from position/activity selection display label, reference outcome, outcome, or event title, then renders the matching country flag badge instead of a hard-coded France-style stripe flag.
- User interactions supported: after the user places the local fake-token Mexico spread position, Portfolio shows a Mexico-specific leading flag/icon while Cash out, Buy more, Orders, and History remain available.
- State transitions: unchanged for `ticket -> order -> position -> Portfolio action tickets`; this is a visual identity correction over the existing position/activity state.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/positionTradeTargetService.test.ts src/__tests__/positionCloseService.test.ts src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8253 -OutputDir docs/mobile/screenshots/cycle-GN-portfolio-team-flag-identity -HierarchyOutputDir docs/mobile/harness/cycle-GN-portfolio-team-flag-identity`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GN-portfolio-team-flag-identity\cycle-GN-holiwyn-local-mvp-portfolio.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GN-portfolio-team-flag-identity\cycle-GN-holiwyn-local-mvp-portfolio.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GN-portfolio-team-flag-identity\cycle-GN-holiwyn-local-mvp-portfolio-history.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GN-portfolio-team-flag-identity\cycle-GN-local-mvp-trade-flow-proof.json`.
- Known limitations: the initial mapping is intentionally small and should grow with provider-backed World Cup coverage.

## Cycle GO - Ticket Team Flag Identity

- Feature/page: Simple Buy/Sell ticket header.
- Frontend components touched: `src/components/TradeTicket.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: `TradeTicket` now derives a team code from selected display label, reference outcome, outcome label, event title, or market label, then renders a matching team flag in the ticket header instead of a generic color square.
- User interactions supported: user opens the selected Mexico spread ticket, sees the Mexico flag in the order header, enters amount, swipes to buy, then reaches Portfolio with identity preserved. Portfolio Buy more and Cash out tickets inherit the same flag identity.
- State transitions: unchanged for `event detail -> ticket -> order -> Portfolio -> Portfolio action tickets`; this is a visible identity correction over existing ticket state.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/positionTradeTargetService.test.ts src/__tests__/positionCloseService.test.ts src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8254 -OutputDir docs/mobile/screenshots/cycle-GO-ticket-team-flag-identity -HierarchyOutputDir docs/mobile/harness/cycle-GO-ticket-team-flag-identity`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GO-ticket-team-flag-identity\cycle-GO-holiwyn-local-mvp-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GO-ticket-team-flag-identity\cycle-GO-holiwyn-local-mvp-ticket.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GO-ticket-team-flag-identity\cycle-GO-holiwyn-local-mvp-portfolio-buy-more-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GO-ticket-team-flag-identity\cycle-GO-holiwyn-local-mvp-portfolio-cash-out-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GO-ticket-team-flag-identity\cycle-GO-local-mvp-trade-flow-proof.json`.
- Known limitations: the initial mapping is intentionally small and should grow with provider-backed World Cup coverage.

## Cycle GP - Portfolio History Time Meta

- Feature/page: Portfolio History row.
- Frontend components touched: `App.tsx`, `src/components/Portfolio.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no service changes. `submitTicketOrder` activity creation now carries `t.justNow`; `Portfolio` renders `PortfolioActivity.timestamp` in a right-side amount/time stack.
- User interactions supported: after the user places a local fake-token trade, History shows the bought row with the selected line, amount, and visible `Just now` timestamp.
- State transitions: `ticket -> order -> activity -> history` now preserves a local recency timestamp for submitted fake-token trades and exposes it in the Polymarket-style location.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/positionTradeTargetService.test.ts src/__tests__/positionCloseService.test.ts src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts src/__tests__/openOrderService.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8255 -OutputDir docs/mobile/screenshots/cycle-GP-portfolio-history-time-meta -HierarchyOutputDir docs/mobile/harness/cycle-GP-portfolio-history-time-meta`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GP-portfolio-history-time-meta\cycle-GP-holiwyn-local-mvp-portfolio-history.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GP-portfolio-history-time-meta\cycle-GP-holiwyn-local-mvp-portfolio-history.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GP-portfolio-history-time-meta\cycle-GP-local-mvp-trade-flow-proof.json`.
- Known limitations: server-mode relative timestamp formatting remains dependent on backend-provided activity timestamps.

## Cycle GQ - Event Detail Simple Chart Trade Rail

- Feature/page: Event Detail chart and selected-contract ticket entry.
- Frontend components touched: `src/components/EventDetail.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no service changes. `EventDetail` now hides operational chart route text from the visible chart area, keeps route/provider state in proof metadata, and presents a compact `Selected / Current / Trade` rail.
- User interactions supported: user opens Event Detail, sees a simpler selected chart contract rail, taps Trade, enters amount, swipes to buy, and reaches Portfolio/history with selected line identity preserved.
- State transitions: unchanged for `event detail -> chart selected contract -> ticket -> order -> portfolio/history`; only the visible chart/ticket entry presentation changed.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/positionTradeTargetService.test.ts src/__tests__/positionCloseService.test.ts src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts src/__tests__/openOrderService.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8256 -OutputDir docs/mobile/screenshots/cycle-GQ-event-detail-simple-chart-trade-rail -HierarchyOutputDir docs/mobile/harness/cycle-GQ-event-detail-simple-chart-trade-rail`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GQ-event-detail-simple-chart-trade-rail\cycle-current-holiwyn-event-detail.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GQ-event-detail-simple-chart-trade-rail\cycle-current-holiwyn-event-detail.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GQ-event-detail-simple-chart-trade-rail\cycle-GQ-local-mvp-trade-flow-proof.json`.
- Known limitations: route-backed chart history and removal of fallback chart source remain future backend/provider work.

## Cycle GR - Event Detail Market Status Hidden

- Feature/page: Event Detail line-market headers.
- Frontend components touched: `src/components/EventDetail.tsx`.
- Important functions/services touched: no service changes. Market availability nodes remain as hidden proof metadata, while visible status pill text is removed from the default market header row.
- User interactions supported: user sees market groups, line chips, outcome rows, and ticket entry without backend/status labels competing with the betting controls.
- State transitions: unchanged for `event detail -> line selection -> ticket -> order -> portfolio/history`.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/positionTradeTargetService.test.ts src/__tests__/positionCloseService.test.ts src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts src/__tests__/openOrderService.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8257 -OutputDir docs/mobile/screenshots/cycle-GR-event-detail-market-status-hidden -HierarchyOutputDir docs/mobile/harness/cycle-GR-event-detail-market-status-hidden`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GR-event-detail-market-status-hidden\cycle-GR-holiwyn-local-mvp-selected-line.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GR-event-detail-market-status-hidden\cycle-GR-holiwyn-local-mvp-selected-line.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GR-event-detail-market-status-hidden\cycle-GR-local-mvp-trade-flow-proof.json`.
- Known limitations: future admin/debug surfaces can expose full provider availability explicitly.

## Cycle GS - Event Detail Line Card Actions

- Feature/page: Event Detail Team to Advance line card.
- Frontend components touched: `src/components/EventDetail.tsx`, `scripts/smoke.ps1`.
- Important functions/services touched: no service changes. The line-detail action strip now presents only `Graph` and `About` in the default Local MVP path and exposes `prediction-tabs-only` for proof.
- User interactions supported: user sees the line card outcome buttons and graph/about context without extra non-MVP icon actions, then continues through line selection, ticket, order, Portfolio, and History.
- State transitions: unchanged for `event detail -> line selection -> ticket -> order -> portfolio/history`.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/positionTradeTargetService.test.ts src/__tests__/positionCloseService.test.ts src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts src/__tests__/openOrderService.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8258 -OutputDir docs/mobile/screenshots/cycle-GS-event-detail-line-card-actions -HierarchyOutputDir docs/mobile/harness/cycle-GS-event-detail-line-card-actions`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GS-event-detail-line-card-actions\cycle-GS-holiwyn-local-mvp-market-lines.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GS-event-detail-line-card-actions\cycle-GS-holiwyn-local-mvp-market-lines.xml`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GS-event-detail-line-card-actions\cycle-GS-local-mvp-trade-flow-proof.json`.
- Known limitations: future debug/admin surfaces may reintroduce non-MVP diagnostics behind a flag if needed.

## Cycle GT - Ticket Phone-Width Retail Flow

- Feature/page: Simple Buy/Sell ticket.
- Frontend components touched: `src/components/TradeTicket.tsx`.
- Important functions/services touched: no service changes. The ticket scroll content is constrained to a centered phone-width column on wide Android screens while the full-screen modal and blue swipe footer remain intact.
- User interactions supported: user opens the selected line-market ticket on the Samsung tablet, sees compact Polymarket-like amount controls, enters an amount, swipes to buy, and reaches Portfolio/history with line identity preserved.
- State transitions: unchanged for `event detail -> line selection -> ticket -> order -> portfolio/history`.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/positionTradeTargetService.test.ts src/__tests__/positionCloseService.test.ts src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts src/__tests__/openOrderService.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8259 -OutputDir docs/mobile/screenshots/cycle-GT-ticket-phone-width-retail-flow -HierarchyOutputDir docs/mobile/harness/cycle-GT-ticket-phone-width-retail-flow`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GT-ticket-phone-width-retail-flow\cycle-GT-holiwyn-local-mvp-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GT-ticket-phone-width-retail-flow\cycle-GT-holiwyn-local-mvp-ticket-ready.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GT-ticket-phone-width-retail-flow\cycle-GT-holiwyn-local-mvp-portfolio-history.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GT-ticket-phone-width-retail-flow\cycle-GT-local-mvp-trade-flow-proof.json`.
- Known limitations: exact Polymarket native blur and continuous swipe physics remain P2 polish.

## Cycle GU - Portfolio Phone-Width Retail Flow

- Feature/page: Portfolio Positions, Orders, and History.
- Frontend components touched: `src/components/Portfolio.tsx`.
- Important functions/services touched: no service changes. The Portfolio scroll content is constrained to a centered phone-width column on wide Android screens.
- User interactions supported: after the user submits a fake-token order, Portfolio keeps the value/chart/tabs/position/history content in a phone-like column while preserving Buy more, Cash out, Orders, and History interactions.
- State transitions: unchanged for `ticket -> order -> position/open order/activity -> portfolio tabs`.
- Validation: `npm run typecheck`; `npx vitest run src/__tests__/positionTradeTargetService.test.ts src/__tests__/positionCloseService.test.ts src/__tests__/portfolioValueHistoryService.test.ts src/__tests__/portfolioPositionMetrics.test.ts src/__tests__/portfolioActivityMetrics.test.ts src/__tests__/openOrderService.test.ts`; PowerShell parser check for `scripts/smoke.ps1`; Samsung tablet proof `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8260 -OutputDir docs/mobile/screenshots/cycle-GU-portfolio-phone-width-retail-flow -HierarchyOutputDir docs/mobile/harness/cycle-GU-portfolio-phone-width-retail-flow`.
- Proof artifacts: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GU-portfolio-phone-width-retail-flow\cycle-GU-holiwyn-local-mvp-portfolio.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GU-portfolio-phone-width-retail-flow\cycle-GU-holiwyn-local-mvp-portfolio-orders.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GU-portfolio-phone-width-retail-flow\cycle-GU-holiwyn-local-mvp-portfolio-history.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GU-portfolio-phone-width-retail-flow\cycle-GU-local-mvp-trade-flow-proof.json`.
- Known limitations: exact native chart curve, avatar gradient, and final pixel polish remain P2 polish.
