# Soccer Market Semantics Normalization

Date: 2026-07-12

## Scope

Fix the Odds API soccer import and mobile event contracts so Holiwyn shows clean prediction-market semantics instead of raw sportsbook lines.

## Acceptance Proof Cases

| Case | Expected result | Proof |
| --- | --- | --- |
| Must-advance event | Top primary profile is `advance`; Draw is not promoted as a top advance button unless a true advance market exists. | `src/__tests__/mobile-live-event-detail.test.ts` |
| Regulation 90-minute event | `resultMode=can_draw_90`; Draw remains valid for Regulation Time Winner. | `src/__tests__/mobile-event-market-rules-contract.test.ts` |
| Quarter spread lines | `0.25` and `0.75` handicap lines are hidden from compact mobile markets. | `src/__tests__/mobile.the-odds-api-single-event.contract.test.ts` and `src/__tests__/mobile-live-event-detail.test.ts` |
| Asian total lines | `1.75`, `2.0`, and `2.25` totals are hidden from compact mobile markets. | `src/__tests__/mobile.the-odds-api-single-event.contract.test.ts` |
| Clean half-goal totals/spreads | Clean lines such as spread `1.5` and total `2.5` remain mobile-visible. | Same focused test files |
| Trading flow compatibility | Market/outcome/line/provider identity remains preserved for quote/order/Portfolio routes. | Existing internal readiness and mobile order proof harnesses |

## Implementation Notes

- Raw provider identity is preserved in metadata through `providerMarketType`, `providerSource`, and `mobileDisplayPolicy`.
- New imports filter mobile-visible markets at normalization time.
- Existing seeded raw line rows are filtered again in `selectCompactLiveMarkets`, so the app can improve without requiring a local DB reset.
- No backend schema migration was required; event-level soccer semantics use existing JSON metadata plus route serialization.

## Remaining Gaps

- P1: Add a real provider-backed team-to-advance market when available.
- P1: Add a durable raw sportsbook audit table only if we need to retain every hidden raw line without creating public `Market` rows.
- P2: Add richer admin/debug visibility for hidden provider lines behind a non-user-facing flag.
