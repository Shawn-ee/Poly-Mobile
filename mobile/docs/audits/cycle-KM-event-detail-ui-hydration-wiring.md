# Cycle KM - Event Detail UI Hydration Wiring

Gate status: Pass

Scope: Backend/data-contract gate for the visible Event Detail/Game page consuming compact backend event hydration in server mode. This does not add order book, chat, live stats, visual redesign, deposits, or withdrawals.

## P0 Checklist

- Visible Event Detail opens through `openEventDetail()`.
- Server mode calls `PolyApi.getEvent()` for the selected event.
- `PolyApi.getEvent()` prefers `/api/mobile/events/:slug/live-detail` and falls back to `/api/events/:slug` only when compact hydration fails.
- `normalizeEventDetail()` preserves backend-owned `marketProfile`, `resultMode`, `gameRules`, `supportedMarketTypes`, and compact market rows for visible Event Detail/Game Lines rendering.
- The hydrated result replaces the visible `selectedEvent` only when it still matches the selected event id.
- No frontend-only event/game rule guessing is added.

## Evidence

- Proof: `docs/mobile/harness/cycle-KM-event-detail-ui-hydration-wiring/cycle-KM-event-detail-ui-hydration-wiring.json`.
- Proof script: `scripts/prove_mobile_event_detail_ui_hydration_wiring.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/api.test.ts`
  - `mobile/src/__tests__/worldCupAdapter.test.ts`
- Focused backend tests:
  - `src/__tests__/mobile-live-event-detail.test.ts`
  - `src/__tests__/mobile-event-market-rules-contract.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Event Detail UI hydration route wiring.
- Remaining P1: explicit visible Game Lines catalog refresh from `/api/events/:slug/markets` and optional Android proof if visual proof becomes required again.
