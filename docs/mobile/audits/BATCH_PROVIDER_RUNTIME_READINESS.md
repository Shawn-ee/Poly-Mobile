# Batch Provider Runtime Readiness

Date: 2026-07-11

Branch: `batch/provider-runtime-readiness`

Scope: Local MVP provider/runtime readiness only. No user-facing order book, chat, live stats, social, deposit, withdraw, or visual polish work.

## Summary

The Local MVP fake-token flow remains testable through contract-shaped line markets, but the current provider-backed Regulation Winner markets are not ready for local market-maker trading.

The readiness gate now reports the exact provider snapshot blockers instead of only `snapshot_not_ready`.

## Evidence

- Initial readiness inspection: `docs/mobile/harness/provider-runtime-readiness/current-detailed-readiness.json`
- Fresh Polymarket snapshot refresh: `npm run reference:snapshot-refresh -- --once true --eventSlug argentina-vs-egypt`
- After-refresh readiness inspection: `docs/mobile/harness/provider-runtime-readiness/current-after-refresh-detailed-readiness.json`

## Current State

- Mobile-visible events: 1
- Mobile-visible provider events: 1
- Provider-backed markets inspected: 3
- Snapshot-ready provider markets: 0
- Local-MM-ready provider markets: 0
- Fresh snapshot pull updated 6 outcome snapshots.

## Provider Snapshot Blockers After Refresh

| Blocker | Count | Meaning |
| --- | ---: | --- |
| `snapshot_missing_bid` | 2 | Two markets have no usable bid side from Polymarket CLOB/reference data. |
| `snapshot_not_accepting_orders` | 3 | Polymarket does not currently expose these markets as usable accepting-order books for our local MM gate. |
| `snapshot_not_mm_eligible` | 3 | The quote planner correctly refuses to seed local MM from these snapshots. |
| `snapshot_reason_reference_missing_book` | 2 | Provider refresh classified two markets as missing usable order books. |
| `snapshot_quality_missing_book` | 2 | Same missing-book quality classification, exposed in the readiness report. |
| `snapshot_reason_reference_invalid_price` | 1 | One market is at an edge price and is unsafe for local MM. |
| `snapshot_quality_invalid_price` | 1 | Same invalid-price quality classification, exposed in the readiness report. |

## Audit Result

P1 still open: provider-backed local-MM readiness is not available for `argentina-vs-egypt`.

This is not a blocker for internal Local MVP fixture-line testing because the proven path uses contract-shaped local line markets and seeded fake-token liquidity. It is a blocker for claiming provider-backed winner markets are local-MM-ready.

## Recommended Next Batch

1. Import or discover another match-only Polymarket event with non-edge, accepting-order books.
2. Refresh snapshots for the new allowlist.
3. Re-run `scripts/check_poly_internal_exchange_readiness.ts`.
4. Only seed/enable bot liquidity when at least one provider market reports no snapshot blockers.

Follow-up result: `docs/mobile/audits/BATCH_PROVIDER_MATCH_BREADTH.md` adds a match-only scanner and confirms the currently scanned World Cup team-match events still have zero usable accepting-order provider books. Do not satisfy match breadth with World Cup Winner futures or player props.
