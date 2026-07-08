# Cycle NB - Event Detail Line Availability Disclosure

## Scope

Make the Event Detail market source banner consume the Cycle NA provider availability contract and show why line markets are local in the current MVP.

This cycle does not touch order book UI, chat, live stats, social features, backend schema, or order routes.

## Acceptance Criteria

- P0: Event Detail keeps the existing provider-winner/local-lines source banner.
- P0: When route data reports line provider availability `unavailable`, the banner text includes `Provider lines unavailable.`
- P0: S23 XML proof includes `line-provider-availability-unavailable` and the contract fixture count marker.
- P0: Home -> Live -> Event Detail -> line ticket -> fake-token order -> Portfolio/history still passes on S23.

## Implementation Result

Pass.

- `mobile/src/components/EventDetail.tsx` now reads `marketSourceSummary.lineMarkets.providerAvailability`.
- The Event Detail banner explains that line markets use local server pricing because provider-backed line markets are unavailable.
- Accessibility/proof markers include provider status, provider-backed line count, and contract fixture count.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-NB-event-detail-line-availability-disclosure/cycle-NB-current-mvp-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-NB-event-detail-line-availability-disclosure/`
- XML/harness: `docs/mobile/harness/cycle-NB-event-detail-line-availability-disclosure/`

## Tests

- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`
- `npm --prefix mobile exec tsc -- --noEmit --pretty false`
- `git diff --check`

## Audit Gate

Result: Pass for focused Event Detail line availability disclosure.

Remaining P1:

- Actual provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket match events.
