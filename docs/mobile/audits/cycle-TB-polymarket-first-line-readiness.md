# Cycle TB - Polymarket-First Line Readiness Audit

## Scope

Backend/provider readiness for compact live line markets used by the Local MVP path:

Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token order -> Portfolio/history.

No visible mobile UI was changed in this cycle. Order book UI, chat, live stats, social features, deposits, and non-MVP polish remain out of scope.

## Reference Behavior

The current product direction is Polymarket-first. For Polymarket parity, a live line market should be considered primary-provider ready when the mobile backend route can expose:

- market `referenceSource=polymarket`
- market `externalMarketId` or `conditionId`
- active outcomes with Polymarket token IDs

Optic Odds can enrich line identity later, but missing `OPTIC_ODDS_API_KEY` must not block the current Polymarket parity milestone.

## Acceptance Criteria

### P0

- Missing Optic Odds configuration is not treated as a P0 blocker.
- `summarizeLineProviderIdentityReadiness()` reports Polymarket-backed compact line markets as ready when the route-visible market and outcome identities are present.
- Optional external line-provider identity remains available as enrichment and can still be validated strictly.
- Invalid external reviews are still blocked by the validation gate.
- Proof output records `primaryProvider=polymarket-gamma-clob` and `opticOddsRequiredForCurrentMilestone=false`.

### P1

- More real attach-ready Polymarket soccer line markets should be imported/normalized for actual World Cup match events.
- Provider readiness should be surfaced in later route proofs for the exact current MVP match, not only seeded provider-breadth events.

### P2

- Rename legacy line-provider proof language away from Optic-specific wording where it is only describing optional enrichment.

## Implementation Summary

- `src/server/services/mobileLiveLineProviderIdentityReview.ts` now separates primary Polymarket line readiness from optional external line-provider enrichment.
- `scripts/prove_mobile_line_provider_identity_review.ts` records provider policy and accepts Polymarket-first terminal readiness.
- `src/__tests__/mobile-live-line-provider-identity-review.test.ts` covers Polymarket-first readiness and optional external enrichment independently.

## Proof

- Event used: `mobile-el-a-provider-breadth-75321796`
- Proof file: `docs/mobile/harness/cycle-TB-polymarket-first-line-readiness/cycle-TB-line-provider-identity-review.json`
- Result: pass
- Initial route-visible readiness:
  - `lineMarketCount=7`
  - `polymarketLineMarketReadyCount=7`
  - `lineProviderReadyMarketCount=7`
  - `nextRequiredAction=polymarket_line_markets_ready`
- Database mutation: false

## Remaining Gaps

- P1: The current human-facing MVP match still needs more real attach-ready Polymarket spread/totals/team-total markets when Polymarket exposes them.
- P1: If Polymarket does not expose a line family, the backend should report unavailable with a clear source/status reason instead of silently relying on arbitrary local mocks.
- P2: Older audit docs may still mention Optic Odds as the next enrichment path; those notes should be read as historical unless they are tied to current pass criteria.
