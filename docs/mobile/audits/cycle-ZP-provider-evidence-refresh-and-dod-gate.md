# Cycle ZP - Provider Evidence Refresh And DoD Gate

## Scope

Refresh stale Polymarket/provider discovery evidence and keep the internal-readiness gate aligned with the current one-event Odds API bridge proof.

This cycle did not add UI features, provider imports, market schemas, order-book UI, chat, social features, or new provider quota usage for The Odds API. It refreshed the existing provider-discovery batch and corrected the final DoD sweep so it recognizes the newer internal-environment/live-runtime/S23 cashout proof for the temporary sportsbook bridge.

## Provider Evidence Refresh

- Command: `npm run mobile:internal-readiness-batch:provider-refresh`
- Result: pass.
- Backend health: pass.
- Root typecheck: pass.
- Jest CI: pass.
- Mobile typecheck: pass.
- Provider evidence freshness: fresh for the next batch window.
- Provider parity result: still P1, not P0.

Current refreshed provider facts:

- World Cup team match event count: `422`
- Usable World Cup team match event count: `0`
- Open World Cup provider event count: `59`
- Usable open non-match World Cup provider event count: `43`
- Provider line candidate count: `2484`
- Attach-ready provider line candidate count: `0`

Interpretation: do not start Polymarket-backed trading work from this evidence. Continue Local MVP testing on the backend-owned Odds API event unless a real attach-ready provider candidate appears or the provider evidence becomes stale again.

## DoD Gate Fix

The final Definition of Done sweep previously only accepted older temporary sportsbook proof files:

- `docs/mobile/harness/the-odds-api-single-event/*`
- `docs/mobile/harness/cycle-ODDSAPIS23-odds-api-s23-visible-flow/*`

That underreported the current bridge because newer proof now lives in:

- `docs/mobile/harness/the-odds-api-internal-environment/internal-environment-proof.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`
- the newest `docs/mobile/harness/cycle-*-spain-france-cashout-s23/cycle-*-odds-api-s23-visible-flow.json` proof

`scripts/mobile_definition_of_done_sweep.ts` now accepts those newer proof shapes, including cashout mode checks:

- close-position ticket opened
- Max uses owned shares
- Yes/No selector hidden for cashout
- cashout sell submitted
- Portfolio/history updated

## Fresh S23 Cashout Proof

- Command: `powershell -ExecutionPolicy Bypass -File scripts\prove_mobile_odds_api_s23_visible_flow.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Cycle ZQ -OutputDir docs\mobile\screenshots\cycle-ZQ-spain-france-cashout-s23 -HierarchyOutputDir docs\mobile\harness\cycle-ZQ-spain-france-cashout-s23`
- Device: Samsung S23, `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Event: `Spain vs. France`.
- Selected market: totals, `Over 2.5`, source `sportsbook-odds`.
- Result: pass.
- Proof summary: `docs/mobile/harness/cycle-ZQ-spain-france-cashout-s23/cycle-ZQ-odds-api-s23-visible-flow.json`.
- Cashout ticket proof: `docs/mobile/harness/cycle-ZQ-spain-france-cashout-s23/cycle-ZQ-cashout-ticket-ready.xml`.
- Screenshot proof: `docs/mobile/screenshots/cycle-ZQ-spain-france-cashout-s23/`.

Key assertions:

- Home shows the backend-owned temporary sportsbook event.
- Event Detail loads Game Lines from backend data and hides chat/order book.
- Buy flow submits and reaches Portfolio.
- Cashout opens close-position mode.
- Cashout Max uses owned shares only.
- Cashout hides the Yes/No selector.
- Cashout sell submits and History remains visible.

## Evidence

- Batch summary: `docs/mobile/harness/batch-internal-readiness-latest/internal-readiness-batch-summary.json`
- Gap list: `docs/mobile/audits/BATCH_INTERNAL_READINESS_GAP_LIST.md`
- Provider plan: `docs/mobile/harness/batch-internal-readiness-latest/provider-evidence-refresh-plan.json`
- DoD sweep: `docs/mobile/harness/cycle-current-mobile-definition-of-done-sweep.json`
- Final parity sweep: `docs/mobile/MOBILE_FINAL_PARITY_SWEEP.md`

## Result

Pass for Local MVP/internal-readiness evidence.

- DoD verified criteria: `12`
- DoD partial criteria: `1`
- Remaining partial: `dod-provider-polymarket-parity`
- P0 blockers: none

## Remaining Gaps

- P0: none for Local MVP internal tester trading.
- P1: Polymarket/provider parity remains open because refreshed provider evidence still has no attach-ready World Cup match or line markets.
- P1: Google callback/runtime consent warnings remain non-blocking for Local MVP trading.
