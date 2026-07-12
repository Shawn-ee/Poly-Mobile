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
- Summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`
- Result: pass.
- Provider event: Spain vs. France, `soccer_fifa_world_cup`, starts `2026-07-14T19:00:00Z`.
- Selected local market: Total Goals 2.5.
- Provider reference: bid `0.4891`, ask `0.5291`.
- Local maker quote: bid `0.47`, ask `0.55`, shifted worse than provider by two ticks.
- Trading proof: fake-token buy filled, Portfolio position appeared, sell/cashout filled, History contained both trades.
- Continuous status: still bounded proof mode, not an unattended production bot.
