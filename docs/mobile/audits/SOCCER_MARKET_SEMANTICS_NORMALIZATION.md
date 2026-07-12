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
| Clean half-goal totals/spreads | Main spread UI hides duplicative `±0.5` lines and keeps `±1.5`, `±2.5`, `±3.5`; totals expose a fuller `0.5`, `1.5`, `2.5`, `3.5`, `4.5`, `5.5` ladder. | Same focused test files plus S23 proof |
| Trading flow compatibility | Market/outcome/line/provider identity remains preserved for quote/order/Portfolio routes. | Existing internal readiness and mobile order proof harnesses |

## Implementation Notes

- Kalshi-style reference behavior treats knockout advancement as a separate no-draw prediction question. Holiwyn now uses a Holiwyn-owned `Team to advance` fake-token contract for the top primary buttons when the temporary sportsbook provider only supplies regulation-time h2h odds.
- Regulation Time Winner stays available lower in Game Lines with Draw preserved.
- Spread `-0.5` duplicates regulation winner, while spread `+0.5` is closer to a double-chance style contract. Both are hidden from the main spread ladder for MVP clarity; they can be added later as separate named markets if desired.
- The temporary sportsbook proof now prefers a visible totals line instead of reinforcing the old sportsbook `0.5` spread path.
- Raw provider identity is preserved in metadata through `providerMarketType`, `providerSource`, and `mobileDisplayPolicy`.
- New imports filter mobile-visible markets at normalization time.
- Existing seeded raw line rows are filtered again in `selectCompactLiveMarkets`, so the app can improve without requiring a local DB reset.
- No backend schema migration was required; event-level soccer semantics use existing JSON metadata plus route serialization.

## S23 Proof

- Home knockout card: `docs/mobile/harness/s23-soccer-semantics-home-after-restart.png`
- Event Detail top and spread ladder: `docs/mobile/harness/s23-soccer-semantics-detail-top.png`

## Remaining Gaps

- P1: Add a real provider-backed team-to-advance market when available.
- P1: Add a durable raw sportsbook audit table only if we need to retain every hidden raw line without creating public `Market` rows.
- P2: Add richer admin/debug visibility for hidden provider lines behind a non-user-facing flag.
