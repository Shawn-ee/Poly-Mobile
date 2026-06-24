# Live Sports UX Polish Evidence

Date: 2026-06-24

## Summary

Phase K polishes the sports event detail experience as display-only UI work.

The event page now adds:

- a compact market status summary
- market group tabs with clearer counts
- market search across title, description, participant, prop, line, period, and outcome metadata
- a sticky outcome preview panel on desktop
- clearer empty state copy when a group/search has no matches

No order placement, ledger behavior, settlement, funding, withdrawal, provider integration, bot behavior, admin mutation, package, or deployment behavior changed in this phase.

## Files Changed

- `src/app/events/[slug]/page.tsx`
- `src/__tests__/live-sports-ux-polish.test.ts`
- `docs/reviews/LIVE_SPORTS_UX_POLISH_EVIDENCE.md`
- `docs/reviews/LIVE_MARKET_BETA_CONTINUATION_PROMPT.md`

## UI Behavior

Sports event detail pages now show event market counts for:

- open/live
- suspended
- closed
- resolved

Operators and internal testers can search event markets by:

- market title
- description
- market type/group
- participant
- prop category
- line/unit/period
- outcome name/label/code/side

Selecting an event-page outcome opens a sticky preview with:

- outcome label
- market title
- display price
- bid/ask
- side/code
- market status
- link to the market detail page

## Display-Only Boundary

The event-page preview is intentionally not an order ticket.

It does not:

- call `/api/orders`
- create orders
- mutate balances
- write ledger entries
- settle positions
- resolve markets
- enable public trading

Real order submission remains limited to the guarded market detail ticket and still requires explicit internal trading beta server/client gates.

## Tests Added

Added:

```text
src/__tests__/live-sports-ux-polish.test.ts
```

Coverage:

- sports event page includes market search
- sports event page includes market status summary
- sports event page includes sticky outcome preview
- event-page preview copy states display-only behavior
- event-page source does not call `/api/orders`

## Validation

Passed locally:

- `git diff --check`
- `npx prisma validate --schema=prisma/schema.prisma`
- `npx prisma generate --schema=prisma/schema.prisma`
- `npx jest --runInBand src/__tests__/live-sports-ux-polish.test.ts src/__tests__/live-sports-market-groups-ui.test.ts`
- `npx tsc --noEmit --pretty false --incremental false`
- `npm run test:ci`
- `npm run build`

`git diff --cached --check` should be run before commit.

## What Is Not Implemented

- new order placement behavior
- new trading gates
- settlement
- market resolution execution
- provider integration
- admin market mutation changes
- funding changes
- withdrawal changes
- bot activation

## Next Phase

Next recommended phase: Phase L End-to-End Internal Live Market Evidence.

Phase L should document and test the current internal flow from event discovery through grouped market display, trade ticket, guarded order placement, portfolio display, admin market management, and settlement-preview readiness.
