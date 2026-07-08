# Holiwyn Game Page Parity Sweep

Date: 2026-07-02

Scope: game/event detail page only, using the provided Polymarket screenshot as the UI reference. Player Props is intentionally blank for this goal.

## Verified On Samsung S23

- Game header: back button, Game/Chat segmented control, chat badge, book icon, and share icon render in the Polymarket-style layout.
- Match header: teams, flags, game time, and probabilities render above the chart.
- Price movement area: static price line and selected outcome probability render in the upper game page.
- Chat preview: visible chat count and one sample message card render above trading controls.
- Primary outcomes: large MEX/ECU buttons render and the MEX button opens the buy ticket.
- Inline position: seeded game position renders with cost/current/to-win, Buy more, and Cash out.
- Buy more: opens the matching Mexico buy ticket from the game-page position card.
- Cash out: removes the inline position card and leaves the user on the game page.
- Game Lines: expanded row shows regulation-time winner copy, bid/ask/spread, liquidity/depth, and outcome buttons.
- Game Lines collapse: tapping the market row hides the outcome/depth details.
- Player Props: tab opens to a deliberately blank state and does not expose old prop markets.

## Final Proof Commands

- `npm run typecheck`
- `npm run smoke:samsung:event-detail-summary`
- `npm run smoke:samsung:event-detail-buy-ticket`
- `npm run smoke:samsung:event-detail-position`
- `npm run smoke:samsung:event-detail-outcome-depth`
- `npm run smoke:samsung:event-detail-props`

## Current Gaps Against Polymarket

- Chat tab is visual only; it does not open a real chat thread yet.
- Share icon is visual only; no native share sheet is wired yet.
- Price chart is static sample movement, not driven by historical market ticks.
- Book/save icon toggles saved state, but there is no full saved-game management flow from this page.
- The bottom area is close but not pixel-identical; Samsung text scaling and USDT labels make Holiwyn taller than the screenshot.
- Player Props is intentionally blank per current instruction.

## Evidence Files

- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-ticket.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-position-buy-ticket.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-position-lines.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-position-cashed-out.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-game-line-expanded.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-game-line-collapsed.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-props.png`
