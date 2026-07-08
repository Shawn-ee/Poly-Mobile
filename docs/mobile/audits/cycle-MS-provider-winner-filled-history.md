# Cycle MS - Provider Winner Filled History

## Scope

Provider-backed Regulation Winner filled fake-token lifecycle on Samsung S23.

This cycle does not work on order book UI, chat, live stats, social features, backend schema, or non-MVP polish.

## Current Service Inspection

- Backend service is usable for the Local MVP retail flow.
- Current Home returns match events, not futures.
- Regulation Winner is provider-backed by Polymarket Gamma/CLOB-derived markets.
- Spread, Totals, and Team Total rows remain explicit `contract-fixture` local rows because inspected Polymarket events did not expose attach-ready line markets.

## Acceptance Criteria

- P0: S23 proof opens Home -> Event Detail -> provider-backed 1X2 Regulation Winner -> ticket.
- P0: Ticket preserves `provider-source-polymarket`, `marketType=winner`, `line=none`, and `period=regulation`.
- P0: Swipe buy submits against valid local liquidity without changing backend order logic.
- P0: Portfolio positions show provider-backed winner identity and source badge.
- P0: History shows a filled activity row, not `No history`.
- P0: Order book/chat remain hidden from the Local MVP path.

## Implementation Result

Pass.

- Extended `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1` with a target provider market id so the filled-history proof can select a provider-backed winner outcome with valid local liquidity.
- Targeted provider market `2793741` for `argentina-vs-egypt`, which has a resting ask available in the local service.
- No backend route, schema, or order matching behavior changed.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-MS-provider-winner-filled-history/cycle-MS-provider-winner-s23-visible-flow.json`.
- Screenshots/XML: `docs/mobile/screenshots/cycle-MS-provider-winner-filled-history/`, `docs/mobile/harness/cycle-MS-provider-winner-filled-history/`.
- Tests:
  - `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1` parse check
  - `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/marketListsHomeCardSelections.test.ts`
  - `npm --prefix mobile exec tsc -- --noEmit --pretty false`

## Audit Gate

Result: Pass for focused provider-backed winner filled-history lifecycle.

Remaining P1:

- Real provider-backed Spread/Totals/Team Total line markets remain unavailable for inspected events.
- Next product cycles should improve visible Local MVP user flow only when the change materially advances Home -> Event Detail -> line market -> ticket -> fake-token order -> Portfolio/history.
