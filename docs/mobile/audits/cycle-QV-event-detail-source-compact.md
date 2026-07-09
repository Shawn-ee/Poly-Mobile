# Cycle QV - Event Detail Source Disclosure Compact

Date: 2026-07-09

## Scope

Local MVP visible user flow:

Home -> Event Detail -> Game Lines.

This cycle reduces a tester-visible debug-style source banner on Event Detail. Holiwyn still needs provider/local-line source disclosure for the audit loop, but the page should stay betting-focused and closer to Polymarket's dense mobile game page.

Out of scope:

- Real provider-backed line-market import.
- Backend route/schema changes.
- Trade ticket, order placement, Portfolio, order book, chat, live stats, social, deposit, or withdraw.

## Reference Behavior

Polymarket's soccer game page prioritizes the match header, chart, primary outcomes, tabs, and market rows. Source/provider/debug explanations do not take over the Game Lines area. Holiwyn should keep audit markers but show only compact user-facing source copy.

## Acceptance Criteria

### P0

- Event Detail Game Lines source disclosure is a compact single-line row, not a large card.
- Visible copy is concise: provider winner plus Holiwyn line state.
- Hidden/accessibility markers still expose provider-backed winner, contract-fixture line state, provider availability, and line-family readiness.
- No order book, chat, live stats, social, ticket, order, Portfolio, backend route, or schema changes.
- Samsung S23 proof exists.

### P1

- The old visible `Market source` heading does not appear.
- The source row remains readable on Samsung S23.

### P2

- Replace Holiwyn line disclosure with Polymarket-backed line source if attach-ready provider lines become available.

## Implementation

- `mobile/src/components/EventDetail.tsx`
  - Replaced the large source banner styling with compact pill-row styling.
  - Shortened visible contract-fixture source copy to `Winner: Polymarket. Lines: Holiwyn.`
  - Kept existing hidden provider/local-line marker strings for audit and migration.
- `mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts`
  - Added guards for the compact source row and concise copy.

## Audit Result

Pass on Samsung S23.

Evidence:

- `docs/mobile/harness/cycle-QV-event-detail-source-compact/cycle-QV-event-detail-source-compact-proof.json`
- `docs/mobile/screenshots/cycle-QV-event-detail-source-compact/cycle-QV-event-detail-source-compact.png`
- `docs/mobile/harness/cycle-QV-event-detail-source-compact/cycle-QV-event-detail-source-compact.xml`

Checked:

- Event Detail opened on `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Game Lines source disclosure rendered with parent height `60` and visible text height `39`.
- Concise copy `Winner: Polymarket. Lines: Holiwyn.` appeared.
- Hidden markers still included `line-source-contract-fixture`, `regulation-winner-provider-backed`, and `line-provider-availability-`.
- The old visible `Market source` heading was absent.
- Expo developer menu was absent from proof XML.

Unresolved P0 gaps for this focused scope: 0.

## Remaining Gaps

- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.
