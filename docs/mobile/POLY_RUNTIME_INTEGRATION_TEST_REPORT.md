# Poly Runtime Integration Test Report

Generated: 2026-07-07

Branch: `cycle/fj-real-provider-home-ticket`

Remote target: `poly-mobile`

## Summary

This loop tested Holiwyn mobile as a local/internal frontend for the Poly backend exchange.

Result:

- Ready for internal bot-backed local testing: yes, with P1 cleanup caveats.
- Ready for server deployment rehearsal: no.
- Ready for production/public launch: no.

The tested architecture matches the intended product model: Polymarket is used as reference metadata and reference price input, while the mobile app trades against the Poly backend/local fake-token exchange. No real Polymarket orders were placed.

## Services Started Or Verified

| Service | URL/port | Result |
| --- | --- | --- |
| Poly backend/API | `http://127.0.0.1:3002` | Pass. `/api/health` returned `status=ok`, `db=connected`. |
| Postgres | `5432` | Pass through backend health/readiness checks. |
| Expo mobile dev server | `http://127.0.0.1:8081` and `exp://172.16.200.14:8081` | Pass. S23 connected through Expo. |
| Samsung S23 | ADB device `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` | Pass. Device loaded Holiwyn. |

Mobile runtime intent:

- `EXPO_PUBLIC_ORDER_MODE=server`
- `EXPO_PUBLIC_MARKET_DATA_MODE=server`
- `EXPO_PUBLIC_API_BASE_URL` points to the local backend reachable from S23.
- `EXPO_PUBLIC_API_KEY` is a local mobile development credential only.

Secrets are intentionally omitted from this report.

## Docs And Source Consulted

- `docs/mobile/POLY_RUNTIME_INTEGRATION_TEST_LOOP.md`
- `docs/runbook.md`
- `docs/reviews/BOT_RISK_CONTROL_PLAN.md`
- `docs/reviews/BOT_DRY_RUN_SAFETY_TEST_PLAN.md`
- `scripts/check_poly_internal_exchange_readiness.ts`
- `scripts/refresh_reference_snapshots.ts`
- `scripts/create_mobile_dev_credential.ts`
- `src/server/services/polymarketReferenceSnapshots.ts`
- `poly-bot/scripts/liquidityRuntime.ts`
- `poly-bot/src/referenceMarket/liveMarketMaker.ts`
- `poly-bot/src/referenceMarket/eventAdmin.ts`

## Commands Run And Classification

| Step | Command purpose | Classification | Result | Expected state change |
| --- | --- | --- | --- | --- |
| Git/remote check | Verify branch, remotes, latest commit, clean tree | Read-only | Pass | None |
| Backend health | Check `/api/health` | Read-only | Pass | None |
| Internal exchange readiness before refresh | `poly:internal-exchange-readiness` | Read-only | Failed as expected | None |
| Reference snapshot refresh | Refresh Polymarket reference snapshots for `mobile-fj-real-world-cup-winner` | Local-mutating | Pass | Updated local reference snapshot rows |
| Internal exchange readiness after refresh | `poly:internal-exchange-readiness` | Read-only | Pass | None |
| Bot dry-run | Planned shifted quotes for England, Argentina, France | Dry-run | Pass | No orders placed |
| Second reference refresh | Refresh snapshots before live-local test | Local-mutating | Pass | Updated local reference snapshot rows |
| Live-local bot test | Short allowlisted Argentina local bot run | Live-local fake-token | Pass | Managed local Poly bot state only |
| Route probes | `/api/events`, live-detail, quote, portfolio/profile routes | Read-only | Pass with P1 caveats | None |
| Mobile credential/order smoke | Local fake-token credential, buy, oversell rejection, cancel | Local-mutating fake-token | Pass | Created local fake-token orders/position/history |
| S23 proof | Open Expo app and inspect UI hierarchy | Device proof | Pass with P1 portfolio-account caveat | Device navigation only |

No production-dangerous command was run.

## Market Import And Visibility

Readiness before refresh:

- DB connected: yes
- Event count: 7
- Market count: 231
- Outcome count: 474
- Mobile-visible event count: 7
- Provider-backed mobile-visible event count: 1
- Provider markets inspected: 8
- Snapshot-ready provider markets: 0
- Local market-maker-ready provider markets: 0
- Blockers: `no_ready_provider_snapshots`, `local_mm_ready_market_count_below_1`

After reference refresh:

- Mobile-visible event count: 7
- Provider-backed mobile-visible event count: 1
- Provider markets inspected: 8
- Mobile-visible provider markets: 8
- Snapshot-ready provider markets: 8
- Local market-maker-ready provider markets: 3
- Open-order-backed provider markets: 3
- Readiness blockers: none

