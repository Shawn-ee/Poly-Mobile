# Cycle KV - Home Filter UI Route Wiring

Gate status: Pass

Scope: Backend/data-contract gate for the visible Home filter chips consuming backend event pages in server market-data mode. This does not add order book, chat, live stats, deposit, withdraw, or visual redesign work.

## P0 Checklist

- Home `All`, `Live`, and `Today` chips keep their visible behavior.
- Server-mode Home filter selection is owned by the app shell and passed into `loadHomeEventFeedPage()`.
- Server-mode Home pages use `/api/events?status=<filter>&includeMobileMarkets=1&limit=...&cursor=...`.
- Successful server-mode filtered pages drive the visible Home list directly instead of locally filtering only the already-loaded Home page.
- Home load-more uses the cursor for the currently selected backend filter.
- Mock/offline mode keeps local status filtering fallback.
- No order book, chat, live stats, deposit, withdraw, or Portfolio redesign work is included.

## Evidence

- Proof: `docs/mobile/harness/cycle-KV-home-filter-ui-route-wiring/cycle-KV-home-filter-ui-route-wiring.json`.
- Proof script: `scripts/prove_mobile_home_filter_ui_route_wiring.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/api.test.ts`
  - `mobile/src/__tests__/homeEventFeedService.test.ts`
  - `mobile/src/__tests__/homePaginationService.test.ts`
- Focused backend tests:
  - `src/__tests__/public.events.no-leak.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Home filter UI backend route wiring.
- Remaining P1: optional Android proof if visual proof becomes required again; calendar-accurate `today` date-window semantics only if product later wants `Today` to mean start-time date instead of status.
