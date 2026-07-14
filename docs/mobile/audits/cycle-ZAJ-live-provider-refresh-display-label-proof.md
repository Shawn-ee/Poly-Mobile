# Cycle ZAJ - Live Provider Refresh Display Label Proof

Date: 2026-07-14

## Scope

Bounded live-provider refresh proof for the current internal tester event, Spain vs. France, plus proof-script cleanup so tester-facing selected-market evidence uses the same clean prediction-market label that mobile displays.

This cycle did not change the mobile UI, order routes, schemas, order book UI, chat, live stats, or settlement behavior.

## Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Live refresh preflight | Pass, no quota spent | `docs/mobile/harness/odds-api-live-runtime/live-odds-refresh-preflight-summary.redacted.json` |
| Secret/key handling | Pass, key read from ignored runtime secret file and not printed | `docs/mobile/harness/odds-api-live-runtime/live-provider-key-preflight.redacted.json` |
| Live provider refresh | Pass, bounded quota spend | `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json` |
| Local maker reseed | Pass, no provider quota spent | `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json` |
| Ordered live-runtime audit gate | Pass, no P0 gaps | `docs/mobile/harness/odds-api-live-runtime/live-runtime-audit-gate-summary.redacted.json` |

## Provider Refresh Result

- Event: Spain vs. France
- Sport: `soccer_fifa_world_cup`
- Local slug: `odds-api-single-soccer-test`
- Provider event id: `f9aa13a662d1658e5a02cfc06d6a2d73`
- Selected market: Total Goals 2.5
- Tester-facing selected outcome: `Over 2.5`
- Raw provider/reference outcome label retained as: `Over +2.5`
- Selected market id: `78ea76f1-fc8f-419b-ac21-2554d79093f6`
- Selected outcome id: `30fbc915-74ca-4809-a0c4-cd54c3236aa4`
- Provider refresh cost: 13 credits
- Quota after refresh: 268 requests remaining

## Behavior Confirmed

- The event was stale/refresh-due before the explicit provider refresh.
- After refresh, quote and runtime proof returned ready provider-backed data.
- The local shifted maker reseed produced quote-visible liquidity for the selected provider-backed market.
- No-quota maker/status proof summaries now distinguish clean mobile display labels from raw provider labels:
  - `outcomeName`: clean tester/mobile label, for example `Over 2.5`
  - `referenceOutcomeLabel`: raw provider label, for example `Over +2.5`
- The quota-spending live refresh artifact still contains the raw provider label because it was generated before the proof-label cleanup. It is retained as provider evidence; the later no-quota maker/status artifacts are the current tester-facing label proof.

## Acceptance Result

| Priority | Status | Notes |
| --- | --- | --- |
| P0 | Pass | Bounded live refresh, provider-backed selected market, maker quote proof, and ordered audit gate all pass. |
| P1 | Open | Installed unattended provider/maker/lifecycle service ownership remains unresolved. Production official-result auto-settlement remains guarded and unresolved. |
| P2 | Open | Multi-event polling and production operator dashboard remain out of scope for this local tester milestone. |

## Validation Commands

```text
npm run mobile:live-odds-refresh-preflight
npm run mobile:one-event-live-runtime:provider-secret
npm run mobile:one-event-live-maker-seed
npm run mobile:live-runtime-audit-gate
npx tsc --noEmit --pretty false --incremental false
```
