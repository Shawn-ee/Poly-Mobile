# Cycle OJ - Fixture Line Order Cleanup

## Scope

Clean stale proof orders that could block repeated fixture-line fake-token submit proof.

This cycle keeps the Local MVP scope narrow:

- Home -> Event Detail -> Spread line -> Trade Ticket -> fake-token server order -> Portfolio.
- No orderbook UI, chat, live stats, social features, backend schema changes, or provider ingestion work.
- No claim that Spread/Totals/Team Total are real Polymarket-backed line markets.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| OJ-P0-01 | P0 | Cleanup-only proof cancels stale fixture-line BUY bids without creating a new maker order. | Pass |
| OJ-P0-02 | P0 | Full S23 proof runs cleanup before launch and no longer hits the binary invariant failure. | Pass |
| OJ-P0-03 | P0 | Fixture-line submit reaches Portfolio as either an open order or a filled position. | Pass |
| OJ-P0-04 | P0 | Portfolio preserves market type, line, provider source, and fake-token/local-test identity after submit. | Pass |
| OJ-P0-05 | P0 | Orderbook, chat, and live stats remain hidden from the Local MVP path. | Pass |

## Proof

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / `SM-S911U1`.
- Cleanup route proof: `docs/mobile/harness/cycle-OJ-fixture-line-order-cleanup/cycle-OJ-line-cleanup-route-proof.json`.
- S23 cleanup artifact: `docs/mobile/harness/cycle-OJ-fixture-line-order-cleanup/cycle-OJ-current-mvp-line-cleanup.json`.
- S23 proof summary: `docs/mobile/harness/cycle-OJ-fixture-line-order-cleanup/cycle-OJ-current-mvp-s23-visible-flow.json`.
- Screenshots: `docs/mobile/screenshots/cycle-OJ-fixture-line-order-cleanup/`.
- UI XML: `docs/mobile/harness/cycle-OJ-fixture-line-order-cleanup/`.

Validation:

- Mobile TypeScript passed.
- Focused mobile Vitest source/selection tests passed.
- S23 full visible proof passed.

## Audit Notes

The OI failure was caused by stale proof BUY bids on the fixture spread market. Those old orders made a repeated proof submit violate the binary market bid invariant.

OJ adds cleanup-only execution to the proof seeding utility and calls it before the S23 fixture-line proof. The final S23 proof submitted the fixture line successfully and landed on Portfolio with an open order preserving:

- `marketType=spread`
- `line=1.5`
- `provider-source=contract-fixture`
- `portfolio-local-test-pricing`

This is valid Local MVP fake-token behavior only. The remaining product gap is unchanged: real provider-backed current-match Spread/Totals/Team Total line markets are still not available from the current Polymarket provider event.

## Decision

Pass for fixture-line proof health. This closes the repeated proof-order-state blocker and keeps the next path focused on real provider-backed line-market availability or visible Local MVP flow improvements.
