# Cycle UB - Approved Line Provider Source Copy

## Scope

Keep Event Detail source copy truthful when line markets are provider-backed by an approved secondary line provider rather than Polymarket.

No backend route, schema, order logic, order book UI, chat, live stats, or broad visual layout changed in this cycle.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| UB-P0-01 | P0 | Polymarket-only provider-backed lines can still show Polymarket source copy. | Pass |
| UB-P0-02 | P0 | Approved secondary-provider line markets do not display as `Lines: Polymarket`. | Pass |
| UB-P0-03 | P0 | Approved secondary-provider line markets use Holiwyn-branded line copy in English and Chinese. | Pass |
| UB-P0-04 | P0 | Hidden audit markers distinguish approved-provider-backed lines from Polymarket-provider-backed lines. | Pass |
| UB-P1-01 | P1 | Current MVP line rows still need real approved provider identity before this copy path becomes visible in normal S23 proof. | Open |

## Proof

- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts`
- Mobile typecheck.

## Audit Result

Pass for source-copy contract scope. Android proof was not rerun because current live MVP data still has zero approved-provider line rows, so this path is not visible until provider identity is attached.
