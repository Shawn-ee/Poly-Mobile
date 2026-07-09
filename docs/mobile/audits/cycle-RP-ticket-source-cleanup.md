# Cycle RP - Trade Ticket Source Label Cleanup

## Scope

Local MVP retail ticket cleanup only: remove visible tester/debug source copy from the Portfolio Cash out -> Sell ticket path while keeping hidden audit markers.

No order book UI, chat, live stats, social, backend schema, provider service, deposit, or withdrawal work was included.

## Reference / Rationale

The Polymarket-style amount-entry ticket is visually minimal: event, selected outcome, amount, odds/balance, keypad, and swipe area. Holiwyn's previous Sell ticket displayed a visible `Checking` pill in the header when source identity was missing from the ticket object. That looked like internal/debug state and distracted from the retail flow.

## Acceptance Criteria

P0:

- Sell ticket does not show visible `Checking` source copy.
- Hidden audit/source marker remains available when source is unknown.
- Ticket still shows `Sell France`.
- Ticket still reaches `$25` / `Swipe to sell`.
- S23 proof exists.

P1:

- Backend-derived portfolio/position selections should consistently preserve explicit source and token identity so source labels can be truthful without inference.

P2:

- Final decision on whether source labels should appear in production ticket header can wait until the Local MVP full-flow proof is stable.

## Implementation

- `mobile/src/components/TradeTicket.tsx`: adds `ticketReferenceSource()` to resolve explicit source first, then infer Polymarket when provider token/condition identity exists.
- `ticketSourceBadge()` now hides truly unknown source from visible UI and preserves `ticket-market-source-badge-hidden`.
- `mobile/src/__tests__/tradeTicketSourceBadge.test.ts`: locks provider-token inference and ensures `label: "Checking"` does not return.
- `mobile/scripts/smoke.ps1`: focused S23 proof fails if visible `Checking` returns.

## Device Proof

Holiwyn device:

- Samsung S23 `SM-S911U1`
- ADB: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Expo port: `8344`
- Backend: `http://127.0.0.1:3002`

Evidence:

- `docs/mobile/screenshots/cycle-RP-ticket-source-cleanup/home.png`
- `docs/mobile/screenshots/cycle-RP-ticket-source-cleanup/portfolio-position-ready.png`
- `docs/mobile/screenshots/cycle-RP-ticket-source-cleanup/sell-ticket-source-clean.png`
- `docs/mobile/harness/cycle-RP-ticket-source-cleanup/home.xml`
- `docs/mobile/harness/cycle-RP-ticket-source-cleanup/portfolio-position-ready.xml`
- `docs/mobile/harness/cycle-RP-ticket-source-cleanup/sell-ticket-source-clean.xml`
- `docs/mobile/harness/cycle-RP-ticket-source-cleanup/sell-ticket-button.xml`

Proof markers:

- `Checking` absent
- `ticket-market-source-badge-hidden`
- `ticket-source-badge-unknown`
- `Sell France`
- `ticket-order-mode-sell`
- `Swipe to sell`

## Result

Audit Gate: Pass for focused RP scope.

Remaining gap:

- P1: preserve explicit source/provider identity in every backend-derived ticket payload.
