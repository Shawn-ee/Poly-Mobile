# Cycle ZAL - Live Runtime Evidence Reconciliation

Date: 2026-07-14

## Scope

Reconcile human-readable live-runtime docs with the latest committed audit evidence. This cycle does not change runtime code, provider behavior, mobile UI, order routes, settlement logic, or device proof.

## Why This Matters

The audit JSON summaries already report the current one-event runtime truth, but a few prose docs still contained older provider quota and maker-price values. Stale prose can mislead the next operator cycle, so this cycle updates the docs to match the current authoritative evidence.

## Authoritative Evidence

| Item | Current value | Evidence |
| --- | --- | --- |
| Event | Spain vs. France | `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json` |
| Selected market | Total Goals 2.5 | `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json` |
| Selected outcome | `Over 2.5` | `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json` |
| Provider proof cost | 13 credits | `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json` |
| Provider quota remaining | 268 requests | `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json` |
| Provider reference bid/ask | `0.4839` / `0.5239` | `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json` |
| Local maker bid/ask | `0.46` / `0.54` | `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json` |
| Internal tester readiness | Pass, no quota spent | `docs/mobile/harness/odds-api-live-runtime/internal-tester-readiness-gate-summary.redacted.json` |

## Updated Docs

- `docs/mobile/BACKEND_LIVE_RUNTIME_PHASE_CLOSEOUT.md`
- `docs/mobile/LIVE_RUNTIME_GAP_LIST.md`
- `docs/mobile/ODDS_PROVIDER_REFRESH_POLICY.md`
- `docs/mobile/FUNCTION_IMPLEMENTATION_LOG.md`

## Acceptance Result

| Priority | Status | Notes |
| --- | --- | --- |
| P0 | Pass | Human-readable docs now agree with current committed audit evidence for provider quota, selected market/outcome, maker prices, and latest proof cycle names. |
| P1 | Open | Installed unattended provider/maker/lifecycle service ownership and production official-result auto-settlement remain open. |
| P2 | Open | Multi-event polling and production operator dashboard remain future work. |

