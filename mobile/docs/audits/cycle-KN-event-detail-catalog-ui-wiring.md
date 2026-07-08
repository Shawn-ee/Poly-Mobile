# Cycle KN - Event Detail Catalog UI Wiring

Gate status: Pass

Scope: Backend/data-contract gate for visible Event Detail/Game Lines consuming `/api/events/:slug/markets` in server mode. This does not add order book, chat, live stats, visual redesign, deposits, or withdrawals.

## P0 Checklist

- Event Detail server mode calls `loadEventMarketCatalog()` for the selected event.
- `loadEventMarketCatalog()` reads `/api/events/:slug/markets` through `PolyApi.getEventMarkets()`.
- Successful backend catalog rows replace `selectedEvent.markets`, which drives visible Game Lines and line/period chips.
- A successful empty backend catalog remains empty and is not replaced by invented frontend rows.
- Route failure uses only the explicit caller-provided fallback markets.
- The catalog update is scoped to the currently selected event id.

## Evidence

- Proof: `docs/mobile/harness/cycle-KN-event-detail-catalog-ui-wiring/cycle-KN-event-detail-catalog-ui-wiring.json`.
- Proof script: `scripts/prove_mobile_event_detail_catalog_ui_wiring.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/api.test.ts`
  - `mobile/src/__tests__/eventMarketCatalogService.test.ts`
  - `mobile/src/__tests__/marketLineOptionsService.test.ts`
- Focused backend tests:
  - `src/__tests__/public.event-markets.no-leak.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Event Detail/Game Lines catalog route wiring.
- Remaining P1: optional Android proof if visual proof becomes required again; production real-provider breadth remains under provider lanes.
