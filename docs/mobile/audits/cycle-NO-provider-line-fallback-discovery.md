# Cycle NO - Provider Line Fallback Discovery

## Scope

Backend/provider discovery hardening for the Local MVP line-market gap.

This cycle does not claim visible UI parity and does not replace fixture lines. It improves the provider discovery path so Holiwyn searches realistic Polymarket line-family slug fallbacks before deciding that backend `contract-fixture` lines must remain.

## Problem

The current `argentina-vs-egypt` mobile event has:

- 3 provider-backed Polymarket Regulation Winner markets.
- 4 backend `contract-fixture` line markets for Spread/Totals/Team Totals.
- 0 provider-backed Polymarket line markets attached.

Inspection found the manual slug fallback generator only produced exact match-winner slugs. That meant line-family candidates such as spread, handicap, total goals, over/under, team total, and team-goal slugs were not searched through the same exact fallback path.

## Acceptance Criteria

| Criterion ID | Priority | Expected behavior | Result |
| --- | --- | --- | --- |
| NO-P0-01 | P0 | Manual Polymarket slug fallback generation covers match-winner, spread, total goals, and team-total line families. | Pass |
| NO-P0-02 | P0 | Exact event match-winner candidates remain attach-ready. | Pass |
| NO-P0-03 | P0 | World Cup outright winner candidates cannot attach to match-specific winner markets. | Pass |
| NO-P0-04 | P0 | Line targets do not attach wrong-family match-winner candidates. | Pass |
| NO-P0-05 | P0 | Current Gamma event availability proof still reports 0 real provider-backed line markets for `argentina-vs-egypt`. | Pass |
| NO-P1-01 | P1 | Replace fixture lines with provider-backed Polymarket line markets. | Partial - still unavailable |

## Implementation

Changed:

- `src/server/services/mobileLiveProviderCandidates.ts`
- `src/__tests__/mobile-live-provider-candidates.service.test.ts`
- `scripts/prove_mobile_mvp_provider_discovery_guard.ts`

Behavior changes:

- `buildProviderCandidateManualSlugFallbacks()` now generates conservative line-family fallback slugs for:
  - Spread/handicap.
  - Total goals / over-under.
  - Team total/team goals.
  - First half, second half, corners, and correct score where those families appear.
- Match-winner relevance now requires two-outcome match-specific candidates to pass the strict subject/event-context check.
- This prevents broad World Cup outright markets such as `will-argentina-win-the-2026-fifa-world-cup-*` from attaching to `Argentina vs Egypt` match-winner markets.

## Proof

Primary evidence:

- `docs/mobile/harness/cycle-NO-provider-line-fallback-discovery/cycle-NO-provider-discovery-guard.json`
- `docs/mobile/harness/cycle-NO-provider-line-fallback-discovery/cycle-NO-provider-match-line-availability.json`

Key proof results:

- `matchWinnerAttachReadyCount`: 3
- `unsafeOutrightAttachCount`: 0
- `lineTargetCount`: 4
- `attachReadyLineTargetCount`: 0
- `lineWrongFamilyRejectionCount`: 4
- Current Gamma event line market count: 0
- Current route line market status: `contract-fixture`

## Validation

- `npx jest src/__tests__/mobile-live-provider-candidates.service.test.ts --runInBand`: pass.
- `npx tsc --noEmit --pretty false --project tsconfig.json`: pass.
- `scripts/prove_mobile_mvp_provider_discovery_guard.ts`: pass.
- `scripts/prove_mobile_provider_match_line_availability.ts`: pass.

## Device Proof

No new Android UI proof was required for this backend/provider cycle because the mobile UI did not change. The latest S23 visible proof remains Cycle NN for the Local MVP line buy/cashout user flow.

## Audit Gate

Pass for provider discovery hardening.

Not a Polymarket line-market parity pass. Current Spread/Totals/Team Total markets remain backend `contract-fixture` rows until Polymarket exposes attach-ready line markets for the event or another approved provider source is configured.
