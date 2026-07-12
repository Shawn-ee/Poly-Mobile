# Live Runtime P0/P1/P2 Gap List

| Gap | Priority | Status |
| --- | --- | --- |
| Determine whether existing Odds API path is replay, one-shot, or continuous | P0 | Complete: replay and one-shot existed; continuous proof runner added for this goal. |
| Prove one upcoming event can refresh from live provider data | P0 | Complete: Spain vs. France live provider proof passed. |
| Prove stale-to-ready provider lifecycle transition | P0 | Complete: selected quote lifecycle went stale -> ready. |
| Prove local maker quotes shifted worse than provider | P0 | Complete: provider bid/ask `0.4891/0.5291`, maker bid/ask `0.47/0.55`. |
| Prove fake-token buy/Portfolio/cashout/history against refreshed event | P0 | Complete: backend proof passed and S23 proof passed for Home -> Event Detail -> provider totals line -> ticket -> buy -> Portfolio -> sell/cashout -> History. |
| Provide one-command local runtime restart check | P0 | Complete: `npm run mobile:one-event-live-runtime` starts/checks backend, verifies Docker/Postgres, reports S23 reachability, and validates cached one-event live proof without spending provider quota. |
| Provide reusable local maker liquidity seed for internal testers | P0 | Complete: `npm run mobile:one-event-live-runtime -- -SeedMaker` seeds resting shifted bid/ask liquidity for the selected provider-backed market and quote route reports `0.47/0.55`. |
| Prove event lifecycle controls for selected live event | P0 | Complete: `npm run mobile:one-event-lifecycle-proof` proves `LIVE` accepts orders, `PAUSED` and `CLOSED` reject with `MARKET_UNAVAILABLE`, settlement preview is non-mutating, and original market status is restored. |
| Prove local start-time lifecycle scheduler | P0 | Complete: `npm run mobile:one-event-lifecycle-scheduler-proof` proves no action before suspend window, `PAUSED` inside suspend window, `CLOSED` at/after start, paused/closed order rejection, event/market restore, and maker reseed after proof. |
| Provide consolidated one-event readiness gate | P0 | Complete: `npm run mobile:one-event-live-readiness` runs runtime, maker seed, lifecycle proof, backend health, Docker/Postgres, S23 reachability, cached live provider proof, and S23 visible proof checks into one summary. |
| Provide repeated local one-event supervisor | P0 | Complete: `npm run mobile:one-event-live-supervisor -- -MaxIterations 2 -IntervalSeconds 1 -SkipSleep` ran two local cycles, spent no provider quota, and left shifted maker bid/ask quotes visible through the quote route. |
| Continuous unattended daemon | P1 | Not complete; the supervisor is a foreground local command, not an installed service. |
| Always-on auto-close/suspend daemon | P1 | Local one-event scheduler proof exists, but it is not installed as an always-on daemon/service. |
| Automatic official-result settlement | P1 | Manual/admin settlement exists; result provider is missing. |
| One-event data hygiene | P1 | Current one-event proof DB still includes some older mixed-title sportsbook markets under the selected event. Mobile filters the visible MVP market, but import cleanup should remove unrelated provider rows before broader testing. |
| Multi-event provider polling | P2 | Intentionally out of scope to protect quota. |
