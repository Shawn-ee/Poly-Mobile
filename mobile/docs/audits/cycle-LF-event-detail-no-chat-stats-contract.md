# Cycle LF - Event Detail No Chat/Stats Contract

Gate status: Pass

Scope: Backend/data-contract gate for leftover Event Detail chat and fake stats code. This cycle removes dead chat UI implementation and frontend-invented volume/liquidity/trader stats from Event Detail while keeping primary outcomes, user position, Game Lines, Player Props placeholder, and backend market summary metadata.

## P0 Checklist

- Event Detail source does not carry chat UI.
- Event Detail source does not carry chat reactions, typing, input, or sticky chat outcomes.
- Event Detail does not compute fake volume, liquidity, or trader counts.
- Event Detail keeps focused primary outcomes, Game Lines, Player Props placeholder, and market summary metadata.
- No order book, live stats, portfolio redesign, deposit, withdrawal, or broad schema work was added.

## Evidence

- Proof: `docs/mobile/harness/cycle-LF-event-detail-no-chat-stats-contract/cycle-LF-event-detail-no-chat-stats-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_no_chat_stats_contract.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/eventDetailNoChatStatsContract.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Event Detail no chat/stats contract.
- Remaining P1: route-backed real discovery/stat metadata only if the Event Detail surface explicitly expands to show those values.
