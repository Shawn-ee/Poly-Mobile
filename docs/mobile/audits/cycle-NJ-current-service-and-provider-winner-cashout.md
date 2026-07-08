# Cycle NJ - Current Service Inspection and Provider Winner Cashout Proof

## Scope

Local MVP retail flow only:

- Home
- Event Detail
- Provider-backed Regulation Winner
- Buy ticket
- Fake-token server-backed filled buy
- Portfolio position
- Cash-out swipe sell
- Portfolio History

No order book UI, chat, live stats, social, backend schema, or non-MVP feature work was added.

## Current Service Inspection

Evidence:

- `docs/mobile/harness/cycle-NJ-current-service-and-sell-path-inspection/cycle-NJ-current-service-summary.json`
- `docs/mobile/harness/cycle-NJ-current-service-and-sell-path-inspection/cycle-NJ-home-feed.json`
- `docs/mobile/harness/cycle-NJ-current-service-and-sell-path-inspection/cycle-NJ-argentina-egypt-live-detail.json`
- `docs/mobile/harness/cycle-NJ-current-service-and-sell-path-inspection/cycle-NJ-switzerland-colombia-live-detail.json`

Findings:

- Home currently returns two match events: `argentina-vs-egypt` and `switzerland-vs-colombia`.
- Both inspected matches expose provider-backed Polymarket Regulation Winner markets.
- Both inspected matches expose Spread, Totals, and Team Total rows only as `contract-fixture`.
- Live-detail provider lifecycle is `stale`.
- Chart history is `unavailable`.

Loop path adjustment:

- Do not claim real Polymarket line-market parity for current matches.
- Continue Local MVP with explicit contract-fixture line disclosures.
- Prioritize provider-backed winner lifecycle and visible buy/sell/Portfolio behavior while line-market provider breadth remains P1 data-contract debt.

## Acceptance Criteria

P0:

- Current service state is documented before implementation continues.
- Provider-backed Regulation Winner can be selected on S23.
- Buy ticket preserves `provider-source-polymarket`, `marketType=winner`, and `line=none`.
- Swipe-to-buy creates a filled server-backed position.
- Portfolio position preserves provider winner identity.
- Cash-out sheet opens from the owned position.
- Swipe-to-cashout submits a server-backed sell.
- Portfolio History shows the sold activity with `portfolio-market-type-winner`, `portfolio-line-none`, and `portfolio-provider-source-polymarket`.

P1:

- Replace contract-fixture Spread/Totals/Team Total rows with real provider-backed line markets when attach-ready provider data exists.
- Add route-backed chart history for current live matches.

## Implementation Notes

- `seed_mobile_route_spread_counterparty.ts` can now seed either BUY or SELL proof counterparties.
- The seed helper can clean exact-market blocking bids/asks for proof liquidity setup.
- `prove_mobile_provider_winner_s23_visible_flow.ps1` now supports `-ExpectCashout`.
- `ticketSelectionMetadata` now normalizes provider soccer market types such as `match_winner_1x2` to mobile retail `winner`, so server-created cash-out sell history keeps the correct visible market family.

## Proof

Device:

- Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`

Evidence:

- Proof summary: `docs/mobile/harness/cycle-NJ-provider-winner-cashout-s23/cycle-NJ-provider-winner-s23-visible-flow.json`
- Counterparty proof: `docs/mobile/harness/cycle-NJ-provider-winner-cashout-s23/cycle-NJ-provider-winner-counterparty.json`
- Cashout counterparty proof: `docs/mobile/harness/cycle-NJ-provider-winner-cashout-s23/cycle-NJ-provider-winner-cashout-counterparty.json`
- Screenshots: `docs/mobile/screenshots/cycle-NJ-provider-winner-cashout-s23/`
- UI hierarchy: `docs/mobile/harness/cycle-NJ-provider-winner-cashout-s23/`

Result:

- Pass.
- P0 failed: 0 for focused provider-backed Regulation Winner buy/sell lifecycle.
- P1 remaining: real provider-backed line-market breadth and route-backed chart history.
