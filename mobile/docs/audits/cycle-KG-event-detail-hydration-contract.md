# Cycle KG - Event Detail Hydration Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Mobile Event Detail hydration prefers `/api/mobile/events/:slug/live-detail`.
- Compact live-detail payload carries backend-owned event market rules and compact markets.
- Legacy `/api/events/:slug` remains a fallback only when compact live-detail fails.
- No Event Detail visual redesign, chart work, order book UI work, chat, or live stats product work.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Mobile API prefers compact live-detail route | Pass | `mobile/src/__tests__/api.test.ts` verifies successful `getEvent()` calls only `/api/mobile/events/:slug/live-detail`. |
| Mobile API keeps legacy fallback | Pass | Existing `mobile/src/__tests__/api.test.ts` fallback test verifies `/api/events/:slug` is called only after compact route failure. |
| Backend live-detail returns event market rules | Pass | `scripts/prove_mobile_event_detail_hydration_contract.ts` verifies `marketProfile=regulation_90`, `resultMode=can_draw`, and `gameRules.allowDraw=true`. |
| Backend live-detail returns compact market rows | Pass | Proof verifies regulation draw/tie outcome and backend spread line `1.5` are present in compact markets. |
| Cycle avoids unrelated UI churn | Pass | No edits to `mobile/App.tsx`, `EventDetail.tsx`, `TradeTicket.tsx`, order book UI, chat, live stats, deposit, or withdraw flows. |

## Change Notes

- Added a mobile API test for compact live-detail success without fallback.
- Added focused route proof for backend-driven event rules and compact Game Lines data.
- Reused existing live-detail and event read-model serializers. No schema migration was added.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/api.test.ts mobile/src/__tests__/worldCupAdapter.test.ts` - pass.
- `npx jest --runInBand --detectOpenHandles src/__tests__/mobile-live-event-detail.test.ts src/__tests__/mobile-event-market-rules-contract.test.ts` - pass.
- `npx tsx scripts/prove_mobile_event_detail_hydration_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle KG"` - pass.

## Remaining P1

- Wire dirty Event Detail UI files to the compact live-detail hydration path after unrelated screen churn is reconciled.
- Production real-provider replay across more World Cup profiles remains under provider mapping/provider refresh lanes.
