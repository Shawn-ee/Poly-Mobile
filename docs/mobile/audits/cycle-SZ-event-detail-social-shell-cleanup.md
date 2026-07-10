# Cycle SZ - Event Detail Social Shell Cleanup

## Scope

Local MVP Event Detail game page cleanup.

Out of scope: order book UI, chat, live stats, watchlists outside Event Detail, backend schemas, provider ingestion, order routes, Google auth, deposit/withdraw, and cosmetic-only rewrites.

## Polymarket Reference Direction

The current Holiwyn MVP is intentionally prediction/trade-first. The active product direction says the default game page should focus on World Cup match prediction, line selection, ticket entry, fake-token order placement, and Portfolio/history. Non-MVP social/share/watchlist controls should not compete with the retail trade path unless a later audit-gated milestone explicitly scopes them.

## Acceptance Criteria

| Criterion | Priority | Result | Evidence |
| --- | --- | --- | --- |
| Event Detail no longer renders the dormant share sheet. | P0 | Pass | `mobile/src/components/EventDetail.tsx`; `mobile/src/__tests__/eventDetailNoChatStatsContract.test.ts` |
| Event Detail no longer renders the dormant save/watchlist notice. | P0 | Pass | `mobile/src/components/EventDetail.tsx`; `mobile/src/__tests__/eventDetailNoChatStatsContract.test.ts` |
| Event Detail position card no longer shows a visible share icon. | P0 | Pass | `mobile/src/components/EventDetail.tsx`; focused contract test |
| Event Detail remains focused on Game, team probabilities, position card, outcome buttons, Game Lines, Player Props placeholder, ticket entry, and Portfolio/history flow. | P0 | Pass | S23 proof: `docs/mobile/harness/cycle-SZ-event-detail-social-shell-cleanup/cycle-SZ-current-mvp-s23-visible-flow.json` |
| Provider-backed spread/totals/team-total lines exist for the current match. | P1 | Open | Not part of this cleanup; remains the SX provider breadth gap. |

## Implementation Notes

- Removed unused `isSaved` and `toggleSavedEvent` props from `EventDetail`.
- Removed `savedNoticeVisible` and `shareSheetVisible` state from `EventDetail`.
- Removed `event-detail-save-notice`, `event-detail-share-sheet`, and `event-detail-share-action-*` render paths.
- Removed the visible `share-outline` icon from the position card.
- Removed now-unused share/save styles.
- No backend route, database, order, Portfolio, provider, or auth code changed.

## Audit Gate

Result: pass for the focused Local MVP Event Detail social-shell cleanup scope.

The source and focused tests now enforce the default Event Detail page as no-chat/no-stats/no-social for the Local MVP. Samsung S23 proof passed on `SM-S911U1`, covering Home, Live, Event Detail top, Game Lines, Trade Ticket submit, and Portfolio History.

Proof summary: `docs/mobile/harness/cycle-SZ-event-detail-social-shell-cleanup/cycle-SZ-current-mvp-s23-visible-flow.json`.

Key screenshots:

- `docs/mobile/screenshots/cycle-SZ-event-detail-social-shell-cleanup/cycle-SZ-current-mvp-detail-top.png`
- `docs/mobile/screenshots/cycle-SZ-event-detail-social-shell-cleanup/cycle-SZ-current-mvp-lines.png`
- `docs/mobile/screenshots/cycle-SZ-event-detail-social-shell-cleanup/cycle-SZ-current-mvp-ticket-ready.png`
- `docs/mobile/screenshots/cycle-SZ-event-detail-social-shell-cleanup/cycle-SZ-current-mvp-portfolio-history.png`
