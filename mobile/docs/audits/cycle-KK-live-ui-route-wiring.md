# Cycle KK - Live UI Route Wiring

Gate status: Pass

Scope: Backend/data-contract gate for the visible Live tab consuming backend live event pages in server market-data mode. This does not add live stats, order book, chat, or visual redesign work.

## P0 Checklist

- Live tab server mode uses `/api/events?status=live&includeMobileMarkets=1&limit=...` through `loadHomeEventFeedPage()`.
- Successful backend Live pages drive the visible `LiveScreen` event list instead of filtering only the already-loaded Home event page.
- Server-mode Live refresh reloads the backend live route instead of refreshing the generic Home page and then filtering locally.
- Server-mode route failure does not repopulate visible Live rows from local demo fallback.
- Mock/offline mode keeps local `status === "live"` filtering fallback.
- No order book, chat, live stats, deposit, withdraw, or Portfolio redesign work is included.

## Evidence

- Proof: `docs/mobile/harness/cycle-KK-live-ui-route-wiring/cycle-KK-live-ui-route-wiring.json`.
- Proof script: `scripts/prove_mobile_live_ui_route_wiring.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/api.test.ts`
  - `mobile/src/__tests__/homeEventFeedService.test.ts`
- Focused backend tests:
  - `src/__tests__/public.events.no-leak.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Live UI backend route wiring.
- Remaining P1: optional Android proof if visual proof becomes required again; rich live sports-stat feeds remain outside this route-wiring cycle.
