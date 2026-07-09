# Cycle RQ - Sell Fill Lands On Portfolio History

## Scope
- Local MVP retail flow only: Home -> visible match outcome -> simple Sell ticket -> server fake-token SELL -> Portfolio History.
- No order book UI, chat, live stats, schema migration, deposit, or social work.

## Reference / Criteria
- Polymarket-style portfolio behavior keeps completed trading activity visible in History after a sell/cash-out action.
- P0: completed `sold`, `closed`, or `canceled` activity should auto-focus Portfolio History when no open orders remain.
- P0: filled sell proof must use a real Android S23 run, server mode, seeded sellable shares, and matching backend liquidity.
- P0: proof must preserve selected event, market, outcome, side, and filled order state.

## Implementation
- Portfolio now auto-focuses History for latest activity actions `sold`, `closed`, and `canceled` when no open orders remain.
- S23 server-order proof wrapper now:
  - tolerates non-fatal config warnings while generating mobile credentials;
  - passes the exact S23 device id;
  - passes seeded event/market/outcome IDs to the mobile smoke route;
  - records a scoped proof summary.
- Mobile proof route can hydrate a forced server-order event and select the exact forced market/outcome.
- Sell liquidity preparation now prefers the visible Match Winner market so the proof enters the ticket like a user from Home.
- Trade Ticket captures Android swipe gestures earlier and the harness uses a delayed S23-style swipe for reliable vertical submit proof.

## Android Proof
- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / `SM-S911U1`.
- Summary: `docs/mobile/harness/cycle-RQ-history-autofocus/cycle-RQ-sell-history-proof.json`.
- Ticket XML: `docs/mobile/harness/cycle-RQ-history-autofocus/cycle-RQ-sell-ticket-ready.xml`.
- Portfolio History XML: `docs/mobile/harness/cycle-RQ-history-autofocus/cycle-RQ-portfolio-history.xml`.
- Screenshots: `docs/mobile/screenshots/cycle-RQ-history-autofocus/`.

## Result
- PASS: backend order summary shows one FILLED SELL for `Paraguay vs Australia: Match Winner`, outcome `Paraguay`.
- PASS: Portfolio proof shows History selected with sold activity row and retail history amount/time markers.
- PASS: pre/post proof noise gates passed with no open-order or locked-balance noise.

## Remaining Gaps
- P1: Production liquidity and public trading policy are still future work.
- P1: The S23 proof uses deterministic local proof liquidity; not real user liquidity.
