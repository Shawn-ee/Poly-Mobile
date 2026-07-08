# Cycle OE - Event Detail Source Wording

## Scope
- Local MVP visible flow: Event Detail market source wording.
- No backend route, schema, order logic, orderbook UI, chat, live stats, social, or provider discovery changes.

## Reference / Product Audit
- Cycle OD proved the current data state for `argentina-vs-egypt`:
  - Regulation Winner is Polymarket-backed.
  - Spread/Totals/Team Total are `contract-fixture`.
- Ticket and Portfolio already use clear retail wording:
  - `Polymarket`
  - `Local test`
- Event Detail still used generic row pills:
  - `Provider`
  - `Local`

## Acceptance Criteria
- P0: Event Detail source pills must use the same user-facing source language as Ticket and Portfolio.
- P0: Provider-backed market rows must show `Polymarket`, not generic `Provider`.
- P0: Contract fixture line rows must show `Local test`, not vague `Local`.
- P0: Accessibility/XML proof must expose machine-checkable markers for the clearer wording.
- P0: S23 proof must show Event Detail still opens and Game Lines source rows render.
- P1: Continue replacing `contract-fixture` line markets with real provider-backed rows only when Polymarket exposes attach-ready line markets.

## Implementation
- `mobile/src/components/EventDetail.tsx`
  - `marketSourceBadge()` now returns `Polymarket` for Polymarket-backed markets.
  - `marketSourceBadge()` now returns `Local test` for contract-fixture line markets.
  - Source badge accessibility now includes:
    - `market-source-polymarket-readable`
    - `market-source-local-test-readable`
- `mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts`
  - Updated the contract test to guard the clearer wording.

## Proof
- Mobile TypeScript: pass.
- Focused mobile Vitest: pass with `vitest.mobile.config.mts`.
- S23 top/detail proof: `docs/mobile/harness/cycle-OE-event-detail-source-wording/cycle-OE-current-mvp-s23-visible-flow.json`
- S23 line-section screenshot: `docs/mobile/screenshots/cycle-OE-event-detail-source-wording/cycle-OE-event-detail-source-wording-lines.png`
- S23 line-section XML: `docs/mobile/harness/cycle-OE-event-detail-source-wording/cycle-OE-event-detail-source-wording-lines.xml`

## Audit Gate
- Result: pass.
- Visible user behavior changed: Event Detail now clearly tells users which market rows are Polymarket-backed versus Local test before they open the ticket.
- Remaining P1: real provider-backed Spread/Totals/Team Total markets remain unavailable for the current event.
