# Cycle WB - Portfolio History Selection Snapshots

## Scope

Local MVP Portfolio History identity for the server-backed fake-token trading flow.

Target user flow:

Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

## Reference Behavior

Polymarket history/activity rows preserve the market and outcome the user traded. For Holiwyn's line-market MVP, the equivalent requirement is that History keeps the selected line, period, provider/source ids, and token/outcome identity for the actual filled trade.

## P0 Criteria

- `/api/portfolio/history` returns `recentTrades[].selection` with the submitted ticket line/outcome identity.
- A later same-market/outcome order must not rewrite an older recent trade's line/provider/token identity.
- Canceled orders continue to use their own `ApiOrderRequest.requestBody.selection`.
- No order book, chat, live stats, social, or non-MVP UI work is introduced.

## Implementation

- `src/app/api/portfolio/history/route.ts` now buckets selection-source orders by `marketId:outcomeId`.
- For each recent trade, the route chooses the candidate order whose `createdAt` is at or before the trade timestamp.
- If no historical candidate exists, it falls back to the newest available request snapshot for backward compatibility.
- `src/__tests__/portfolio.history.route.test.ts` adds a regression where a later `Germany -1.5` order must not change an earlier `Germany -0.5` trade history row.

## Proof

- Focused route test: `npx jest src/__tests__/portfolio.history.route.test.ts --runInBand`
- Local service readiness: restored `argentina-vs-egypt` provider winner markets and Local MVP line fixtures after the local feed was empty.
- Android proof: Samsung S23 `SM-S911U1`, device `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- S23 flow: Home -> Live -> Event Detail -> Spread `1.5` -> Trade Ticket -> seeded fake-token fill -> Portfolio History.
- S23 summary: `docs/mobile/harness/cycle-WB-portfolio-history-selection-snapshots/cycle-WB-current-mvp-s23-visible-flow.json`.
- Result: pass.

## Audit Result

P0: pass.

Remaining P1:

- Add direct immutable trade-level selection storage or an order/trade relation in a future schema cycle.
- Real provider-backed Spread/Totals/Team Total current-match line rows remain unavailable from the current Polymarket source path.
