# Cycle OF - Ticket and Portfolio Fake-Token Source Clarity

## Scope

Make the Local MVP mixed-source state clearer in the visible trade flow:

- Trade Ticket source note for contract-fixture line markets.
- Portfolio open order/source summary for contract-fixture line markets.

This cycle does not change backend routes, order behavior, schemas, orderbook UI, chat, live stats, social features, or provider discovery.

## Reference / Product Reason

Current inspection shows the app is not yet fully backed by Polymarket line markets:

- Regulation Winner is Polymarket-backed.
- Spread/Totals/Team Total for `argentina-vs-egypt` remain backend-shaped `contract-fixture` line markets.

The Local MVP can still support fake-token trading through these fixtures, but the ticket and portfolio must not imply that fixture line markets are real Polymarket-backed lines.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| OF-P0-01 | P0 | Trade Ticket renders contract-fixture line markets as `Local test line - fake-token` in intent and XML evidence includes `fake-token`. | Pass |
| OF-P0-02 | P0 | Portfolio open orders and source summary render contract-fixture line markets as local-test fake-token lines in intent and XML evidence includes `fake-token`. | Pass |
| OF-P0-03 | P0 | S23 proof still completes Home -> Event Detail -> Spread ticket -> fake-token server order -> Portfolio. | Pass |
| OF-P0-04 | P0 | Backend order routes and schemas are not changed. | Pass |
| OF-P1-01 | P1 | Replace contract fixtures with real provider-backed Spread/Totals/Team Total when attach-ready Polymarket line markets exist. | Open |

## Implementation Notes

- `TradeTicket` contract-fixture source note now says `Local test line · fake-token`.
- `Portfolio` contract-fixture open order source note now says `Local test line · fake-token`.
- `Portfolio` source summary now says `Local test lines · fake-token` when local line fixtures are present.
- Focused tests check readable `Polymarket`, `Local test`, and fake-token source wording.

## Proof

- Mobile TypeScript: pass.
- Focused mobile Vitest source-badge tests: pass.
- Samsung S23 proof: pass on `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / `SM_S911U1`.
- Proof summary: `docs/mobile/harness/cycle-OF-ticket-portfolio-fake-token-source/cycle-OF-ticket-portfolio-fake-token-source-proof.json`.
- Screenshot evidence: `docs/mobile/screenshots/cycle-OF-ticket-portfolio-fake-token-source/`.
- XML evidence: `docs/mobile/harness/cycle-OF-ticket-portfolio-fake-token-source/`.

## Audit Gate

Pass for the narrow OF scope. The app is clearer that line-market ticket/portfolio activity is fake-token local-test trading, while Regulation Winner/provider-backed work remains separate.

Remaining P1 parity gap: real provider-backed Spread/Totals/Team Total line markets are still missing for the current event.
