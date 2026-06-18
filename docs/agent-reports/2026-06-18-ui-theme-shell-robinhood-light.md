# UI Theme Shell Robinhood Light

Branch: `agent/ui-theme-shell-robinhood-light`

Date: 2026-06-18

## Goal

Create a clean Robinhood Light inspired trading UI foundation with custom blue, indigo, and teal styling.

## Scope

- Added light trading design tokens in `src/app/globals.css`.
- Updated the app shell and `TopNav` with a sticky white navigation surface, beta banner, compact account controls, and responsive nav links.
- Added shared UI primitives:
  - `PageContainer`
  - `Button`
  - `Card`
  - `Badge`
  - `OutcomeButton`
  - `EmptyState`
  - `LoadingState`
  - `ErrorState`
- Applied the shell lightly to:
  - `/`
  - `/markets`
  - `/sports`
  - `/sports/soccer`
  - `/sports/soccer/world-cup`
  - `/events/[slug]`
  - market cards
  - event cards
  - sports event cards

## Design Notes

- Background: warm off-white/light gray.
- Primary: deep indigo/blue.
- Secondary: teal/cyan.
- YES/positive: teal/blue-green.
- NO/negative: soft red.
- Cards: white, 8px radius, light border, subtle shadow.
- Text: dark slate with gray-slate muted copy.

## Intentionally Not Changed

- Matching logic
- Ledger logic
- Orderbook logic
- Settlement logic
- Wallet, deposit, withdrawal, custody, or payment logic
- Player props, parlay, sportsbook, or casino UI
- Production deployment configuration

## Validation

| Check | Result | Notes |
| --- | --- | --- |
| `git diff --check` | PASS | No whitespace errors |
| `npm ci` | PASS | Existing npm audit/deprecation warnings remain |
| `npm exec -- prisma generate --schema=prisma/schema.prisma` | PASS | Existing Prisma config deprecation warning |
| `npm exec -- prisma validate --schema=prisma/schema.prisma` | PASS | Existing Prisma config deprecation warning |
| `npx tsc --noEmit --pretty false --incremental false` | PASS | No TypeScript errors |
| `npm run test:ci` | PASS | 13 suites, 39 tests passed |
| Focused ESLint on changed source files | PASS | No errors |
| Changed-file secret scan | PASS | Matches were non-secret UI/docs terms: `design tokens`, `tokenBalance` |
| Chrome/Playwright route smoke | PASS | `/`, `/markets`, `/sports`, `/sports/soccer`, `/sports/soccer/world-cup`, `/events/france-vs-argentina` returned 200 and had visible content |

## Screenshots

Generated under ignored `test-results/`:

- `test-results/ui-theme-shell-robinhood-light/home.png`
- `test-results/ui-theme-shell-robinhood-light/markets.png`
- `test-results/ui-theme-shell-robinhood-light/sports.png`
- `test-results/ui-theme-shell-robinhood-light/sports-soccer.png`
- `test-results/ui-theme-shell-robinhood-light/sports-soccer-world-cup.png`
- `test-results/ui-theme-shell-robinhood-light/events-france-vs-argentina.png`

## Known Limitations

- The first pass focuses on shell, public listings, cards, sports listing pages, and event detail surfaces.
- Market detail/orderbook panels, grouped trade ticket internals, wallet/portfolio, auth modal, and admin surfaces still use older styling in places.
