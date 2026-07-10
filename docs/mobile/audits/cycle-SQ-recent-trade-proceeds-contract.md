# Cycle SQ - Recent Trade Proceeds Contract

## Scope

Local MVP Portfolio History rows for recent fake-token trade/cashout activity.

Out of scope: order book UI, chat, live stats, social features, deposits/withdrawals, provider breadth, and visual Portfolio redesign.

## Reference Behavior

Polymarket-style retail history distinguishes bought rows from sold/closed rows. Sold/cashout rows should read as realized proceeds, while bought rows should read as cost/entry activity.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | `/api/portfolio/history` returns a stable recent-trade contract for proceeds display. | Pass |
| P0 | SELL recent trades include explicit `proceedsTokens`; BUY recent trades include `proceedsTokens: null`. | Pass |
| P0 | Mobile maps SELL `proceedsTokens` into `PortfolioActivity.proceedsAmount`. | Pass |
| P0 | Existing resolved history `realizedPnLTokens` mapping remains intact. | Pass |
| P0 | No order book/chat/live stats/social scope is touched. | Pass |
| P1 | Exact recent-trade `realizedPnlTokens` is calculated before market resolution. | Partial; explicit `null` until cost-basis data exists. |

## Implementation Notes

- Backend route: `src/app/api/portfolio/history/route.ts`.
- Mobile types: `mobile/src/types.ts`.
- Mobile mapper: `mobile/src/services/portfolioHistoryService.ts`.
- Backend test: `src/__tests__/portfolio.history.route.test.ts`.
- Mobile tests: `mobile/src/__tests__/portfolioHistoryService.test.ts`.

## Audit Result

P0 pass for the focused recent-trade proceeds contract. Remaining P1 is an honest backend/schema gap: the current `Trade` model does not preserve execution-time cost basis for sold shares, so exact recent-trade realized P/L cannot be calculated without adding a basis snapshot or ledger-backed calculation.

## Proof

- Focused mobile history tests: passed.
- Backend portfolio history route test: passed.
- Mobile typecheck: passed.
- Samsung S23 proof: passed in `docs/mobile/harness/cycle-SQ-recent-trade-proceeds-contract/cycle-SQ-current-mvp-s23-visible-flow.json`.
