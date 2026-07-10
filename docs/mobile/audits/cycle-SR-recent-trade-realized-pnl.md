# Cycle SR - Recent Trade Realized P/L Replay

## Scope

Local MVP Portfolio History recent SELL/cashout rows.

Out of scope: order book UI, chat, live stats, social features, deposits/withdrawals, provider breadth, and Portfolio visual redesign.

## Reference Behavior

Polymarket-style retail history should distinguish realized sell/cashout activity from bought/opened activity. When the app has enough execution history, recent sold rows should carry backend-owned realized P/L rather than relying on frontend action labels or guessed values.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | `/api/portfolio/history` still returns recent trades, canceled orders, and resolved history. | Pass |
| P0 | Recent SELL rows preserve `proceedsTokens`. | Pass |
| P0 | Recent SELL rows calculate `realizedPnlTokens` from reconstructable trade history. | Pass |
| P0 | BUY rows keep `realizedPnlTokens: null`. | Pass |
| P0 | Invalid or incomplete trade basis returns `null` rather than guessed P/L. | Pass |
| P0 | Existing mobile history mapping consumes `realizedPnlTokens` without extra UI wiring. | Pass |
| P0 | S23 Local MVP buy -> cashout/sell -> Portfolio History proof passes. | Pass |

## Implementation Notes

- Backend route: `src/app/api/portfolio/history/route.ts`.
- Backend test: `src/__tests__/portfolio.history.route.test.ts`.
- Formula matches the matching engine seller logic: `(sell price - average cost) * shares - fee`.
- No schema migration was required.

## Audit Result

P0 pass. Focused backend route tests verify exact recent SELL realized P/L when basis is reconstructable, and Samsung S23 proof verifies the visible Local MVP trade/cashout/history journey.

## Proof

- Backend route test: `src/__tests__/portfolio.history.route.test.ts`.
- Mobile history mapping tests: `mobile/src/__tests__/portfolioHistoryService.test.ts`.
- Mobile typecheck: passed.
- Root TypeScript check: `npm exec -- tsc --noEmit` passed.
- Samsung S23 proof: `docs/mobile/harness/cycle-SR-recent-trade-realized-pnl/cycle-SR-current-mvp-s23-visible-flow.json`.
