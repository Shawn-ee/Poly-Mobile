# Cycle ZAS - Two-Sided Maker Liquidity Refresh

## Scope

Refresh local shifted maker liquidity for the current internal tester event after the S23 cashout proof consumed the visible ask side.

Target event:

- Event: Spain vs. France
- Event slug: `odds-api-single-soccer-test`
- Selected market: `Spain vs. France: Total Goals 2.5`
- Selected outcome: `Over 2.5`
- Provider/source: The Odds API sportsbook snapshot, local fake-token maker liquidity

## Problem Found

`npm run mobile:one-event-runtime-status -- --json` failed with P0 `selectedOutcomeAskVisible`.

The selected outcome still had sell/cashout bid liquidity, but the buy-side ask had been consumed by the previous mobile cashout/order proof. That left the runtime locally tradable for cashout, but not fully ready for the next internal tester buy path.

## Action

Ran the local no-provider-quota maker seed:

`npm run mobile:one-event-live-maker-seed`

This reseeded resting shifted maker quotes for the selected sportsbook-backed market:

- bid: `0.58`
- ask: `0.60`
- ask size: `200`
- provider reference bid/ask: `0.54` / `0.58`
- quote offset: `2` ticks

No provider API quota was spent by this reseed command.

## Evidence

- Maker seed summary: `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`
- Runtime status summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`

Fresh runtime status passed with:

- `selectedOutcomeQuoteFound: true`
- `selectedOutcomeBidVisible: true`
- `selectedOutcomeAskVisible: true`
- P0 gaps: none
- Current managed supervisor/result-poller loops: running
- Quota-spending loop: false

## Runtime Truth

Current local tester runtime is foreground/local, not an installed unattended service.

- Backend: healthy on `3002`
- Supervisor process: running, continuous, no provider quota
- Result poller process: running, continuous, no provider quota
- Live provider refresh: explicit, quota-capped, not part of cached runtime by default
- Market maker: reseed path is proven and can be run by the local runtime/supervisor path, but this cycle manually refreshed the selected market after proof consumption

## Remaining Gaps

- P0: none for current selected-market buy/sell readiness.
- P1: installed unattended service ownership remains future work.
- P1: official-result automatic settlement remains guarded/manual; execution requires CLOSED market and exact approval.
- P2: multi-event provider polling and inventory-aware multi-market quoting remain future work.
