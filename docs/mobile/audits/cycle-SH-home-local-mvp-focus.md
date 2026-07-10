# Cycle SH - Home Local MVP Focus

Status: P0 pass.

Scope:
- Local MVP Home page only.
- Keep Home focused on World Cup matches and Live count.
- Remove visible All/Live/Today Home filter chips.
- Preserve 10-at-a-time progressive loading and backend server-mode paging.

Out of scope:
- Search tab behavior.
- Event Detail, Trade Ticket, Portfolio, order routes, order book UI, chat, live stats, social features, deposits, withdrawals, backend schema.

Acceptance criteria:
- P0: Home shows World Cup, Matches, match count, and live count.
- P0: Home no longer renders visible filter chips or `home-filter-*` controls.
- P0: Home still starts at 10 matches and can reveal/load 10 more.
- P0: Server-mode Home still calls the mobile World Cup match feed with `filter: "all"` and `mobileMvpMatches=true`.
- P1: Search remains the separate discovery/filter surface.

Implementation notes:
- Removed `homeFilter` state from `mobile/App.tsx`.
- Removed Home filter props and chip styles from `mobile/src/components/HomeScreen.tsx`.
- Kept `initialHomeMatchCount`, `nextHomeMatchCount`, scroll-to-load behavior, and server cursor loading.
- Added `mobile/src/__tests__/homeLocalMvpFocusContract.test.ts`.

Backend/API:
- No backend route or schema changes.
- Home continues using `loadHomeEventFeedPage()` -> `/api/events` through `api.listWorldCupEvents()`.
- The route is requested with `filter: "all"`, `leagueKey: "world_cup"`, and `mobileMvpMatches: true`.

Audit result:
- P0 pass.
- Typecheck passed.
- Focused Home/service tests passed.
- Android proof passed on Samsung S23 `SM-S911U1`.
- Screenshot: `docs/mobile/screenshots/cycle-SH-home-local-mvp-focus/cycle-SH-current-mvp-home.png`.
- XML: `docs/mobile/harness/cycle-SH-home-local-mvp-focus/cycle-SH-current-mvp-home.xml`.
- Summary: `docs/mobile/harness/cycle-SH-home-local-mvp-focus/cycle-SH-current-mvp-s23-visible-flow.json`.