The provider-backed event is:

- Slug: `mobile-fj-real-world-cup-winner`
- Title: `World Cup Winner`
- Market profile: `outright`
- Market count: 8

This satisfies "multiple imported Polymarket-backed markets" as multiple markets inside one event. It does not yet satisfy "multiple provider-backed events" if that becomes a later requirement.

## Reference Price Refresh

The refresh for `mobile-fj-real-world-cup-winner` completed successfully:

- Markets refreshed: 8
- Snapshots updated: 16
- Skipped: 0
- Stale snapshots: 0
- Wide snapshots: 0
- Missing snapshots: 0
- Error snapshots: 0
- `mmEligible`: true for tested outcomes

Example reference prices observed:

- Argentina reference bid/ask: `0.184 / 0.185`
- England reference bid/ask: `0.147 / 0.148`
- France reference bid/ask: `0.330 / 0.331`
- Belgium reference bid/ask: `0.023 / 0.024`

## Market Maker Dry Run

Dry-run settings:

- `SYSTEM_LIQUIDITY_DRY_RUN=true`
- `LIVE_SYSTEM_LIQUIDITY_ENABLED=false`
- `QUOTE_OFFSET_TICKS=2`
- `TICK_SIZE=0.01`
- Allowlist: England, Argentina, France

Result: pass.

Observed planned shifted quotes:

- England reference `0.147 / 0.148`, planned local `0.13 / 0.17`
- Argentina reference `0.184 / 0.185`, planned local `0.16 / 0.20`
- France reference `0.330 / 0.331`, planned local `0.31 / 0.35`

No local orders were placed in dry-run. No Polymarket orders were placed.

## Live-Local Fake-Token Bot Test

Live-local settings:

- `SYSTEM_LIQUIDITY_DRY_RUN=false`
- `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`
- `QUOTE_OFFSET_TICKS=2`
- `TICK_SIZE=0.01`
- `MAX_SINGLE_ORDER_NOTIONAL_CENTS=100`
- `MAX_PER_MARKET_EXPOSURE_CENTS=20000`
- `MAX_GLOBAL_EXPOSURE_CENTS=100000`
- Allowlist: Argentina only
- Runtime: short local window

Result: pass.

The bot reached `manage_quotes` for Argentina with:

- Market: `will-argentina-win-the-2026-fifa-world-cup-245`
- Reference bid/ask: `0.184 / 0.185`
- Planned local quote: `0.16 / 0.20`
- Reasons blocking quote management: none
- Local open order count: 3
- Global exposure: 2648 cents

No real Polymarket orders were placed. The bot managed the Poly local fake-token market only.

## Backend Route Proof

Verified routes:

- `/api/health`
- `/api/events?source=polymarket&includeMobileMarkets=1&limit=3`
- `/api/mobile/events/mobile-fj-real-world-cup-winner/live-detail`
- `/api/markets/:marketId/quote`
- `/api/orders`
- `/api/orders/:orderId`
- `/api/portfolio`
- `/api/portfolio/history`
- `/api/profile/summary`

Important route observations:

- `/api/events` returned the provider-backed `World Cup Winner` event with `marketCount=8`.
- Live detail returned `marketProfile=outright`, `resultMode=one_winner`, and `supportedMarketTypes=["outright"]`.
- Quote route returned local Poly orderbook pricing, not a direct Polymarket trade route.
- Order submission and cancel route worked against local fake-token backend state.
- Portfolio route returned backend state for the credential used.

## Mobile S23 Proof

Device proof:

- S23 connected through ADB.
- Expo opened `exp://172.16.200.14:8081`.
- Holiwyn rendered on device.
- Home showed backend/server-mode feed with `World Cup Winner`.
- UI hierarchy included backend card marker `event-card-mobile-fj-real-world-cup-winner`.
- The visible Home card showed `World Cup Winner` and backend-derived probabilities.
- Portfolio tab opened and showed backend account shell/value from the current app credential.

S23 Portfolio caveat:

- The route-level order proof used a freshly generated mobile development credential.
- The S23 app instance was using a different active local test credential, so it showed a clean backend account with no positions.
- This is not a backend route failure, but it means the device proof and order-fill proof were not performed against the same account in this loop.

## Fake-Token Order Proof

Using a local mobile development credential:

- Created/found local mobile test user: `holiwyn-mobile-dev`.
- Submitted a France buy order through `/api/orders`.
- Buy order filled against local Poly liquidity.
- Portfolio showed one position after the buy.
- Attempted oversell with size greater than available position.
- Backend rejected oversell with HTTP 409 Conflict.
- Submitted an Argentina open order.
- Canceled the open order through `/api/orders/:id`.
- Portfolio/history reflected the canceled order.

