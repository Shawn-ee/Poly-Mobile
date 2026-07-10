# Cycle SP - Portfolio History Realized P/L Contract

## Scope

Local MVP Portfolio History data-contract tightening. This cycle preserves backend-provided realized P/L for resolved history items in the mobile activity model. It does not alter order placement, cashout execution, order book UI, chat, live stats, deposits, withdrawals, or database schema.

## Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| SP-P0-01 | P0 | Existing Local MVP buy/cashout/history flow remains working on S23. | Pass |
| SP-P1-01 | P1 | Resolved `/api/portfolio/history` `realizedPnLTokens` is preserved in mobile state. | Pass |
| SP-P1-02 | P1 | Resolved history proceeds amount is preserved separately from entry amount. | Pass |
| SP-P1-03 | P1 | Recent trade/cashout exact realized P/L backend field is documented as still missing. | Open |

## Implementation Notes

- Added optional `realizedPnl` and `proceedsAmount` to `PortfolioActivity`.
- `portfolioHistoryToActivity` now maps `realizedPnLTokens` and proceeds.
- History amount display prefers explicit `realizedPnl` / `proceedsAmount` when present.
- No backend route or schema changed.

## Proof

- Focused tests: `mobile/src/__tests__/portfolioHistoryService.test.ts`, `mobile/src/__tests__/portfolioHistoryMarketContextContract.test.ts`, `mobile/src/__tests__/portfolioActivityMetrics.test.ts`.
- Typecheck: `npm run typecheck`.
- S23 proof summary: `docs/mobile/harness/cycle-SP-portfolio-realized-contract/cycle-SP-current-mvp-s23-visible-flow.json`.

## Remaining Gaps

- P1: recent trade/cashout rows still need explicit backend row-level realized P/L/proceeds fields.
