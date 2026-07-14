# Cycle ZBP - Runtime Evidence Recovery

Date: 2026-07-14

Scope: recover the local one-event live-runtime evidence for the backend-owned Odds API event after focused backend tests reset the local development database.

## Event

- Event: Spain vs. France
- Local slug: `odds-api-single-soccer-test`
- Provider: The Odds API
- Selected proof market: `Spain vs. France: Total Goals 2.5`
- Selected proof outcome: `Over 2.5`
- Mobile trading mode: fake-token local trading
- Provider quota used by this recovery: no

## What Broke

The runtime status gate initially failed because the selected market quote route returned `404 Market not found`. The local event and durable runtime rows had been removed by a backend test run that used the local development database instead of an isolated test database.

## Recovery Actions

- Restored the one-event Spain vs. France market set from cached live-runtime evidence.
- Re-applied one-event data hygiene.
- Re-seeded shifted local market-maker quotes for `Total Goals 2.5`.
- Re-recorded the durable provider refresh run from the existing redacted live-provider proof.
- Re-ran the shifted maker seed twice so `MarketMakerQuoteRun` proves repeated local runs.
- Re-ran bounded no-quota supervisor and result-poller proofs so `RuntimeServiceHeartbeat` and `RuntimeServiceRun` evidence exists again.
- Re-ran the ordered live-runtime audit gate and internal tester readiness gate.

## Evidence

- Runtime status: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- Live runtime audit gate: `docs/mobile/harness/odds-api-live-runtime/live-runtime-audit-gate-summary.redacted.json`
- Completion audit: `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`
- Internal tester readiness gate: `docs/mobile/harness/odds-api-live-runtime/internal-tester-readiness-gate-summary.redacted.json`
- Cached restore: `docs/mobile/harness/odds-api-live-runtime/one-event-cached-restore-summary.redacted.json`
- Maker quote proof: `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`
- Supervisor proof: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-summary.redacted.json`
- Result poller proof: `docs/mobile/harness/odds-api-live-runtime/one-event-result-poller-summary.redacted.json`
- Fresh S23 visible flow: `docs/mobile/harness/cycle-ZBP-odds-api-s23-visible-flow/cycle-ZBP-odds-api-s23-visible-flow.json`
- Fresh S23 screenshots: `docs/mobile/screenshots/cycle-ZBP-odds-api-s23-visible-flow/`

## Acceptance Results

| Requirement | Result |
| --- | --- |
| Backend health on port 3002 | Pass |
| Spain vs. France event restored | Pass |
| Selected market quote route healthy | Pass |
| Selected outcome bid visible | Pass |
| Selected outcome ask visible | Pass |
| Provider refresh run durability restored | Pass |
| Market maker quote run durability restored | Pass |
| Runtime heartbeat/run durability restored | Pass |
| Ordered live-runtime audit gate | Pass |
| Internal tester readiness gate | Pass |
| S23 Home -> Event Detail -> Buy -> Portfolio -> Cashout -> History | Pass |
| Cashout Max uses owned shares, not wallet balance | Pass: `43.1` shares |
| Cashout ticket hides Yes/No selector | Pass |

## S23 Cashout Proof

The fresh S23 proof ran on `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / `SM-S911U1`.

- Event: `Spain vs. France`
- Market: `Spain vs. France: Total Goals 2.5`
- Outcome: `Over 2.5`
- Market ID: `78ea76f1-fc8f-419b-ac21-2554d79093f6`
- Outcome ID: `b6066039-6c5a-47f1-bbc4-91cad4eb5bd1`
- Cashout Max amount shown on phone: `43.1 SHARES`
- Cashout helper shown on phone: `Sell up to 43.1 shares`
- Cashout proceeds line shown on phone: `Estimated proceeds $25`
- Wallet-sized cashout amount check: no `$9000` or `$10000` cashout amount appeared in the S23 cashout ticket.

## Remaining Gaps

- P0: none for local internal tester runtime readiness.
- P1: installed unattended provider/maker/lifecycle service remains open.
- P1: production official-result auto-settlement remains open; active-event execution is still guarded by CLOSED market status and exact confirmation.
- P2: multi-event provider polling and production dashboard/operator UI remain future work.

## Validation

- `npx tsc --noEmit --pretty false --incremental false` - pass.
- `npm --prefix mobile run typecheck` - pass.
- `npm run test:ci` - pass, 35 suites / 177 tests.
- `npm run mobile:live-runtime-audit-gate` - pass.
- `npm run mobile:internal-tester-readiness-gate` - pass.
- `powershell -ExecutionPolicy Bypass -File scripts/prove_mobile_odds_api_s23_visible_flow.ps1 -Device "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp" -Cycle "ZBP"` - pass.
