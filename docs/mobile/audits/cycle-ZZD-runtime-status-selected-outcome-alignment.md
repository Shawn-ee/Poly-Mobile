# Cycle ZZD - Runtime Status Selected Outcome Alignment

## Scope

Backend Live Runtime Survey + One Event Live Pipeline.

This cycle closes the remaining status-surface gap after Cycle ZZC. The local runtime status API and completion audit now use the current maker-selected outcome rather than older live-proof outcome metadata.

## Issue

After Cycle ZZC, `npm run mobile:one-event-runtime-status` and the phase audit correctly selected the maker-seeded `Over 2.5` outcome. However:

- `GET /api/internal/live-runtime/status` still exposed `phaseAudit.selectedMarket`, which could be older `Over +2.5` metadata.
- `npm run mobile:live-runtime-completion-audit` only checked generic `quoteRouteHealthy` and `makerSeedPassed`.

That left a possible false-green operator surface even though the lower-level phase gate was stricter.

## Implementation

- `src/server/services/liveRuntimeStatus.ts`
  - Prefers `phaseAudit.currentSelectedMarket`.
  - Falls back to legacy `phaseAudit.selectedMarket` and completion summary fields only when current selected market evidence is absent.
  - Exposes the current selected outcome under `selectedMarket`.

- `scripts/report_holiwyn_live_runtime_completion_audit.ts`
  - Requires runtime-status checks:
    - `selectedOutcomeQuoteFound`
    - `selectedOutcomeBidVisible`
    - `selectedOutcomeAskVisible`
  - Keeps the completion audit from passing on route `200` alone.

## Proof

- `npm run mobile:live-runtime-completion-audit`
- `npm run mobile:one-event-runtime-status`
- `npm run mobile:one-event-phase-audit`
- `npx jest --runInBand src/__tests__/liveRuntimeStatus.service.test.ts src/__tests__/internal.live-runtime.status.route.test.ts`

## Result

- Completion audit: pass.
- Runtime status: pass.
- Phase audit: pass.
- `GET /api/internal/live-runtime/status` now reports selected outcome `Over 2.5` with current outcome id `8720dab4-70ff-44d0-8d74-5fcff36f8420`.
- Selected quote route shows bid `0.58` and ask `0.6`.

## Remaining Gaps

- P0: none for selected-outcome runtime status alignment.
- P1: installed unattended service ownership.
- P1: production official-result auto-settlement.
- P2: multi-event provider polling.
