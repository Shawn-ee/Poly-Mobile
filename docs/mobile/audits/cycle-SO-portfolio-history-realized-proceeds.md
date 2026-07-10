# Cycle SO - Portfolio History Realized Proceeds

## Scope

Local MVP Portfolio History row cleanup. This cycle focuses only on visible History rows after fake-token buy/cashout. It does not change backend routes, schemas, order matching, order book UI, chat, live stats, deposits, or withdrawals.

## Reference Behavior

The Polymarket mobile Portfolio reference shows history rows with a compact icon, action/outcome, event context, amount on the right, and positive winning/proceeds rows in green. Neutral bought rows remain white/neutral.

## Holiwyn Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| SO-P0-01 | P0 | Bought History rows stay neutral and show the order amount on the right. | Pass |
| SO-P0-02 | P0 | Sold/closed History rows show realized proceeds with a leading `+`. | Pass |
| SO-P0-03 | P0 | Sold/closed History amount uses the green positive style. | Pass |
| SO-P0-04 | P0 | History rows keep event and market context visible. | Pass |
| SO-P0-05 | P0 | Full S23 path proves buy -> cashout -> Portfolio History. | Pass |
| SO-P1-01 | P1 | Backend provides exact row-level realized P/L instead of mobile deriving proceeds display from action. | Open |

## Implementation Notes

- Added `isPositiveRealizedActivity`.
- Added `activityAmountDisplay`.
- Applied `activityAmountPositive` to sold/closed activity rows.
- Preserved hidden selection/source/order identity markers.
- No route or schema changed.

## Proof

- Focused tests: `mobile/src/__tests__/portfolioHistoryMarketContextContract.test.ts`, `mobile/src/__tests__/portfolioActivityMetrics.test.ts`.
- Typecheck: `npm run typecheck`.
- S23 proof summary: `docs/mobile/harness/cycle-SO-portfolio-history-realized-proceeds/cycle-SO-current-mvp-s23-visible-flow.json`.
- S23 screenshot: `docs/mobile/screenshots/cycle-SO-portfolio-history-realized-proceeds/cycle-SO-current-mvp-line-cashout-history.png`.

## Remaining Gaps

- P1: exact backend row-level realized profit/loss fields.
- P1: deeper Portfolio position row parity remains separate from this History amount treatment.
