# Cycle TX - Realized P/L Tracker Cleanup

Status: contract/docs pass, no visible Android UI change.

## Scope

This cycle closes stale tracker/data-contract text left from Cycle SO. Later cycles SQ and SR already implemented the backend/mobile contract for recent SELL/cashout proceeds and realized P/L:

- SELL rows expose `proceedsTokens`.
- Reconstructable SELL rows expose exact `realizedPnlTokens`.
- BUY rows keep `realizedPnlTokens: null`.
- Incomplete or inconsistent trade basis returns `null` rather than guessed P/L.
- Mobile maps these fields to `PortfolioActivity.proceedsAmount` and `PortfolioActivity.realizedPnl`.

No mobile UI, backend route behavior, schema, order book UI, chat, live stats, social, deposit, or withdrawal work was touched.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Backend History route still returns SELL `proceedsTokens`. | Pass |
| P0 | Backend History route still returns reconstructable SELL `realizedPnlTokens`. | Pass |
| P0 | Mobile History mapper consumes `proceedsTokens` and `realizedPnlTokens`. | Pass |
| P1 | Stale tracker row no longer reports exact row-level realized P/L as open. | Pass |

## Evidence

- `src/app/api/portfolio/history/route.ts`
- `src/__tests__/portfolio.history.route.test.ts`
- `mobile/src/services/portfolioHistoryService.ts`
- `mobile/src/__tests__/portfolioHistoryService.test.ts`
- Prior S23 proof: `docs/mobile/harness/cycle-SR-recent-trade-realized-pnl/cycle-SR-current-mvp-s23-visible-flow.json`

## API/Data Dependencies

| Feature | Route/service | Contract |
| --- | --- | --- |
| Recent trade history | `GET /api/portfolio/history` | Recent SELL rows include `proceedsTokens`; reconstructable SELL rows include `realizedPnlTokens`; unavailable basis stays `null`. |
| Mobile history mapping | `mobile/src/services/portfolioHistoryService.ts` | Maps `proceedsTokens` to `proceedsAmount` and `realizedPnlTokens` to `realizedPnl`. |

## Remaining Gaps

| Gap | Priority | Status | Note |
| --- | --- | --- | --- |
| Production-scale realized P/L persistence | P2 | Open | If history volume grows, route-time reconstruction should move to persisted execution-basis/realized-P/L aggregation. |
| Production liquidity/public market-maker policy | P1 | Open | Unchanged. This cycle only cleans realized P/L tracking. |
