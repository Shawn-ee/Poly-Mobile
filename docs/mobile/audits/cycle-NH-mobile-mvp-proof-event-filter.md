# Cycle NH - Mobile MVP Proof Event Filter

## Scope

Local MVP Home/Live event discovery.

This cycle removes disposable engineering proof events from the user-facing mobile match feed. It does not change order book, chat, live stats, social, watchlists, backend schema, or non-MVP UI.

## Inspection Result

Before the route filter, `mobileMvpMatches=1` returned:

- `mobile-el-a-provider-breadth-47e994c1`
- `argentina-vs-egypt`
- `switzerland-vs-colombia`

After the route filter, `mobileMvpMatches=1` returns:

- `argentina-vs-egypt`
- `switzerland-vs-colombia`

Current service diagnosis:

- Regulation Winner is provider-backed from Polymarket for the inspected current match.
- Spread/Totals/Team Total markets are not provider-backed for the inspected current match.
- Local MVP line markets remain explicit backend-shaped `contract-fixture` rows.

## Acceptance Criteria

P0:

- `/api/events?...mobileMvpMatches=1` excludes disposable proof events.
- Home and Live do not show `EL-A Provider Breadth`, `Provider Breadth`, or `mobile-el-a-provider-breadth`.
- Home and Live still show the current Argentina vs. Egypt match.
- The full S23 path still passes: Home -> Live -> Event Detail -> Spread ticket -> server order -> Cancel -> History.

P1:

- Replace Local MVP line fixtures with real provider-backed Spread/Totals/Team Total markets when attach-ready provider markets exist.

P2:

- Add a cleanup job for old disposable proof events if local database noise grows again.

## Implementation Notes

- Tightened `mobileMvpMatchFilter()` in `src/app/api/events/route.ts`.
- Added route test expectation in `src/__tests__/public.events.no-leak.test.ts`.
- Added S23 harness negative assertions for leaked provider-breadth proof text.

## Proof

Route/test:

- `npm run test:jest -- src/__tests__/public.events.no-leak.test.ts`
- `docs/mobile/harness/cycle-NH-current-service-reinspection/cycle-NH-current-service-reinspection.json`
- `docs/mobile/harness/cycle-NH-current-service-reinspection/cycle-NH-current-service-reinspection-after-filter.json`

Android:

- Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Proof summary: `docs/mobile/harness/cycle-NH-s23-proof-event-filter/cycle-NH-current-mvp-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-NH-s23-proof-event-filter/`
- UI hierarchy: `docs/mobile/harness/cycle-NH-s23-proof-event-filter/`

Result:

- Pass.
- P0 failed: 0 for focused Home/Live proof-event filter scope.
- P1 remaining: provider-backed line-market breadth.
