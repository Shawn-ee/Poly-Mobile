# Cycle ON - Source Label Tester Cleanup

Date: 2026-07-08

## Goal

Reduce tester-facing debug/source label noise without hiding whether a market is Polymarket-backed or fixture-backed.

## Visible Mobile User Flow Changed

Home -> Event Detail -> line market -> Trade Ticket.

## Backend/API Route Changed

None.

Existing dependencies remain:

- `GET /api/events`
- `GET /api/mobile/events/:slug/live-detail`
- Existing server-mode order routes are unchanged.

## Acceptance Criteria

- P0: Home no longer shows `local test fake-token` as dominant card copy.
- P0: Event Detail still discloses mixed Polymarket/test-line state.
- P0: Line-market rows and tickets identify fixture-backed pricing without using debug-heavy wording.
- P0: Internal proof/source markers remain available for automation.
- P0: S23 proof exists.

## Proof

Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM_S911U1`.

- Home: `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-home-reopened.png`
- Event Detail: `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-event-detail.png`
- Line markets: `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-event-detail-line.png`
- Provider-backed ticket: `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-ticket.png`
- Test-line ticket: `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/cycle-ON-s23-line-ticket.png`

## Validation

- `npm --prefix mobile run typecheck`: pass.
- `npm run test:mobile-api -- mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts mobile/src/__tests__/tradeTicketSourceBadge.test.ts mobile/src/__tests__/portfolioSourceBadge.test.ts mobile/src/__tests__/homeEventFeedService.test.ts mobile/src/__tests__/searchEventService.test.ts`: pass.

## Result

Audit Gate: pass for source-label cleanup.

Remaining P1/P2:

- Replace contract-shaped fixture lines with real provider-backed line markets when available.
- Expose multiple provider-backed events in the retail flow after the provider breadth runtime milestone expands match coverage.
