# Cycle ET - Period-Safe Retail Line Matching Gate

Cycle: ET
Feature: Provider-backed retail line ticket matching must preserve selected period.
Date: 2026-07-04

## Scope

Harden the Local MVP simple-ticket path so a backend line market can replace deterministic fixture data only when it matches:

- market family/type
- line
- period

## Acceptance Criteria

P0:

- Mobile rejects a same-line backend Totals market when its period differs from the selected ticket period.
- Mobile rejects a same-line backend Team Total market when its period differs from the selected ticket period.
- EventDetail backend matching chooses line markets by family, line, and period.
- The Totals and Team Total Android simple-ticket path remains working with default orderbook hidden.

P1:

- Prove the same period-safe path against real provider-backed route rows from `/api/mobile/events/:slug/live-detail`.

## Evidence

- Android proof bundle: `docs/mobile/harness/cycle-ET-local-mvp-period-safe-line-family/cycle-ES-local-mvp-line-family-breadth-proof.json`
- Android screenshots/XML: `docs/mobile/screenshots/cycle-ET-local-mvp-period-safe-line-family/`, `docs/mobile/harness/cycle-ET-local-mvp-period-safe-line-family/`
- Focused tests: `mobile/src/__tests__/eventDetailLineTicketService.test.ts`

Validation:

- `npm --prefix mobile run typecheck`: pass.
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/eventDetailLineTicketService.test.ts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/openOrderService.test.ts`: 20 passed.
- Samsung tablet proof: pass on `172.16.200.30:41299`.

## Gate Result

Pass for period-safe line-ticket matching and selected Android regression proof.

Unresolved P0 gaps: 0 for this selected flow.

Remaining P1 route-backed provider proof is tracked in `docs/mobile/POLYMARKET_PARITY_GAP_TRACKER.md`.
