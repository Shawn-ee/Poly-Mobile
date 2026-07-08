# Cycle NI - Provider Winner Clean Feed Regression

## Scope

Local MVP real-provider retail flow:

- Home
- Event Detail
- Provider-backed Regulation Winner
- Simple Buy ticket
- Fake-token server-backed filled order
- Portfolio position
- Portfolio History

This cycle does not change order book, chat, live stats, social, watchlists, backend schema, or non-MVP UI.

## Current Provider State

The current inspected match has:

- 3 provider-backed Polymarket Regulation Winner markets.
- 0 route-visible provider-backed Spread/Totals/Team Total markets.
- 4 Local MVP `contract-fixture` line markets.

Cycle NI focuses on the real provider-backed part that is currently available: Regulation Winner.

## Acceptance Criteria

P0:

- Home shows the current match and does not show disposable provider-breadth proof rows.
- Event Detail shows composed Regulation Winner 1X2 provider markets.
- Ticket opened from Egypt winner preserves `provider-source-polymarket`, `marketType=winner`, and `line=none`.
- Swipe-to-buy reaches Portfolio after server order submit.
- Portfolio position preserves provider winner source identity.
- History shows filled activity preserving provider winner source identity.

P1:

- Replace Local MVP line fixtures with real provider-backed Spread/Totals/Team Total markets when attach-ready provider markets exist.
- Replace deterministic proof maker liquidity with a production policy for provider-backed match-winner liquidity.

P2:

- Repeat filled provider-backed winner proof for home/draw/away variants without relying on a fixed target market id.

## Implementation Notes

- Added no-BOM JSON summary output to `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`.
- Added Home negative assertions for `Provider Breadth`, `EL-A Provider Breadth`, and `mobile-el-a-provider-breadth`.
- No app UI, route, or schema changes were required.

## Proof

Device:

- Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`

Evidence:

- Proof summary: `docs/mobile/harness/cycle-NI-provider-winner-clean-feed/cycle-NI-provider-winner-s23-visible-flow.json`
- Counterparty proof: `docs/mobile/harness/cycle-NI-provider-winner-clean-feed/cycle-NI-provider-winner-counterparty.json`
- Screenshots: `docs/mobile/screenshots/cycle-NI-provider-winner-clean-feed/`
- UI hierarchy: `docs/mobile/harness/cycle-NI-provider-winner-clean-feed/`

Result:

- Pass.
- P0 failed: 0 for focused provider-backed Regulation Winner filled-flow scope.
- P1 remaining: provider-backed line-market breadth and production liquidity policy.
