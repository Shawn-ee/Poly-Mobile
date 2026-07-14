# Cycle ZAG - Live Provider Refresh And Mobile Line Normalization

## Scope

Run the explicit one-event live provider refresh for the current Spain vs. France internal tester event, reseed local maker liquidity, and fix a mobile-facing market semantics leak found after refresh.

## Provider Refresh

- Preflight command: `npm run mobile:one-event-live-runtime:provider-secret-preflight`
- Refresh command: `npm run mobile:one-event-live-runtime:provider-secret`
- Provider secret source: ignored local runtime secret file.
- Secret printed: no.
- Secret committed: no.
- Event scope: one event only.
- Provider quota result:
  - Last proof cost: `13`
  - Requests used: `219`
  - Requests remaining: `281`
  - Requests last: `6`

Refreshed event:

- Spain vs. France
- Start time: `2026-07-14T19:00:00Z`
- Local slug: `odds-api-single-soccer-test`

## Maker Liquidity

After provider refresh, local maker liquidity was reseeded for:

- Market: `Spain vs. France: Total Goals 2.5`
- Market id: `78ea76f1-fc8f-419b-ac21-2554d79093f6`
- Provider outcome id: `30fbc915-74ca-4809-a0c4-cd54c3236aa4`
- Provider raw outcome label: `Over +2.5`
- Provider reference bid/ask: `0.4839 / 0.5239`
- Local shifted maker bid/ask: `0.46 / 0.54`

## Mobile Semantics Fix

The live provider refresh exposed a raw sportsbook label in the mobile route:

- Raw provider display: `Over +2.5 | Under +2.5`

The mobile-facing prediction market contract now:

- Keeps the provider-backed market for tradability and live pricing.
- Normalizes the user-facing total labels to `Over 2.5 | Under 2.5`.
- Suppresses the duplicate Holiwyn fixture market for the same family, period, and line when a provider-backed line market exists.
- Preserves raw provider labels in provider/reference metadata and proof artifacts.

Route proof:

- `GET /api/mobile/events/odds-api-single-soccer-test/live-detail`
- Returned exactly one `totals` / `2.5` market.
- Returned source `sportsbook-odds`.
- Returned outcomes `Over 2.5 | Under 2.5`.

## Validation

- `npx jest --runInBand src/__tests__/mobile-live-event-detail.test.ts`
- `npm run mobile:live-runtime-audit-gate`

Both passed.

## Remaining Gaps

P0: none for the one-event live provider refresh, maker quote visibility, or mobile-facing total label normalization.

P1:

- Installed unattended provider/maker/lifecycle service ownership remains open.
- Production official-result auto-settlement remains open; active-event execution is still guarded by closed-market status and exact confirmation.

P2:

- Multi-event provider polling remains future work to protect quota.
