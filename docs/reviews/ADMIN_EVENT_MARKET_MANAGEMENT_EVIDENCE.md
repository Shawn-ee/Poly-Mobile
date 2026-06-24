# Admin Event Market Management Evidence

Date: 2026-06-24

## Summary

Phase H extends the existing admin market management routes so operators can create and edit grouped sports markets and props under an event.

This phase supports the admin workflow needed before an internal live market beta:

- create an ORDERBOOK market under an event
- assign market group metadata
- set market type, line, unit, period, participant, prop category, rules text, and display order
- create YES/NO, OVER/UNDER, team-side, player-prop, or named outcome choices through structured outcome fields
- edit grouped market metadata
- edit outcome display metadata while protecting locked outcomes after activity starts
- pause or close a market through the existing admin status endpoints
- query the created market through the public event market read model

No settlement, market resolution payout, order placement, ledger math, funding, withdrawal, wallet, or bot behavior was added.

## Files Changed

- `src/app/api/admin/markets/create/route.ts`
- `src/app/api/admin/markets/[id]/route.ts`
- `src/app/api/admin/markets/[id]/outcomes/route.ts`
- `src/__tests__/admin.event-market-management.test.ts`
- `docs/reviews/ADMIN_EVENT_MARKET_MANAGEMENT_EVIDENCE.md`
- `docs/reviews/LIVE_MARKET_BETA_CONTINUATION_PROMPT.md`

## Admin Routes

`POST /api/admin/markets/create`

Adds support for:

- `eventId`
- `marketGroupKey`
- `marketGroupTitle`
- `marketType`
- `displayOrder`
- `line`
- `unit`
- `period`
- `participantType`
- `participantName`
- `participantId`
- `propCategory`
- `rulesText`
- structured outcome objects with `name`, `label`, `code`, `side`, `status`, `displayOrder`, and optional metadata

The route remains admin-only and still creates ORDERBOOK markets only.

`GET /api/admin/markets/[id]`

Now returns grouped sports-market metadata and outcome display metadata for admin editing.

`PATCH /api/admin/markets/[id]`

Now edits grouped sports-market metadata. It does not close or resolve markets. Closing and pausing remain on the dedicated admin status endpoints.

`PATCH /api/admin/markets/[id]/outcomes`

Now edits outcome label/code/side/status/display order. Locked outcomes cannot be removed, renamed, or have code/side changed after trade or position activity starts.

## Safety Boundaries

Admin-only access remains required through existing admin guards.

Normal and anonymous users remain blocked by the existing `requireAdmin` / `assertAdmin` guard path.

This phase does not:

- implement settlement
- implement market resolution payout
- implement order placement
- change trading gates
- change ledger math
- change funding behavior
- change withdrawal behavior
- change wallet/private-key behavior
- enable public trading
- enable live bots

## Public Read Model

Created grouped event markets can be queried through `GET /api/events/[slug]/markets`.

The targeted test verifies the public event-market response includes grouped market metadata and does not expose admin identity fields such as admin email or `createdBy`.

## Tests Added

`src/__tests__/admin.event-market-management.test.ts`

Coverage:

- non-admin market creation is blocked
- admin can create a grouped player prop market under an event
- admin can set line/unit/period/participant/prop fields
- admin can create structured OVER/UNDER outcomes
- admin can edit grouped market metadata
- admin can edit outcome metadata
- admin can pause and close through existing admin status routes
- created grouped market appears in public event-market read model
- public read model does not leak admin identity fields

## Validation

- `git diff --check`: passed.
- `npx prisma validate --schema=prisma/schema.prisma`: passed.
- `npx prisma generate --schema=prisma/schema.prisma`: passed.
- `npx jest --runInBand src/__tests__/admin.event-market-management.test.ts`: passed.
- `npx tsc --noEmit --pretty false --incremental false`: passed.
- `npm run test:ci`: passed.
- `npm run build`: passed.

## Risk Assessment

This PR changes admin mutation behavior and should remain open for human/specialist review even if CI passes.

The risk is bounded because:

- mutations are admin-only
- market close/pause still use existing status endpoints
- no settlement path is added
- no resolution payout path is added
- no ledger or trading behavior is changed

## Next Phase

Next recommended phase: Phase I Market Resolution and Settlement.

Because Phase I is high risk, do not start it until Phase H is reviewed and merged.
