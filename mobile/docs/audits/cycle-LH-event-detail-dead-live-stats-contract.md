# Cycle LH - Event Detail Dead Live Stats Contract

Gate status: Pass

Scope: Backend/data-contract cleanup for dead Event Detail live sports-stat UI. This cycle removes the unreachable fake live stats panel, deterministic stat rows, and match-flow timeline from source while preserving backend route-status markers, primary outcomes, user position, Game Lines, and Player Props placeholder.

## P0 Checklist

- Event Detail source does not carry fake live sports-stat rows.
- Event Detail source does not carry a dead live stats panel or match-flow timeline.
- Event Detail still preserves hidden route-status metadata for backend live/provider state.
- Event Detail keeps primary outcomes, Game Lines, user position, and Player Props placeholder.
- No order book, chat, live stats product, portfolio redesign, deposit, withdrawal, or broad schema work was added.

## Evidence

- Proof: `docs/mobile/harness/cycle-LH-event-detail-dead-live-stats-contract/cycle-LH-event-detail-dead-live-stats-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_dead_live_stats_contract.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/eventDetailDeadLiveStatsContract.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Event Detail dead live stats contract.
- Remaining P1: route-backed real sports/live stats only if the MVP explicitly expands to a live-stat product surface.
