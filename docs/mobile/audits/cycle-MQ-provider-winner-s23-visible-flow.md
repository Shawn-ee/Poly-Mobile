# Cycle MQ - Provider Winner S23 Visible Flow

## Scope

S23 proof for the real provider-backed Regulation Winner retail betting flow.

This cycle does not work on order book UI, chat, live stats, social features, backend schema, or non-MVP polish.

## Why

Cycle MP confirmed current line markets are Local `contract-fixture` rows, while Regulation Winner is provider-backed from Polymarket. The next useful loop step was to prove that a real provider-backed market can move through ticket, fake-token/server order, Portfolio, and history.

## Acceptance Criteria

- P0: Home opens the current World Cup match.
- P0: Event Detail shows a provider-backed Regulation Winner section.
- P0: Ticket opened from the provider-backed winner preserves `provider-source-polymarket`.
- P0: Ticket submit reaches Portfolio.
- P0: Portfolio/open state preserves `portfolio-provider-source-polymarket`.
- P0: History preserves `portfolio-provider-source-polymarket`.
- P0: Order book/chat remain hidden from the Local MVP user path.

## Implementation Result

Pass.

- Added a focused S23 proof script: `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`.
- The script selects the provider-backed winner outcome by exact provider/source identity markers instead of broad row prefixes.
- No backend/order schema changes were made.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-MQ-provider-winner-s23-visible-flow/cycle-MQ-provider-winner-s23-visible-flow.json`.
- Screenshots:
  - `docs/mobile/screenshots/cycle-MQ-provider-winner-s23-visible-flow/cycle-MQ-provider-winner.png`
  - `docs/mobile/screenshots/cycle-MQ-provider-winner-s23-visible-flow/cycle-MQ-provider-winner-ticket-ready.png`
  - `docs/mobile/screenshots/cycle-MQ-provider-winner-s23-visible-flow/cycle-MQ-provider-winner-after-submit.png`
  - `docs/mobile/screenshots/cycle-MQ-provider-winner-s23-visible-flow/cycle-MQ-provider-winner-portfolio-history.png`
- XML:
  - `docs/mobile/harness/cycle-MQ-provider-winner-s23-visible-flow/cycle-MQ-provider-winner-settled.xml`
  - `docs/mobile/harness/cycle-MQ-provider-winner-s23-visible-flow/cycle-MQ-provider-winner-ticket-ready.xml`
  - `docs/mobile/harness/cycle-MQ-provider-winner-s23-visible-flow/cycle-MQ-provider-winner-after-submit.xml`
  - `docs/mobile/harness/cycle-MQ-provider-winner-s23-visible-flow/cycle-MQ-provider-winner-portfolio-history.xml`

## Audit Gate

Result: Pass for provider-backed Regulation Winner retail flow.

Remaining tracked P1:

- Real provider-backed Spread/Totals/Team Total line markets remain unavailable for the inspected events.
