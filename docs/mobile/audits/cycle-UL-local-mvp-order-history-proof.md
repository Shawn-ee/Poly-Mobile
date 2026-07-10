# Cycle UL - Local MVP Order To Portfolio History Proof

Status: backend/API lifecycle proof pass; no visible UI change.

## Scope

Prove the current Local MVP backend trading lifecycle for the route-selected World Cup match:

- selected `argentina-vs-egypt` line market
- fake-token server-backed order through `POST /api/orders`
- filled Portfolio position from `GET /api/portfolio`
- recent trade from `GET /api/portfolio/history`
- selected line/source/token identity preserved across every step

Out of scope: Android UI proof, order book UI, chat, live stats, social/watchlist, deposit/withdraw, schema migration, and provider-backed line-market import.

## Proof

Output: `docs/mobile/harness/cycle-UL-local-mvp-order-history-proof/cycle-UL-match-line-order-lifecycle.json`

Command:

```powershell
npx tsx scripts/prove_mobile_mvp_match_line_order_lifecycle.ts --cycle=UL --eventSlug=argentina-vs-egypt --summaryPath=docs/mobile/harness/cycle-UL-local-mvp-order-history-proof/cycle-UL-match-line-order-lifecycle.json
```

## Result Summary

| Check | Result |
| --- | --- |
| Event | `argentina-vs-egypt` |
| Market | Spread `Egypt +1.5` |
| Reference source | `contract-fixture` |
| Order route | `POST /api/orders` |
| Order status | `FILLED` |
| Portfolio position present | true |
| History recent trade present | true |
| Selected line preserved | true |
| Selected token preserved | true |
| Portfolio line source summary | `contract-fixture` |
| History line source summary | `contract-fixture` |

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| UL-P0-01 | P0 | The selected line-market order fills through the server order route. | Pass |
| UL-P0-02 | P0 | Order response preserves `marketId`, `outcomeId`, line, period, side, source, provider ids, and token id. | Pass |
| UL-P0-03 | P0 | Portfolio position preserves the same selected line identity. | Pass |
| UL-P0-04 | P0 | Portfolio History recent trade preserves the same selected line identity. | Pass |
| UL-P0-05 | P0 | Portfolio and History classify the selected line as `contract-fixture`, not Polymarket-backed. | Pass |

## Harness Hardening

`scripts/prove_mobile_mvp_match_line_order_lifecycle.ts` now:

- loads `DATABASE_URL` from local `.env` when the shell does not provide it
- handles a UTF-8 BOM in `.env`
- defaults to a high local proof price so the maker quote is less likely to collide with existing local liquidity before the taker order is placed

## Remaining Gaps

- P1: S23 visible proof is still needed for Home/Live -> Event Detail -> line ticket -> server order -> Portfolio/history using this same route data.
- P1: real provider-backed Spread/Totals/Team Total line rows remain unavailable.