Sanitized result:

- Filled buy: yes
- Position after buy: yes
- Oversell rejected: yes
- Cancel route worked: yes
- Canceled order appeared in history: yes

No real-money order and no Polymarket order was placed.

## Cashout And Cancel Safety

Proof result:

- No direct cashout UI proof was run in this loop.
- Backend sell/oversell safety was proved through `/api/orders`: an attempted sell greater than available position was rejected with HTTP 409.
- Cancel route was proved through a local fake-token open order and backend cancel.

Safety status:

- Backend oversell protection: pass.
- Backend cancel protection: pass.
- S23 same-account cashout visual proof: P1 gap for the next loop.

## Issues Found

### P0

None remaining from this loop.

### P1

1. S23 Portfolio and API order smoke used different local mobile credentials.
   - Impact: device UI proof did not show the same position created by the route smoke.
   - Next action: restart Expo with one known dev credential, place the order from that same credential, then verify Portfolio on S23.

2. Only one provider-backed event is mobile-visible.
   - Impact: multiple imported markets are visible, but only under `World Cup Winner`.
   - Next action: run the controlled import/grouping sequence for more selected Polymarket-backed events.

3. Live-detail provider lifecycle still reports stale provider sub-data in some areas.
   - Impact: quote snapshots are fresh, but orderbook-depth/chart-history lifecycle data can still be stale.
   - Next action: decide whether orderbook-depth/chart-history is required for mobile MVP. If not, keep it out of the MVP readiness gate.

4. Some local orderbook prices can be dominated by stale/test local orders.
   - Impact: the quote route can show local Poly prices far away from fresh Polymarket reference if old test orders remain in the book.
   - Next action: add a local runtime cleanup/noise gate for allowlisted markets before proof runs.

5. Bot live-local run managed existing quotes but did not need to place new quote actions.
   - Impact: it proves safe live-local management, but not fresh quote creation from an empty book.
   - Next action: run a tiny allowlisted clean-book test after adding the cleanup/noise gate.

### P2

1. S23 app was in Chinese locale during proof.
   - Impact: acceptable for runtime proof, but screenshots/readouts are less clear for English audit review.
   - Next action: switch locale before formal stakeholder screenshot capture.

2. Some seeded non-provider World Cup game rows remain local/dummy-backed.
   - Impact: fine for internal development, but should be clearly labeled or hidden when testing provider-backed-only runtime.
   - Next action: add a runtime filter for provider-backed proof mode if needed.

## Bots To Keep

- Reference snapshot refresh script: keep.
- Polymarket reference market maker dry-run: keep.
- Live-local fake-token market maker with allowlist and caps: keep for internal-only testing.
- Internal exchange readiness check: keep.

## Bots To Disable Or Avoid

- Any production/live-money bot path.
- Any path that places real Polymarket orders.
- Any broad unbounded market-maker run without allowlist, dry-run, and caps.

## Bots To Improve

- Add an allowlisted local orderbook cleanup/noise check before runtime proofs.
- Add clearer distinction between imported provider-backed markets and local seeded dummy markets.
- Add a clean-book tiny quote-creation proof after cleanup/noise gating exists.
- Keep two-tick shifted quote reporting in the dry-run output, since that is the product's core pricing idea.

## Readiness Decision

Internal bot-backed local testing: yes.

Reason: backend, DB, mobile server-mode feed, reference snapshots, dry-run shifted quotes, short live-local fake-token bot management, fake-token order submit, oversell rejection, cancel, and S23 app loading were all proven.

Server deployment rehearsal: no.

Reason: the current proof is local-only and still has P1 account-alignment, provider breadth, stale lifecycle sub-data, and local orderbook-noise gaps.

Production/public launch: no.

Reason: production safety, real auth/wallet boundaries, real money controls, deployment hardening, provider breadth, monitoring, and clean market operations are not proven.

## Next Recommended Loop

Run a focused "single-account S23 runtime proof" loop:

1. Generate or choose one local mobile dev credential.
2. Restart Expo with that exact credential.
3. Confirm S23 Home loads the provider-backed `World Cup Winner` event.
4. Place one tiny fake-token order through the S23 Trade Ticket.
5. Confirm Portfolio on the same S23 account shows the position.
6. Confirm cashout/sell safety and cancel behavior from the same account.
7. Keep screenshots/XML out of git unless a specific proof artifact is required.

After that, run a separate provider-import breadth loop:

1. Controlled allowlist import for more Polymarket-backed markets/events.
2. Group/classify them into mobile-safe event structures.
3. Refresh reference snapshots.
4. Run bot dry-run only.
5. Expose the new provider-backed events in Home/Search/Event Detail.
6. Run S23 proof for multiple provider-backed events.
