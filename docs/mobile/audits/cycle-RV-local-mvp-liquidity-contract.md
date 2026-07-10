# Cycle RV - Local MVP Liquidity Contract

## Scope

Local MVP fake-token liquidity setup for the visible Android flow:

Home -> Event Detail -> Spread line -> Buy ticket -> server order fill -> Portfolio position -> Cash out/Sell ticket -> Portfolio History.

This cycle does not change visible UI, order routes, schemas, chat, order book UI, live stats, or social features. It tightens the proof harness so the mobile buy and sell/cashout paths cannot accidentally pass against ambiguous counterparty liquidity.

## Acceptance Criteria

P0:

- Buy-fill proof setup must seed a resting `SELL` ask for the mobile `BUY` ticket.
- Cashout/sell-fill proof setup must seed a resting `BUY` bid for the mobile `SELL` ticket.
- The S23 proof script must pass explicit liquidity purpose flags for cleanup, buy-fill, and cashout/sell-fill.
- The full S23 visible flow must pass with `-SeedCounterparty -ExpectFilledHistory -ExpectCashout`.

P1:

- Replace proof-only liquidity with approved runtime/local-MM liquidity policy later.
- Keep production liquidity/risk controls separate from this proof harness.

## Implementation Notes

- `scripts/seed_mobile_route_spread_counterparty.ts` now accepts `--liquidityPurpose=buy-fill|cashout-sell-fill|cleanup`.
- The script rejects mismatched maker sides for non-cleanup proof liquidity.
- `buy-fill` also forces blocking market bid cleanup so a stale cashout bid cannot cross before the buy proof rests its ask.
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` passes the explicit purpose flags at each proof step.

## Validation

- Targeted static contract test: passed.
- Direct local helper runs: passed for `buy-fill` and `cashout-sell-fill`.
- Backend health: passed on `http://127.0.0.1:3002/api/health`.

## Android Proof

Device:

- Samsung S23 / `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / model `SM-S911U1`

Evidence:

- `docs/mobile/harness/cycle-RV-local-mvp-liquidity-contract/cycle-RV-current-mvp-s23-visible-flow.json`
- `docs/mobile/screenshots/cycle-RV-local-mvp-liquidity-contract/cycle-RV-current-mvp-home.png`
- `docs/mobile/screenshots/cycle-RV-local-mvp-liquidity-contract/cycle-RV-current-mvp-detail-top.png`
- `docs/mobile/screenshots/cycle-RV-local-mvp-liquidity-contract/cycle-RV-current-mvp-lines.png`
- `docs/mobile/screenshots/cycle-RV-local-mvp-liquidity-contract/cycle-RV-current-mvp-ticket-ready.png`
- `docs/mobile/screenshots/cycle-RV-local-mvp-liquidity-contract/cycle-RV-current-mvp-after-submit.png`
- `docs/mobile/screenshots/cycle-RV-local-mvp-liquidity-contract/cycle-RV-current-mvp-line-cashout-ticket.png`
- `docs/mobile/screenshots/cycle-RV-local-mvp-liquidity-contract/cycle-RV-current-mvp-line-cashout-history.png`

## Audit Gate

Result: Pass.

Unresolved P0: 0.

Remaining P1:

- Replace proof-only liquidity with approved runtime/local-MM liquidity policy later.
