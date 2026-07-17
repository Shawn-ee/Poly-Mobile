# Cycle ZCK - Launch Readiness And Provider Catalog Identity

Date: 2026-07-17

## Scope

Audit the current launch state and remove the fixed-slot overwrite behavior from future Odds API catalog imports. No mobile UI, provider quota, payment, order-book UI, chat, live stats, or production deployment work is included.

## Baseline

- Backend health: pass on port 3002; Postgres connected.
- Docker Postgres: healthy.
- Mobile-visible provider events: one (`Chapecoense vs. Bahia`).
- Active markets: 20.
- Latest S23 fake-token buy/cashout/history proof: pass, Cycle ZCJ.
- Expo: intentionally stopped after proof.
- Runtime workers: local command-owned capability, not installed production services.
- Baseline GitHub `main`: `3d77f971`, green.

## Acceptance Criteria

### P0

- A catalog event slug is derived from provider source, sport key, and provider event ID.
- Team display-name changes do not change catalog identity.
- Different provider event IDs cannot share a catalog slug.
- Catalog import reuses an existing `source + externalEventId` event, including the current legacy event.
- A catalog import refuses to overwrite a slug owned by another provider/event.
- Existing single-event commands remain backward compatible.
- No provider request or quota spend is required for contract validation.

### P1

- The replay/live importer exposes explicit catalog commands.
- Launch gaps and the next release-candidate Definition of Done are written in one current report.

### P2

- Friendly human-readable catalog slugs. Stable opaque slugs are preferred until identity migration is complete.

## Implementation

- `oddsApiCatalogEventSlug` creates a stable hash from provider source, sport key, and provider event ID.
- `seedOddsApiCatalogEvent` preserves `source + externalEventId` ownership and delegates market/outcome seeding to the proven path.
- Catalog mode checks slug ownership before insert and fails closed on collision.
- Historical replay events are stored as closed, unlisted, non-tradable catalog records after a six-hour match window; they cannot leak into Home.
- `--catalogIdentity` and package aliases expose live and no-quota replay entry points.
- Catalog proof writes to its own audit/summary paths and cannot overwrite the active one-event readiness handoff.
- Legacy `mobile:the-odds-api-single-event` behavior remains available for the current one-event runtime.

## Audit Gate

- Root TypeScript: pass.
- Focused Odds API provider contract suite: pass, 45 tests.
- Full Jest CI: pass, 35 suites and 189 tests.
- Mobile TypeScript: pass.
- Prisma schema validation: pass through the local environment loader; no schema change.
- No-quota catalog replay: pass for real redacted Switzerland vs. Argentina provider evidence.
- Catalog coexistence: pass. The archived catalog event uses `odds-api-event-80f5351f8fe881cc6e09`; the active legacy Chapecoense vs. Bahia event remains `odds-api-single-soccer-test`.
- Home feed safety: pass. `GET /api/events?includeMobileMarkets=1&mobileMvpMatches=1&sportKey=soccer` returns only Chapecoense vs. Bahia.
- Canonical active-event readiness summaries: unchanged; catalog evidence is isolated under `docs/mobile/harness/the-odds-api-event-catalog/`.
- Provider quota used: no.
- Mobile-visible behavior changed: no; fresh S23 proof is not required for this backend identity-only cycle.
- P0 gaps for the scoped identity contract: zero.

Evidence:

- `docs/mobile/harness/the-odds-api-event-catalog/catalog-event-summary.redacted.json`
- `docs/mobile/audits/BATCH_THE_ODDS_API_EVENT_CATALOG.md`
- `docs/mobile/HOLIWYN_LAUNCH_READINESS_REPORT.md`

## Remaining Gaps

- P0: RC1 still needs three current/upcoming provider-shaped events proven together; ZCK proves one active plus one safely archived provider event.
- P0: refresh/maker/lifecycle runtime must accept an explicit event allowlist rather than one default slug.
- P0: installed Android RC and physical account flow remain unproven.
- P1: migrate the legacy fixed slug after every runtime caller supports provider-stable identity.
- P1: public hosted operations and official-result automation remain open.
