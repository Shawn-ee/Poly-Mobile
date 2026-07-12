# Event Lifecycle Runbook

## Local MVP Lifecycle

| State | Meaning | Current support |
| --- | --- | --- |
| Open / LIVE | Users can quote, buy, sell, and see Portfolio/history. | Supported by `Market.status=LIVE` and existing order routes. |
| Refresh due | Provider quote snapshot is still usable but should refresh. | Surfaced by event detail provider lifecycle fields. |
| Stale | Provider quote snapshot is older than route stale threshold. | Surfaced by event detail provider lifecycle fields. Trading is still governed by market status unless a guard is explicitly added. |
| Suspended / PAUSED | Trading disabled manually. | Admin pause route sets `Market.status=PAUSED`. |
| Closed | Trading disabled manually. | Admin close route sets `Market.status=CLOSED` and cancels open orders. |
| Settled / resolved | Winning outcome selected and collateral settled. | Admin/manual orderbook resolve route exists. Automatic soccer settlement is not implemented. |

## Operator Steps For One Local Live Event

1. Start Postgres and backend.
2. Run one-event live runtime proof with `THE_ODDS_API_KEY` in local environment.
3. Confirm the proof reports provider refresh `ready`.
4. Confirm local shifted maker quotes exist.
5. Open mobile and trade the selected event with fake tokens.
6. If provider goes stale or event starts, pause/close the market manually.
7. Do not settle automatically unless official result input and admin review are added.

## Completion Boundary

This runbook supports internal fake-token testing. It does not approve real-money deployment, automatic settlement, public liquidity, or unattended production bots.

## Latest Lifecycle Proof

- Summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`
- Open state: selected market was `LIVE`, visible on Home, visible on Event Detail, and accepted fake-token orders.
- Stale state: proof forced selected quote snapshots stale and Event Detail reported stale provider quote lifecycle.
- Refreshed state: live Odds API refresh restored selected quote lifecycle to ready.
- Closed state: temporarily setting the selected market to `CLOSED` caused order placement to fail with `MARKET_UNAVAILABLE`.
- Settlement readiness: manual resolve route exists, but automatic soccer result ingestion and automatic settlement remain P1.
