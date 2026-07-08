# Cycle OI - Local Line Fake-Token Disclosure

## Scope

Make local-test line markets visibly honest before the user reaches Portfolio:

- Home source label.
- Event Detail line-source banner.
- Event Detail line row source note.
- Trade Ticket source note proof.

This cycle does not claim real Polymarket parity for Spread/Totals/Team Total. It also does not change backend routes, schemas, order matching, orderbook UI, chat, live stats, social features, or provider ingestion.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| OI-P0-01 | P0 | Home mixed-source label includes fake-token local-line disclosure. | Pass |
| OI-P0-02 | P0 | Event Detail line-source banner includes fake-token local-line disclosure. | Pass |
| OI-P0-03 | P0 | Event Detail contract-fixture line rows include fake-token source note/marker. | Pass |
| OI-P0-04 | P0 | Trade Ticket still includes fake-token source note for contract-fixture line market. | Pass |
| OI-P0-05 | P0 | S23 proof captures Home, Event Detail lines, and Ticket ready state. | Pass |
| OI-P1-01 | P1 | Fixture-line submit should not hit binary invariant conflicts after order-book cleanup. | Open |

## Proof

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / `SM-S911U1`.
- Proof summary: `docs/mobile/harness/cycle-OI-local-line-fake-token-disclosure/cycle-OI-current-mvp-s23-visible-flow.json`.
- Screenshots: `docs/mobile/screenshots/cycle-OI-local-line-fake-token-disclosure/`.
- UI XML: `docs/mobile/harness/cycle-OI-local-line-fake-token-disclosure/`.

Validation:

- Mobile TypeScript passed.
- Focused mobile Vitest source/selection tests passed.
- S23 source-disclosure proof passed.

## Audit Notes

An earlier full-submit attempt reached the fixture-line ticket but the backend rejected the order with:

`Binary invariant violation: resting order would make best_bid_yes + best_bid_no exceed 1`

That failure is not hidden as a pass. OI is scoped to source disclosure only. The order lifecycle remains covered by earlier provider-winner proof and should be rechecked for fixture lines after backend/order-book cleanup.

## Decision

Pass for source disclosure. The app now tells the user earlier that line markets are local-test fake-token lines, while the real Polymarket-backed current-match path remains Regulation Winner.
