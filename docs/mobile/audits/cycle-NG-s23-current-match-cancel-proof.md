# Cycle NG - S23 Current Match Cancel Proof

## Scope

Local MVP retail betting flow only:

- Home
- Live
- Event Detail
- Spread line market
- Simple Buy ticket
- Server-backed fake-token order
- Portfolio Orders
- Cancel
- Portfolio History

No order book, chat, live stats, social, watchlists, backend schema, or non-MVP UI work was touched.

## Reference Baseline

This cycle uses the current audited Polymarket parity baseline already established for the Local MVP path:

- The visible app path should behave like a retail ticket flow.
- Users should be able to choose a market/outcome, enter amount, submit, and see order state in Portfolio.
- Cancel is a required Portfolio lifecycle behavior when an order remains open.

Current inspected provider state remains:

- Regulation Winner is provider-backed from Polymarket.
- Spread/Totals/Team Total lines are still Local MVP contract-fixture rows because inspected Polymarket provider discovery has not returned attach-ready line markets for this current match.

## Acceptance Criteria

P0:

- S23 proof opens Holiwyn through server mode and lands on Home.
- Home and Live show the current match with provider-winner/local-lines disclosure.
- Event Detail opens without order book or chat entry points.
- Spread line selection opens a ticket preserving `marketType=spread`, `line=1.5`, and `referenceSource=contract-fixture`.
- Swipe-to-buy reaches Portfolio Orders with an open order row and visible Cancel control.
- Tapping Cancel removes the open order and shows no open orders.
- History shows a canceled activity row preserving spread line/source/local-pricing identity.

P1:

- Replace Local MVP contract-fixture line markets with real provider-backed Spread/Totals/Team Total markets when Polymarket exposes attach-ready candidates.

P2:

- Broader cancel proof across totals/team-total families after provider-backed line breadth exists.

## Implementation Notes

- Added `-ExpectCancel` to `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`.
- `-ExpectCancel` uses the same current-match path as the existing S23 proof, then taps the first visible `cancel-open-order-*` control and verifies the canceled History state.
- No backend route, database schema, or mobile UI component was changed.

## Proof

Device:

- Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`

Evidence:

- Proof summary: `docs/mobile/harness/cycle-NG-s23-current-match-cancel-proof/cycle-NG-current-mvp-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-NG-s23-current-match-cancel-proof/`
- UI hierarchy: `docs/mobile/harness/cycle-NG-s23-current-match-cancel-proof/`

Result:

- Pass.
- P0 failed: 0 for focused cancel proof scope.
- P1 remaining: provider-backed line-market breadth.
