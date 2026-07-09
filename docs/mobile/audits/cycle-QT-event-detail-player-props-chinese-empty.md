# Cycle QT - Event Detail Player Props Chinese Empty State

Date: 2026-07-09

## Scope

Local MVP visible user flow:

Home -> Event Detail -> Player Props tab.

The Product direction keeps Player Props visible but intentionally blank for this MVP. This cycle fixes the Chinese-mode blank state and tab copy so the game page does not switch back to English when the user taps Player Props.

Out of scope:

- Building player prop markets.
- Backend schema/routes for player props.
- Order book, chat, live stats, social, deposit, or withdraw.

## Reference Behavior

Polymarket shows a dedicated Player Props tab on soccer game pages. Holiwyn keeps the tab visible for parity structure, but because player prop functionality is not part of the current MVP, the tab must show a clear localized empty state rather than an English-only placeholder.

## Acceptance Criteria

### P0

- Event Detail tabs use localized copy from `appCopy`.
- Chinese mode renders localized Game Lines and Player Props tab labels.
- Chinese Player Props tab renders a localized blank-state message.
- The tab remains intentionally blank and does not expose unfinished player prop markets.
- No backend route, schema, ticket, order, Portfolio, order book, chat, live stats, or social work changes.

### P1

- English mode remains unchanged.
- Internal accessibility markers still identify `event-detail-player-props-empty` and `event-detail-player-props-blank-local-mvp`.

### P2

- Later player prop work can replace this blank state with real provider-backed prop groups.

## Implementation

- `mobile/src/components/EventDetail.tsx`
  - Added `gameLines`, `playerProps`, and `playerPropsUnavailable` to `EventDetailCopy`.
  - Event Detail market tabs now use `t.gameLines` and `t.playerProps`.
  - Player Props empty state now uses `t.playerPropsUnavailable`.
- `mobile/src/localization/appCopy.ts`
  - Added English and Chinese copy for Event Detail tabs and Player Props empty state.
- `mobile/src/__tests__/eventDetailPlayerPropsChineseCopy.test.ts`
  - Adds a source contract guard for this localized blank state.

## Audit Result

Pass on Samsung S23.

Evidence:

- `docs/mobile/harness/cycle-QT-event-detail-player-props-chinese-empty/cycle-QT-event-detail-player-props-chinese-empty-proof.json`
- `docs/mobile/screenshots/cycle-QT-event-detail-player-props-chinese-empty/cycle-QT-event-detail-game-lines-chinese.png`
- `docs/mobile/harness/cycle-QT-event-detail-player-props-chinese-empty/cycle-QT-detail-game-lines.xml`
- `docs/mobile/screenshots/cycle-QT-event-detail-player-props-chinese-empty/cycle-QT-player-props-empty-chinese.png`
- `docs/mobile/harness/cycle-QT-event-detail-player-props-chinese-empty/cycle-QT-player-props.xml`

Checked:

- Event Detail opened on `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Chinese mode rendered `比赛盘口` and `球员特殊盘` tab copy.
- Tapping Player Props rendered the intentionally blank MVP state with `本场暂无球员特殊盘`.
- The previous English blank text was absent.
- Expo developer menu was absent from proof XML.

Unresolved P0 gaps for this focused scope: 0.

## Remaining Gaps

- Player Props functionality remains intentionally blank for this MVP.
- Real provider-backed current-match Spread/Totals/Team Total markets remain unavailable.
