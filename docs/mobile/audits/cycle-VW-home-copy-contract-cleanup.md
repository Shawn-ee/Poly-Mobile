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
- Home empty state does not mention search after the Home search UI was removed.
- Samsung S23 screenshot/XML proof captures the current Home screen without search, Trending, filter, account-entry, or Expo developer-menu overlay labels.

P1:
- Real provider-backed Spread/Totals/Team Total current-match rows remain a separate provider-data milestone.

P2:
- None for this cleanup cycle.

## Implementation

- Removed stale `marketSearch`, `clearSearch`, `searchAll`, `searchLive`, and `today` fields from `HomeScreenCopy`.
- Added source-contract guards to `homeLocalMvpFocusContract.test.ts`.
- Replaced the stale Home empty state `No markets match your search.` with `No World Cup matches available.` for the match-only Home surface.
- Updated function, route, and data-contract docs.
- Hardened `mobile/scripts/check-mobile-audit-gate.ps1` so it can read current `# Cycle...` audit sections, legacy `P0 result: PASS` sections, and pending Android-proof details.
- Added `mobile/scripts/s23-proof-preflight.ps1` and package scripts so the loop can detect the required Samsung S23 proof device before launching screenshot/XML proof.
- Added `mobile/scripts/s23-home-proof.ps1` and `npm run proof:s23:home` for repeatable S23 Home screenshot/XML proof.

## Audit Gate

Status: Pass.

Passed:
- Source contract aligns with the current Home visual behavior.
- No backend/API/schema behavior changed.
- No orderbook/chat/live-stats work touched.
- Audit helper accepts a known passed cycle and rejects pending cycles without explicit pending mode.
- S23 preflight passed for Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / `SM_S911U1`.
- `npm run proof:s23:home` passed and captured current Home evidence:
  - Screenshot: `docs/mobile/screenshots/cycle-VW-home-copy-contract-cleanup/cycle-VW-home.png`
  - XML: `docs/mobile/harness/cycle-VW-home-copy-contract-cleanup/cycle-VW-home.xml`
- Final S23 proof shows World Cup, Matches, 3 matches, 1 live, and rejects Home search/filter/account controls, Trending, stale search empty-state copy, and Expo developer-menu overlay labels.

## Remaining Gaps

P1:
- Real provider-backed Spread/Totals/Team Total current-match rows remain a separate data-provider gap.
