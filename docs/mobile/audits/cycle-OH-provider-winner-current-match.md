# Cycle OH - Current Match Provider Winner S23 Proof

## Scope

Prove the current match's real Polymarket-backed Regulation Winner path on Samsung S23:

Home -> Event Detail -> Regulation Winner -> Trade Ticket -> swipe-to-buy -> fake-token server order -> Portfolio/history.

No app runtime files, backend routes, schemas, orderbook UI, chat, live stats, social features, or fixture-line behavior were changed.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| OH-P0-01 | P0 | Home opens the current `argentina-vs-egypt` match on S23. | Pass |
| OH-P0-02 | P0 | Event Detail exposes composed provider-backed Regulation Winner outcomes. | Pass |
| OH-P0-03 | P0 | Ticket preserves `marketType=winner`, `line=none`, and `provider-source-polymarket`. | Pass |
| OH-P0-04 | P0 | Swipe submit reaches Portfolio with provider winner identity preserved. | Pass |
| OH-P0-05 | P0 | Portfolio History preserves provider winner identity. | Pass |
| OH-P0-06 | P0 | Orderbook, chat, and live stats remain hidden from the MVP path. | Pass |

## Proof

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / `SM-S911U1`.
- Proof summary: `docs/mobile/harness/cycle-OH-provider-winner-current-match/cycle-OH-provider-winner-s23-visible-flow.json`.
- Screenshots: `docs/mobile/screenshots/cycle-OH-provider-winner-current-match/`.
- UI XML: `docs/mobile/harness/cycle-OH-provider-winner-current-match/`.

Key evidence:

- `cycle-OH-current-mvp-home.*`
- `cycle-OH-current-mvp-detail-top.*`
- `cycle-OH-provider-winner.*`
- `cycle-OH-provider-winner-ticket-ready.*`
- `cycle-OH-provider-winner-after-submit.*`
- `cycle-OH-provider-winner-portfolio-history.*`

## Decision

Pass. The current match has at least one complete real provider-backed Local MVP path through mobile visible proof.

The next visible cycles should prefer this provider-backed Regulation Winner path for real Polymarket parity, while keeping Spread/Totals/Team Total clearly labeled as local-test fake-token fixtures until real provider line markets exist.
