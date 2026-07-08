# Cycle LY - Portfolio Chart Containment

Date: 2026-07-08

## Scope

Local MVP visible Portfolio parity.

Targeted issue from S23 proof:

- Portfolio chart could visually spill into the range selector/watermark row.
- This made the account header feel messier than the Polymarket reference, where the chart, time-range selector, and section tabs read as distinct bands.

No order book, chat, live stats, social, backend schema, or order-route work was started.

## Implementation

Changed frontend component:

- `mobile/src/components/Portfolio.tsx`

Visible behavior improved:

- Added explicit chart plot bounds.
- Reduced chart area height and enabled clipping so line points cannot overflow into the range selector.
- Added a small spacer before the range/watermark row.
- Added an accessibility marker: `portfolio-chart-contained-above-range`.

Backend/API route changes:

- None.

## Android Proof

Device:

- Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`

Evidence:

- `docs/mobile/screenshots/cycle-LY-portfolio-chart-containment/portfolio-chart-contained.png`
- `docs/mobile/harness/cycle-LY-portfolio-chart-containment/portfolio-chart-contained.xml`

XML audit result:

- Portfolio screen: present
- Portfolio chart: present
- Chart containment marker: present
- Range selector: present
- Positions tab: present
- Chat/orderbook text: absent

## Validation

- `npm run typecheck -- --pretty false` passed from `mobile/`.

## Remaining Gaps

P0 open for broader MVP:

- Continue S23 proof cycles on a post-order Portfolio state after future ticket/position UI changes.

P1 visual gap:

- Portfolio header still needs broader Polymarket parity work around value curve shape, tab density, and account/settings entry polish.
