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
| Odds API one-event supervisor | Added for local testing | `npm run mobile:one-event-live-supervisor` repeats runtime checks and maker reseeding while the command is running. With `-RunProviderProof`, it also runs quota-guarded live provider refresh cycles. |
| One-event runtime status report | Added for operator safety | `npm run mobile:one-event-runtime-status` reads local proof summaries and backend health/quote routes to report cached-vs-live mode, live proof freshness, quota from the last provider proof, maker quote status, and scheduler state without calling the provider. |
| Local background supervisor process | Added for internal runtime testing | `npm run mobile:one-event-live-supervisor:process -- -Action start` starts the supervisor hidden with process state/log files; status and stop wrappers are available. This is local process management, not an installed OS service. |

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
| Automatic quote replacement on every provider refresh | Partial: supervisor can reseed after each refresh while running; no installed unattended service yet. |
| Inventory-aware maker across many markets | P2 |
| Production risk controls and monitoring | P2 |

## Latest Proof

- Command: `npm run mobile:odds-api-live-runtime-proof -- --skipSleep --refreshIterations=2 --maxCredits=16 --minRemaining=2`
- Restart/runtime command: `npm run mobile:one-event-live-runtime`
- Runtime command with maker liquidity: `npm run mobile:one-event-live-runtime -- -SeedMaker`
- Consolidated readiness command: `npm run mobile:one-event-live-readiness`
- Repeated local supervisor command: `npm run mobile:one-event-live-supervisor -- -MaxIterations 2 -IntervalSeconds 1`
- Local background supervisor command: `npm run mobile:one-event-live-supervisor:process -- -Action start -Continuous -MaxIterations 0`
- Local background supervisor status/stop: `npm run mobile:one-event-live-supervisor:status`, `npm run mobile:one-event-live-supervisor:stop`
- Runtime status command: `npm run mobile:one-event-runtime-status`
- Maker seed command: `npm run mobile:one-event-live-maker-seed`
- Lifecycle controls command: `npm run mobile:one-event-lifecycle-proof`
- Settlement readiness command: `npm run mobile:one-event-settlement-readiness`
- Manual settlement dry-run command: `npm run mobile:one-event-settlement -- --winningOutcome=over`
- Live provider wrapper command: `npm run mobile:one-event-live-runtime:provider`
- Summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`
- Runtime launch summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json`
- Maker seed summary: `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`
- Lifecycle controls summary: `docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json`
- Consolidated readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-readiness-summary.redacted.json`
- Supervisor summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-summary.redacted.json`
- Supervisor process summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-process-summary.redacted.json`
- Runtime status summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- Settlement readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-readiness-summary.redacted.json`
- Manual settlement dry-run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-manual-settlement-summary.redacted.json`
- Result: pass.
- Provider event: Spain vs. France, `soccer_fifa_world_cup`, starts `2026-07-14T19:00:00Z`.
- Selected local market: Total Goals 2.5.
- Provider reference: bid `0.4891`, ask `0.5291`.
- Local maker quote: bid `0.47`, ask `0.55`, shifted worse than provider by two ticks.
- Reusable maker seed proof: quote route returned best bid `0.47` and best ask `0.55` for the selected provider-backed market after `-SeedMaker`.
- Trading proof: fake-token buy filled, Portfolio position appeared, sell/cashout filled, History contained both trades.
- Settlement readiness proof: both selected outcomes preview successfully without mutation, payout conservation passes, and automatic official-result settlement remains a separate P1 gap.
- Manual settlement proof: dry-run command selected `Over +2.5`, proved payout conservation, printed the explicit execution confirmation phrase, and left the market unresolved.
- S23 proof: `docs/mobile/harness/cycle-LIVEODDSS23-odds-api-live-runtime-s23/cycle-LIVEODDSS23-odds-api-s23-visible-flow.json`.
- Continuous status: the supervisor can run repeated local maker reseeds while it is open, but there is still no installed unattended production bot.
