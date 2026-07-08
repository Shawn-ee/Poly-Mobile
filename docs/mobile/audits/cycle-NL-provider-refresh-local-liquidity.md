# Cycle NL - Provider Refresh And Local MVP Liquidity

Date: 2026-07-08

## Scope

Current Local MVP retail flow only:

Home -> Event Detail -> provider-backed Regulation Winner -> simple ticket -> fake-token/server-backed order -> Portfolio/history.

No order book UI, chat, live stats, social, or backend schema work was added.

## Inspection

The local database had the `argentina-vs-egypt` event shell but zero markets after focused Jest tests reset the database. That made the service look unready: Regulation Winner disappeared, Spread/Totals/Team Total rows were missing, and S23 proof could not reach the intended ticket path.

The existing Polymarket grouped event importer skipped the inspected event's markets because the Gamma event is no longer active/live. The event is still useful for local MVP proof, but it needs a repeatable restore path after test resets.

## Implementation

- Added `scripts/restore_current_mobile_mvp_match.ts` to restore the current match with three Polymarket-backed Regulation Winner markets from Gamma event data.
- Re-ran `scripts/seed_mobile_mvp_match_line_markets.ts` to restore backend-shaped Spread/Totals/Team Total fixtures.
- Fixed `refreshPolymarketReferenceSnapshots` to fall back from `/markets?slug=<market>` to `/events?slug=<event>` when Gamma returns an empty market lookup for grouped soccer markets.
- Added provider refresh proof via `scripts/prove_current_match_provider_refresh.ts`.
- Updated provider-backed order validation so fake-token orders can trade a provider-mapped market when Holiwyn has local resting liquidity, even if the old provider book is unavailable.
- Updated the S23 proof harness to create a temporary mobile dev credential with proof-sized order limits.

## Acceptance Criteria

| ID | Priority | Result | Evidence |
| --- | --- | --- | --- |
| NL-P0-01 | P0 | Pass | Restore proof recreated 3 Polymarket-backed Regulation Winner markets. |
| NL-P0-02 | P0 | Pass | Line seed proof restored Spread, Totals, and Team Totals as backend-shaped fixtures. |
| NL-P0-03 | P0 | Pass | Provider refresh proof updated 6 Gamma quote snapshots with 0 skipped markets. |
| NL-P0-04 | P0 | Pass | Local liquidity diagnostic filled a provider-backed winner BUY through the server. |
| NL-P0-05 | P0 | Pass | S23 proof completed Home -> Event Detail -> ticket -> Portfolio/history. |
| NL-P1-01 | P1 | Partial | Real provider-backed Spread/Totals/Team Total markets remain unavailable for this inspected Polymarket event. |
| NL-P1-02 | P1 | Partial | CLOB chart history exists but is stale because the inspected match timestamp is old. |

## Evidence

- `docs/mobile/harness/cycle-NL-current-match-provider-refresh/current-match-restore.json`
- `docs/mobile/harness/cycle-NL-current-match-provider-refresh/current-match-line-markets.json`
- `docs/mobile/harness/cycle-NL-current-match-provider-refresh/current-match-provider-refresh.json`
- `docs/mobile/harness/cycle-NL-current-match-provider-refresh/provider-winner-counterparty-diagnostic.json`
- `docs/mobile/harness/cycle-NL-current-match-provider-refresh-s23-pass/cycle-NL3-provider-winner-s23-visible-flow.json`

## Audit Result

Pass for the Local MVP provider refresh and server-backed provider winner ticket flow.

This is not a final Polymarket game-page parity pass. The line-market rows are still contract fixtures, not real Polymarket-backed line markets.
