# Cycle TC - Line Provider Unavailable Contract

## Scope

Local MVP route contract for current World Cup Event Detail line markets.

This cycle does not add order book, chat, live stats, social features, watchlists, deposits, or cosmetic-only polish. It tightens the backend/mobile contract so the app can clearly distinguish:

- provider-backed Polymarket regulation winner markets
- contract-shaped Holiwyn line fixtures used for local MVP testing
- expected line families that are unavailable from Polymarket for the current match

## Reference Audit

Current match:

- Holiwyn event: `argentina-vs-egypt`
- Polymarket Gamma event: `fifwc-arg-egy-2026-07-07`

Gamma currently returns 3 match-winner markets:

- Argentina win
- Draw
- Egypt win

Gamma returns 0 attach-ready line markets for the event. The route therefore must not pretend spread/totals/team-total rows are Polymarket-backed.

## Acceptance Criteria

### P0

- `/api/mobile/events/:slug/live-detail` keeps regulation winner marked `provider-backed`.
- Line-market source summary keeps line status `contract-fixture` when only local MVP fixtures exist.
- Provider availability lists expected MVP line families: `spread`, `total`, `team_total`.
- Provider availability lists those families under `providerUnavailableFamilies`.
- Fixture-backed families are listed under `fixtureOnlyFamilies`.
- `missingFamilies` is empty when Holiwyn has fixture coverage for each expected family.
- Event Detail Android XML exposes the new family markers audit-only, without adding visible debug copy.

### P1

- Replace fixture-backed line families with real Polymarket mappings when Polymarket exposes attach-ready spread/totals/team-total markets.
- If Polymarket continues not exposing a line family, keep the unavailable reason explicit instead of hiding it behind generic fixture labels.

## Implementation Summary

- `src/server/services/mobileLiveEventDetail.ts` now emits `expectedFamilies`, `providerUnavailableFamilies`, `fixtureOnlyFamilies`, and `missingFamilies` in `lineMarkets.providerAvailability`.
- `mobile/src/types.ts` and `mobile/src/mocks/worldCup.ts` were updated so server and mock modes share the same contract shape.
- `mobile/src/components/EventDetail.tsx` adds audit-only accessibility markers for these family lists.
- `scripts/prove_mobile_provider_match_line_availability.ts` now asserts the new contract fields.
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` now requires the new markers during S23 source-disclosure proof.

## Proof

- Provider route proof: `docs/mobile/harness/cycle-TC-line-provider-unavailable-contract/cycle-TC-provider-match-line-availability.json`
- S23 proof summary: `docs/mobile/harness/cycle-TC-line-provider-unavailable-contract/cycle-TC-current-mvp-s23-visible-flow.json`
- S23 device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`
- S23 proof mode: source-disclosure-only, no order submit
- Result: pass

## Remaining Gaps

- P1: current MVP match still has no real Polymarket spread/totals/team-total markets.
- P1: full order lifecycle still uses contract-fixture line rows for this match; prior order/portfolio proofs cover the flow, but provider parity remains incomplete until real line mappings exist or a secondary provider contract is approved.
