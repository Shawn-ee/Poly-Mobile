# Cycle TF - Home/Live Card Simplification

Branch: `cycle/tf-home-live-card-simplification`

## Scope

Cycle TF keeps the Local MVP Home and Live feeds focused on a single compact retail prediction path per match card.

The old hidden legacy outcome row was removed from `MarketLists`; Home/Live cards now rely on the compact `event-card-retail-outcome-rail` controls for opening tickets. This avoids duplicate hidden ticket targets in source/hierarchy and keeps the feed behavior aligned with the simpler mobile retail flow.

No backend route, order logic, provider logic, order book UI, chat, live stats, social, deposit, or withdrawal work was changed.

## Acceptance Criteria

| Criterion | Priority | Result | Evidence |
| --- | --- | --- | --- |
| Home/Live event cards use the compact retail outcome rail as the card's only outcome/ticket control path. | P0 | Pass | `mobile/src/components/MarketLists.tsx`; `mobile/src/__tests__/homeCardStatsContract.test.ts` |
| Legacy hidden `teamRow` / `probButton` outcome controls are removed. | P0 | Pass | Focused mobile tests; Home XML proof |
| Audit-only provider/source readiness markers stay available for Home/Live proofs. | P0 | Pass | `homeShowsProviderWinnerLocalLinesDisclosure=true`; `liveShowsProviderWinnerLocalLinesDisclosure=true` |
| Full Local MVP flow still works after the feed cleanup. | P0 | Pass | `docs/mobile/harness/cycle-TF-home-live-card-simplification/cycle-TF-current-mvp-s23-visible-flow.json` |

## Device Proof

- Device: Samsung S23
- ADB device id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`
- Backend base URL: `http://127.0.0.1:3002`
- Mobile API base URL: `http://172.16.200.14:3002`
- Expo port: `8296`
- Result: `pass`

Primary proof summary:

- `docs/mobile/harness/cycle-TF-home-live-card-simplification/cycle-TF-current-mvp-s23-visible-flow.json`

Screenshots:

- `docs/mobile/screenshots/cycle-TF-home-live-card-simplification/cycle-TF-current-mvp-home.png`
- `docs/mobile/screenshots/cycle-TF-home-live-card-simplification/cycle-TF-current-mvp-live.png`
- `docs/mobile/screenshots/cycle-TF-home-live-card-simplification/cycle-TF-current-mvp-detail-top.png`
- `docs/mobile/screenshots/cycle-TF-home-live-card-simplification/cycle-TF-current-mvp-lines.png`
- `docs/mobile/screenshots/cycle-TF-home-live-card-simplification/cycle-TF-current-mvp-ticket-ready.png`
- `docs/mobile/screenshots/cycle-TF-home-live-card-simplification/cycle-TF-current-mvp-after-submit.png`
- `docs/mobile/screenshots/cycle-TF-home-live-card-simplification/cycle-TF-current-mvp-portfolio-history.png`

## Backend And Data Dependencies

This cycle does not add or change backend dependencies. The proof still uses:

- `/api/events`
- `/api/mobile/events/:slug/live-detail`
- `/api/markets/:marketId/quote`
- `/api/orders`
- `/api/portfolio`
- `/api/portfolio/history`
- `scripts/seed_mobile_route_spread_counterparty.ts`

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| Real Polymarket-backed spread, total, and team-total line markets for the current user-facing match set. | P1 | Open |
| Manual Google account consent proof on S23. | P1 | Open |
| Production dev build/APK proof instead of Expo Go-only runtime. | P2 | Open |
