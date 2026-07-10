# Cycle VW - Home Copy Contract Cleanup

Date: 2026-07-10

## Scope

Local MVP Home page contract cleanup only.

Included:
- Home page source contract.
- Home Local MVP source guard.
- Documentation for route/data dependency.

Excluded:
- Order book UI.
- Chat.
- Live stats.
- Search page behavior.
- Backend schema or route behavior.
- Trade/order/Portfolio logic.

## Reference Direction

Current product direction keeps Home focused on:
- World Cup.
- Matches.
- Live count.
- Initial 10-match feed with 10-more loading.

Home should not own:
- Search box copy.
- Search filters.
- Trending sections.
- Account/settings entry.

## Holiwyn Criteria

P0:
- Home component contract does not require search/filter/today copy fields.
- Home still renders the match-only Local MVP feed.
- Home still preserves progressive 10-match loading.

P1:
- S23 screenshot proof should be recaptured when ADB device is available.

P2:
- None for this cleanup cycle.

## Implementation

- Removed stale `marketSearch`, `clearSearch`, `searchAll`, `searchLive`, and `today` fields from `HomeScreenCopy`.
- Added source-contract guards to `homeLocalMvpFocusContract.test.ts`.
- Updated function, route, and data-contract docs.
- Hardened `mobile/scripts/check-mobile-audit-gate.ps1` so it can read current `# Cycle...` audit sections, legacy `P0 result: PASS` sections, and pending Android-proof details.

## Audit Gate

Status: Partial.

Passed:
- Source contract aligns with the current Home visual behavior.
- No backend/API/schema behavior changed.
- No orderbook/chat/live-stats work touched.
- Audit helper accepts a known passed cycle, fails Cycle VW without `-AllowPending`, and allows Cycle VW only with explicit pending mode.

Pending:
- Android/S23 visual proof, because `adb devices -l` currently reports no attached devices.

## Remaining Gaps

P1:
- Recapture Home screen proof on Samsung S23 after ADB connectivity returns.
- Real provider-backed Spread/Totals/Team Total current-match rows remain a separate data-provider gap.
