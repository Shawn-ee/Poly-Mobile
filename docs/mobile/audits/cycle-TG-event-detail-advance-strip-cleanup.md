# Cycle TG - Event Detail Advance Strip Cleanup

Branch: `cycle/tg-event-detail-advance-strip-cleanup`

## Scope

Cycle TG removes the obsolete debug-only Team to Advance detail strip from Event Detail:

- no inline order book strip
- no inline graph placeholder
- no inline about placeholder
- no `activeLineDetailTab` state

The Local MVP Event Detail path remains focused on prediction rows, line selectors, simple Trade Ticket, fake-token order placement, and Portfolio/history.

No backend route, schema, provider logic, order logic, Portfolio logic, chat, live stats, social, deposit, or withdrawal work was changed.

## Acceptance Criteria

| Criterion | Priority | Result | Evidence |
| --- | --- | --- | --- |
| Event Detail does not include the Team to Advance inline order book/graph/about strip. | P0 | Pass | `mobile/src/components/EventDetail.tsx`; `mobile/src/__tests__/eventDetailChartInteractionContract.test.ts` |
| Local MVP market page remains chart-free and does not reintroduce placeholder chart behavior. | P0 | Pass | focused Event Detail tests |
| Full Local MVP flow still passes after Event Detail cleanup. | P0 | Pass | `docs/mobile/harness/cycle-TG-event-detail-advance-strip-cleanup/cycle-TG-current-mvp-s23-visible-flow.json` |
| Order book remains hidden from default user flow. | P0 | Pass | `orderbookHidden=true` in S23 proof |

## Device Proof

- Device: Samsung S23
- ADB device id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`
- Backend base URL: `http://127.0.0.1:3002`
- Mobile API base URL: `http://172.16.200.14:3002`
- Expo port: `8298`
- Result: `pass`

Primary proof summary:

- `docs/mobile/harness/cycle-TG-event-detail-advance-strip-cleanup/cycle-TG-current-mvp-s23-visible-flow.json`

Screenshots:

- `docs/mobile/screenshots/cycle-TG-event-detail-advance-strip-cleanup/cycle-TG-current-mvp-home.png`
- `docs/mobile/screenshots/cycle-TG-event-detail-advance-strip-cleanup/cycle-TG-current-mvp-live.png`
- `docs/mobile/screenshots/cycle-TG-event-detail-advance-strip-cleanup/cycle-TG-current-mvp-detail-top.png`
- `docs/mobile/screenshots/cycle-TG-event-detail-advance-strip-cleanup/cycle-TG-current-mvp-lines.png`
- `docs/mobile/screenshots/cycle-TG-event-detail-advance-strip-cleanup/cycle-TG-current-mvp-ticket-ready.png`
- `docs/mobile/screenshots/cycle-TG-event-detail-advance-strip-cleanup/cycle-TG-current-mvp-after-submit.png`
- `docs/mobile/screenshots/cycle-TG-event-detail-advance-strip-cleanup/cycle-TG-current-mvp-portfolio-history.png`

## Backend And Data Dependencies

This cleanup does not add or change backend dependencies. The proof still uses:

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
