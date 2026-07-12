# Market Maker Live Runtime Report

## Current Status

The Local MVP has deterministic one-shot maker liquidity. A true production daemon is not yet established inside this repo.

## Existing Modes

| Mode | Status | Notes |
| --- | --- | --- |
| One-shot proof liquidity | Working | Harness creates a maker user, mints complete sets, places a resting ask for buy proof and a resting bid for cashout proof. |
| `poly-bot` continuous soak | Not self-contained | `scripts/soak_orderbook_bots.ts` imports `../../poly-bot`, which is outside this repo worktree. Do not treat it as always available. |
| Reference liquidity seeding | Polymarket-only | `referenceLiquiditySeeding.ts` rejects non-Polymarket markets. |
| Odds API local shifted maker | Added as proof mode | The one-event live proof places local bid/ask quotes around provider reference price, shifted worse by configurable ticks. |
| Odds API reusable maker seed | Added for local testing | `npm run mobile:one-event-live-maker-seed` uses the latest stored sportsbook snapshot, cancels prior local shifted-maker quotes for the selected market, and leaves a new fake-token bid/ask resting. |

## Live Proof Strategy

For a selected binary sportsbook market:

- Provider midpoint comes from latest `ReferenceQuoteSnapshot`.
- Local maker bid is provider bid shifted down by `QUOTE_OFFSET_TICKS`.
- Local maker ask is provider ask shifted up by `QUOTE_OFFSET_TICKS`.
- If only a midpoint exists, the proof builds a small local spread around it.
- The proof cancels its own previous local maker quotes before placing replacements.
- The proof does not start a permanent unattended bot by default.

## Remaining Gaps

| Gap | Priority |
| --- | --- |
| Long-lived source-aware maker daemon with risk state | P1 |
| Automatic quote replacement on every provider refresh | P1 |
| Inventory-aware maker across many markets | P2 |
| Production risk controls and monitoring | P2 |

## Latest Proof

- Command: `npm run mobile:odds-api-live-runtime-proof -- --skipSleep --refreshIterations=2 --maxCredits=16 --minRemaining=2`
- Restart/runtime command: `npm run mobile:one-event-live-runtime`
- Runtime command with maker liquidity: `npm run mobile:one-event-live-runtime -- -SeedMaker`
- Consolidated readiness command: `npm run mobile:one-event-live-readiness`
- Maker seed command: `npm run mobile:one-event-live-maker-seed`
- Lifecycle controls command: `npm run mobile:one-event-lifecycle-proof`
- Live provider wrapper command: `npm run mobile:one-event-live-runtime:provider`
- Summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`
- Runtime launch summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json`
- Maker seed summary: `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`
- Lifecycle controls summary: `docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json`
- Consolidated readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-readiness-summary.redacted.json`
- Result: pass.
- Provider event: Spain vs. France, `soccer_fifa_world_cup`, starts `2026-07-14T19:00:00Z`.
- Selected local market: Total Goals 2.5.
- Provider reference: bid `0.4891`, ask `0.5291`.
- Local maker quote: bid `0.47`, ask `0.55`, shifted worse than provider by two ticks.
- Reusable maker seed proof: quote route returned best bid `0.47` and best ask `0.55` for the selected provider-backed market after `-SeedMaker`.
- Trading proof: fake-token buy filled, Portfolio position appeared, sell/cashout filled, History contained both trades.
- S23 proof: `docs/mobile/harness/cycle-LIVEODDSS23-odds-api-live-runtime-s23/cycle-LIVEODDSS23-odds-api-s23-visible-flow.json`.
- Continuous status: still bounded proof mode, not an unattended production bot.
