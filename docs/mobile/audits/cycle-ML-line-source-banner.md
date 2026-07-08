# Cycle ML - Game Lines Source Banner

## Scope

Event Detail Game Lines source honesty for the Local MVP retail betting flow.

This cycle does not work on order book UI, chat, live stats, social features, backend schema, or provider-line breadth.

## Reference/Acceptance

After Cycle MK, the current route state is:

- Regulation Winner / match-winner: provider-backed.
- Spread/Totals/Team Total: backend-shaped `contract-fixture` rows.

Acceptance criteria:

- P0: Mobile must preserve backend `marketSourceSummary`.
- P0: Event Detail Game Lines must visibly disclose contract-fixture line state when present.
- P0: S23 proof must show the source banner and still complete the MVP ticket/order/Portfolio flow.
- P1: Replace the contract-fixture line state with real provider-backed line markets when attach-ready candidates exist.

## Implementation Result

Pass for focused P0 scope.

- Added `marketSourceSummary` to mobile backend and mock event types.
- Preserved `marketSourceSummary` in `normalizeEventSummary`.
- Added Event Detail Game Lines banner copy for provider-backed, contract-fixture, missing, and unknown line source states.
- Added focused adapter test.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-ML-line-source-banner/cycle-ML-current-mvp-s23-visible-flow.json`.
- S23 screenshots: `docs/mobile/screenshots/cycle-ML-line-source-banner/`.
- S23 XML proof: `docs/mobile/harness/cycle-ML-line-source-banner/cycle-ML-current-mvp-lines-settled.xml`.
- Focused test: `mobile/src/__tests__/worldCupAdapter.test.ts`.

Observed S23 marker:

- `event-detail-line-source-banner line-source-contract-fixture regulation-winner-provider-backed line-market-count-4`
- Visible text: `Winner is provider-backed. Lines use local server pricing.`

## Audit Gate

Result: Pass for focused source-honesty scope.

Remaining tracked P1:

- Real provider-backed Spread/Totals/Team Total candidates are still unavailable for `argentina-vs-egypt`.
