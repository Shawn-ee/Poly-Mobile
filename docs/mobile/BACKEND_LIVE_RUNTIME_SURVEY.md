# Backend Live Runtime Survey

Generated for the Backend Live Runtime Survey + One Event Live Pipeline goal.

## Current Truth

The current Local MVP is backend-owned and fake-token only. It has proven one sportsbook event with Odds API replay data, route visibility, order placement, Portfolio, cashout/sell, and History. That proof is not the same as a continuous live provider/runtime.

## Existing Pieces

| Area | Existing implementation | Current runtime status |
| --- | --- | --- |
| Odds API import | `src/server/services/theOddsApiSingleEventProvider.ts` and `scripts/seed_the_odds_api_single_event.ts` can fetch or replay one soccer event, normalize markets, upsert `Event`, `Market`, `Outcome`, and `ReferenceQuoteSnapshot`. | Live fetch is one-shot. Replay is default for proof. No long-lived polling loop was present before this goal. |
| Quota protection | `assertQuotaBudget`, `quotaCost`, redacted call records, and `MAX_CREDITS=8` in the seed script. | Present for one-shot import. Needs explicit refresh policy for live loop cadence. |
| Mobile route stack | `GET /api/events`, `GET /api/mobile/events/:slug/live-detail`, `GET /api/markets/:id/quote`, `POST /api/orders`, `GET /api/portfolio`, `GET /api/portfolio/history`. | Proven for replay event. Can support a live-refreshed backend event if snapshots/orders are seeded. |
| Provider lifecycle surface | `mobileLiveEventDetail.ts` reports quote/depth/chart lifecycle as `ready`, `refresh_due`, `stale`, or `unavailable`. Quote snapshots are stale after 90 seconds and refresh-due after 60 seconds. | Exists. Needs a provider refresh runner to keep snapshots fresh. |
| Local matching/order flow | `matching.ts`, canonical order route, Portfolio/history routes. | Proven for fake-token buy/sell and negative sell cases. |
| One-shot maker liquidity | Internal harnesses mint complete sets and place maker ask/bid orders directly with `placeOrderAndMatch`. | Works for proof. Not continuous by default. |
| Continuous bot/soak harness | `scripts/soak_orderbook_bots.ts` references a sibling `poly-bot` package. `scripts/create_sim_bot_credentials.ts` writes bot config to `../poly-bot`. | Not self-contained in this repo. Do not assume it is running or available for mobile MVP runtime. |
| Reference liquidity seeding | `referenceLiquiditySeeding.ts` supports approved Polymarket reference markets only. | Not usable for Odds API sportsbook markets without new source-aware logic. |
| Event pause/close/resolve | Admin routes can pause/close markets and resolve orderbook markets. | Manual/admin lifecycle exists. No automatic soccer settlement or result ingest exists yet. |
| Settlement | `settlement.ts` and admin preview/resolve routes exist for orderbook markets. | Manual/admin-driven. Automatic sports settlement is not proven. |

## Odds API Usage Classification

| Mode | Current support |
| --- | --- |
| Replay fixture only | Yes. `npm run mobile:odds-api-internal-env-proof` defaults to committed redacted Odds API evidence and makes no provider calls. |
| One-time live import | Yes, when `THE_ODDS_API_KEY` is provided to `npm run mobile:the-odds-api-single-event`. |
| Live provider polling | Not previously present as a product runtime. Added as a minimal proof script in this goal, not yet a production daemon. |

## Missing For A Real Live Local Event

| Gap | Priority | Notes |
| --- | --- | --- |
| Source-aware Odds API refresh loop | P0 for this goal | Need configurable interval, quota cap, stale detection, and failure handling. |
| Continuous local market maker tied to provider odds | P0 for this goal | Need maker quotes shifted worse than provider, with risk caps and cleanup. |
| Auto-close/suspend near event start or provider unavailable | P1 | Market status can be changed manually today; automatic lifecycle is not complete. |
| Automatic settlement from official result | P1 | Existing settlement is manual/admin. No final soccer result provider is wired. |
| Production bot daemon ownership | P1 | `poly-bot` is not inside this repo, so mobile repo must not claim continuous bot readiness from that script alone. |

## Survey Conclusion

The backend is close enough for a one-event local live proof because the data model, mobile routes, fake-token matcher, provider snapshot model, and manual lifecycle routes already exist. The missing piece is a small live runner that refreshes one provider event, keeps reference snapshots fresh, places local maker quotes based on those snapshots, and proves mobile route/order/portfolio behavior against the same event.

## Proof Added In This Goal

- Command: `npm run mobile:odds-api-live-runtime-proof`.
- Restart/runtime command: `npm run mobile:one-event-live-runtime`.
- Explicit live-provider wrapper: `npm run mobile:one-event-live-runtime:provider`.
- Script: `scripts/prove_odds_api_one_event_live_runtime.ts`.
- Runtime launcher: `scripts/start_holiwyn_one_event_live_runtime.ps1`.
- Summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`.
- Runtime launch summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json`.
- S23 summary: `docs/mobile/harness/cycle-LIVEODDSS23-odds-api-live-runtime-s23/cycle-LIVEODDSS23-odds-api-s23-visible-flow.json`.
- Result: pass.
- The proof is bounded and local-only. It proves the minimum live path for one upcoming provider event, but it is not an unattended production daemon.
