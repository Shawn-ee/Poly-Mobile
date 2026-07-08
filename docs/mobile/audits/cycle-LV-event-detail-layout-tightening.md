# Cycle LV - Event Detail Layout Tightening

Date: 2026-07-08

## Scope

Local MVP visible user flow only: Home -> Event Detail -> chart/probability -> line selector.

This cycle did not work on order book UI, chat, live stats, social, backend schemas, or order routes.

## Inspection Finding

Cycle LU proved the service can provide two World Cup match cards and provider-backed Regulation Winner data, but the S23 Event Detail proof showed:

- The chart/probability band was not visible in the first game-page view.
- Market rows were too large and cramped on Samsung S23.
- The sticky market header appeared too early and clipped market content during scroll.
- Duplicate winner-like fallback groups appeared after the line markets.
- Spread/Totals/Team Total rows are still backend-shaped `contract-fixture` rows, not real provider-backed Polymarket line markets.

## Implementation

Changed frontend component:

- `mobile/src/components/EventDetail.tsx`

Visible behavior improved:

- Restored a compact probability chart band in the first Event Detail view.
- Tightened S23 layout density for the top bar, compact header, outcome buttons, market tabs, market rows, line chips, and probability buttons.
- Delayed sticky header activation so it does not cover early market rows.
- Filtered fallback market groups by represented market family, not only ID, to avoid duplicate Regulation Winner sections.

Backend/API route changes:

- None.

## Android Proof

Device:

- `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Samsung S23 `SM-S911U1`
- 1080x2340

Evidence:

- `docs/mobile/screenshots/cycle-LV-event-detail-layout-tightening/home-after-reload.png`
- `docs/mobile/screenshots/cycle-LV-event-detail-layout-tightening/detail-top-after.png`
- `docs/mobile/screenshots/cycle-LV-event-detail-layout-tightening/detail-lines-final.png`
- `docs/mobile/harness/cycle-LV-event-detail-layout-tightening/detail-top-after.xml`
- `docs/mobile/harness/cycle-LV-event-detail-layout-tightening/detail-lines-final.xml`

XML audit result:

- `event-detail-price-chart`: present
- `Game Lines`: present
- `Spread`: present
- `Totals`: present
- `Team Total Goals`: present
- Chat text: absent
- Order book text: absent
- Duplicate Regulation Winner fallback in lower market proof: removed

## Validation

- `npm run typecheck -- --pretty false` passed from `mobile/`.

## Remaining Gaps

P0 open for the broader MVP:

- Prove the full S23 user path through line selection, simple Buy/Sell ticket, fake-token/server-backed order, and Portfolio/history.

P1 service/data gap:

- The selected Polymarket Gamma event exposes provider-backed Regulation Winner data, but no real provider-backed Spread/Totals/Team Total markets were found for this match. Local MVP line rows remain backend-shaped `contract-fixture` data and are suitable for UI/order proof, but not final provider parity.

P2 visual gap:

- The chart is visibly functional and closer to Polymarket, but still simpler than Polymarket's native moving/touch chart.
