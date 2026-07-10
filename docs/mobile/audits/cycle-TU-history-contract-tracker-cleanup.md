# Cycle TU - History Display Contract Tracker Cleanup

Status: contract/docs pass, no visible Android UI change.

## Scope

This cycle cleans stale Local MVP parity debt around Portfolio History display fields. Cycle RR originally left a P1 gap for canonical event/market fields on `/api/portfolio/history`; Cycle RS implemented and proved that contract. The tracker and backend dependency notes are now updated so future cycles do not keep treating this completed contract as open.

No order book UI, chat, live stats, social, deposits, withdrawals, backend schemas, or order logic were touched.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | `/api/portfolio/history` still emits canonical market display fields for server-mode History rows. | Pass |
| P0 | Mobile still maps backend `market.displayTitle` into `PortfolioActivity.marketTitle`. | Pass |
| P0 | Gap tracker no longer reports canonical History event/market fields as open after Cycle RS evidence. | Pass |
| P1 | Fallback title parsing remains documented as compatibility only for old/offline payloads. | Pass |

## API/Data Dependencies

| Feature | Route/service | Contract |
| --- | --- | --- |
| Portfolio History route | `GET /api/portfolio/history` | Returns `market.displayTitle`, `market.eventTitle`, and `market.eventSlug` when available. |
| Mobile History mapper | `mobile/src/services/portfolioHistoryService.ts` | Maps `market.displayTitle` to `PortfolioActivity.marketTitle` and preserves fallback parsing for legacy payloads. |
| Portfolio History UI | `mobile/src/components/Portfolio.tsx` | Prefers `activity.marketTitle` before title parsing. |

## Proof

- `src/__tests__/portfolio.history.route.test.ts`
- `mobile/src/__tests__/portfolioHistoryService.test.ts`
- Prior S23 proof remains Cycle RS: `docs/mobile/harness/cycle-RS-history-display-contract/cycle-RS-sell-history-proof.json`

## Remaining Gaps

| Gap | Priority | Status | Note |
| --- | --- | --- | --- |
| Real provider-backed current-match line breadth | P1 | Open | Unchanged. This cycle only cleans stale History contract debt. |
| Production liquidity/public trading policy | P1 | Open | Unchanged. Local MVP still uses deterministic proof liquidity for internal testing. |
