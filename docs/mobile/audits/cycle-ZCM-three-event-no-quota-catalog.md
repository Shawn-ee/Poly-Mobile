# Cycle ZCM - Three-Event No-Quota Provider Catalog

Date: 2026-07-17

## Scope

Use committed provider evidence to prove three stable The Odds API event identities can coexist without replacing the active event. Do not call the provider, fabricate future events, expose archived events in Home, or claim current/upcoming breadth.

## Evidence Audit

Git history contains three distinct live-provider event IDs:

- Spain vs. France: `f9aa13a662d1658e5a02cfc06d6a2d73`, kickoff 2026-07-14.
- Argentina vs. England: `ced22494ae0bbb8cc4f7108bf6f493df`, kickoff 2026-07-15.
- Chapecoense vs. Bahia: `e64cfcc03ee00f71d21b9c99e9c37d2d`, kickoff 2026-07-17.

Only Chapecoense vs. Bahia is still upcoming at this audit. The Spain vs. France summary at commit `887383f0` retained exact selected-market identity and provider bid/ask. The replay fixture uses only that Total Goals 2.5 evidence.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Third event uses a real immutable provider identity and stable catalog slug. | Pass |
| P0 | Replay makes zero provider calls and contains no key. | Pass |
| P0 | Historical event is closed, unlisted, non-accepting, absent from Home, and worker-disabled. | Pass |
| P0 | Existing active event remains unchanged and Home-visible. | Pass |
| P0 | Provider market count excludes Holiwyn contract fixtures. | Pass |
| P0 | Replaying the same provider event reuses the same Event identity. | Pass |
| RC1 P0 | Three current/upcoming provider events are Home/Event Detail ready. | Fail: one current/upcoming event |

## Result

- Provider catalog records: 3.
- Current/upcoming records: 1.
- Runtime owners: 1.
- Archived records: 2.
- Spain vs. France provider markets: 1.
- Spain vs. France contract fixtures: 16, stored separately and closed.
- Home-visible event: Chapecoense vs. Bahia only.
- Provider quota used: 0.

Evidence:

- `docs/mobile/harness/the-odds-api-event-catalog/spain-france/catalog-event-summary.redacted.json`
- `docs/mobile/harness/the-odds-api-event-catalog/runtime-allowlist-summary.redacted.json`
- `docs/mobile/audits/BATCH_THE_ODDS_API_SPAIN_FRANCE_HISTORICAL_CATALOG.md`

## Validation

- Root TypeScript: pass.
- Jest CI: 36 suites, 194 tests passed.
- Mobile TypeScript: pass.
- Prisma schema validation: pass.
- Backend health: pass on `3002`, DB connected.
- Docker Postgres: healthy.
- Expo: stopped; no mobile-visible code changed.
- Changed-file secret scan: pass.

## Audit Gate

Pass for safe three-record provider catalog storage. The cycle does not pass the RC1 current/upcoming Home breadth gate, and the remaining P0 is explicit.
