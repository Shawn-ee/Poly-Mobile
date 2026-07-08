# Cycle MT - Provider Winner Top Outcome Fill

## Scope

Make the obvious top provider-backed Regulation Winner outcome fill through the Local MVP retail path.

This cycle does not work on order book UI, chat, live stats, social features, backend schema, or non-MVP polish.

## Why

Cycle MS proved provider-backed Regulation Winner can fill when valid ask liquidity exists. The visible top Argentina outcome still had a local service issue: it had a 70% system bid and the opposite No ask, but no resting Yes ask. A normal Buy flow could therefore land as an open order instead of a filled Portfolio/history row.

## Acceptance Criteria

- P0: Proof-local liquidity setup can target a provider market by external provider market id.
- P0: The setup clears blocking BUY orders at or above the intended ask before placing the maker ask.
- P0: The placed ask respects the backend binary invariant.
- P0: S23 proof selects provider market `2793738` for Argentina Yes.
- P0: Swipe buy fills and Portfolio/history show provider-backed winner identity.
- P0: No backend schema, order matching, order book UI, chat, or live stats work is touched.

## Implementation Result

Pass.

- Extended `scripts/seed_mobile_route_spread_counterparty.ts` with `--externalMarketId` and `--cleanupBlockingBids`.
- Extended `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1` with `-CounterpartyAskPrice`.
- S23 proof prepared a 70% ask for provider market `2793738`, then completed Home -> Event Detail -> ticket -> swipe buy -> Portfolio/history.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-MT-provider-winner-top-outcome-fill/cycle-MT-provider-winner-s23-visible-flow.json`.
- Counterparty proof: `docs/mobile/harness/cycle-MT-provider-winner-top-outcome-fill/cycle-MT-provider-winner-counterparty.json`.
- Screenshots/XML: `docs/mobile/screenshots/cycle-MT-provider-winner-top-outcome-fill/`, `docs/mobile/harness/cycle-MT-provider-winner-top-outcome-fill/`.
- Tests:
  - `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1` parse check
  - `npm --prefix mobile exec tsc -- --noEmit --pretty false`
  - `npx tsc --noEmit --pretty false --allowJs false`

## Audit Gate

Result: Pass for focused top-outcome provider winner fill.

Remaining P1:

- Real provider-backed Spread/Totals/Team Total line markets remain unavailable for inspected events.
- The liquidity prep is local proof/service setup, not a public production market-maker policy.
