# Event Page Split Plan

This FE-002 plan defines a safe future split of `events/[slug]` into smaller display components. It is docs-only and does not change route code.

## Goal

Make the event detail page easier to maintain and redesign by separating its current responsibilities into focused, testable views:

- Generic event detail.
- Sports event detail.
- Grouped market table.
- Market cards.
- Trade entry points.
- Loading, empty, and error states.

The future implementation should preserve behavior while improving readability, mobile layout, and sports-first UX.

## Current Problems

The page currently serves several modes:

- General event pages.
- Sports-specific event pages.
- Grouped market pages.
- Non-sports market lists.
- Event-level trade entry.

This makes the route hard to reason about and raises the risk of accidental behavior changes during UI redesign.

## Target Component Boundaries

Future display-only implementation should split by behavior:

| Component | Responsibility |
|---|---|
| `EventPageShell` | Shared route layout, loading/error/empty routing, beta-safe framing. |
| `EventHeader` | Event title, category/source metadata, status, timing. |
| `SportsEventSummary` | Sport/team/tournament presentation and sports-first context. |
| `GroupedMarketTable` | Grouped market rows, outcomes, prices/probabilities, links. |
| `EventMarketCardGrid` | Non-grouped related market cards. |
| `EventTradePreview` | Display-only selected trade preview or link into market detail. |
| `EventStateMessages` | Empty, loading, closed, paused, and unavailable states. |

Names are suggestions only. The future PR may choose local naming that fits existing component conventions.

## Safe Refactor Order

1. Extract pure presentational components without changing data fetches.
2. Keep existing API calls and response handling unchanged.
3. Preserve existing route paths and links.
4. Add or update public route smoke coverage after component extraction.
5. Only after stable extraction, redesign sports-first visual hierarchy.

Do not combine data-flow changes with visual restructuring in the same PR.

## Display Rules

- Event page should lead with event context, not internal market mechanics.
- Sports pages should show tournament/match framing when available.
- Yes/No prices should use the terminology map once copy cleanup starts.
- Users should be able to reach market detail from every related market.
- Normal users should not see bot/reference internals unless explicitly approved.
- Empty states should guide users back to `/sports` or `/markets`, not admin pages.

## Mobile Requirements

Future implementation should:

- Replace dense tables with card or stacked row layouts where needed.
- Keep event title and primary action visible without horizontal scrolling.
- Avoid multi-row chip/filter clutter.
- Keep market links tappable.
- Preserve stable spacing for loading and empty states.

## Forbidden Future Scope Without Separate Approval

Do not change:

- Event API routes.
- Market API routes.
- Order placement.
- Trade ticket payloads.
- Matching.
- Ledger or balances.
- Positions.
- Settlement/resolution.
- Wallet/deposit/withdrawal behavior.
- Admin auth.
- Bot/reference live behavior.
- Prisma schema or migrations.

## Validation For Future UI PR

Future implementation should run:

```sh
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

Add route evidence:

- `/events` still renders.
- At least one `/events/[slug]` route renders.
- Sports event detail route renders.
- Mobile viewport does not overlap critical content.

## Review Routing

- FrontendAgent may implement display-only component extraction.
- TestingAgent should cover public route smoke before or alongside visual redesign.
- LedgerWalletReviewerAgent is required if trade, order, balance, position, or settlement behavior changes.
- SecurityAgent is required if auth, admin-only visibility, or funding claims change.

## Non-Goals

This plan does not:

- Edit `src/app/events/[slug]/page.tsx`.
- Add components.
- Change APIs.
- Change trading, wallet, ledger, matching, settlement, admin auth, bot, Prisma, tests, CI, or deployment behavior.
