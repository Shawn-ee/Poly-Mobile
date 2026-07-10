# Holiwyn Local MVP Game Page Gap Tracker

Date: 2026-07-10

Scope: current Local MVP game/event detail page for the retail betting path:

Home or Live -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

This tracker supersedes the older July 2 full Polymarket game-page parity tracker. That older tracker treated chart, chat, share/watchlist, and order-book surfaces as P0 parity work. The current product direction explicitly removes those from the default MVP path.

Authoritative current rules:

- Do not show the Polymarket-style price chart on the Event Detail market page.
- Do not show chat, line chat, social preview cards, live sports statistics, or share/watchlist panels.
- Do not show order book UI by default. Existing order-book backend/routes may remain internal/debug-only.
- Keep the page focused on match context, current probabilities, Game Lines, Player Props tab shell, ticket entry, fake-token submit, and Portfolio/history.
- Keep source disclosure honest: provider-backed Regulation Winner may be Polymarket-backed; Spread/Totals/Team Total rows remain contract-shaped fixtures unless real reviewed provider identity exists.

Reference docs:

- Main workflow tracker: `docs/mobile/POLYMARKET_PARITY_GAP_TRACKER.md`
- Current function log: `docs/mobile/FUNCTION_IMPLEMENTATION_LOG.md`
- Backend route map: `docs/mobile/MOBILE_BACKEND_ROUTE_DEPENDENCY_MAP.md`
- Data contract gaps: `docs/mobile/MOBILE_DATA_CONTRACT_GAPS.md`

## P0 Criteria

| ID | Requirement | State | Evidence |
| --- | --- | --- | --- |
| LMVP-GP-P0-01 | Event Detail opens from Home/Live using current route-backed event data. | Verified | Latest full-flow proof: `docs/mobile/harness/cycle-TE-current-mvp-full-flow-reproof/cycle-TE-current-mvp-s23-visible-flow.json`; ongoing route/server proofs in main tracker. |
| LMVP-GP-P0-02 | Header and match context are compact: back navigation, teams, flags/abbreviations, date/time/status, and current probabilities. | Verified | Event Detail source and S23 Local MVP proofs in `docs/mobile/POLYMARKET_PARITY_GAP_TRACKER.md`. |
| LMVP-GP-P0-03 | Chart is absent from default Event Detail UI. | Verified | `mobile/src/__tests__/eventDetailChartStatusCopy.test.ts`; `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` rejects `event-detail-price-chart`. |
| LMVP-GP-P0-04 | Chat, social preview, share/watchlist, and live-stat surfaces are absent from default Event Detail UI. | Verified | `mobile/src/__tests__/eventDetailNoChatStatsContract.test.ts`; S23 proof script rejects chat/order-book/social markers. |
| LMVP-GP-P0-05 | Order book UI is hidden by default and only available behind debug/internal gates. | Verified | `mobile/src/components/EventDetail.tsx` gates order-book opening through `EXPO_PUBLIC_SHOW_ORDERBOOK === "1"`; S23 proof rejects default order-book markers. |
| LMVP-GP-P0-06 | Regulation Winner and line groups are visible and open the simple Trade Ticket with selected market/outcome/line identity preserved. | Verified | Current MVP full-flow and ticket proof artifacts listed in the main tracker. |
| LMVP-GP-P0-07 | Trade Ticket supports amount entry and gesture-only swipe submit for Buy/Sell without changing backend order routes. | Verified | Trade Ticket swipe/submit cycles in `docs/mobile/POLYMARKET_PARITY_GAP_TRACKER.md`; full submit proof in Cycle TE/TP evidence. |
| LMVP-GP-P0-08 | Server-backed fake-token order appears in Portfolio/history with selected market/outcome/line/source identity preserved. | Verified | Cycle TE/TP full-flow proof and Portfolio density/History contracts in main tracker. |
| LMVP-GP-P0-09 | Real provider-backed line markets are not falsely claimed when Polymarket Gamma exposes none for the current match. | Verified | Provider line source reprobe and approved-provider source copy cycles in main tracker. |

## Open P1 Gaps

| ID | Gap | Status | Next Useful Work |
| --- | --- | --- | --- |
| LMVP-GP-P1-01 | Real provider-backed Spread/Totals/Team Total current-match line markets remain unavailable from Polymarket Gamma. | Open | Continue Local MVP with explicit contract fixtures, or configure/review an approved secondary provider contract. |
| LMVP-GP-P1-02 | Full real Google consent proof on S23 remains manual/setup-dependent. | Open | Run when backend auth origin and Google Cloud callback URL are reachable and registered. |
| LMVP-GP-P1-03 | More closed/suspended/unavailable market states need visible Android proof. | In progress | Cycle UE added a visible read-only Trade Ticket state and source/typecheck proof; S23 proof is still required because no Android device was attached. |

## Audit Gate Notes

The old full-parity rows for chart, chat, social preview, share/watchlist, and default order-book UI must not be used as completion evidence for the current Local MVP.

A future cycle fails the gate if it:

- Reintroduces chart/chat/order-book/social surfaces into the default Event Detail UI.
- Marks fixture line rows as Polymarket-backed without real provider identity.
- Claims Event Detail completion without a current S23 proof or a clear reason why no visible UI changed.
- Changes backend order or Portfolio behavior without updating route/data-contract documentation.
