# Mobile Backend Route Dependency Map

Purpose: document what the mobile app needs from backend routes, auth, request/response contracts, database models, and mock fallbacks for each feature cycle.

## Cycle ZY - Operator Snapshot Lifecycle Handoff

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal tester lifecycle handoff snapshot | `/api/health`; `/api/internal/live-runtime/status`; local command `npm run mobile:internal-tester-operator-snapshot` | `GET` plus local CLI | Local/internal status route only; no mobile auth and no provider key. The snapshot command refuses production. | Optional `--baseUrl` and `--summaryPath`; no request body | `selectedEventLifecycle`, `operatorNextActions.eventLifecycleAction`, `eventLifecycleWindow`, `eventLifecycleOperatorAction`, tester checklist lifecycle row, derived next lifecycle action and timestamp | Reads status route projection of existing `Event.startTime`; no schema change and no writes | None. If health/status is unavailable or status has P0 gaps, the snapshot fails rather than fabricating tester readiness | Installed unattended lifecycle service remains P1. The snapshot is read-only and does not run the lifecycle scheduler. |

## Cycle ZX - Lifecycle Scheduler Timing Proof

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| One-event lifecycle scheduler timing artifact | `npm run mobile:one-event-lifecycle-scheduler-run` | Local CLI/service call | Local dev DB only; no provider key and no mobile auth | Optional `eventSlug`, `suspendBeforeStartSeconds`, `referenceSource`, `dryRun`, and `summaryPath` | `scheduler.timing.tradingWindow`, `pauseAt`, `closeAt`, `secondsUntilStart`, `secondsUntilPause`, `nextLifecycleAction`, `nextLifecycleActionAt`, `secondsUntilNextLifecycleAction`, `operatorNextAction`, `candidateMarketStatusCounts`, and `mutationApplied` | Reads `Event.startTime`, `Event.status`, `Event.liveStatus`, and public sportsbook-backed `Market.status`; may update `Market.status`/`closeTime` and cancel open orders only when not dry-run and action is due | Dry-run mode produces the same timing evidence without mutation or provider quota | Installed unattended lifecycle service remains P1. This command is still foreground/local unless run by the local supervisor. |

## Cycle ZW - Lifecycle-Aware Operator Actions

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lifecycle-aware runtime next action | `/api/internal/live-runtime/status` | `GET` | Local/dev only; route returns unavailable outside the internal runtime status environment | Optional `phaseAuditInProgress=1` for audit bootstrap | `operatorNextActions.recommendedFirstAction`, `eventLifecycleAction`, `eventLifecycleWindow`, `eventLifecycleOperatorAction`, and action rows `run_lifecycle_pause` / `run_lifecycle_close` when applicable | Reads existing `Event.startTime` through `selectedEventLifecycle`; no schema change and no writes | None. Current open event state keeps `cached_internal_testing`; test coverage proves pause/close recommendations with synthetic event timing | Installed unattended lifecycle service remains P1. The action points to the existing lifecycle scheduler command but does not run it from the status route. |

## Cycle ZV - Selected Event Lifecycle Status

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal tester selected-event lifecycle status | `/api/internal/live-runtime/status` | `GET` | Local/dev only; route returns unavailable outside the internal runtime status environment | Optional `phaseAuditInProgress=1` for audit bootstrap | `selectedEventLifecycle.checked`, `found`, `eventSlug`, `eventId`, `title`, `status`, `liveStatus`, `startTime`, `secondsUntilStart`, `suspendBeforeStartSeconds`, `tradingWindow`, `schedulerActionNow`, and `operatorNextAction` | Reads existing `Event` row by selected local slug from completion/phase audit evidence; no schema change and no writes | None. If the event is missing, status becomes `needs_attention` with P0 gap `selected_event_missing_from_db` | Installed unattended lifecycle service remains P1. This route reports lifecycle timing; the existing scheduler/supervisor still performs pause/close behavior when run. |

## Cycle ZL - One-Command Onboarding Aliases

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cached runtime onboarding shortcut | `npm run mobile:one-event-onboarding:cached-runtime`; child checks use `/api/health`, `/api/internal/live-runtime/status`, event/detail/quote routes, order/portfolio proof routes, and settlement readiness commands | Local CLI plus local `GET`/`POST` child proofs | Local development runtime and generated proof credential for order/portfolio child proof; no provider key | No direct request body. Alias passes `-AllowDisconnectedS23 -StartRuntimeLoops -StopRuntimeLoopsAfterProof` to the existing onboarding wrapper | Onboarding pass/fail, backend health, selected event/market, runtime loop start/status/stop summaries, settlement readiness, and no-quota runtime truth | Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance`, `RuntimeServiceHeartbeat`, `RuntimeServiceRun` | Cached mode restores/uses committed provider-shaped evidence and does not call The Odds API | Installed unattended service ownership remains P1. |
| Live-provider runtime onboarding shortcut | `npm run mobile:one-event-onboarding:live-provider-runtime`; child provider calls stay inside the existing `-RunProviderRefresh` path | Local CLI plus provider `GET` when explicitly run | Local `THE_ODDS_API_KEY` required in the caller environment; no committed key | Alias passes `-RunProviderRefresh -StartRuntimeLoops -StopRuntimeLoopsAfterProof` | Live provider quota/cadence summary, ready-after-refresh provider snapshots, runtime loop proof, settlement readiness | Existing provider-backed event/market/outcome/snapshot models and durable proof rows | None. This path is intentionally not default because it may spend quota | Multi-event onboarding and installed provider daemon remain future work. |

## Cycle ODDSAPIS23CASHOUTFRESH - Spain vs. France Cashout and Event Restore

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cached Spain vs. France restore for S23 tester proof | Local command `npm run mobile:one-event-cached-restore`; public Home route `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1` | Local CLI plus `GET` | Local DB for restore; no auth for Home route | Restore reads `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json` | Event `title=Spain vs. France`, `resultMode=must_advance`, `primaryMarketProfile=advance`, `marketProfile=full_match_with_overtime`, and top advance outcomes `France advances` / `Spain advances` | Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | Cached restore avoids provider quota and closes stale replay markets under the reusable test slug | Per-provider-event slugs remain P2 before multi-event onboarding. |
| S23 buy/cashout/history proof | `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history`, `/api/internal/live-runtime/status` | `GET`/`POST` | Generated local mobile dev credential for order/portfolio routes | Buy uses selected market/outcome/size/price; cashout Sell uses owned market/outcome, `side=SELL`, owned share quantity, and current bid/sell price | Event detail markets, quote price, order fill result, Portfolio position, cashout close-position markers, History row, runtime P0/P1/P2 state | `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, `UserBalance`, local runtime proof rows | Proof-only liquidity seeded by `scripts/seed_mobile_route_spread_counterparty.ts`; no provider quota used | No P0 for internal tester trading. Installed unattended runtime service and official result auto-settlement remain P1. |

## Cycle SETTLEMENTFRESHSTATUS - Settlement Guard Freshness in Runtime Status

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| One-event settlement guard freshness gate | Local command `npm run mobile:one-event-runtime-status`; proof command `npm run mobile:one-event-result-settlement-execution-proof` | Local CLI plus DB/service calls | Local development DB only; no provider key and no mobile auth | Optional CLI `--maxSettlementProofAgeHours`; proof uses a disposable event and local trusted-result fixture | `settlementSafety.resultSettlementExecutionFresh`, `resultSettlementLiveBlockedFresh`, `resultSettlementGuardFresh`, `maxSettlementProofAgeHours`, `nextSettlementProofAction`, `executionRequiresMarketStatus`, and `activeTesterEventMutated` | Existing `Event`, `Market`, `Outcome`, `Order`, `Position`, settlement/audit rows touched by the disposable proof; active tester event is only snapshotted | None. The gate reads committed redacted proof artifacts and the proof refreshes disposable local data only | Installed unattended official-result polling/settlement remains P1. Active event execution still requires closed market status plus exact approval/confirmation. |

## Cycle S23PROOFFRESHSTATUS - S23 Proof Freshness in Runtime Status

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal tester S23 proof freshness gate | `/api/internal/live-runtime/status` | `GET` | Local/dev only; route returns 404 in production or when internal status is disabled; no public mobile auth and no provider key | Optional `phaseAuditInProgress=1` for audit bootstrap | `freshness.s23ProofPath`, `s23ProofDevice`, `s23ProofAgeAtCompletionHours`, `s23ProofCurrentAgeHours`, `maxS23ProofAgeHours`, `s23ProofFresh`, and `s23ProofNextAction`; readiness becomes `needs_attention` when S23 proof is stale | Reads existing redacted proof artifacts only; no database schema change and no writes | None. The route projects existing completion-audit proof metadata and does not run physical-device proof | Automatic S23 proof refresh remains manual/operator-driven. If stale, rerun the S23 cashout/trading proof before claiming internal tester readiness. |

## Cycle LIVEODDSREPEAT - Repeatable Live Provider Proof

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Repeatable one-event live provider refresh | The Odds API `/v4/sports`, `/v4/sports/{sport}/events`, `/v4/sports/{sport}/events/{eventId}/markets`, `/v4/sports/{sport}/events/{eventId}/odds`; local command `npm run mobile:one-event-live-runtime:provider` | Provider `GET`; local proof command | `THE_ODDS_API_KEY` in the caller's process environment only | One event, capped market keys, `regions=us`, `oddsFormat=decimal`, two refresh iterations under quota cap | Redacted quota headers, selected event, normalized markets/outcomes, provider quote snapshots, stale-to-ready quote lifecycle | Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `MarketOutcomeSnapshot`, `ProviderRefreshRun` | Cached runtime/status checks read the redacted proof and do not call the provider | Continuous unattended provider refresh remains P1. |
| Repeatable outcome identity upsert | Internal provider seeding service `seedOddsApiSingleEvent` | Local DB/service call | Local dev DB only | Normalized market/outcome specs from provider response | Stable outcome `code`, `slug`, `referenceTokenId`, `referenceMetadata`, and market/outcome identity | Existing globally unique `Outcome.slug` and unique `(marketId, code)` constraints | None | No schema change. Legacy/global slug collisions get deterministic per-market suffixes instead of failing the import. |
| Local proof collateral reconciliation | Internal proof helper in `scripts/prove_odds_api_one_event_live_runtime.ts` before maker seeding | Local DB/service call | Local development only; refuses production | Selected public `sportsbook-odds` market id | Records `marketMaker.collateralRepair` with before/after collateral and by-outcome outstanding shares | Existing `Market.collateralUSDC`, `Outcome`, `Position` | None | This is proof-state hygiene only. Production accounting/settlement reconciliation remains outside this cycle. |

## Cycle S23CASHOUT - Spain vs. France Cashout Proof

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home shows backend-owned provider World Cup event | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1` | `GET` | None for public event list | Query only. `sportKey=soccer` now includes provider alias `soccer_fifa_world_cup`; `leagueKey=world_cup` now includes provider alias `soccer_fifa_world_cup`. | `events[].slug`, `title`, `sportKey`, `leagueKey`, `eventType`, team names, status/live status, compact `markets`, market source summary | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | No mobile fallback in server mode; if the route is unreachable, Home may show fallback/local empty state. | None for the tested internal event. |
| S23 buy/cashout/history flow | `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | `GET`/`POST` | Local mobile dev credential/API key | Buy order uses selected market/outcome/side/price/size; cashout Sell uses owned market/outcome and owned share quantity | Event detail markets, quote price, order fill result, Portfolio position, sold History row | `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, user balance | Deterministic proof liquidity is seeded by `scripts/seed_mobile_route_spread_counterparty.ts`; no provider quota used | Provider line breadth remains P1 for unavailable line families. |

## Cycle S23STARTUPGATE - S23 Startup Audit Gate

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Audit-gated S23 server-backed startup | Existing audit commands `npm run mobile:one-event-phase-audit` and `npm run mobile:live-runtime-completion-audit`; protected runtime path later consumes `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` | Local read-only audit commands plus existing HTTP routes | Local dev runtime only. No provider key and no mobile auth are required for audit. Existing mobile order routes keep their existing local API key/session behavior. | None for audit. The audit reads `scripts/manage_holiwyn_internal_tester_runtime.ps1` source contract and existing runtime evidence. | Audit checks `managedS23ServerModeStartupKnown`, including manager-owned server-mode env, S23 ADB reverse failure handling, and the external Expo unverified warning contract; completion `runtimeLaunch` includes the same managed server-mode startup contract | No schema change. No database writes from this gate. | None. The audit prevents the internal tester launch path from silently drifting back to mock/default mobile mode and prevents reused stale Expo listeners from counting as verified server-mode proof. | None for local runtime gate. Production service ownership remains P1 and is still not claimed by this source-contract check. |

## Cycle S23SERVERMODESTART - Managed Expo Server-Mode Startup

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S23 server-backed internal tester launch | Backend `GET /api/health` for readiness; mobile app then uses `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` through `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3002` | Local PowerShell process launch plus existing HTTP routes | Local dev runtime only. Mobile order routes still require the existing local API key/session flow. No provider key is required for cached startup. | Runtime manager flags: `Action=start`, `BackendPort`, `ExpoPort`, optional supervisor/result-poller flags. ADB reverse maps `tcp:3002` and `tcp:8081` when S23 is connected. | Runtime summary now records manager-started Expo server-mode env and ADB reverse results; mobile consumes existing event/detail/quote/order/portfolio fields | No schema change. Existing `Event`, `Market`, `Outcome`, `Order`, `Position`, `Trade`, and wallet/balance models remain unchanged. | None. This prevents accidental mock/default mobile mode during managed internal tester startup. | Manager can only verify Expo env for processes it owns. If an external Expo listener already occupies the port, restart it through the manager or manually start Expo with the same server-mode env. |

## Cycle OPERATORCONTROLBOUNDARY - Runtime Operator Controls Boundary

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local operator controls boundary | `/api/internal/live-runtime/status`; source evidence from `/api/internal/live-runtime/result-review` and `/api/internal/live-runtime/settlement-queue` inside phase audit | `GET` | Local/dev only; route returns 404 in production or when internal status is disabled; no public mobile auth and no provider key | Optional `phaseAuditInProgress=1` for audit bootstrap | `operatorControlBoundary.mode`, `devOnly`, `readOnly`, `noProviderQuota`, `authenticatedControls.*`, `localControls.resultReviewRoute`, `localControls.settlementQueueRoute`, `localControls.approvedSchedulerCommand`, `executionSafety.*`, `productionBlockers`, `requiredBeforeProduction`, `p0`, `p1` | Reads existing local proof artifacts plus `OfficialResultReview`, `CanonicalEvent`, `Market`, and `Event` evidence through phase-audit snapshots; no schema change and no writes from status route | None. The route projects existing local read-only evidence and spends no provider quota. | Production still needs authenticated operator controls, role checks, durable operator identity, audited approval/execution workflow, installed official-result polling, and service ownership. |

## Cycle RUNTIMECOMMANDS - Operator Launch Commands in Runtime Status

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local runtime launch command projection | `/api/internal/live-runtime/status` | `GET` | Local/dev only; route returns 404 in production or when internal status is disabled; no mobile auth and no provider key | Optional `phaseAuditInProgress=1` for audit bootstrap | `serviceOwnership.localLaunch.recommendedProfileCommand`, `recommendedProfileInstallCommand`, `recommendedProfileUninstallCommand`, `scheduledTaskPlanCommand`, `scheduledTaskInstallCommand`, `liveProviderCommand`, `liveProviderInternalTesterCommand`, quota/prod-boundary fields | Reads existing launch-profile proof artifacts plus runtime status artifacts; no database schema change and no writes | None. The route projects existing no-quota artifact data and does not start or install anything. | Production still needs authenticated runtime controls, installed service ownership, and official-result auto-settlement controls. |

## Cycle SETTLEMENTBLOCKEDEVIDENCE - Blocked Settlement Audit Trail

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local blocked settlement evidence | `/api/internal/live-runtime/result-review`; `/api/internal/live-runtime/status`; gated by `npm run mobile:one-event-phase-audit` | `GET` | Local/dev only; route returns 404 in production or when internal status is disabled; no mobile auth and no provider key | Optional query `eventSlug`, optional query `marketId`; optional status `phaseAuditInProgress=1` | `reviewTrail.settlementBlockedEvent`, `runtimeTruth.canonicalSettlementBlockedAuditAvailable`, status `resultReview.canonicalSettlementBlockedAuditAvailable`, and redacted blocked payload fields including `executionReason` and `currentMarketStatus` | Reads `CanonicalEvent` rows with type `settlement.trusted_result.blocked`, plus existing `Market`, `Event`, and `OfficialResultReview`; no schema change and no writes from status route | None. This projects existing canonical audit evidence and spends no provider quota. | Production still needs authenticated operator UI/actions, installed official-result polling, and durable execution-attempt ownership. |

## Cycle SETTLEMENTSTATUSGUARD - Status Projection for Repeat-Execution Safety

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local status repeat-execution guard projection | `/api/internal/live-runtime/status`; source evidence from `/api/internal/live-runtime/result-review` inside phase audit | `GET` | Local/dev only; route returns 404 in production or when internal status is disabled; no mobile auth and no provider key | Optional `phaseAuditInProgress=1` for audit bootstrap | `resultReview.settlementAlreadyExecuted`, `resultReview.repeatExecutionBlocked`, `resultReview.repeatSettlementExecutionBlocked`, existing exact-confirmation redaction flags, and P0 status | Reads redacted phase-audit evidence backed by `OfficialResultReview`, `CanonicalEvent`, `Market`, and `Event`; no schema change and no writes from status route | None. The route projects existing runtime evidence and spends no provider quota. | Production still needs authenticated operator action endpoints, installed official-result polling, and durable execution-attempt ownership. |

## Cycle SETTLEMENTIDEMPOTENCY - Result Review Repeat-Execution Guard

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local result-review repeat-execution guard | `/api/internal/live-runtime/result-review`; gated by focused service test and no-quota runtime audits | `GET` | Local/dev only; route returns 404 in production or when internal status is disabled; no mobile auth and no provider key | Optional query `eventSlug`, optional query `marketId` | `executionDecision.operatorDecision="already_executed"`, `executionDecision.executionEligibleNow=false`, `executionDecision.settlementAlreadyExecuted=true`, `executionDecision.repeatExecutionBlocked=true`, `runtimeTruth.canonicalSettlementExecutionAuditAvailable=true`, `runtimeTruth.repeatSettlementExecutionBlocked=true`, and redacted `officialResultReview` fields | Reads `Market`, linked `Event`, and `CanonicalEvent`; writes/updates redacted `OfficialResultReview` with `settlementExecutedCanonicalId`, terminal `executionDecision`, and `executionEligibleNow=false` | None. The route reads existing canonical execution evidence and spends no provider quota. | Production still needs authenticated operator UI/actions, installed official-result polling, and durable execution-attempt ownership beyond this local status contract. |

## Cycle CASHOUTPOSITIONUX - Position Close Ticket Contract

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio/Event Detail cashout | `/api/orders` via `PolyApi.placeLimitOrder` | `POST` | Mobile API key in server mode | `marketId`, `outcomeId`, `side="SELL"`, `contractSide`, `price` from current sell/bid price, `size` from owned share quantity, and `selection` identity | Order id/status/size/remaining/fills; follow-up Portfolio sync reads positions/history from existing routes | Existing `Order`, `Fill`, `Trade`, `Position`, `Market`, `Outcome`, and user balance tables | Mock mode reduces the local owned position by sold shares and adds proceeds to local balance | No new backend route required. Backend already rejects no-position and oversell SELL orders; future work can add a dedicated quote/preview route for cashout proceeds if needed. |

## Cycle LIVEODDS1 - One Event Odds API Live Runtime Proof

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- |
| One-event live provider refresh | The Odds API `/v4/sports`, `/v4/sports/{sport}/events`, `/v4/sports/{sport}/events/{eventId}/markets`, `/v4/sports/{sport}/events/{eventId}/odds`; local command `npm run mobile:odds-api-live-runtime-proof` | Provider `GET`; local proof command | `THE_ODDS_API_KEY` in local process env only; key is not printed or committed | One sport/event, `regions=us`, `oddsFormat=decimal`, supported MVP market keys only | Provider quota headers, event id/start/team names, bookmaker market odds, normalized line/outcome probabilities | Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `MarketOutcomeSnapshot` | None for live refresh. Replay remains separate for normal readiness checks. | Continuous daemon is still P1; this proof is bounded. |
| Provider lifecycle stale-to-ready | `/api/mobile/events/:slug/live-detail` | `GET` | Public/mobile browse route | Event slug | `markets[].providerLifecycle.quote.status`, `ready`, `stale`, `lastFetchedAt`, `nextRefreshAt`, `stalenessSeconds` | Existing `ReferenceQuoteSnapshot` and market/outcome rows | None. The proof intentionally forced stale snapshots before live refresh. | Route-level stale display exists; automatic market pause on stale provider remains P1. |
| Local shifted market maker | Direct local service calls in proof script; order route for user trades | Local service plus `POST /api/orders` | Local generated API credential for buyer; maker user created by proof | Maker bid/ask are shifted worse than provider; user order body includes `marketId`, `outcomeId`, `side`, `price`, `size`, and selection identity | Filled order status, position, history trades, selected market/outcome/provider identity | Existing `User`, `UserBalance`, `ApiCredential`, `Order`, `Fill`, `Trade`, `Position`, `ReferenceQuoteSnapshot` | None. This is fake-token local liquidity only. | Long-lived source-aware maker daemon remains P1. |
| Event lifecycle proof | `/api/mobile/events/:slug/live-detail`; `POST /api/orders`; manual admin lifecycle routes documented | `GET` / `POST` | Public browse plus generated local API key for orders; admin routes require admin session outside this proof | Closed-market proof temporarily sets `Market.status=CLOSED` in DB and posts order | Closed market rejects order with `MARKET_UNAVAILABLE`; open market trades; settlement readiness documented | Existing `Market.status`, `closeTime`, order/position tables | None | Automatic close/suspend and automatic official-result settlement remain P1. |
| S23 live visible flow | Local S23 proof command `scripts/prove_mobile_odds_api_s23_visible_flow.ps1 -SkipReplaySeed` | Physical Android proof | Generated local mobile API credential | Home/Event Detail taps, ticket preset, swipe buy, Portfolio cashout, swipe sell, History tab | S23 proof summary fields, screenshots/XML, provider-backed line identity markers | Existing mobile app route stack plus generated local API credential | None. The proof uses the already-refreshed backend event and does not replay stale fixture data. | None for one-event visible proof. |
| One-command runtime launch check | Local command `npm run mobile:one-event-live-runtime`; optional live provider command `npm run mobile:one-event-live-runtime:provider` | Local PowerShell wrapper plus backend `GET /api/health` | No auth for cached restart check; live provider mode requires `THE_ODDS_API_KEY` in local process env | Cached mode uses no provider request; provider mode forwards capped one-event proof args | Backend health, Docker/Postgres status, S23 reachability, cached proof freshness, provider/maker continuous status, exact follow-up commands | Existing backend health route and proof artifacts; no schema change | Cached mode reads existing redacted proof summary and does not spend quota | Continuous provider daemon and continuous market-maker daemon remain P1. |
| Reusable one-event shifted maker seed | Local command `npm run mobile:one-event-live-maker-seed`; wrapper `npm run mobile:one-event-live-runtime -- -SeedMaker`; quote route `GET /api/markets/:marketId/quote` | Local DB/service command plus public quote route | No mobile auth; local DB/service access only | Selected `eventSlug`, optional `marketId`, `quoteOffsetTicks`, size, and snapshot freshness guard | Resting local `BUY`/`SELL` maker orders, shifted bid/ask, provider snapshot age, quote route best bid/ask | Existing `User`, `UserBalance`, `Order`, `Position`, `ReferenceQuoteSnapshot`; no schema change | None. Uses stored provider snapshot and fake-token local maker liquidity. | This is reusable one-shot maker seeding, not an unattended source-aware market-maker daemon. |
| One-event lifecycle controls | Local command `npm run mobile:one-event-lifecycle-proof`; `POST /api/orders`; settlement service preview | Local DB/service command plus canonical order route | Generated local API credential for order route; local DB/service access for status transitions and preview | Selected `eventSlug`, optional `marketId`; order body uses selected market/outcome | `LIVE` order accepted/canceled, `PAUSED` rejected, `CLOSED` rejected, settlement preview `mutation=none`, restored market status | Existing `Market.status`, `ApiCredential`, `ApiOrderRequest`, `Order`, `UserBalance`, `Position`; no schema change | None | Automatic close/suspend scheduler and official result settlement remain P1. |
| Consolidated one-event live readiness | Local command `npm run mobile:one-event-live-readiness` | Local PowerShell orchestration plus existing route/service proofs | Generated local proof credentials inside child commands | Runs data hygiene, runtime with maker seed, manual lifecycle proof, start-time lifecycle scheduler proof, backend health, Docker/Postgres, S23 reachability, cached live provider proof, and S23 visible proof checks | One redacted pass/fail readiness summary, artifact paths, runtime truth flags, P0/P1/P2 gaps | Existing proof artifacts and DB state; no schema change | Cached mode only; no provider quota spent | Continuous provider refresh daemon, continuous maker daemon, installed always-on scheduler service, and automatic settlement remain P1. |

## Cycle NEXTSTALEFIX - Earliest Proof Refresh Forecast

Cycle NEXTSTALEFIX changes local readiness aggregation only. It does not add or change backend route handlers, Prisma schema, mobile UI, order logic, provider fetch calls, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Earliest proof refresh forecast | Local command `npm run mobile:internal-readiness-batch` | Local proof aggregation | None | None | `readiness.s23ProofNextStaleName`, `readiness.s23ProofHoursUntilStale`, `readiness.cachedProviderEvidenceNextStaleName`, and `readiness.temporarySportsbookBackendProofNextStaleName` are selected by numeric `hoursUntilStale` | No database access or writes beyond the underlying batch checks | None | None for readiness forecasting. Provider parity still requires real Polymarket-backed World Cup match/line data. |

## Cycle NEXTACTIONCLEAN - Clean Autonomous Planner Checks

Cycle NEXTACTIONCLEAN changes local planning/reporting only. It does not add or change backend route handlers, Prisma schema, mobile UI, order logic, provider fetch calls, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Autonomous next-action clean check | Local command `npm run mobile:autonomous-next-action` | Local proof aggregation | None | None | Planner fields `status`, `priority`, `recommendedAction`, `state.*`; existing output is compared ignoring `generatedAt` before writing | No database access or writes | None | None for harness hygiene. Provider parity still requires real Polymarket-backed World Cup match/line data. |

## Cycle ODDSAPIPLAN - Temporary Provider Next-Action Planning

Cycle ODDSAPIPLAN changes local planning/reporting only. It does not add or change backend route handlers, Prisma schema, mobile UI, order logic, provider fetch calls, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Temporary provider next-action planner | Local commands `npm run mobile:autonomous-next-action` and `npm run mobile:definition-of-done-sweep` | Local proof aggregation | None | None | Planner fields `status=prove-temporary-provider-on-s23`, `temporaryProviderReady`, `temporaryProviderNeedsS23VisualProof`, plus DoD criterion `dod-temporary-sportsbook-provider-bridge` | No database access or writes | None | None. Next required proof is visible S23 UI evidence for the already-seeded `odds-api-single-soccer-test` event. |

## Cycle ODDSAPI1 - The Odds API Single-Event Temporary Provider

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| One-event sportsbook discovery | The Odds API `/v4/sports`, `/v4/sports/{sport}/events`, `/v4/sports/{sport}/events/{eventId}/markets`, `/v4/sports/{sport}/events/{eventId}/odds` | `GET` public provider reads with `THE_ODDS_API_KEY` env var | Provider key in local env only; key is not committed or printed | Query params: one sport, one event, one region `us`, selected market keys only, decimal odds | Sport key, event id/title/start time, available market keys, bookmaker title/key, market key, decimal odds, point/line, outcome labels | No schema change. Upserts existing `Event`, `Market`, `Outcome`, and `ReferenceQuoteSnapshot` rows. | None for provider fetch. Replay mode can seed from committed redacted odds evidence without spending more quota. | Future route can wrap this as a backend refresh endpoint if we want UI-triggered sportsbook refresh. Current MVP uses local seed/proof commands only. |
| Mobile Home/Event Detail sportsbook event | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1`; `/api/mobile/events/:slug/live-detail`; `/api/markets/:marketId/quote` | `GET` | None for public market reads | Query params only | `slug`, `title`, `marketSourceSummary.sourceBreakdown.sportsbook-odds`, `lineMarkets.status`, market `referenceSource`, `externalMarketId`, `conditionId`, outcome `referenceTokenId`, best bid/ask | Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `Order` | Existing contract fixtures remain available for other Local MVP events. | None for one-event route visibility. |
| Fake-token order and portfolio proof | `POST /api/orders`; `/api/portfolio`; `/api/portfolio/history` | `POST` / `GET` | Canonical API key for local proof user | Order body includes `marketId`, `outcomeId`, `side`, `contractSide`, `price`, `size`, and ticket `selection` with sportsbook provider identity | Filled order status, position `selection.referenceSource=sportsbook-odds`, history trade market/outcome/line identity | Existing `User`, `UserBalance`, `Order`, `Fill`, `Position`, `Trade`, `Market`, `Outcome` | None. Proof creates local maker liquidity and buyer credentials. | None for fake-token local proof. Real-money/provider settlement remains out of scope. |

## Cycle S23PROOFFORECAST - S23 Proof Staleness Forecast

Cycle S23PROOFFORECAST changes local proof aggregation and reporting only. It does not add or change backend route handlers, Prisma schema, provider mapping, order logic, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S23 proof freshness forecast | Local command `npm run mobile:internal-readiness-batch`; committed S23 proof summaries under `docs/mobile/harness/cycle-XG-*`, `cycle-XH-*`, `cycle-XI-*`, `cycle-WF-*`, and `cycle-WG-*` | Local proof aggregation | None | None | Per-proof `staleAt` and `hoursUntilStale`; batch fields `s23ProofNextStaleName`, `s23ProofNextStaleAt`, and `s23ProofHoursUntilStale` | No database access or writes | None | None. If proof is near stale or stale, rerun physical S23 proof commands; backend support is unchanged. |

## Cycle BATCHJSONGUARD - Readiness Evidence Hygiene Guard

Cycle BATCHJSONGUARD changes local readiness harness output hygiene and CI coverage only. It does not add or change backend route handlers, Prisma schema, provider mapping, order logic, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal readiness evidence hygiene | Local command `npm run mobile:internal-readiness-batch`; CI command `npm run test:ci` | Local proof aggregation and contract test | None | None | Batch JSON summaries remain no-BOM UTF-8 and current-run scoped; cached provider artifacts are not reformatted by default cached mode | No database access or writes | None | None. Provider-backed parity still requires usable provider match books or attach-ready line markets, tracked separately as P1. |

## Cycle PROVIDERSCANDEPTH - Match/Line Provider Scan Depth

Cycle PROVIDERSCANDEPTH changes provider audit/readiness scripts only. It does not add or change backend route handlers, Prisma schema, order logic, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| World Cup match provider breadth scan | Polymarket Gamma `/events?tag_slug=...&limit=...&offset=...` plus exact event slug lookups | `GET` public provider reads | None | Tag slugs, explicit event slugs, page count, limit | Summary fields `matchEventCount`, `openMatchEventCount`, `closedOrEndedMatchEventCount`, `usableMatchEventCount`, `openWorldCupEventCount`, `usableOpenWorldCupEventCount`, `usableOpenNonMatchWorldCupEventCount`, and rejected market reasons | No database access or writes | None; futures/non-match events remain diagnostics only | No backend support changed. Current evidence shows no open usable provider match books; usable open World Cup provider markets are non-match futures/props and must not be imported to fake match breadth. |
| World Cup line provider breadth scan | Polymarket Gamma `/markets?search=...`, `/markets?slug=...`, `/events?tag_slug=...&offset=...` | `GET` public provider reads | None | Search queries, tag slugs, static/dynamic event probes, capped exact slug guesses | Summary fields `providerLineCandidateCount`, `identityCompleteProviderLineCandidateCount`, `closedOrUnavailableIdentityLineCandidateCount`, `attachReadyProviderLineCandidateCount`, and `providerLineDiscoveryBlockers` | No database access or writes | Existing contract-shaped line fixtures remain the honest Local MVP source | Current evidence shows closed/unavailable provider line identities; no usable attach-ready line provider support exists yet. |

## Cycle FINALSIGNOFFGATE - DoD-Aware Final Signoff

Cycle FINALSIGNOFFGATE changes final audit harness reporting only. It does not add or change backend route handlers, Prisma schema, order logic, provider mapping, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Final QA/review signoff gate | Local commands `npm run mobile:definition-of-done-sweep` and `npm run mobile:final-qa-review-signoff` | Local proof aggregation | None | None | Final signoff fields `definitionOfDoneSweepPresent`, `definitionOfDoneReadyToDeclareDone`, `definitionOfDoneCounts`, `definitionOfDoneBlockingCriteria`, `qaSignoff`, and `reviewSignoff` | No database access or writes | None | None. Current failure is expected while provider-backed Polymarket parity remains partial. |

## Cycle PROVIDERFRESHGATE - Cached Provider Evidence Freshness

Cycle PROVIDERFRESHGATE changes readiness harness reporting only. It does not add or change backend route handlers, Prisma schema, order logic, provider mapping, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cached provider freshness gate | Local command `npm run mobile:internal-readiness-batch`; optional refresh command `npm run mobile:internal-readiness-batch:provider-refresh` | Local proof aggregation | None beyond local backend/DB for refreshed mode | None in cached mode; refreshed mode reruns existing provider scripts | Batch fields `readiness.cachedProviderEvidenceFresh`, `readiness.cachedProviderEvidenceMaxAgeHours`, `readiness.cachedProviderEvidence[]`, and recovery `providerRefreshCommand` | Existing provider/reference snapshot tables are read only in cached mode; refreshed mode uses existing provider refresh scripts | None; stale cache is P1 audit debt, not runtime mock data | None. Real provider-backed parity still needs usable Polymarket match books or attach-ready line markets. |

## Cycle S23GOOGLEGATE - S23 Google Consent Readiness Summary

Cycle S23GOOGLEGATE changes readiness harness reporting only. It does not add or change backend route handlers, Prisma schema, order logic, provider mapping, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S23 Google consent readiness summary | `/api/auth/google/start`; local commands `npm run mobile:internal-readiness-batch` and `npm run mobile:google-auth-lan-preflight` | `GET` route preflight plus local proof aggregation | None for start/preflight | Query params include `returnTo=/portfolio` and `mobileReturnTo=<configured mobile return URL>` | Batch fields `readiness.googleS23ConsentReady`, `readiness.googleS23ConsentSource`, and `readiness.googleS23ConsentExpectedCallback`; raw localhost probe fields stay diagnostic | OAuth state/callback implementation only during preflight; no user/token records should be created | None | Real consent still needs the exact LAN/hosted callback registered in Google Cloud. Backend route behavior is unchanged. |

## Cycle LINEFAMILYGATE - S23 Line-Family Proof Gate

Cycle LINEFAMILYGATE changes readiness harness verification only. It does not add or change backend route handlers, Prisma schema, order logic, provider mapping, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S23 Local MVP line-family proof gate | Local command `npm run mobile:internal-readiness-batch`; committed S23 proof JSON under `cycle-XG-*`, `cycle-XH-*`, `cycle-XI-*`, `cycle-WF-*`, and `cycle-WG-*` | Local proof aggregation | None | None | Batch `s23Proofs[]` entries for Spread, Totals, and Team Totals with `proofAgeHours`, `fresh`, `missingArtifacts`, and required assertion status | No database access or writes | None; stale/missing family proof is a P0 readiness blocker | None. If stale, rerun the generated physical S23 proof refresh command for the affected family. |

## Cycle PROVIDERCACHE - Cached Provider Discovery Mode

Cycle PROVIDERCACHE changes readiness harness loop control only. It does not add or change backend route handlers, Prisma schema, order logic, provider mapping, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal readiness with cached provider debt | Local command `npm run mobile:internal-readiness-batch`; committed provider summaries under `docs/mobile/harness/batch-internal-readiness-latest/` | Local proof aggregation | None beyond local repo access | Optional `-ProviderDiscoveryMode cached` default | Batch `providerDiscoveryMode`, provider step `cached=true`, existing provider summary fields for P1 blockers | No database writes in cached provider mode | None; cached evidence is only audit evidence, not mobile runtime data | None. Use `npm run mobile:internal-readiness-batch:provider-refresh` when provider data should be regenerated. |
| Provider refresh readiness | Local command `npm run mobile:internal-readiness-batch:provider-refresh` | Local proof/refresh command | Existing local backend/DB and public Polymarket provider access | `-ProviderDiscoveryMode refresh` | Fresh provider snapshot, exchange, tradable-flow, match-scan, and line-scan summaries | Existing reference snapshot/provider mapping tables through current scripts | None | Provider books/line markets remain external availability P1 debt when Polymarket exposes no usable candidates. |

## Cycle PROOFRECOVERY - S23 Proof Recovery Commands

Cycle PROOFRECOVERY changes readiness harness metadata only. It does not add or change backend route handlers, Prisma schema, order logic, provider mapping, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S23 Local MVP proof recovery | Local command `npm run mobile:internal-readiness-batch`; generated commands for `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` | Local proof guidance | None in the batch; physical S23 proof commands use the existing local proof environment | None in the batch summary | `recovery.s23ProofRefreshCommands[].name`, `summaryPath`, `command`, and `recovery.rerunBatchCommand` | No database access or writes from the batch | None; stale proof remains a P0 blocker until physical S23 evidence is regenerated | None. Backend routes are unchanged; if proof refresh fails, debug the existing S23 proof path rather than changing schemas. |

## Cycle PROOFFRESH - S23 Proof Freshness Gate

Cycle PROOFFRESH changes readiness harness verification only. It does not add or change backend route handlers, Prisma schema, order logic, provider mapping, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S23 Local MVP proof freshness | Local command `npm run mobile:internal-readiness-batch`; committed S23 proof JSON under `docs/mobile/harness/cycle-XG-*`, `cycle-XH-*`, and `cycle-XI-*` | Local proof aggregation | None | None | Batch `s23Proofs[].proofAgeHours`, `s23Proofs[].fresh`, `s23Proofs[].maxAgeHours`, and `readiness.s23ProofMaxAgeHours` | No database access or writes | None; stale proof is a P0 readiness blocker rather than a mock fallback | None. If stale, rerun the physical S23 proof set. |

## Cycle STARTUPBATCH - S23 Startup Contract Batch Gate

Cycle STARTUPBATCH changes readiness harness verification only. It does not add or change backend route handlers, Prisma schema, order logic, provider mapping, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal MVP startup contract gate | Local command `npm run mobile:internal-readiness-batch`; no-start wrapper `scripts/start_poly_mobile_rehearsal.ps1 -SkipBackend -SkipSnapshotWatch -SkipBots -SkipExpo` | Local proof command | None; intentionally no credential creation and no service start | None | `internal-mvp-startup-contract.json` fields `mobileApiBaseUrl`, `backendAuthBaseUrl`, `expectedGoogleCallback`, `mobileApiKey`, `started`, and skipped process list | No database access or writes in proof mode | None; this is a startup contract check, not a mobile mock mode | None for startup. Real Google consent still requires the reported callback URL to be registered in Google Cloud. |

## Cycle S23LANSTART - S23 Internal MVP LAN Auth Startup

Cycle S23LANSTART changes startup/runtime environment wiring only. It does not add or change backend route handlers, Prisma schema, order logic, provider mapping, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S23 internal MVP starter | `npm run mobile:internal-mvp:start`; wrapper for `scripts/start_poly_mobile_rehearsal.ps1 -CreateMobileDevCredential -RestartBackend -RestartExpo -SkipSnapshotWatch -SkipBots` | Local startup command | Local backend/DB plus generated local mobile API credential | None from user; script generates a local mobile API key when needed | Rehearsal summary now records `mobileApiBaseUrl`, `backendAuthBaseUrl`, `expectedGoogleCallback`, `restartBackend`, started/skipped processes, and redacted credential status | Existing dev credential/API key tables through `scripts/create_mobile_dev_credential.ts`; existing auth route config through `NEXTAUTH_URL` | No frontend mock fallback for startup; the app runs in server market/order mode | None for startup. Google Cloud must still authorize the exact reported callback URL before real S23 consent can pass. |
| Portfolio account Google entry | `/api/auth/google/start` | `GET` route opened by mobile account entry | None for start; callback creates/links backend account session | Query params include `returnTo` and mobile return URL | Redirect `redirect_uri` now should match the LAN `NEXTAUTH_URL/api/auth/google/callback` when using the one-command S23 starter | OAuth state/callback tables or cookies owned by backend auth implementation | None | Real consent remains an external Google Cloud setup step, not a schema gap. |

## Cycle PROVIDERLINEDECISION - Provider Line Discovery Decision Summary

Cycle PROVIDERLINEDECISION changes provider proof reporting only. It does not add or change backend route handlers, Prisma schema, order logic, provider mapping, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider line breadth scan | Local command `npm run mobile:provider-line-breadth-scan`; Polymarket Gamma `/markets` and `/events` | Read-only local proof command plus public provider reads | None | Search queries, event tag slugs, exact slug guesses, static provider event probes, and local-fixture search-only probes | Summary fields `decision.providerLineParityReady`, `decision.keepLocalContractFixtures`, `decision.providerLineDiscoveryBlockers`, `decision.realProviderProbeCount`, and `decision.syntheticLocalFixtureProbeCount` | No database writes; local fixture source is read only to build search probes | Local MVP keeps backend-shaped contract fixtures for spread/totals/team-total rows when provider line candidates are unavailable | Real attach-ready provider line markets remain missing. A future provider route/schema change is needed only after Polymarket exposes usable line-family candidates or another approved provider is added. |

## Cycle DODCURRENT - Batch-Aware Final Parity Sweep

Cycle DODCURRENT changes audit reporting only. It does not add or change backend route handlers, Prisma schema, order logic, provider mapping, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Final parity sweep | Local command `npm run mobile:definition-of-done-sweep`; reads `docs/mobile/harness/batch-internal-readiness-latest/internal-readiness-batch-summary.json` | Local proof/report command | None beyond local repo access | None | Batch fields `readiness.localMvpReadyForInternalTesting`, `readiness.providerBackedExchangeReady`, validation booleans, and `blockers.p0`/`blockers.p1` | No database access | None; it consumes committed readiness evidence only | None for the report. Full provider parity still needs the batch P1 provider blockers cleared before completion can be declared. |

## Cycle BATCHSTART - Internal MVP S23 Startup Path

Cycle BATCHSTART changes the tester startup contract only. It does not add or change backend route handlers, Prisma schema, order logic, provider mapping, mobile UI, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local MVP S23 startup command | `npm run mobile:internal-mvp:start`; wrapper for `scripts/start_poly_mobile_rehearsal.ps1 -CreateMobileDevCredential -RestartExpo -SkipSnapshotWatch -SkipBots` | Local startup command | Local backend/DB plus generated local mobile API credential | None from user; script generates server-mode env for Expo | Runtime summary redacts mobile API key and records backend health URL, LAN API base, started/skipped processes, and selected event slugs | Existing dev credential user/API key tables through `scripts/create_mobile_dev_credential.ts`; existing `Event`, `Market`, `Outcome`, order/portfolio tables for manual flow | No frontend mock fallback for this command; the app is started in server market/order mode. Local MVP line markets remain contract-shaped backend fixtures when provider lines are unavailable | None for startup. Provider-backed exchange remains P1 until a real accepting-order World Cup match book or attach-ready line market exists. |
| Manual S23 proof route stack | `GET /api/events`; `GET /api/mobile/events/:slug/live-detail`; `POST /api/orders`; `GET /api/portfolio`; `GET /api/portfolio/history`; optional account route `GET /api/profile/summary` | Existing route stack | Public browse routes plus bearer Holiwyn API key for order/portfolio/profile sync | Existing ticket/order request body with `marketId`, `outcomeId`, `side`, amount/quantity fields; route-owned portfolio/profile requests | Home match cards, Event Detail outcome/line identity, fake-token order result, Portfolio positions/orders/history, account/profile summary | Existing event/market/outcome/provider identity fields; user/API credential; order, position, activity/history models | Local MVP spread/totals/team-total line rows remain contract fixtures but keep backend-shaped IDs and source metadata | Real provider-backed spread/totals/team-total and usable provider order books are still unavailable for the current World Cup match flow. |

## Batch Readiness - Provider Unavailable Classification

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider/internal exchange readiness batch | Internal script `npm run poly:internal-exchange-readiness`; batch wrapper `npm run mobile:internal-readiness-batch` | Local proof command | Local backend/DB only | None | `providerMarkets.providerBooksUnavailableOrClosed`, `providerMarkets.providerUnavailableOrClosedCount`, batch P1 `provider_worldcup_match_books_unavailable_or_closed` | Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, reference bot metadata | Local MVP remains on contract-shaped fixtures when provider books are unavailable | Need a real accepting-order World Cup match book or attach-ready line market before provider-backed local-MM readiness can pass. |
| Google auth runtime readiness batch | `/api/auth/google/start`; batch wrapper `npm run mobile:internal-readiness-batch` | `GET` route preflight | None | Query params: `returnTo=/portfolio`, `mobileReturnTo=<configured mobile return URL>`; batch passes `BackendBaseUrl` as expected `NEXTAUTH_URL` | Redacted summary fields `googleAuthRuntimeReady`, `googleAuthFailedChecks`, batch P1 `google_redirect_uri_mismatch` or `google_auth_runtime_preflight_has_warnings` | OAuth state cookies only during preflight; no user/token records should be created | Non-strict preflight records warnings without blocking Local MVP fake-token trading | Real Google consent requires the emitted `/api/auth/google/callback` URL to be authorized in Google Cloud and reachable from S23. |
| Google physical callback readiness batch | `/api/auth/google/start`; batch wrapper `npm run mobile:internal-readiness-batch` | `GET` route preflight | None | Same Google auth start query params plus strict physical-callback check | Redacted summary fields `googlePhysicalCallbackReady`, `googlePhysicalFailedChecks`, batch P1 `google_physical_callback_not_phone_reachable` | OAuth state cookies only during preflight; no user/token records should be created | Local MVP fake-token trading remains available when physical Google consent is not ready | Use a hosted origin or LAN IP `NEXTAUTH_URL` and register its exact `/api/auth/google/callback` URL in Google Cloud before real S23 browser consent proof. |

## Cycle UT - Google Login Setup Validation

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio/account Google login entry | `/api/auth/google/start` | `GET` | None | Query params: `returnTo=/portfolio`, `mobileReturnTo=<encoded holiwyn:/exp: return URL>` | Redirect only; no JSON consumed. | OAuth state cookies; user/session state is backend-owned. | None. If Google is unavailable, user can continue MVP fake-token trading without account sync. | None for source contract. Real S23 consent requires configured Google Cloud callback URL. |
| Google OAuth callback to mobile | `/api/auth/google/callback` | `GET` | Google OAuth `code`/`state` | Query params from Google. | Mobile deep link query: `googleAuth=success`, `forcePortfolio=1`, `forceRuntimePortfolioSync=1`, `holiwynApiKey`, compatibility `apiKey`. | User, linked Google identity, API credential/token model. | None. Mobile must not fabricate Google identity. | None for source contract. |
| Google mobile logout | `/api/auth/mobile/logout` | `POST` | Bearer Holiwyn API key | No required body in current mobile usage. | Best-effort logout; mobile clears SecureStore regardless of network result. | API credential/session revocation. | Local credential clear still works if server call fails. | None for MVP. |

## Cycle UV - Google Auth Runtime Preflight

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Google auth runtime preflight | `/api/auth/google/start` | `GET` | None | Query params: `returnTo=/portfolio`, `mobileReturnTo=<configured mobile return URL>` | The preflight consumes only the 3xx Location header and checks host plus `redirect_uri`; it does not follow to Google. | OAuth state cookies may be created by the route; no user records are created during preflight. | Non-strict mode reports missing/unreachable setup without failing local dev loops. | None for current route shape. Real S23 proof still needs a phone-reachable callback URL registered in Google Cloud. |

## Cycle TN - Provider Line Breadth Current Matches

Cycle TN changes provider discovery normalization and docs only. It does not add or change API route signatures.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail line-market source decision | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile event browse | Event slug | `markets[].referenceSource`, `markets[].marketType`, `markets[].line`, `markets[].period`, `event.marketSourceSummary.lineMarkets.providerAvailability` | Existing `Event`, `Market`, `Outcome` provider identity fields | Spread/totals/team-total rows remain `contract-fixture` when Polymarket has no attach-ready line markets | Real Polymarket-backed spread/totals/team-total markets are not available for the current event. |
| Provider discovery/manual fallback proof | Internal service `discoverMobileLiveProviderCandidates()` and Gamma `/markets` / `/events` calls | Internal/runtime proof | Local backend proof environment; no user auth | Event slug plus inferred provider event slugs | `providerEventSlugs`, `manualSlugFallbacks`, `lineDiscoverySummary`, `attachReadyCandidateCount` | Existing `Event.externalSlug`, `Market.marketType`, `Market.line`, `Outcome.referenceTokenId` | No local fixture is attached as provider-backed data | Continue expanding provider discovery as real Polymarket line-market slugs appear. |

Evidence:

- `docs/mobile/harness/cycle-TN-provider-line-breadth-current-matches/cycle-TN-provider-line-breadth-scan.json`
- `docs/mobile/harness/cycle-TN-provider-line-breadth-current-matches/cycle-TN-provider-match-line-availability.json`
- `docs/mobile/harness/cycle-TN-provider-line-breadth-current-matches/cycle-TN-current-match-provider-discovery.json`

## Cycle RP - Trade Ticket Source Label Cleanup

Cycle RP changes no backend route or schema. It improves how the mobile ticket consumes existing source identity fields.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket source label | Existing ticket/open-position selection data only; no route called by this visual cleanup | Existing routes unchanged | Existing auth unchanged | Existing request bodies unchanged | `selection.referenceSource`, `market.referenceSource`, `selection.referenceTokenId`, `selection.conditionId`, `outcome.referenceTokenId` | Existing market/outcome/provider identity fields | Unknown source is hidden from visible UI but retained as hidden audit marker | Ensure future backend/portfolio selection payloads keep source/token identity populated so tickets can show truthful provider/local source labels when useful. |

Evidence:

- Screenshots: `docs/mobile/screenshots/cycle-RP-ticket-source-cleanup/`
- UI hierarchy: `docs/mobile/harness/cycle-RP-ticket-source-cleanup/`

## Cycle RO - Trade Ticket Sell Mode Clarity

Cycle RO changes no backend route or schema. It is a visible Trade Ticket clarity change only.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket visible Buy/Sell mode badge | Existing ticket order path only after swipe threshold release; no route called by this visual badge | Existing `placeOrder()` path unchanged | Existing mode-dependent order auth unchanged | Existing order body unchanged | Existing ticket/order fields unchanged | Existing order/portfolio models unchanged | Fake-token/demo mode remains available | None for this visible mode-clarity cycle. |

Evidence:

- Screenshots: `docs/mobile/screenshots/cycle-RO-ticket-mode-clarity/`
- UI hierarchy: `docs/mobile/harness/cycle-RO-ticket-mode-clarity/`

## Cycle RN - Portfolio Cash Out to Sell Ticket

Cycle RN changes no backend route or schema. It routes the visible Portfolio cash-out action into the existing generic Trade Ticket sell path.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio position display | Existing portfolio snapshot/order history route used by the server-mode proof | GET | Existing server-mode API key/session behavior | None from this UI action | Position id, market/outcome identity, side, shares, entry/current price, portfolio/history values | Existing order, position, trade/activity, and portfolio summary models | Server-position proof fixture remains available | None introduced by this UI routing cycle. |
| Portfolio Cash out -> Trade Ticket Sell | Existing `placeOrder()` route only when user completes the swipe threshold | Existing order route method unchanged | Existing mode-dependent order auth unchanged | Existing ticket order body unchanged; selection identity and side are preserved by the existing Trade Ticket path | Existing order result/open-order/history fields unchanged | Existing order lifecycle models | Fake-token/demo mode remains available | Ticket sell-mode copy/identity should be clearer before production auth/trading. |

Evidence:

- Screenshots: `docs/mobile/screenshots/cycle-RN-position-sell-ticket/`
- UI hierarchy: `docs/mobile/harness/cycle-RN-position-sell-ticket/`

## Cycle RD - Trade Ticket Swipe Motion

Cycle RD changes no backend route or schema. It is a visible Trade Ticket gesture/UI change only.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket swipe-to-buy/sell handle motion | Existing ticket order path only after threshold release; no route called by this visual change | Existing `placeOrder()` path unchanged | Existing mode-dependent order auth unchanged | Existing order body unchanged | Existing ticket/order fields unchanged | Existing order/portfolio models unchanged | Fake-token/demo mode remains available | None for this visual motion cycle. |

Evidence:

- `docs/mobile/harness/cycle-RD-ticket-swipe-motion/cycle-RD-ticket-swipe-motion-proof.json`

## Cycle RC - Portfolio Account Login Clarity

Cycle RC changes no backend route or schema. It makes the existing Portfolio auth entry visually clearer and preserves the current auth-start route.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio full-width Google login row | `/api/auth/google/start?returnTo=/portfolio` through `Linking.openURL(GOOGLE_AUTH_URL)` | Browser GET | Server auth route owns OAuth policy | None from mobile before browser open | None before callback/session completion | Existing backend auth/user/session models | Demo/fake-token trading remains available without sign-in | Full native OAuth callback/session/logout proof remains P1. |
| Portfolio avatar/settings gear Account entry | None directly | UI navigation only | None | None | None | None | None | Account screen remains a local tab; no server profile/session dependency added. |

Evidence:

- `docs/mobile/harness/cycle-RC-portfolio-account-login-clarity/cycle-RC-portfolio-account-login-clarity-proof.json`

## Cycle RB - Event Chart History Readout

Cycle RB changes no backend route or schema. It consumes the existing Event Detail chart-history contract more directly in the visible chart readout.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail chart readout | `/api/mobile/events/:slug/live-detail` through existing Event Detail hydration | GET | Public/mobile event browse | Event slug | `chartHistory[].outcomeId`, `chartHistory[].timestamp`, `chartHistory[].probability`, `chartHistorySource`, `chartHistoryStatus`, `chartHistoryRange`, `chartHistoryLastUpdated` | Existing event/market/outcome snapshot or provider chart-history tables behind the route | Deterministic fallback points only when `chartHistory` is absent | Continuous drag-to-nearest-point and richer per-line/per-outcome chart switching remain future UI work; real provider-backed line markets remain unavailable. |

Evidence:

- `docs/mobile/harness/cycle-RB-event-chart-history-readout/cycle-RB-event-chart-history-readout-proof.json`

## Cycle RA - Portfolio Google Direct Login

Cycle RA changes no backend route or schema. It wires the Portfolio Google chip to the existing auth-start launcher.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio Google login chip | `/api/auth/google/start?returnTo=/portfolio` through `Linking.openURL(GOOGLE_AUTH_URL)` | Browser GET | Server auth route owns OAuth policy | None from mobile before browser open | None before callback/session completion | Existing backend auth/user/session models | Demo/fake-token trading remains available without sign-in | Full native OAuth callback/session/logout proof remains P1. |
| Portfolio top-left account entry | None directly | UI navigation only | None | None | None | None | None | None; this remains local tab navigation to Account. |

Evidence:

- `docs/mobile/harness/cycle-RA-portfolio-google-direct-login/cycle-RA-portfolio-google-direct-login-proof.json`

## Cycle QZ - Search Retail Source Cleanup

Cycle QZ changes no backend route or schema. It keeps the existing Search feed/source-summary contract and removes only visible retail source/debug copy.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search result retail rows | Existing Search feed route through `loadSearchEventPage()` | Existing service contract | Existing API client config | Existing search query/page parameters | Event title, outcomes/probability, saved state, and `marketSourceSummary` for hidden audit markers only | Existing event/market/provider mapping models | Existing local Search fallback unchanged | Real provider-backed current-match Spread/Totals/Team Total markets remain unavailable. |

Evidence:

- `docs/mobile/harness/cycle-QZ-search-retail-source-cleanup/cycle-QZ-search.xml`

## Cycle QO - Chinese Source Copy Cleanup

Cycle QO changes no backend route or schema. It keeps the existing Home/Live event-feed source contract and changes only Chinese visible copy.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chinese Home/Live card source label | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` through existing mobile feed service | GET | Public/mobile event browse | Query params only | `marketSourceSummary.regulationWinner.status`, `marketSourceSummary.lineMarkets.status`, line families, provider/fixture counts | Existing `Event`, `Market`, `Outcome` | Contract-shaped line markets display with 利云体育 branding when provider-backed line markets are unavailable | Real provider-backed Spread/Totals/Team Total line markets remain unavailable for the current match. |

Evidence:

- `docs/mobile/harness/cycle-QO-chinese-source-copy/cycle-QO-chinese-source-copy-proof.json`
- `docs/mobile/harness/cycle-QO-chinese-source-copy/cycle-QO-chinese-home-source.xml`

## Cycle QN - Account Google Entry Clarity

Cycle QN changes no backend route or schema. It keeps the existing Google auth/profile route dependencies and improves the mobile entry-point copy.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio -> Account entry | None directly | UI navigation only | None | None | None | None | None | None; this is local tab navigation to Account. |
| Google sign-in launcher | `/api/auth/google/start?returnTo=/portfolio` | Browser/deep-link open | Server auth route owns OAuth provider policy | None from mobile before browser open | None before callback/session completion | Existing backend auth/user/session models | Demo/fake-token trading remains available without sign-in | Full native OAuth callback/session/logout proof remains P1. |
| Connected Account display | `/api/profile/summary` indirectly controls `forceSignedIn` in server mode | GET through existing profile summary service | Mobile API key/session depending on runtime mode | None for this UI-only change | Existing profile summary success sets signed-in display | Existing user/profile summary models | Forced signed-in proof state for harness only | Real end-to-end mobile Google session lifecycle remains future work. |

Evidence:

- `docs/mobile/harness/cycle-QN-account-google-entry-clarity/cycle-QN-account-google-entry-clarity-proof.json`
- `docs/mobile/harness/cycle-QN-account-google-entry-clarity/cycle-QN-portfolio-account-entry.xml`
- `docs/mobile/harness/cycle-QN-account-google-entry-clarity/cycle-current-holiwyn-account.xml`

## Cycle QM - Provider Chart Freshness Copy

Cycle QM changes no backend route or schema. It documents and consumes the existing Event Detail chart-history contract more clearly in the mobile UI.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail chart/probability display | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile event browse | Event slug `argentina-vs-egypt` | `chartHistory`, `chartHistorySource`, `chartHistoryStatus`, `chartHistoryLastUpdated`, selected outcome probabilities | Existing provider snapshot/chart-history tables behind the route; no schema change | None for provider winner chart history in this proof | Fresh/current live chart status for an active provider event remains future work. |
| Chart history route proof | Existing mobile/provider chart-history route used by `scripts/prove_current_match_polymarket_chart_history.ts` | GET/runtime script | Local backend env/API setup | Event slug only | Polymarket CLOB source, history point counts, latest provider timestamp, route status | Existing provider market/outcome snapshot models | None | Provider history may legitimately be stale when Polymarket has no newer points for the ended/old event. |

Evidence:

- `docs/mobile/harness/cycle-QM-provider-chart-freshness/cycle-QM-current-match-polymarket-chart-history.json`
- `docs/mobile/harness/cycle-QM-provider-chart-freshness/cycle-QM-current-match-polymarket-chart-history-after-copy.json`
- `docs/mobile/harness/cycle-QM-provider-chart-freshness/cycle-QM-current-mvp-s23-visible-flow.json`

## Cycle QL - Provider Line Structural Inspection

Cycle QL changes no backend route or schema. It refreshes proof for the current backend contracts and hardens the S23 proof harness.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home match discovery | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public/mobile event browse | Query params only | Event slug/title/type/status, `marketSourceSummary.regulationWinner`, `marketSourceSummary.lineMarkets`, source counts | Existing `Event`, `Market`, `Outcome` | None for provider winner; line counts include contract fixtures | Additional real current match breadth remains limited to the seeded/imported MVP match. |
| Event Detail line readiness | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile event browse | Event slug `argentina-vs-egypt` | `markets[]`, market type, period, line, outcome identity, `referenceSource`, provider ids, `marketSourceSummary.lineMarkets.providerAvailability` | Existing `Event`, `Market`, `Outcome`, provider reference metadata | Spread/Totals/Team Total stay contract-shaped fixtures | Real provider-backed Spread/Totals/Team Total line markets are unavailable from current Polymarket Gamma/CLOB data. |
| Provider availability proof | Polymarket Gamma `/events?slug=fifwc-arg-egy-2026-07-07` and broad `/markets`/`/events` searches | GET | Public provider API | Query params only | Provider event markets, ids, slugs, questions, condition ids, token/outcome identity where available | No local schema change | None | Current provider data exposes 3 match-winner markets and 0 line markets. |
| S23 line order proof | Existing ticket/order/Portfolio routes used by mobile server mode | GET/POST | Mobile dev credential/API key | Ticket/order payload preserving event slug, market id, outcome id, market type `spread`, line `1.5`, period, side, amount, and fake-token mode | Portfolio History row with order-time selection identity and `contract-fixture` source | Existing user/API credential/order/position/history models | Fake-token server-backed line order remains allowed for Local MVP proof | Production wallet/liquidity/auth policy remains future work. |

Evidence:

- `docs/mobile/harness/cycle-QL-provider-line-structural-inspection/cycle-QL-current-state.json`
- `docs/mobile/harness/cycle-QL-provider-line-structural-inspection/cycle-QL-provider-match-line-availability.json`
- `docs/mobile/harness/cycle-QL-provider-line-structural-inspection/cycle-QL-provider-line-breadth-scan.json`
- `docs/mobile/harness/cycle-QL-provider-line-structural-inspection/cycle-QL-current-mvp-s23-visible-flow.json`

## Cycle QK - Search Source Copy

Cycle QK changes no backend route or schema. It keeps the existing Search event-feed contract and only changes mobile-facing source labels.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search mixed-source result disclosure | `/api/events` through existing mobile search/feed service | GET | Public/mobile event browse | Search query such as `argentina`; status/filter query when applicable | Event slug/title/status, provider count, contract-fixture count, `marketSourceSummary`, provider/local market source counts | Existing `Event`, `Market`, `Outcome` | Contract-shaped line fixtures display as Holiwyn lines when provider-backed lines are unavailable | Real provider-backed Spread/Totals/Team Total imports remain P1. |

Evidence:

- `docs/mobile/harness/cycle-QK-search-source-copy/cycle-QK-search-source-copy-proof.json`
- `docs/mobile/audits/cycle-QK-search-source-copy.md`

## Cycle QJ - Holiwyn Line Copy

Cycle QJ changes no backend route or schema. It keeps existing Local MVP route contracts and improves visible source wording around current contract-fixture line markets.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Live source disclosure | `/api/events`, `/api/events?status=live` through existing mobile feed service | GET | Public/mobile event browse | Status/filter query when applicable | Event slug/title/status, provider/local market source counts, `marketSourceSummary`, provider winner count, contract-fixture line count | Existing `Event`, `Market`, `Outcome` | Contract-fixture lines display as Holiwyn lines/pricing | Real provider-backed Spread/Totals/Team Total lines remain unavailable for the current match. |
| Event Detail line markets | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile event browse | Event slug `argentina-vs-egypt` | Market groups, `marketType`, `period`, `line`, `side`, `label`, `probability`, `bestBid`, `bestAsk`, `liquidity`, `referenceSource`, provider IDs, `marketSourceSummary`, `lineMarkets.providerAvailability` | Existing `Event`, `Market`, `Outcome`, provider snapshot models | Contract-fixture line rows are shaped like backend markets and now display as Holiwyn lines | Provider-backed line-market discovery/import remains P1. |
| Simple ticket/order/Portfolio History proof | Existing mobile ticket/order/portfolio routes used by the mobile API client | GET/POST | Mobile API key/dev credential; local beta trading runtime | Ticket/order payload preserving event slug, market id, outcome id, market type `spread`, line `1.5`, period, side, amount, source, and fake-token mode | Portfolio position/activity/history rows with order-time snapshot fields and source identity | Existing `User`, `ApiCredential`, `Event`, `Market`, `Outcome`, order/position/history models | Fake-token order can fill locally and appears in History with contract-fixture identity | Production liquidity/wallet/auth policy remains future work. |
| Google account entry visibility | `/api/auth/google/start?returnTo=/portfolio` through Account screen | Browser/deep-link open | Server auth route owns OAuth provider policy | None from mobile before browser open | None before callback/session completion | Existing backend auth/user/session models | Demo trading remains available without sign-in | End-to-end Google OAuth callback/session/logout proof remains P1. |

Evidence:

- `docs/mobile/harness/cycle-QJ-holiwyn-line-copy/cycle-QJ-current-mvp-s23-visible-flow.json`
- `docs/mobile/harness/cycle-QJ-provider-line-reinspection/`

## Cycle QI - Account Google Status Visibility

Cycle QI changes no backend route or schema. It clarifies the mobile Account UI state around the existing Google auth route.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Signed-out Google account entry | `/api/auth/google/start?returnTo=/portfolio` through `openGoogleSignIn()` | Browser/deep-link open | Server auth route owns OAuth provider policy | None from mobile before browser open | None before callback/session completion | Existing backend auth/user/session models | Demo trading remains available without sign-in | Native callback/session/logout proof remains P1. |
| Signed-in Google connected status | `/api/profile/summary` indirectly controls `forceSignedIn` in server mode | GET through existing profile summary service | Mobile API key/session depending on runtime mode | None for this UI-only change | Existing profile summary success sets signed-in display | Existing user/profile summary models | Forced signed-in proof state for harness only | Full Google OAuth session state is not yet proven end to end on mobile. |

Evidence:

- `docs/mobile/harness/cycle-QI-account-google-status/cycle-QI-account-google-status-proof.json`

## Cycle QH - Chart Status UI

Cycle QH changes no backend route. It makes existing chart route state visible and readable in the mobile Event Detail chart area.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail chart status UI | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile event browse | Event slug `argentina-vs-egypt` | `event.chartHistorySource`, `event.chartHistoryStatus`, `event.chartHistoryRange`, `event.chartHistoryLastUpdated` | None beyond existing `MarketOutcomeSnapshot` chart route state | No new fallback | Fresh provider chart history still depends on Polymarket CLOB availability. |

Evidence:

- `docs/mobile/harness/cycle-QH-chart-status-ui/cycle-QH-provider-winner-s23-visible-flow.json`

## Cycle QG - Provider Chart History

Cycle QG makes real Polymarket CLOB price history available to the mobile Event Detail chart when the short `1D` CLOB window is empty but wider provider history exists.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail chart history | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile event browse | Event slug `argentina-vs-egypt` | `event.chartHistory`, `event.chartHistorySource`, `event.chartHistoryStatus`, market `chartHistory`, market `chartHistoryStatus`, contract `batchedChartHistorySource`, `batchedChartHistoryPointCount` | `Market`, `Outcome`, `MarketOutcomeSnapshot` | None. History points are fetched from Polymarket CLOB and stored as snapshots. | Latest history can still be stale if Polymarket has no fresh points. |
| Standalone market chart route | `/api/markets/:id/chart?range=1D` | GET | Market visibility guard | Query `range` | `source`, `requestedRange`, effective `range`, `rangeFallbackApplied`, `history`, `series`, `lastUpdated`, `emptyState` | `Market`, `Outcome`, `MarketOutcomeSnapshot` | None | Route falls back to wider provider history; future UI may expose range labels more explicitly. |
| Provider CLOB history refresh | Polymarket CLOB `/prices-history` through `refreshPolymarketPriceHistorySnapshots()` | GET/provider service | Public provider read | Token ID, requested interval, fidelity | History points `t` and `p`, converted to market outcome snapshots | `MarketOutcomeSnapshot` | None | If all provider ranges are empty, chart remains explicitly unavailable. |

Evidence:

- `docs/mobile/harness/cycle-QG-provider-chart-history/current-match-polymarket-chart-history.json`
- `docs/mobile/harness/cycle-QG-provider-chart-history/cycle-QG-provider-winner-s23-visible-flow.json`

## Cycle QF - Provider Winner Cashout Refresh

Cycle QF changes no backend route or schema. It proves the existing route contract can support the provider-backed winner buy/sell lifecycle on S23.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed winner buy | Existing mobile Event Detail, quote/order, Portfolio, and History routes used by the simple ticket flow, including `/api/mobile/events/:slug/live-detail`, order submit, `/api/portfolio`, and `/api/portfolio/history` through the mobile API client | GET/POST | Mobile API key/dev credential; backend must run with internal trading beta enabled and kill switch off for local proof | Ticket/order payload preserving event slug, provider market id `2793741`, market type `winner`, line `none`, provider source `polymarket`, selected outcome, side, amount, and price | Event title, provider winner market/outcome/token identity, ticket price, filled order, Portfolio position, Portfolio History row | Existing `User`, `ApiCredential`, `Event`, `Market`, `Outcome`, order/position/portfolio/history models | Seeded local counterparty liquidity fills the fake-token order | Production liquidity, wallet funding, and public trading policy remain future work. |
| Provider-backed winner cashout/sell | Existing cashout/sell ticket path plus order/Portfolio/History routes | POST/GET | Same mobile API key/dev credential and internal beta runtime | Cashout/sell payload preserving the original provider-backed winner selection and position identity | Cashout ticket fields, estimated proceeds, sell/fill activity, history source and market identity | Existing position/order/history models | Seeded local bid-side counterparty fills the cashout proof | Real production cashout pricing/liquidity policy remains future work. |
| Event Detail chart state | `/api/mobile/events/:slug/live-detail` chart fields consumed by mobile | GET | Public/mobile event browse | Event slug | `chartHistorySource`, `chartHistoryStatus`, `chartHistoryRange`, chart point count | Existing event/market/provider snapshot models | UI shows explicit unavailable/empty chart state when route history is not available | Route-backed Polymarket CLOB chart history is still P1 for this event proof. |

Evidence:

- `docs/mobile/harness/cycle-QF-provider-winner-cashout-refresh/cycle-QF-provider-winner-s23-visible-flow.json`

## Cycle QE - Provider Line Breadth Scan

Cycle QE adds a read-only provider breadth proof script and records current-match plus broad Gamma evidence for World Cup line-market availability.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current match line source proof | `/api/mobile/events/:slug/live-detail`; Gamma `/events?slug=fifwc-arg-egy-2026-07-07`; provider discovery service | GET/service call | Local DB env for route/service proof; public Gamma fetch | Event slug `argentina-vs-egypt` | `event.marketSourceSummary`, market `referenceSource`, `marketType`, `line`, `period`, provider market IDs, provider availability status | Existing `Event`, `Market`, `Outcome` | Contract-fixture line rows remain for Spread/Totals/Team Total | Real provider-backed line markets are unavailable for the current event. |
| World Cup provider line breadth scan | Gamma `/markets?search=...` and `/events?tag_slug=...` | GET | None; public provider read | World Cup/soccer line-market query set and tag slugs | Provider candidate family counts, line candidate count, attach-ready line candidate count, next interpretation | No DB writes; no schema change | No fixture change. Scan only justifies keeping existing contract-shaped fixtures for MVP | If future scan finds attach-ready line candidates, a review/attach cycle is required before replacing fixtures. |
| S23 Local MVP regression proof | Existing mobile routes for Home/Live/Event Detail/order/Portfolio History | GET/POST | Mobile API key/dev credential; internal beta runtime with kill switch off for fake-token order proof | Existing ticket/order payload preserving event slug, market id, outcome id, market type, line, period, side, reference source, and amount | Home/Live provider/local disclosure, ticket line identity, Portfolio History filled row | Existing `User`, `ApiCredential`, `Event`, `Market`, `Outcome`, order/position/portfolio/history models | Uses Local MVP contract-fixture lines | Real provider-backed line markets remain unavailable. |

Evidence:

- `docs/mobile/harness/cycle-QE-provider-line-breadth-scan/cycle-QE-current-match-line-availability.json`
- `docs/mobile/harness/cycle-QE-provider-line-breadth-scan/cycle-QE-provider-discovery-guard.json`
- `docs/mobile/harness/cycle-QE-provider-line-breadth-scan/cycle-QE-provider-line-breadth-scan.json`
- `docs/mobile/harness/cycle-QE-provider-line-breadth-scan/cycle-QE-provider-line-breadth-scan-npm-script.json`
- `docs/mobile/harness/cycle-QE-provider-line-breadth-scan/cycle-QE-current-mvp-s23-visible-flow.json`

## Cycle QD - Local Line History Flow

Cycle QD changes no backend source. It proves the existing backend/mobile route contract can carry a Local MVP line order into Portfolio History after a filled fake-token/server-backed trade.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local line filled-order history | Existing mobile quote/order/portfolio/history routes used by the simple ticket flow, including `/api/portfolio` and `/api/portfolio/history` through the mobile API client | GET/POST | Mobile API key/dev credential; backend must run with internal trading beta enabled and kill switch off for local proof | Existing ticket/order payload preserving event slug, market id, outcome id, market type, line, period, side, reference source, and amount | Portfolio cash, positions, history rows, trade side, amount, shares, probability, event title, outcome, market type, line, period, source markers | Existing `User`, `ApiCredential`, `Event`, `Market`, `Outcome`, order/position/portfolio/history models | Local MVP line markets remain backend-shaped `contract-fixture` rows until provider-backed line markets are available | Real provider-backed Spread/Totals/Team Total markets remain missing. Production trading and wallet auth remain future work. |
| Portfolio -> Account Google entry | Existing Account screen opens `${EXPO_PUBLIC_API_BASE_URL}/api/auth/google/start?returnTo=/portfolio` through `openGoogleSignIn` | Browser/deep-link open | Server auth route decides Google requirements | None from Portfolio entry | None until auth callback/profile sync is implemented | No schema change | Demo trading remains available without sign-in | End-to-end Google OAuth callback/session proof is not complete. |

Evidence:

- `docs/mobile/harness/cycle-QD-local-line-history-flow/cycle-QD-current-mvp-s23-visible-flow.json`
- `docs/mobile/screenshots/cycle-QD-local-line-history-flow/cycle-QD-current-mvp-portfolio-history.png`

## Cycle QC - Local Line Tradable Flow And Tab Regression

Cycle QC changes mobile UI tab rendering and proves the existing fake-token/server-backed Local MVP line order flow.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local MVP line ticket submit | Existing quote/order/portfolio routes used by the mobile ticket flow, including canonical fake-token order placement and Portfolio snapshot/history refresh | GET/POST | Mobile API key/dev credential; backend must run with internal trading beta enabled and kill switch off for local proof | Existing ticket/order payload preserving event slug, market id, outcome id, market type, line, period, side, reference source, and amount | Portfolio balance/cash, positions, local-line source badge, line/market selection snapshot, position cost/current/to-win fields | Existing `User`, `ApiCredential`, `Event`, `Market`, `Outcome`, order/position/portfolio tables | Local MVP line markets remain `contract-fixture` rows because provider line markets are unavailable | Production trading policy is still not implemented. Local proof requires explicit internal beta runtime; real provider-backed line markets remain open. |
| Event Detail duplicate tab fix | None | UI only | None | None | No API fields changed | No schema change | None | None. |

Evidence:

- `docs/mobile/harness/cycle-QC-local-line-tradable-flow/cycle-QC-current-mvp-s23-visible-flow.json`
- `docs/mobile/harness/cycle-QC-local-line-tradable-flow/cycle-QC-no-duplicate-tabs-summary.json`

## Cycle QB - Provider Line Discovery Runtime Summary

Cycle QB extends the provider-candidates service/route contract with a line-specific discovery summary for the Local MVP Event Detail line-market gap.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider candidate discovery for current match lines | `/api/mobile/events/:slug/provider-candidates`; proof calls `discoverMobileLiveProviderCandidates()` directly and fetches Polymarket Gamma sports events, manual slug fallbacks, and market search candidates | GET/service call | Route requires internal/admin auth; local proof uses service directly with local DB | Query params: `providerSearchMode`, optional `providerEventSlug`, `marketId`, `maxCandidatesPerMarket` | New `lineDiscoverySummary`: `lineTargetCount`, `lineTargetFamilies`, `lineCandidateCount`, `attachReadyLineTargetCount`, `exactProviderLineCandidateCount`, `manualLineSlugFallbackCount`, `manualLineSlugFallbackCandidateCount`, `candidateFamilySummary`, `rejectedReasonSummary`, `nextRequiredAction` | Existing `Event`, `Market`, `Outcome`; no schema change | Existing Local MVP line markets remain `contract-fixture` until attach-ready provider line markets exist | Real provider-backed Spread/Totals/Team Total markets are still missing. The discovery route now proves that absence instead of leaving it as an implicit UI fixture. |

Evidence:

- `docs/mobile/harness/cycle-QB-provider-line-discovery-runtime/cycle-QB-provider-discovery-guard.json`
- `docs/mobile/harness/cycle-QB-provider-line-discovery-runtime/cycle-QB-s23-proof-summary.json`

## Cycle QA - Provider Line Contract Action Fields

Cycle QA extends the live Event Detail route contract so mobile and future provider work can distinguish real provider-backed line families from Local MVP contract-fixture lines.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail line-market provider readiness | `/api/mobile/events/:slug/live-detail`; proof also reads Polymarket Gamma `/events?slug=fifwc-arg-egy-2026-07-07` | GET | None for public event browsing | None | `marketSourceSummary.lineMarkets.providerAvailability.status`, `providerBackedLineMarketCount`, `contractFixtureLineMarketCount`, `providerBackedFamilies`, `contractFixtureFamilies`, `nextProviderAction`, plus existing `markets[].referenceSource`, `marketType`, `line`, `period`, `outcomes[]` identity | Existing `Event`, `Market`, `Outcome`; no schema change in this cycle | Existing Local MVP Spread/Totals/Team Total rows remain backend-shaped `contract-fixture` lines; mobile consumes the same route-shaped contract fields in its deterministic proof fixture | Real provider-backed Spread/Totals/Team Total markets are still missing for the current match. The next provider milestone needs attach-ready Polymarket line markets or an approved line provider contract before backend parity can be marked complete. |

Evidence:

- `docs/mobile/harness/cycle-QA-provider-line-contract/cycle-QA-provider-match-line-availability.json`
- `docs/mobile/harness/cycle-QA-provider-line-contract/cycle-QA-s23-proof-summary.json`
- `docs/mobile/screenshots/cycle-QA-provider-line-contract/cycle-QA-s23-event-detail-provider-line-contract.png`

## Cycle PZ - Portfolio Google Entry Clarity

Cycle PZ changes visible mobile navigation only. No backend route, auth route, Prisma schema, provider import, order matching, portfolio sync, or fake-token mechanics changed.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio Google sign-in entry | Existing Account screen can open `${EXPO_PUBLIC_API_BASE_URL}/api/auth/google/start?returnTo=/portfolio` through `openGoogleSignIn` | Browser/deep-link open after Portfolio -> Account navigation | Server auth route decides Google auth requirements | None from the Portfolio header | None until auth callback/profile sync is implemented | No schema change | Demo trading remains available without sign-in in Local MVP | End-to-end Google OAuth callback/session proof remains future backend/auth work. |

## Cycle PY - Current APK Lane Refresh

Cycle PY changes no backend routes or mobile source. It refreshes the current-code installed Android APK proof lane.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Installed APK smoke on Samsung S23 | Existing mobile app startup and existing `holiwyn://qa?forcePortfolio=1` deep-link handling | Native app launch/deep link | None for launch; existing app route modes unchanged | None | Existing embedded app state and local/server-mode runtime config | No schema change | Existing demo/local fake-token state can render Portfolio if server mode is not configured | Full dev-client/EAS lane remains future tooling work; this cycle proves a local release APK lane only. |

## Cycle PX - Account Login Focus Cleanup

Cycle PX changes visible Account UI only. It does not change backend routes, auth routes, Prisma schema, provider import, order matching, portfolio sync, or fake-token mechanics.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Focused Account login screen | Existing `${EXPO_PUBLIC_API_BASE_URL}/api/auth/google/start?returnTo=/portfolio` through `openGoogleSignIn`; existing profile summary/balance routes in server mode | Browser/deep-link open plus existing GET routes | Existing server auth route decides Google auth requirements | None from this UI cleanup | No new response fields consumed | No schema change | Demo trading remains available without sign-in during MVP testing | End-to-end Google OAuth callback/session proof remains future backend/auth work. |
| Removed disabled Account menu rows | Existing `/api/profile/summary` may still return `menuItems`, but mobile no longer renders disabled non-MVP rows in the Local MVP Account screen | Existing GET unchanged | Existing profile auth behavior unchanged | Existing payload unchanged | `menuItems` ignored by the focused Account UI | No schema change | None added | If future product restores these rows, each needs a real route and working action before visible exposure. |

## Cycle PW - Demo Trading Copy Cleanup

Cycle PW changes visible mobile copy only. It does not change backend routes, auth routes, Prisma schema, provider import, order matching, portfolio sync, or fake-token mechanics.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Demo trading copy in Account/Portfolio/Ticket labels | Existing account, portfolio, order, and profile routes when server mode is active | Existing GET/POST routes unchanged | Existing Local MVP credential/profile auth behavior unchanged | Existing payloads unchanged | No new response fields consumed | No schema change | Existing fake-token/local demo trading remains active; only visible labels now say demo/practice | Real production wallet/deposit/withdraw and real-money compliance flows are still intentionally not implemented. |

## Cycle PV - Local Line Source Copy Cleanup

Cycle PV changes visible mobile copy only. No backend route, auth route, Prisma schema, provider import path, bot path, or order route changed.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Live/Event Detail/Search source labels | Existing event feed and live-detail routes, especially `/api/events?...includeMobileMarkets=1...` and `/api/mobile/events/:slug/live-detail` | GET | None for browsing | None | `marketSourceSummary.regulationWinner.status`, `marketSourceSummary.lineMarkets.status`, `familyReadiness`, `providerAvailability`, `markets[].referenceSource` | Existing `Event`, `Market`, `Outcome`; no schema change | Existing backend-shaped `contract-fixture` line markets remain active for Local MVP | Real provider-backed Spread/Totals/Team Total line markets remain missing. The UI now says `Local line(s)` while accessibility/test labels retain `contract-fixture` and fake-token markers. |
| Trade Ticket and Portfolio source labels | Existing quote/order/portfolio routes | GET/POST depending on action | Existing Local MVP credential for server-backed fake-token orders | Existing ticket/order payloads unchanged | Existing `selection.referenceSource`, `selection.marketType`, `selection.line`, `selection.outcomeId`, `selection.referenceTokenId` | Existing order/portfolio selection snapshots; no schema change | Local line orders continue to use fake-token Local MVP pricing | Backend route/schema parity for real provider-backed line orders remains open until provider line market identity exists. |

## Cycle PT - Portfolio Google Entry Visibility

Cycle PT changes visible mobile navigation only. No backend route, auth route, Prisma schema, or order route changed.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio account entry to Google login screen | Existing Account screen can open `${EXPO_PUBLIC_API_BASE_URL}/api/auth/google/start?returnTo=/portfolio` through `openGoogleSignIn` | Browser/deep-link open from mobile | Server auth route decides Google auth requirements | None from mobile beyond opening URL | None until auth callback/profile sync is implemented | None changed | Fake-token trading remains available without sign-in in Local MVP | Google login success requires a correctly configured backend auth route and mobile API base URL; this cycle only makes the existing entry discoverable. |

## Cycle PS - Provider-Backed Line Market Gap

Cycle PS does not change backend routes or schemas. It verifies the current match line-market provider gap against Polymarket Gamma and the Holiwyn live-detail route.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current match provider line availability | Polymarket Gamma `/events?slug=fifwc-arg-egy-2026-07-07`; `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | None for public provider/event viewing | None | Provider market `question`, `slug`, `conditionId`; route `markets[].referenceSource`, `markets[].marketType`, `markets[].line`, `event.marketSourceSummary.lineMarkets.status`, `providerAvailability` | Existing `Event`, `Market`, `Outcome`; no schema change | Existing backend-shaped `contract-fixture` Spread/Totals/Team Total rows remain active for Local MVP UI/order proof | Real provider-backed Spread/Totals/Team Total markets are unavailable for the current MVP match; next provider milestone needs a richer current match source or approved line-market provider contract. |

Evidence:

- `docs/mobile/harness/cycle-PS-provider-backed-line-market-gap/cycle-PS-provider-match-line-availability.json`
- `docs/mobile/audits/cycle-PS-provider-backed-line-market-gap.md`

## Cycle OV - Nation Top Goalscorer Provider Breadth And Classification Guard

Cycle OV imports/refreshed another real Polymarket-backed World Cup event and fixes backend provider normalization so top-goalscorer nation futures do not leak into match-only Home/Live routes.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nation top-goalscorer provider import | Polymarket Gamma `/events?slug=world-cup-nation-of-top-goalscorer`; CLOB public market data through provider services | GET | None for public provider fetch | None | provider event title/slug, market slugs/ids, condition ids, outcome token ids, best bid/ask, source/status fields | `Event`, `Market`, `Outcome`, reference quote/depth snapshot tables | None added | More current provider-backed match events remain needed. |
| Futures classification guard | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | None for browsing | None | `eventType`, `marketProfile`, `markets[].marketType`, `marketSourceSummary` | `Event`, `Market`, `Outcome` | No frontend-only data added | Additional World Cup futures phrases may need future normalization coverage as Polymarket adds markets. |
| Search provider breadth | `/api/events?sportKey=soccer&source=polymarket&includeMobileMarkets=1&limit=10&search=world` | GET | None for browsing | None | `title`, `eventType`, `marketCount`, `marketSourceSummary.polymarketMarketCount`, compact top market title/probability, source label fields | `Event`, `Market`, `Outcome`, reference snapshot tables | Existing local fallback only if server mode is not enabled | Home remains intentionally match-only; broad futures are Search-visible. |
| Tiny bot dry-run/live-local | poly-bot admin/reference routes plus canonical fake-token order route | GET/POST internal runtime | Dev admin plus bot runtime credential | Event slug `world-cup-nation-of-top-goalscorer`, allowlist `England`, `maxMarkets=1` | reference bid/ask, planned bot bid/ask, lifecycle status, risk-cap skip reason | `User`, `ApiCredential`, `Market`, `Outcome`, fake-token order tables | Fake-token local bot only; no external Polymarket orders | Per-market exposure cap blocks quote placement after seed; cap/seed sizing needs adjustment. |

Evidence:

- `docs/mobile/harness/cycle-OV-provider-breadth-nation-top-scorer/cycle-OV-provider-breadth-runtime-route-after-classification-fix.json`
- `docs/mobile/harness/cycle-OV-provider-breadth-nation-top-scorer/cycle-OV-search-provider-breadth-route-after-classification-fix.json`
- `docs/mobile/harness/cycle-OV-provider-breadth-nation-top-scorer/cycle-OV-nation-top-scorer-reference-refresh.json`
- `docs/mobile/harness/cycle-OV-provider-breadth-nation-top-scorer/cycle-OV-bot-dry-run-final.txt`
- `docs/mobile/harness/cycle-OV-provider-breadth-nation-top-scorer/cycle-OV-bot-live-local-final.txt`

## Cycle OU - Golden Boot Provider Breadth Refresh

Cycle OU does not change backend route or schema source. It imports/refreshed one additional real Polymarket-backed World Cup event, proves the existing mobile routes surface it, and proves the tiny bot runtime reaches quote management before the internal trading kill switch blocks placement.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Golden Boot provider import | Polymarket Gamma `/events?slug=world-cup-golden-boot-winner`; CLOB public market data through provider services | GET | None for public provider fetch | None | provider event title/slug, market slugs/ids, condition ids, outcome token ids, probabilities, best bid/ask, source/status fields | `Event`, `Market`, `Outcome`, reference quote/depth snapshot tables | None added | More provider-backed current match events remain needed. |
| Broad World Cup provider runtime | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | None for browsing | None | `events[]`, `eventType`, `source`, compact `markets[]`, `marketSourceSummary`, provider market counts | `Event`, `Market`, `Outcome` | No frontend-only data added | Real provider-backed line markets for match detail pages remain unavailable. |
| Search provider breadth | `/api/events?sportKey=soccer&source=polymarket&includeMobileMarkets=1&limit=10&search=world` | GET | None for browsing | None | `title`, `eventType`, `marketCount`, `marketSourceSummary.polymarketMarketCount`, compact top market title/probability, source label fields | `Event`, `Market`, `Outcome`, reference snapshot tables | Existing local fallback only if server mode is not enabled | Home remains intentionally match-only; broad futures are Search-visible. |
| Reference snapshot refresh | Internal reference refresh script/API path for `world-cup-golden-boot-winner` | GET/POST internal runtime | Dev/internal admin context | Event slug/market id through script params | token ids, best bid/ask, spread, quality status, `mmEligible`, missing-book status | `ReferenceQuoteSnapshot`, provider metadata on `Market`/`Outcome` | None | Scheduled refresh policy remains future work. |
| Tiny bot dry-run/live-local | poly-bot admin/reference routes plus canonical fake-token order route | GET/POST internal runtime | Dev admin plus bot runtime credential | Event slug `world-cup-golden-boot-winner`, allowlist `Kylian Mbappe`, `maxMarkets=1` | reference bid/ask, planned bot bid/ask, lifecycle status, quote action attempts, trading gate error | `User`, `ApiCredential`, `Market`, `Outcome`, fake-token order tables | Fake-token local bot only; no external Polymarket orders | Internal trading kill switch blocks quote placement even after provider readiness passes. |

Evidence:

- `docs/mobile/harness/cycle-OU-provider-match-breadth-refresh/cycle-OU-provider-breadth-runtime-route.json`
- `docs/mobile/harness/cycle-OU-provider-match-breadth-refresh/cycle-OU-search-provider-breadth-route.json`
- `docs/mobile/harness/cycle-OU-provider-match-breadth-refresh/cycle-OU-golden-boot-reference-refresh.json`
- `docs/mobile/harness/cycle-OU-provider-match-breadth-refresh/cycle-OU-bot-dry-run-final.txt`
- `docs/mobile/harness/cycle-OU-provider-match-breadth-refresh/cycle-OU-bot-live-local-final.txt`

## Cycle OT - World Cup Winner Provider Breadth Refresh

Cycle OT changes proof/import labeling only; no backend route or schema source changed. It refreshes local provider runtime data from Polymarket and proves the existing mobile routes surface it.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| World Cup winner provider import | Polymarket Gamma `/events?slug=world-cup-winner`; CLOB public market data through provider services | GET | None for public provider fetch | None | provider event title/slug, market slug/id, condition id, outcome token ids, best bid/ask, liquidity/depth | `Event`, `Market`, `Outcome`, reference quote/depth snapshot tables | None added | Scheduled refresh and broader attach-ready current match discovery remain future work. |
| Broad World Cup provider runtime | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | None for browsing | None | `events[]`, `eventType`, `source`, compact `markets[]`, `marketSourceSummary`, source/status fields | `Event`, `Market`, `Outcome` | No frontend-only data added | Real provider-backed line markets for match pages remain unavailable. |
| Search provider breadth | `/api/events?sportKey=soccer&source=polymarket&includeMobileMarkets=1&limit=10` and `/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&limit=10` | GET | None for browsing | None | `title`, `eventType`, `marketCount`, `marketSourceSummary.polymarketMarketCount`, `marketSourceSummary.contractFixtureMarketCount`, compact top market title/probability | `Event`, `Market`, `Outcome`, reference snapshot tables | Existing local fallback only if server mode is not enabled | Home is intentionally filtered to MVP matches; broad futures remain Search-visible. |

Evidence:

- `docs/mobile/harness/cycle-OT-world-cup-winner-breadth-refresh/cycle-OT-real-provider-world-cup-winner.json`
- `docs/mobile/harness/cycle-OT-world-cup-winner-breadth-refresh/cycle-OT-provider-breadth-runtime-route.json`
- `docs/mobile/harness/cycle-OT-world-cup-winner-breadth-refresh/cycle-OT-search-provider-breadth-route.json`

## Cycle OS - Provider Breadth / Line Inspection

Cycle OS does not change backend routes or schema. It refreshes provider-breadth route proof, current-match line availability proof, and S23 Search visibility proof.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed Search results | `/api/events?sportKey=soccer&source=polymarket&includeMobileMarkets=1&limit=10&search=world` | GET | None for browsing | None | `events[]`, `eventType`, `source`, `marketCount`, `marketSourceSummary`, compact `markets[]`, `referenceSource` | `Event`, `Market`, `Outcome`, reference quote/depth snapshot tables | Local fallback only when backend is unreachable | More current match events and true line-market provider data remain missing. |
| Broad World Cup provider runtime | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | None for browsing | None | Provider-backed event list, `marketSourceSummary`, `markets[].externalSlug`, `markets[].externalMarketId` | `Event`, `Market`, `Outcome` | None added | Scheduled provider refresh is still future work. |
| Current match live detail | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | None for browsing | None | `event.marketSourceSummary.regulationWinner.status`, `event.marketSourceSummary.lineMarkets.status`, `markets[].referenceSource`, `markets[].marketType`, `markets[].line` | `Event`, `Market`, `Outcome` | Existing contract-fixture line markets remain active for Local MVP | Polymarket-backed Spread/Totals/Team Total markets are not available from Gamma for this event. |

Evidence:

- `docs/mobile/harness/cycle-OS-provider-breadth-line-inspection/cycle-OS-provider-breadth-runtime-route.json`
- `docs/mobile/harness/cycle-OS-provider-breadth-line-inspection/cycle-OS-search-provider-breadth-route.json`
- `docs/mobile/harness/cycle-OS-provider-breadth-line-inspection/cycle-OS-current-match-line-availability.json`

## Cycle OR - Home/Live Provider Breadth Status Guard

Cycle OR does not change backend routes or schemas. It documents and guards the existing route behavior where Polymarket World Cup futures can carry `liveStatus=LIVE`.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search provider breadth display | `/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&limit=20` | GET | None for browsing | None | `eventType`, `liveStatus`, `marketProfile`, `supportedMarketTypes`, compact `markets[]`, `marketSourceSummary` | `Event`, `Market`, `Outcome`, reference snapshot tables | None added | More current provider-backed match events remain needed. |
| Home/Live match-only guard | `/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&mobileMvpMatches=1&limit=10`; `/api/events?...status=live...` | GET | None for browsing | None | `eventType`, `homeTeamName`, `awayTeamName`, `liveStatus`, `status` | `Event`, `Market`, `Outcome` | Existing local fallback only when backend is unreachable | Backend raw live status can include futures; mobile now guards future/outright types explicitly. |

Evidence:

- Route summary: `docs/mobile/harness/cycle-OR-home-provider-breadth-feed/cycle-OR-route-status-summary.json`
- S23 Search proof: `docs/mobile/harness/cycle-OR-home-provider-breadth-feed/cycle-OR-s23-search-summary-after-clear.json`
- S23 Live proof: `docs/mobile/harness/cycle-OR-home-provider-breadth-feed/cycle-OR-s23-live-summary-after-tap.json`

## Cycle OQ - Provider Breadth Runtime Loop

Cycle OQ imports one additional real Polymarket-backed World Cup event, refreshes reference prices, proves it in mobile Search on S23, and proves one tiny allowlisted fake-token bot dry-run/live-local path.

- S23 proof: `docs/mobile/harness/cycle-OQ-provider-breadth-runtime/cycle-OQ-s23-search-provider-breadth-summary.json`; screenshot: `docs/mobile/screenshots/cycle-OQ-provider-breadth-runtime/cycle-OQ-search-provider-breadth.png`.
- Route proof: `docs/mobile/harness/cycle-OQ-provider-breadth-runtime/cycle-OQ-provider-breadth-runtime-route.json`.
- Bot proof: `docs/mobile/harness/cycle-OQ-provider-breadth-runtime/cycle-OQ-bot-dry-run.txt`; `docs/mobile/harness/cycle-OQ-provider-breadth-runtime/cycle-OQ-bot-live-local.txt`.

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/runtime | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed World Cup breadth in Search | `/api/events?sportKey=soccer&source=polymarket&includeMobileMarkets=1&limit=10`; `/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&limit=10` | GET | None for mobile browsing | None | `events[]`, `eventType`, compact `markets[]`, `marketSourceSummary.polymarketMarketCount`, `referenceSource`, source labels | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | None added; imported provider data is persisted from Polymarket Gamma/CLOB | Real provider-backed World Cup match line markets remain unavailable. |
| Provider-backed event detail hydration | `/api/mobile/events/which-continent-will-win-the-world-cup/live-detail` | GET | None for mobile browsing | None | `event`, compact `markets[]`, `marketSourceSummary`, provider lifecycle source fields | `Event`, `Market`, `Outcome`, reference metadata | None | This event is futures/outright, not a live match detail replacement. |
| Reference snapshot refresh | Admin/provider refresh through `reference:snapshot-refresh` and admin reference-market routes | GET/POST internal runtime | Dev admin or internal admin key | Event slug/market id through script/API params | CLOB token ids, best bid/ask, spread, last trade price, quality status, `mmEligible` | `ReferenceQuoteSnapshot`, provider metadata on `Market`/`Outcome` | None | Snapshots remain freshness-window dependent and need scheduled refresh for stable bot readiness. |
| Tiny bot dry-run/live-local | poly-bot admin reference routes and canonical bot order/quote routes | GET/POST internal runtime | Dev admin plus bot API credential generated during seeding | One-market allowlist `Africa (CAF)`, tiny local capital/mint budget | bot lifecycle status, reference bid/ask, planned bot bid/ask, per-market exposure, quote actions | `User`, `ApiCredential`, `Market`, `Outcome`, orders/positions for local bot account | Fake-token local bot only; no external Polymarket orders | Wider bot breadth still requires explicit allowlist, seed, live-ready lifecycle, and fresh snapshots per market. |

## Cycle OP - Search Provider Breadth Visibility

Cycle OP renders existing provider/source contract fields in mobile Search rows and proves the broad provider route contains multiple provider-backed events.

- Route proof: `docs/mobile/harness/cycle-OP-search-provider-breadth/cycle-OP-search-provider-breadth-route.json`.
- S23 proof: `docs/mobile/harness/cycle-OP-search-provider-breadth/`.
- Audit: `docs/mobile/audits/cycle-OP-search-provider-breadth.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search provider breadth source labels | `/api/events?sportKey=soccer&source=polymarket&includeMobileMarkets=1&limit=10`; `/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&limit=10` | GET | None for Search browsing | None | `events[]`, `title`, `eventType`, compact `markets[]`, `marketSourceSummary.polymarketMarketCount`, `marketSourceSummary.contractFixtureMarketCount`, `marketSourceSummary.regulationWinner.status`, `marketSourceSummary.lineMarkets.status` | Existing `Event`, `Market`, `Outcome`; no schema change | Search row labels use existing route-provided contract summary; no frontend-invented volume/liquidity | More real provider-backed match events and real provider-backed line markets remain needed. |

## Cycle ON - Source Label Tester Cleanup

Cycle ON changes tester-facing mobile copy only; no backend route, schema, or request/response contract changed.

- UI report: `docs/mobile/UI_REGRESSION_SOURCE_CHANGE_REPORT.md`.
- S23 proof: `docs/mobile/harness/cycle-ON-source-label-tester-cleanup/`.
- Audit: `docs/mobile/audits/cycle-ON-source-label-tester-cleanup.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Event Detail/Ticket source disclosure cleanup | `/api/events`; `/api/mobile/events/:slug/live-detail` | GET | None for viewed feed/detail | None | Existing `marketSourceSummary`, `referenceSource`, market/outcome identity, source status, line family metadata | Existing `Event`, `Market`, `Outcome`; no schema change | Existing `contract-fixture` line markets remain visible as `Test` / `Test line - fake USDT` | Real provider-backed Spread/Totals/Team Total markets for inspected MVP match remain unavailable. |

## Cycle NJ - Current Service Inspection and Provider Winner Cashout

Cycle NJ re-inspects current service readiness and proves the provider-backed Regulation Winner buy/sell lifecycle on S23.

- Inspection: `docs/mobile/harness/cycle-NJ-current-service-and-sell-path-inspection/`.
- S23 proof: `docs/mobile/harness/cycle-NJ-provider-winner-cashout-s23/cycle-NJ-provider-winner-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-NJ-current-service-and-provider-winner-cashout.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed Regulation Winner buy/cashout lifecycle | `/api/events`; `/api/mobile/events/:slug/live-detail`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | GET and POST | Existing mobile API auth for order/portfolio | Existing ticket order body for buy; cashout sell uses `marketId`, `outcomeId`, `side=SELL`, `price`, and `size` from the owned position | `marketSourceSummary`, provider-backed `match_winner_1x2` identity normalized to mobile `winner`, `externalMarketId=2793741`, condition id, token id, filled buy, filled sell, Portfolio position/history source identity | Existing `Event`, `Market`, `Outcome`, `Order`, trade/fill read models; no schema change | Proof seeds deterministic maker SELL liquidity for buy and maker BUY liquidity for cashout | Real provider-backed Spread/Totals/Team Total markets and route-backed current chart history remain unavailable for inspected events. |

## Cycle NI - Provider Winner Clean Feed Regression

Cycle NI changes the provider-winner S23 proof harness only; it consumes existing provider-backed Regulation Winner, order, and Portfolio routes.

- S23 proof: `docs/mobile/harness/cycle-NI-provider-winner-clean-feed/cycle-NI-provider-winner-s23-visible-flow.json`.
- Counterparty proof: `docs/mobile/harness/cycle-NI-provider-winner-clean-feed/cycle-NI-provider-winner-counterparty.json`.
- Audit: `docs/mobile/audits/cycle-NI-provider-winner-clean-feed.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed Regulation Winner filled retail flow | `/api/events`; `/api/mobile/events/:slug/live-detail`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | GET and POST | Existing mobile API auth for order/portfolio | Existing ticket order body | Provider-backed `match_winner_1x2` market identity, `externalMarketId=2793741`, `conditionId`, outcome token id, order fill, Portfolio position/history source identity | Existing `Event`, `Market`, `Outcome`, `Order`; no schema change | Proof seeds deterministic maker ask liquidity for filled-history proof only | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket events. |

## Cycle NH - Mobile MVP Proof Event Filter

Cycle NH changes the public event list route used by Home, Live, and Search-style event discovery.

- Route inspection: `docs/mobile/harness/cycle-NH-current-service-reinspection/`.
- S23 proof: `docs/mobile/harness/cycle-NH-s23-proof-event-filter/cycle-NH-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-NH-mobile-mvp-proof-event-filter.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Live Local MVP match feed | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1` | GET | None | None | Event slug/title/type/status, compact markets, `marketSourceSummary.regulationWinner`, `marketSourceSummary.lineMarkets` | Existing `Event`, `Market`, `Outcome`; no schema change | None for event filtering; current line markets remain explicit `contract-fixture` data | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket events. |

## Cycle NG - S23 Current Match Cancel Proof

Cycle NG changes the S23 proof harness only; it consumes the existing server order/cancel/portfolio routes.

- S23 proof: `docs/mobile/harness/cycle-NG-s23-current-match-cancel-proof/cycle-NG-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-NG-s23-current-match-cancel-proof.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current MVP cancel proof | `/api/events`; `/api/mobile/events/:slug/live-detail`; `/api/orders`; `/api/orders/:id`; `/api/portfolio`; `/api/portfolio/history` | GET, POST, DELETE | Existing mobile API auth for order/portfolio | Existing ticket order body; cancel uses order id route param | Event compact markets, ticket selection snapshot, open order id/status, order selection/source identity, canceled activity/history identity | Existing `Event`, `Market`, `Outcome`, `Order`; no schema change | Existing Local MVP `contract-fixture` line selections remain cancel proof data | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket events. |

## Cycle NF - Proof JSON Hygiene

Cycle NF changes proof harness output only; it consumes the same mobile routes as Cycle NE.

- S23 proof: `docs/mobile/harness/cycle-NF-proof-json-hygiene/cycle-NF-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-NF-proof-json-hygiene.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current MVP proof artifact generation | `/api/events`; `/api/mobile/events/:slug/live-detail`; `/api/orders`; `/api/portfolio` | GET and POST | Existing mobile API auth for order/portfolio | Existing ticket order body | Event compact markets, ticket selection snapshot, open order selection/source identity | Existing `Event`, `Market`, `Outcome`, `Order`; no schema change | Existing Local MVP `contract-fixture` line selections remain proof data | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket events. |

## Cycle NE - S23 Open Order Proof Mode

Cycle NE changes proof harness behavior only; it consumes the same mobile routes as Cycle ND.

- S23 proof: `docs/mobile/harness/cycle-NE-s23-open-order-proof-mode/cycle-NE-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-NE-s23-open-order-proof-mode.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current MVP open-order proof harness | `/api/events`; `/api/mobile/events/:slug/live-detail`; `/api/orders`; `/api/portfolio` | GET and POST | Existing mobile API auth for order/portfolio | Existing ticket order body | Event compact markets, ticket selection snapshot, open order selection/source identity | Existing `Event`, `Market`, `Outcome`, `Order`; no schema change | Existing Local MVP `contract-fixture` line selections remain open-order proof data | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket events. |

## Cycle ND - Open Order Source Badge

Cycle ND consumes existing server Portfolio open-order selection snapshots in visible Portfolio Orders UI.

- Focused S23 proof: `docs/mobile/harness/cycle-ND-open-order-source-badge/cycle-ND-open-order-source-badge-proof.json`.
- Audit: `docs/mobile/audits/cycle-ND-open-order-source-badge.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio open-order source badge | `/api/portfolio` | GET | Existing mobile API auth | None | Open order `selection.referenceSource`, `selection.marketType`, `selection.line`, `selection.period`, `selection.marketId`, `selection.outcomeId`, `selection.referenceTokenId` | Existing `Order`, `Market`, `Outcome`; no schema change | Existing Local MVP `contract-fixture` line selections are shown as `Local test pricing` | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket events. |

## Cycle NC - Portfolio Selection Source Summary

Cycle NC consumes existing server Portfolio/history selection snapshots in visible Portfolio UI.

- S23 proof: `docs/mobile/harness/cycle-NC-portfolio-selection-source-summary/cycle-NC-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-NC-portfolio-selection-source-summary.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio selection source summary | `/api/portfolio`; `/api/portfolio/history` | GET | Existing mobile API auth | None | Position/open-order/history `selection.referenceSource`, `selection.marketType`, `selection.line`, `selection.period`, `selection.marketId`, `selection.outcomeId` | Existing `Order`, `Trade`, `Position`, `Market`, `Outcome`; no schema change | Existing Local MVP `contract-fixture` line selections are summarized as `Local line pricing` | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket events. |

## Cycle NB - Event Detail Line Availability Disclosure

Cycle NB consumes the Cycle NA backend contract in visible Event Detail UI.

- S23 proof: `docs/mobile/harness/cycle-NB-event-detail-line-availability-disclosure/cycle-NB-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-NB-event-detail-line-availability-disclosure.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail line availability disclosure | `/api/events?...includeMobileMarkets=1...`; `/api/mobile/events/:slug/live-detail` | GET | Public event viewing | None | `marketSourceSummary.lineMarkets.providerAvailability.status`, `providerBackedLineMarketCount`, `contractFixtureLineMarketCount` | Existing `Event`, `Market`, `Outcome`; no schema change | Existing `contract-fixture` line markets remain Local MVP fallback rows and are visibly explained in Event Detail | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket events. |

## Cycle NA - Line Provider Availability Contract

Cycle NA adds a structured line-market provider availability contract to the mobile event payload.

- Route proof: `docs/mobile/harness/cycle-NA-line-provider-availability-contract/cycle-NA-line-provider-availability-route.json`.
- S23 proof: `docs/mobile/harness/cycle-NA-line-provider-availability-contract/cycle-NA-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-NA-line-provider-availability-contract.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Line-market provider availability disclosure | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10&status=live`; `/api/mobile/events/:slug/live-detail` | GET | Public event viewing | None | `marketSourceSummary.lineMarkets.providerAvailability.source`, `status`, `providerBackedLineMarketCount`, `contractFixtureLineMarketCount`, `reason` | Existing `Event`, `Market`, `Outcome`; no schema change | Existing backend-shaped `contract-fixture` line markets remain Local MVP fallback rows and are counted in the new availability field | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket events. |

## Cycle MZ - Backend Live Status Route

Cycle MZ closes the backend `status=live` route gap discovered by the Live page.

- Route proof: `docs/mobile/harness/cycle-MZ-backend-live-status-route/cycle-MZ-live-route-status.json`.
- S23 proof: `docs/mobile/harness/cycle-MZ-backend-live-status-route/cycle-MZ-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-MZ-backend-live-status-route.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live page event feed | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10&status=live` | GET | Public event viewing | None | `status`, `liveStatus`, compact `markets`, `marketSourceSummary`, event slug/team/title fields | Existing `Event`, `Market`, `Outcome`; no schema change | Mobile still has defensive all-match fallback from Cycle MY, but the backend live route now returns current `liveStatus=LIVE` events directly | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket events. |

## Cycle MY - Live Source Readiness

Cycle MY makes the Live page robust against the current backend status contract where live matches may have `status=active` and `liveStatus=LIVE`.

- S23 proof: `docs/mobile/harness/cycle-MY-live-source-readiness/cycle-MY-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-MY-live-source-readiness.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live source-readiness feed | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&status=live`, fallback `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1` | GET | Public event viewing | None | `status`, `liveStatus`, `marketSourceSummary.regulationWinner.status`, `marketSourceSummary.lineMarkets.status`, `marketSourceSummary.lineMarkets.families`, event/market `referenceSource` | Existing `Event`, `Market`, `Outcome`; no schema change | If the live-status route returns empty, mobile uses the all-match route and client-filters `status=live` or `liveStatus=LIVE` | Backend status filter does not currently return `status=active/liveStatus=LIVE` matches for `status=live`; real provider-backed Spread/Totals/Team Total markets remain unavailable. |

## Cycle MX - Home Source Readiness

Cycle MX uses existing backend source summary fields to make current provider readiness visible on Home cards.

- S23 proof: `docs/mobile/harness/cycle-MX-home-source-readiness/cycle-MX-current-mvp-s23-visible-flow.json`.
- Route/provider proof: `docs/mobile/harness/cycle-MX-provider-line-readiness-route/cycle-MX-current-state-inspection.json`.
- Audit: `docs/mobile/audits/cycle-MX-home-source-readiness.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home source-readiness disclosure | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10`, `/api/mobile/events/:slug/live-detail`, Polymarket Gamma `events?slug=...` for provider inspection | GET | Public event viewing | None | `event.marketSourceSummary.regulationWinner.status`, `event.marketSourceSummary.lineMarkets.status`, `event.marketSourceSummary.lineMarkets.families`, event/market `referenceSource` | Existing `Event`, `Market`, `Outcome`; no schema change | Existing `contract-fixture` line markets remain backend-shaped Local MVP fallback rows and are now disclosed from Home | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket events. |

## Cycle MW - Portfolio Local Pricing Disclosure

Cycle MW carries existing line-market source state into Portfolio positions and History.

- S23 proof: `docs/mobile/harness/cycle-MW-portfolio-local-pricing-disclosure/cycle-MW-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-MW-portfolio-local-pricing-disclosure.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio/history local-pricing source disclosure | `/api/events?...includeMobileMarkets=1&mobileMvpMatches=1`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET for Home/detail/Portfolio/history; POST for order submit | Public event viewing; existing mobile API auth for order/portfolio | Existing ticket order body for selected Spread market/outcome/line | Portfolio/history `selection.referenceSource=contract-fixture`, selected `marketType=spread`, `line=1.5`, `period=regulation`, position/activity selection snapshots | Existing `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`; no schema change | Existing backend-shaped `contract-fixture` line markets remain Local MVP fallback rows and are now visibly labeled in Portfolio/history | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events. |

## Cycle MV - Ticket Local Pricing Disclosure

Cycle MV carries existing line-market source state into the Trade Ticket.

- S23 proof: `docs/mobile/harness/cycle-MV-ticket-local-pricing-disclosure/cycle-MV-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-MV-ticket-local-pricing-disclosure.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket local-pricing source disclosure | `/api/events?...includeMobileMarkets=1&mobileMvpMatches=1`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET for Home/detail/Portfolio/history; POST for order submit | Public event viewing; existing mobile API auth for order/portfolio | Existing ticket order body for selected Spread market/outcome/line | `ticket.selection.referenceSource=contract-fixture`, selected `marketType=spread`, `line=1.5`, `period=regulation`, portfolio/history selection snapshots | Existing `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`; no schema change | Existing backend-shaped `contract-fixture` line markets remain Local MVP fallback rows and are now visibly labeled in the ticket | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events. |

## Cycle MU - Line Local Pricing Disclosure

Cycle MU adds visible disclosure for existing line-market source state.

- S23 proof: `docs/mobile/harness/cycle-MU-line-local-pricing-disclosure/cycle-MU-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-MU-line-local-pricing-disclosure.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local MVP line-market source disclosure | `/api/events?...includeMobileMarkets=1&mobileMvpMatches=1`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET for Home/detail/Portfolio/history; POST for order submit | Public event viewing; existing mobile API auth for order/portfolio | Existing ticket order body for selected Spread market/outcome/line | `market.referenceSource=contract-fixture`, selected `marketType=spread`, `line=1.5`, `period=regulation`, portfolio/history selection snapshots | Existing `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`; no schema change | Existing backend-shaped `contract-fixture` line markets remain Local MVP fallback rows and are now visibly labeled `Local test pricing` | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events. |

## Cycle MT - Provider Winner Top Outcome Fill

Cycle MT proves the top provider-backed Regulation Winner outcome can fill after local proof liquidity is prepared for the selected provider market.

- S23 proof: `docs/mobile/harness/cycle-MT-provider-winner-top-outcome-fill/cycle-MT-provider-winner-s23-visible-flow.json`.
- Counterparty proof: `docs/mobile/harness/cycle-MT-provider-winner-top-outcome-fill/cycle-MT-provider-winner-counterparty.json`.
- Audit: `docs/mobile/audits/cycle-MT-provider-winner-top-outcome-fill.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed Regulation Winner top-outcome filled lifecycle | `/api/events?...includeMobileMarkets=1&mobileMvpMatches=1`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history`; proof setup uses local Prisma + `placeOrderAndMatch()` | GET for Home/detail/Portfolio/history; POST for order submit; local proof setup before S23 run | Public event viewing; existing mobile API auth for order/portfolio; proof setup refuses production | Existing ticket order body with selected `marketId`, `outcomeId`, `marketType=winner`, `line=null`, `period=regulation`, provider IDs/tokens | `referenceSource=polymarket`, provider market `2793738`, provider token, filled trade/position/history selection snapshots | Existing `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`; no schema change | No UI mock fallback. Proof setup creates valid local ask liquidity and cancels blocking local bids for the target provider market. | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events. |

## Cycle MS - Provider Winner Filled History

Cycle MS proves the provider-backed Regulation Winner route data through a filled S23 ticket/order/Portfolio/history lifecycle.

- S23 proof: `docs/mobile/harness/cycle-MS-provider-winner-filled-history/cycle-MS-provider-winner-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-MS-provider-winner-filled-history.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed Regulation Winner filled lifecycle | `/api/events?...includeMobileMarkets=1&mobileMvpMatches=1`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET for Home/detail/Portfolio/history; POST for order submit | Public event viewing; existing mobile API auth for order/portfolio | Existing ticket order body with selected `marketId`, `outcomeId`, `marketType=winner`, `line=null`, `period=regulation`, provider IDs/tokens | `referenceSource=polymarket`, `externalMarketId`, `conditionId`, `referenceTokenId`, `selection.referenceSource`, filled trade/position/history selection snapshots | Existing `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`/portfolio read models; no schema change | No mock fallback for provider winner fill; proof uses existing valid local liquidity for provider market `2793741` | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events. |

## Cycle MR - Provider Winner 1X2 Parity

Cycle MR fixes Event Detail rendering for provider-backed soccer Regulation Winner markets.

- S23 proof: `docs/mobile/harness/cycle-MR-provider-winner-1x2-parity/cycle-MR-provider-winner-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-MR-provider-winner-1x2-parity.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed Regulation Winner 1X2 display/ticket | `/api/events?...includeMobileMarkets=1&mobileMvpMatches=1`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET for Home/detail/Portfolio/history; POST for order submit | Public event viewing; existing mobile API auth for order/portfolio | Existing ticket order body; each composed visible row maps to its own provider `marketId`, `outcomeId`, `externalMarketId`, `conditionId`, and `referenceTokenId` | Three provider binary winner markets, `referenceSource=polymarket`, market title/slug for home/draw/away classification, `selection.referenceSource` snapshots | Existing `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`/portfolio read models; no schema change | No local fallback for provider winner 1X2 when all three provider markets exist. If the three-market set is incomplete, Event Detail falls back to existing market rows. | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events. |

## Cycle MQ - Provider Winner S23 Visible Flow

Cycle MQ proves the provider-backed Regulation Winner route data through visible S23 ticket/order/Portfolio/history.

- S23 proof: `docs/mobile/harness/cycle-MQ-provider-winner-s23-visible-flow/cycle-MQ-provider-winner-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-MQ-provider-winner-s23-visible-flow.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed Regulation Winner retail flow | `/api/events?...includeMobileMarkets=1&mobileMvpMatches=1`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET for Home/detail/Portfolio/history; POST for order submit | Public event viewing; existing mobile API auth for order/portfolio | Existing ticket order body with selected `marketId`, `outcomeId`, `marketType=winner`, `line=null`, `period=regulation`, provider IDs/tokens | `referenceSource=polymarket`, `externalMarketId`, `conditionId`, `referenceTokenId`, `selection.referenceSource`, Portfolio/history selection snapshot fields | Existing `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`/portfolio read models; no schema change | None for Regulation Winner in this proof. Spread/Totals remain separate Local MVP fixtures. | Real provider-backed Spread/Totals/Team Total markets remain unavailable for inspected events. |

## Cycle MP - Current Service Reinspection

Cycle MP inspected current Home/Event Detail route readiness and Polymarket Gamma availability before continuing the loop.

- Route inspection: `docs/mobile/harness/cycle-MP-current-state-reinspection/cycle-MP-current-state-reinspection.json`.
- Provider inspections: `docs/mobile/harness/cycle-MP-current-state-reinspection/cycle-MP-provider-match-line-availability-argentina-egypt.json`, `docs/mobile/harness/cycle-MP-current-state-reinspection/cycle-MP-provider-match-line-availability-switzerland-colombia.json`.
- Audit: `docs/mobile/audits/cycle-MP-current-service-reinspection.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local MVP service readiness inspection | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10`, `/api/mobile/events/:slug/live-detail`, Polymarket Gamma `/events?slug=:externalSlug` | GET | Public event viewing | Route params/query only | `eventType`, `marketCount`, `marketSourceSummary`, compact `markets[]`, `referenceSource`, `marketType`, `line`, `period`, `externalMarketId` | Existing `Event`, `Market`, `Outcome`; no schema change | Spread/Totals/Team Total remain `contract-fixture` Local MVP rows when Polymarket Gamma has no line markets | Real provider-backed Spread/Totals/Team Total markets are unavailable for inspected events; next route/user-flow work should prove provider-backed Regulation Winner end-to-end. |

## Cycle MO - Portfolio Source Badges

Cycle MO renders Portfolio source state from existing order-time selection snapshots.

- S23 proof: `docs/mobile/harness/cycle-MO-portfolio-source-badges/cycle-MO-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-MO-portfolio-source-badges.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio position/history source badges | Existing `/api/portfolio` and `/api/portfolio/history`; upstream ticket submit still uses `/api/orders` | GET for portfolio/history refresh; POST for order submit | Existing mobile API auth | No new request body fields | Position/activity `selection.referenceSource`, existing market/outcome/line/source identity fields | Existing `Order`, `Trade`, `Position`/portfolio read models; no schema change | `referenceSource=contract-fixture` renders `Local`; Polymarket source renders `Provider`; unknown source renders checking state | Real provider-backed Spread/Totals/Team Total markets remain missing for the inspected event. |

## Cycle MN - Trade Ticket Source Badge

Cycle MN renders Trade Ticket source state from existing ticket/market reference fields.

- S23 proof: `docs/mobile/harness/cycle-MN-ticket-source-badge/cycle-MN-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-MN-ticket-source-badge.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket source badge | Existing Event Detail hydration/catalog routes populate the ticket target; submit still uses existing `/api/orders`; Portfolio/history proof still uses existing `/api/portfolio` and `/api/portfolio/history` | GET for event/catalog hydration; POST for order submit; GET for portfolio refresh | Public event viewing; order/portfolio use existing mobile API auth | No new request body fields | `ticket.selection.referenceSource`, fallback `ticket.market.referenceSource`, existing market/outcome/selection identity fields | Existing `Event`, `Market`, `Outcome`, `Order`, `Position`/portfolio read models; no schema change | `referenceSource=contract-fixture` renders `Local`; Polymarket source renders `Provider`; unknown source renders checking state | Real provider-backed Spread/Totals/Team Total markets remain missing for the inspected event. |

## Cycle MM - Market Source Row Badges

Cycle MM renders row-level source badges from existing market reference fields.

- S23 proof: `docs/mobile/harness/cycle-MM-market-source-row-badges/cycle-MM-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-MM-market-source-row-badges.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail Game Lines row source badges | Existing `/api/mobile/events/:slug/live-detail` hydration and `/api/events?...includeMobileMarkets=1&mobileMvpMatches=1` feed/catalog fields | GET | Public event viewing; trading still uses existing account/order auth | Route params/query only | `market.referenceSource` on compact `markets[]`; existing `marketSourceSummary` remains used by the section banner | Existing `Event`, `Market`, `Outcome`; no schema change | `referenceSource=contract-fixture` renders `Local`; Polymarket source renders `Provider`; unknown/missing source renders checking/unavailable state | Real provider-backed Spread/Totals/Team Total markets remain missing for the inspected event. |

## Cycle ML - Game Lines Source Banner

Cycle ML wires backend `marketSourceSummary` into the visible Event Detail Game Lines UI.

- S23 proof: `docs/mobile/harness/cycle-ML-line-source-banner/cycle-ML-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-ML-line-source-banner.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail Game Lines source banner | `/api/mobile/events/:slug/live-detail`; Home can also receive the same summary through `/api/events?...includeMobileMarkets=1&mobileMvpMatches=1` | GET | Public event viewing; trading still uses existing account/order auth | Route params/query only | `event.marketSourceSummary.regulationWinner.status`, `event.marketSourceSummary.lineMarkets.status`, `lineMarkets.totalCount`, `lineMarkets.reason`, source counts | Existing `Event`, `Market`, `Outcome`; no schema change | Offline/mock event type can carry the same `marketSourceSummary` shape. If missing, the banner is omitted. | No new backend support is missing for the banner. Real provider-backed line markets remain missing for the current event and are tracked separately. |

## Cycle MK - Provider Line Readiness Inspection

Cycle MK re-checks Polymarket Gamma candidate availability for the current Local MVP event.

- Provider readiness proof: `docs/mobile/harness/cycle-MK-provider-line-readiness-inspection/cycle-MK-provider-line-readiness-inspection.json`.
- Audit: `docs/mobile/audits/cycle-MK-provider-line-readiness-inspection.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed market discovery for current MVP event | Internal service behind `/api/mobile/events/:slug/provider-candidates`; Polymarket Gamma `/events` and `/markets` public fetches | GET through route or proof service | Protected route requires admin/internal access; proof uses local service directly | `eventSlug=argentina-vs-egypt`, provider search mode `combined` | Provider candidate family, slug, question, event title, attach readiness, mismatch reasons | Existing `Event`, `Market`, `Outcome`; no schema change | Current Spread/Totals/Team Total rows remain backend-shaped `contract-fixture` markets. They are allowed for Local MVP fake-token flow but not provider parity. | Real provider-backed Spread/Totals/Team Total candidates are not available for this inspected event. |

## Cycle MJ - Position Sell Contract Identity

Cycle MJ preserves owned contract identity when reopening a Portfolio position for sell/retrade ticket behavior.

- Identity proof: `docs/mobile/harness/cycle-MJ-position-sell-contract-identity/cycle-MJ-position-sell-contract-identity.json`.
- S23 proof: `docs/mobile/harness/cycle-MJ-position-sell-contract-identity/cycle-MJ-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-MJ-position-sell-contract-identity.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio position sell/retrade ticket identity | Existing ticket and portfolio routes: `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | POST for order submit; GET for portfolio/history refresh | Existing mobile API key/session auth in server mode | Position action should submit `side=SELL` with the owned `marketId`, `outcomeId`, `line`, `period`, and owned `contractSide`; it must not auto-flip an owned Yes position into No | Order result, portfolio positions/open orders/activity/history, selected ticket identity fields | Existing `Order`, `Trade`, `Position`/portfolio read models and selection snapshot fields; no schema change | Offline/mock mode uses the same selected position identity resolver. S23 proof used the current server-mode Local MVP flow with seeded counterparty. | None for this identity fix. Real provider-backed Spread/Totals/Team Total remains tracked separately from this Portfolio identity contract. |

## Cycle MI - Provider Discovery Guard

Cycle MI tightens provider candidate ranking and attach readiness for current Local MVP event mappings.

- Provider guard proof: `docs/mobile/harness/cycle-MI-provider-discovery-guard/cycle-MI-provider-discovery-guard.json`.
- S23 proof: `docs/mobile/harness/cycle-MI-provider-discovery-guard/cycle-MI-current-mvp-s23-visible-flow.json`.
- Audit: `docs/mobile/audits/cycle-MI-provider-discovery-guard.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Polymarket provider candidate discovery | Internal service used by protected `/api/mobile/events/:slug/provider-candidates`; Gamma `/events` and `/markets` public provider fetches | GET through protected route or internal proof | Protected route requires internal admin key/session; proof uses local service directly | Query params/body vary by provider-candidate route; proof uses `eventSlug=argentina-vs-egypt` | `providerEventSlugs`, target markets, candidate slug/question/event title, family, relevance tokens, attach readiness, provider condition/token identity | Existing `Event`, `Market`, `Outcome`; no schema change | Existing contract-shaped line markets remain available for Local MVP UI. They do not become provider-backed. | Real provider-backed Spread/Totals/Team Total slugs/tokens remain unavailable for the inspected event. |

## Cycle MH - MVP Service Readiness Inspection

Cycle MH inspects the current server-mode Local MVP routes and fixes the inspection harness to use the same match-only feed contract as Home.

- Inspection proof: `docs/mobile/harness/cycle-MH-mvp-current-state-inspection/cycle-MH-current-state-inspection.json`.
- Audit: `docs/mobile/audits/cycle-MH-mvp-service-readiness-inspection.md`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local MVP Home/Event Detail readiness | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10`; `/api/mobile/events/:slug/live-detail` | GET | Public event viewing; account/order auth only for order and Portfolio actions | Query params only | Event slug/title/type/status, `marketSourceSummary`, compact markets, `marketType`, `line`, `period`, `referenceSource`, provider/source status, outcomes | Existing `Event`, `Market`, `Outcome`, provider reference metadata | No frontend-only random mocks are required for this inspection. Existing Local MVP line rows are backend-shaped `contract-fixture` markets. | Real provider-backed Spread/Totals/Team Total markets are not attached for the inspected event. |

## Cycle LH - Event Detail Dead Live Stats Contract

Cycle LH removes the unreachable fake live stats panel, deterministic sports-stat rows, and match-flow timeline from Event Detail source. Event Detail still consumes backend route-status metadata for hidden proof markers while the MVP excludes a visible live-stat product surface.

- Event Detail dead live stats proof: `docs/mobile/harness/cycle-LH-event-detail-dead-live-stats-contract/cycle-LH-event-detail-dead-live-stats-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_dead_live_stats_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/eventDetailDeadLiveStatsContract.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail MVP route-status markers | `/api/mobile/events/:slug/live-detail`, `/api/events/:slug/markets`, `/api/markets/:id/quote` | GET | Public event viewing; account/order auth only for user state and trading actions | Existing route params/query only | Event identity, teams, status/time, backend market profile/rules, compact markets, primary outcomes, Game Lines, provider/live availability metadata for hidden proof markers | Existing `Event`, `Market`, `Outcome`, provider lifecycle/status read models | Offline/mock mode can still use local event fixtures, but Event Detail no longer contains fake live-stat rows or a match-flow timeline. | Real route-backed sports/live stats remain outside MVP unless a visible live-stat product surface is explicitly scoped. |

## Cycle LG - Home Card Stats Contract

Cycle LG removes hidden local-MVP volume/liquidity stats from active Home match cards. Home cards remain tied to the `/api/events` feed in server mode and use backend-provided event rules/profile fields for outcome selection.

- Home card stats proof: `docs/mobile/harness/cycle-LG-home-card-stats-contract/cycle-LG-home-card-stats-contract.json`.
- Proof script: `scripts/prove_mobile_home_card_stats_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/homeCardStatsContract.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Home match cards | `/api/events?category=sports&sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&filter=<all/live/today>&limit=<n>&cursor=<event-id>` | GET | Public event viewing; optional account preference sync for saved ids through existing profile preferences wiring | Query params only | Event id/title/teams/status/start time/tag, compact markets/outcomes, `marketProfile`, `resultMode`, `gameRules`, `supportedMarketTypes`, cursor metadata | Existing `Event`, listed public `Market`, active `Outcome`, sports/league taxonomy | Offline/mock mode can still use local event fixtures, but active Home cards no longer fabricate volume/liquidity stats. | Route-backed Home volume/liquidity is not displayed unless backend explicitly adds and product scopes those fields. Inactive Futures catalog presentation still carries local volume/chart fallback and remains a tracked P1 only if restored to visible MVP. |

## Cycle LF - Event Detail No Chat/Stats Contract

Cycle LF removes leftover Event Detail chat UI code and frontend-invented volume/liquidity/trader stats. Event Detail remains focused on route-backed event identity, primary outcomes, user position, Game Lines, Player Props placeholder, and backend market summary metadata.

- Event Detail no chat/stats proof: `docs/mobile/harness/cycle-LF-event-detail-no-chat-stats-contract/cycle-LF-event-detail-no-chat-stats-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_no_chat_stats_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/eventDetailNoChatStatsContract.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Event Detail focused surface | Existing Event Detail routes: `/api/mobile/events/:slug/live-detail`, `/api/events/:slug/markets`, `/api/markets/:id/quote`, plus Portfolio/order routes for user position and ticket actions | GET for event/catalog/quote/portfolio; POST/DELETE through existing order flows | Public event viewing; account/order auth for user state and trading | Existing route params/request bodies only | Event identity, teams, status/time, backend market profile/rules, compact markets, primary outcomes, Game Lines, Player Props empty state, user position | Existing `Event`, `Market`, `Outcome`, order/portfolio read models | Mock/offline mode can still use local event fixtures, but Event Detail no longer carries chat UI or fake volume/liquidity/trader stats. | Chat/social and real route-backed event stats remain outside MVP unless explicitly scoped. |

## Cycle LE - Search Result Stats Contract

Cycle LE removes frontend-invented Search result stats. Search rows no longer display fake volume, liquidity, today-volume, or chat counts; they keep event identity/start time/top outcome/save/navigation backed by the existing Search route and profile preference sync.

- Search result stats proof: `docs/mobile/harness/cycle-LE-search-result-stats-contract/cycle-LE-search-result-stats-contract.json`.
- Proof script: `scripts/prove_mobile_search_result_stats_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/searchResultStatsContract.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Search result row metadata | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&search=<query>&limit=10&cursor=<event-id>` plus `/api/profile/preferences` for saved event ids | GET for events/preferences; PUT for saved preferences | Public event list; account read/write for preference sync when server mode is active | Query params for Search; existing preference body for saved ids | Event title/category/start time, compact top market/outcome, saved state, cursor metadata | Existing `Event`, listed public `Market`, active `Outcome`, and `UserProfilePreference` rows | Mock/offline mode can still filter local events, but visible Search no longer fabricates market stats or chat counts. | Real route-backed volume, liquidity, today-volume, and comment/chat counts are not displayed until backend/Search explicitly supports those fields. |

## Cycle LD - Portfolio Settings Contract

Cycle LD removes the duplicate local-only Portfolio account/settings gear and sheet. Portfolio remains focused on route-backed account value, positions, orders, history, cashout, buy, and cancel controls; Account remains the owner of account/preferences surfaces.

- Portfolio settings proof: `docs/mobile/harness/cycle-LD-portfolio-settings-contract/cycle-LD-portfolio-settings-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_settings_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/portfolioSettingsContract.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Portfolio account/settings affordance | Existing Portfolio routes only: `/api/account/balance`, `/api/portfolio`, `/api/portfolio/history`, `/api/portfolio/value-history`, plus existing Account preference/profile routes on the Account surface | GET for Portfolio data; Account uses its already-documented GET/PUT preference/summary routes | Existing account read/write auth when server mode is active | None for removed Portfolio settings sheet | Portfolio consumes balance, value-history, positions, open orders, history/activity, cashout/cancel state | Existing account balance, portfolio, order, position, trade/history, and profile preference models already documented by KT/KP/KU/KW | Mock/offline mode keeps Portfolio data fallback only. It no longer exposes a duplicate local-only account settings sheet. | Broader account/security/session/funding settings remain future Account-surface work only if MVP scope expands. |

## Cycle LC - Account Static Rows Contract

Cycle LC removes unsupported hardcoded Account rows (`Theme: Dark`, security teaser, fake-token static row). Account keeps rows backed by profile preferences, profile summary, or app trading-mode state.

- Account static rows proof: `docs/mobile/harness/cycle-LC-account-static-rows-contract/cycle-LC-account-static-rows-contract.json`.
- Proof script: `scripts/prove_mobile_account_static_rows_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/accountStaticRowsContract.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Account settings/status rows | Existing `/api/profile/preferences`, `/api/profile/summary`, and local trading mode state | GET/PUT for preferences; GET for summary | Existing account preference/profile auth when server mode is active | Existing preference body only | Locale, saved market count, portfolio/account summary values, ticket defaults, profile sync status, trading mode | Existing `UserProfilePreference`, account summary read models | Mock/offline mode keeps local preference and trading-mode display only. Unsupported static rows are not shown. | Theme/security settings require future backend contracts before they become visible. |

## Cycle LB - Account Auth Visibility Contract

Cycle LB removes local mock Account login/signup/sign-out actions. Visible Account auth state is now display-only and route-derived: server profile summary success marks the Account screen as signed in; otherwise auth actions are unavailable.

- Account auth visibility proof: `docs/mobile/harness/cycle-LB-account-auth-visibility-contract/cycle-LB-account-auth-visibility-contract.json`.
- Proof script: `scripts/prove_mobile_account_auth_visibility_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/accountAuthContract.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Account auth state | `/api/profile/summary` through existing Account summary wiring | GET | Canonical actor with `account:read`; route id `account:summary` | None | Successful summary load sets app-level `forceAccountSignedIn=true`; summary props drive visible profile/account values | Existing `User`, `UserProfilePreference`, `UserBalance`, `Position`, `Order` route read models | Mock/offline mode shows signed-out/auth-unavailable copy only. It no longer stores or toggles a local fake auth session. | Full login, signup, logout, session, KYC, and wallet auth flows remain outside focused MVP scope. |

## Cycle LA - Header Actions Contract

Cycle LA removes unsupported local-only promo and notification actions from the app header. The remaining visible header action is language switching, which is already covered by the profile preference/local preference path:

- Header actions proof: `docs/mobile/harness/cycle-LA-header-actions-contract/cycle-LA-header-actions-contract.json`.
- Proof script: `scripts/prove_mobile_header_actions_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/headerContract.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible app header actions | Existing language preference path through local app state and `/api/profile/preferences` when server preferences are active | GET/PUT for preferences; no route for removed actions | Existing account preference auth when server mode is active | Existing preference body only | Locale/language state only | Existing `UserProfilePreference.preferences` for server preference sync | Mock/offline mode keeps local language switching. Promo and notification actions are not shown and do not invent local fake feedback. | Promo/rewards/claim-credit and notifications routes remain outside focused MVP scope. Add them only if product scope expands. |

## Cycle KZ - Search Controls Route Contract

Cycle KZ removes unsupported local-only Search category/sort controls so the visible Search page only exposes controls backed by the current route contract:

- Search controls proof: `docs/mobile/harness/cycle-KZ-search-controls-route-contract/cycle-KZ-search-controls-route-contract.json`.
- Proof script: `scripts/prove_mobile_search_controls_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/searchScreenContract.test.ts`, `mobile/src/__tests__/searchEventService.test.ts`, and `mobile/src/__tests__/api.test.ts`.
- Focused backend tests: `src/__tests__/public.events.no-leak.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Search query and pagination | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&search=<query>&limit=10&cursor=<event-id>` | GET | Public/mobile route | Query params only | `events[]`, compact `markets[]`, `nextCursor`, `page.limit`, `page.nextCursor`, `page.hasMore` | Existing `Event`, public listed `Market`, active `Outcome` rows | Mock/offline mode keeps local fallback text filtering and cursor-shaped paging only when the backend route is unavailable. | Ranked/faceted discovery remains future scope. Unsupported local category chips and local sort buttons are not visible in the focused MVP Search surface. |

## Cycle KY - Account Menu Availability Wiring

Cycle KY wires visible Account More-menu rows to explicit backend availability metadata instead of leaving outside-MVP rows as tappable dead buttons:

- Account menu availability proof: `docs/mobile/harness/cycle-KY-account-menu-availability-wiring/cycle-KY-account-menu-availability-wiring.json`.
- Proof script: `scripts/prove_mobile_account_menu_availability_wiring.ts`.
- Focused mobile tests: `mobile/src/__tests__/profileSummaryService.test.ts` and `mobile/src/__tests__/api.test.ts`.
- Focused backend tests: `src/__tests__/profile.summary.route.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Account More-menu availability | `/api/profile/summary` | GET | Canonical actor with `account:read`; route id `account:summary` | None | `menuItems[].key`, `menuItems[].status=unavailable`, `menuItems[].reason=outside-mvp-scope`, `menuItems[].route=null` | No new table; static MVP availability metadata is returned alongside existing profile summary data | Mock/offline mode uses the same unavailable metadata fallback and renders non-actionable rows. | Real routes for leaderboard, rewards, API management, accuracy, status, documentation, help, and terms only if MVP scope expands. |

## Cycle KX - Route Wiring Tracker Consolidation

Cycle KX reconciles stale documentation rows after the KJ-KW UI wiring passes:

- Tracker proof: `docs/mobile/harness/cycle-KX-route-wiring-tracker-consolidation/cycle-KX-route-wiring-tracker-consolidation.json`.
- Proof script: `scripts/prove_mobile_route_wiring_tracker_consolidation.ts`.
- Scope: documentation/audit consistency only; no app route or schema changes.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tracker consistency for visible route-wired flows | Existing KJ-KW route set: `/api/events`, `/api/events/:slug/markets`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:id/quote`, `/api/orders`, `/api/orders/:id`, `/api/portfolio`, `/api/portfolio/history`, `/api/portfolio/value-history`, `/api/profile/summary`, `/api/account/balance`, `/api/profile/preferences` | GET/POST/PUT/DELETE as already documented by each closure cycle | Same as each existing route | Same as each existing route | Same as each existing route | Same existing tables already listed by the closure cycles | No runtime fallback changes. Cycle KX only removes stale tracker statements that contradicted later closure cycles. | Repeat tracker sweep after the next backend/UI wiring batch. |

## Cycle KW - Profile Preferences UI Sync Wiring

Cycle KW wires the visible Account/preference state to the already-proven profile preferences route in server mode:

- Profile preferences UI proof: `docs/mobile/harness/cycle-KW-profile-preferences-ui-sync-wiring/cycle-KW-profile-preferences-ui-sync-wiring.json`.
- Proof script: `scripts/prove_mobile_profile_preferences_ui_sync_wiring.ts`.
- Focused mobile tests: `mobile/src/__tests__/profilePreferencesService.test.ts`, `mobile/src/__tests__/api.test.ts`, and `mobile/src/__tests__/profileSummaryService.test.ts`.
- Focused backend tests: `src/__tests__/profile.preferences.route.test.ts` and `src/server/services/__tests__/profilePreferences.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible preference load | `/api/profile/preferences` | GET | Canonical actor with `account:read` | None | `preferences.locale`, `ticketDefaultAmount`, `ticketDefaultSide`, `ticketDefaultSlippage`, `savedEventIds[]` | Existing `UserProfilePreference.preferences` JSON | Mock/offline mode keeps AsyncStorage-local locale, saved markets, and ticket defaults. Server mode waits for local hydration, then applies successful route preferences to visible app state. | Broader account/security/session/funding settings remain outside focused MVP scope. |
| Visible preference save | `/api/profile/preferences` | PUT | Canonical actor with `account:write` | `locale`, `ticketDefaultAmount`, `ticketDefaultSide`, `ticketDefaultSlippage`, `savedEventIds[]` | Normalized saved preference response and visible sync status | Same existing preferences row | Server-mode route failure sets visible sync error; mock mode does not call the route. | Optional Android proof if visual proof becomes required again. |
| Account preference display | Same route through app state and `/api/profile/summary` fallback props | GET | Same account actor | None | Account language row, saved market count, ticket default row, and profile sync status | `UserProfilePreference`, plus summary route existing Account values | Non-server Account props remain local/demo by design. | None for focused visible preference fields. |

## Cycle KV - Home Filter UI Route Wiring

Cycle KV wires the visible Home filter chips to the already-proven backend status-filter event route in server market-data mode:

- Home filter UI proof: `docs/mobile/harness/cycle-KV-home-filter-ui-route-wiring/cycle-KV-home-filter-ui-route-wiring.json`.
- Proof script: `scripts/prove_mobile_home_filter_ui_route_wiring.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts`, `mobile/src/__tests__/homeEventFeedService.test.ts`, and `mobile/src/__tests__/homePaginationService.test.ts`.
- Focused backend tests: `src/__tests__/public.events.no-leak.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Home filtered event page | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&status=<home-filter>&limit=10` | GET | Public/mobile route | Query params only | `events[]`, compact `markets[]`, event `status`, `nextCursor`, `page.hasMore` | Existing `Event`, public listed `Market`, active `Outcome` rows | In mock/offline mode Home still filters local events by status. In server market-data mode backend filtered route pages drive the visible Home list. | Calendar-accurate `today` date-window semantics only if product later wants date-window filtering instead of status filtering. |
| Visible Home load more for selected filter | Same `/api/events` route with `cursor=<event-id>` | GET | Public/mobile route | Cursor query param | Next filtered route page, cursor metadata, loading state | Same existing tables and cursor ordering as Home route contracts | Failed server loads fall back only through the service route-unavailable path; successful server pages are not locally replaced. | Optional Android proof if visual proof becomes required again. |

## Cycle KS - Event Detail Line Options UI Wiring

Cycle KS wires the visible Event Detail/Game Lines line and period chips to the already-proven backend-backed line options service:

- Event Detail line-options UI proof: `docs/mobile/harness/cycle-KS-event-detail-line-options-ui-wiring/cycle-KS-event-detail-line-options-ui-wiring.json`.
- Proof script: `scripts/prove_mobile_event_detail_line_options_ui_wiring.ts`.
- Focused mobile tests: `mobile/src/__tests__/marketLineOptionsService.test.ts`, `mobile/src/__tests__/eventMarketCatalogService.test.ts`, and `mobile/src/__tests__/api.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Event Detail/Game Lines line chips | `/api/mobile/events/:slug/live-detail` and `/api/events/:slug/markets` through selected event `markets[]` | GET | Public/mobile routes; auth header tolerated but not required | Event slug path param | `markets[].marketType`, `markets[].period`, `markets[].line`, `markets[].outcomes[]`, selected market ids, outcome ids, and availability metadata | Existing `Event`, public listed `Market`, active `Outcome`, optional quote/read-model rows | Mock/offline mode uses whatever fixture markets are on the selected event. Server mode treats successful route/catalog `markets[]` as authoritative; missing backend lines do not create visible chips. | Optional Android proof if visual proof becomes required again; production real-provider breadth remains under provider lanes. |

## Cycle KR - Portfolio Cancel UI Wiring

Cycle KR proves the visible Portfolio cancel button is wired to the already-proven backend cancel route in server mode:

- Portfolio cancel UI proof: `docs/mobile/harness/cycle-KR-portfolio-cancel-ui-wiring/cycle-KR-portfolio-cancel-ui-wiring.json`.
- Proof script: `scripts/prove_mobile_portfolio_cancel_ui_wiring.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts` and `mobile/src/__tests__/openOrderService.test.ts`.
- Focused backend tests: `src/__tests__/orders.cancel.route.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Portfolio open-order cancel | `/api/orders/:id` | DELETE | Canonical actor with `orders:write`; route scopes order lookup to actor user id | Order id path param only | Cancel response, then refreshed `/api/portfolio` open orders and `/api/portfolio/history` canceled activity | `Order`, `ApiCredential`, `ApiOrderRequest`, `UserBalance`, `Position`, `Market`, `Outcome` | Mock mode keeps local cancel behavior. Server mode calls `cancelOpenOrderOnServer()` -> `PolyApi.cancelOrder()` and refreshes Portfolio from backend state. | Broader provider-family cancel breadth remains future hardening if gates require it. |

## Cycle KQ - Trade Ticket Submit UI Wiring

Cycle KQ proves the visible Trade Ticket submit control is wired to the already-proven backend order route in server mode:

- Trade Ticket submit UI proof: `docs/mobile/harness/cycle-KQ-trade-ticket-submit-ui-wiring/cycle-KQ-trade-ticket-submit-ui-wiring.json`.
- Proof script: `scripts/prove_mobile_trade_ticket_submit_ui_wiring.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts` and `mobile/src/__tests__/orderService.test.ts`.
- Focused backend tests: `src/__tests__/orders.internal-trading-gate.route.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Trade Ticket submit | `/api/orders` | POST | Canonical actor with `orders:write`; internal trading beta gate and provider tradability guard remain enforced server-side | `marketId`, `outcomeId`, `side`, `contractSide`, `price`, `size`, and normalized `selection` from the visible ticket | `order.id`, `order.status`, `order.size`, `order.remaining`, `fills[]`; Portfolio refresh then consumes `/api/portfolio` and `/api/portfolio/history` | `ApiCredential`, `ApiOrderRequest`, `Order`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `UserBalance`, Portfolio read models | Mock mode keeps local fake-token orders. Server mode calls `submitTicketOrder()` -> `PolyApi.placeLimitOrder()` -> `/api/orders`; route failure surfaces ticket error and does not create local fake server orders. | Broader provider-family submit breadth remains future hardening if gates require it. |

## Cycle KP - Portfolio Sync UI Wiring

Cycle KP proves the visible Portfolio screen consumes the already-proven backend Portfolio snapshot/history sync in server mode:

- Portfolio sync UI proof: `docs/mobile/harness/cycle-KP-portfolio-sync-ui-wiring/cycle-KP-portfolio-sync-ui-wiring.json`.
- Proof script: `scripts/prove_mobile_portfolio_sync_ui_wiring.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts`, `mobile/src/__tests__/portfolioSyncService.test.ts`, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, `mobile/src/__tests__/portfolioHistoryService.test.ts`, and `mobile/src/__tests__/portfolioStateApplyService.test.ts`.
- Focused backend tests: `src/__tests__/portfolio.open-orders.route.test.ts` and `src/__tests__/portfolio.history.route.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Portfolio sync | `/api/portfolio`, `/api/portfolio/history` | GET | Canonical actor with `account:read`; route ids covered by existing portfolio route contracts | None | Snapshot balance, positions, open orders, selection metadata, recent trades, canceled activities/history, and sync status | Existing `UserBalance`, `Position`, `Order`, `Trade`, `ApiOrderRequest`, `Market`, `Outcome` | In server mode route success drives visible `Portfolio` props. Partial route failure preserves the last known local half only for the failed route. Full route failure sets sync error instead of inventing mock rows. | Optional Android proof if visual proof becomes required again; broader provider lifecycle breadth remains under provider lanes. |
| Portfolio refresh after server mutations | Same `/api/portfolio` plus `/api/portfolio/history` routes | GET after server order submit, cancel, and position close/cashout | Same active mobile API key/session auth | None | Fresh route-backed visible positions/open orders/history after mutation | Same existing Portfolio and order lifecycle tables | Mock/offline order mode keeps existing local state path. Server mode refreshes from backend after successful mutation. | Filled/cancel breadth for more provider families remains future hardening. |

## Cycle KO - Trade Ticket Quote UI Wiring

Cycle KO proves the visible Trade Ticket quote refresh is wired to the already-proven backend quote route in server mode:

- Trade Ticket quote UI proof: `docs/mobile/harness/cycle-KO-trade-ticket-quote-ui-wiring/cycle-KO-trade-ticket-quote-ui-wiring.json`.
- Proof script: `scripts/prove_mobile_trade_ticket_quote_ui_wiring.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts` and `mobile/src/__tests__/quoteService.test.ts`.
- Focused backend tests: `src/__tests__/market.quote.route.test.ts` and `src/__tests__/orderbook-pricing.quote-size.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Trade Ticket quote refresh | `/api/markets/:id/quote?outcomeId=:outcomeId` | GET | Public/mobile route; auth header tolerated but not required | Market id path param, optional outcome id query param | `quotes[]`, selected `outcomeId`, `outcomeName`, `bestBid`, `bestAsk`, `bestBidSize`, `bestAskSize`, `midPrice`, `lastPrice` mapped into visible ticket odds/quote fields | Existing `Market`, active `Outcome`, orderbook depth/read-model rows, latest trade price when available | Server route failure keeps the current ticket state. Mock/offline mode keeps local ticket odds. Selected limit-price tickets do not overwrite the explicit staged limit price. | Optional Android proof if visual proof becomes required again; production provider quote breadth remains under provider lanes. |
| Visible Event Detail quote refresh | Same `/api/markets/:id/quote` route through `loadMarketQuotesById()` | GET | Public/mobile route | Market ids from selected event markets | Backend quote fields update visible market/outcome probabilities and bid/ask fields before ticket opening | Same existing market/outcome/orderbook read models | Server route failure leaves selected event markets unchanged instead of inventing quote rows. | Broader provider quote freshness remains under provider refresh lanes. |

## Cycle KN - Event Detail Catalog UI Wiring

Cycle KN wires visible Event Detail/Game Lines market rows to the backend market catalog route in server mode:

- Event Detail catalog UI proof: `docs/mobile/harness/cycle-KN-event-detail-catalog-ui-wiring/cycle-KN-event-detail-catalog-ui-wiring.json`.
- Proof script: `scripts/prove_mobile_event_detail_catalog_ui_wiring.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts`, `mobile/src/__tests__/eventMarketCatalogService.test.ts`, and `mobile/src/__tests__/marketLineOptionsService.test.ts`.
- Focused backend tests: `src/__tests__/public.event-markets.no-leak.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Event Detail/Game Lines catalog | `/api/events/:slug/markets` | GET | Public/mobile route; auth header tolerated but not required | Event slug path param | `markets[]`, `marketType`, `marketGroupKey`, `marketGroupTitle`, `period`, `line`, `outcomes[]`, outcome price/bid/ask/tradability, provider ids when present | Existing `Event`, public listed `Market`, active `Outcome`, optional quote/read-model rows | Route failure uses only caller-provided selected-event fallback markets. Successful route responses, including empty arrays, replace visible `selectedEvent.markets`. | Optional Android proof if visual proof becomes required again; production real-provider breadth remains under provider lanes. |

## Cycle KM - Event Detail UI Hydration Wiring

Cycle KM proves the visible Event Detail/Game page is wired to the compact backend event hydration path in server mode:

- Event Detail UI hydration proof: `docs/mobile/harness/cycle-KM-event-detail-ui-hydration-wiring/cycle-KM-event-detail-ui-hydration-wiring.json`.
- Proof script: `scripts/prove_mobile_event_detail_ui_hydration_wiring.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts` and `mobile/src/__tests__/worldCupAdapter.test.ts`.
- Focused backend tests: `src/__tests__/mobile-live-event-detail.test.ts` and `src/__tests__/mobile-event-market-rules-contract.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Event Detail hydration | `/api/mobile/events/:slug/live-detail` preferred, `/api/events/:slug` fallback | GET | Public/mobile route | Event slug path param | `event.marketProfile`, `event.resultMode`, `event.gameRules`, `event.supportedMarketTypes`, compact `markets[]`, market line/period/outcome metadata, status/time/team fields | Existing `Event`, public `Market`, active `Outcome`, optional quote/depth/chart read models | Mock/offline mode keeps the initially selected local event. Server mode swaps in compact route hydration only for the still-selected event id. | P1 optional Android proof if visual proof becomes required again. |

## Cycle KL - Account UI Summary Wiring

Cycle KL wires the visible Account screen to the already-proven profile summary route in server mode:

- Account UI summary proof: `docs/mobile/harness/cycle-KL-account-ui-summary-wiring/cycle-KL-account-ui-summary-wiring.json`.
- Proof script: `scripts/prove_mobile_account_ui_summary_wiring.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts` and `mobile/src/__tests__/profileSummaryService.test.ts`.
- Focused backend tests: `src/__tests__/profile.summary.route.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Account summary | `/api/profile/summary` | GET | Canonical actor with `account:read`; route id `account:summary` | None | `profile`, `preferences`, `account.walletTotalUSDC`, `portfolioValue`, open position/order counts, open order value, total exposure, trading mode, `menuItems[]` availability metadata | Existing `User`, `UserBalance`, `Position`, `Order`, `UserProfilePreference`; no table needed for static MVP menu availability | Mock/offline mode keeps existing local Account props and unavailable menu fallback. Server route failure clears stale summary state and shows Account sync error. | Broader account/security/session/funding settings remain outside this focused MVP route-wiring cycle. |

## Cycle KK - Live UI Route Wiring

Cycle KK wires the visible Live tab to the already-proven backend status-filter event route in server market-data mode:

- Live UI route-wiring proof: `docs/mobile/harness/cycle-KK-live-ui-route-wiring/cycle-KK-live-ui-route-wiring.json`.
- Proof script: `scripts/prove_mobile_live_ui_route_wiring.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts` and `mobile/src/__tests__/homeEventFeedService.test.ts`.
- Focused backend tests: `src/__tests__/public.events.no-leak.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Live tab event page | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&status=live&limit=10` | GET | Public/mobile route | Query params only | `events[]`, compact `markets[]`, event `status`, `nextCursor`, `page.hasMore` | Existing `Event`, public listed `Market`, active `Outcome` rows | In mock/offline mode Live still filters local events by `status === "live"`. In server market-data mode backend Live route pages drive the visible Live list. | Rich live sports-stat feeds remain outside this MVP route-wiring cycle. |
| Visible Live refresh | Same `/api/events` route with `status=live` | GET | Public/mobile route | Query params only | Fresh backend Live page and visible refresh state | Same existing tables and status filtering as Home route contracts | Server-mode route failure leaves visible Live rows empty instead of repopulating from local demo fallback. | Optional Android proof if visual proof becomes required again. |

## Cycle KJ - Search UI Route Wiring

Cycle KJ wires the visible Search tab to the already-proven backend Search route/service in server market-data mode:

- Search UI route-wiring proof: `docs/mobile/harness/cycle-KJ-search-ui-route-wiring/cycle-KJ-search-ui-route-wiring.json`.
- Proof script: `scripts/prove_mobile_search_ui_route_wiring.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts` and `mobile/src/__tests__/searchEventService.test.ts`.
- Focused backend tests: `src/__tests__/public.events.no-leak.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Search tab result page | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&search=<query>&limit=10` | GET | Public/mobile route | Query params only | `events[]`, compact `markets[]`, `nextCursor`, `page.nextCursor`, `page.hasMore` | Existing `Event`, public listed `Market`, active `Outcome` rows | In mock/offline mode Search still filters local events. In server market-data mode successful route pages drive the visible Search list. | P1: ranked/faceted discovery only if MVP Search scope expands. |
| Visible Search "load more" | Same `/api/events` route with `cursor=<event-id>` | GET | Public/mobile route | Cursor query param | Next route page, cursor metadata, loading state | Same existing tables and cursor ordering as Home/Search route contracts | Failed server loads do not invent backend events; local filtering remains non-server fallback. | Optional Android proof if visual proof becomes required again. |

## Cycle KI - Account Balance Route Contract

Cycle KI proves the visible account/cash balance route/service contract without editing dirty Account or Portfolio UI files:

- Account balance proof: `docs/mobile/harness/cycle-KI-account-balance-route-contract/cycle-KI-account-balance-route-contract.json`.
- Proof script: `scripts/prove_mobile_account_balance_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts`, `mobile/src/__tests__/accountBalanceService.test.ts`, and `mobile/src/__tests__/profileSummaryService.test.ts`.
- Focused backend tests: `src/server/services/__tests__/canonical_route_auth.phase5.test.ts` and `src/__tests__/wallet.balance.route.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible account/cash balance refresh | `/api/account/balance` | GET | Canonical actor with `account:read`; route id `account:balance` | None | `availableUSDC`, `lockedUSDC`, `totalUSDC`, `updatedAt` | Existing `UserBalance` via custody wallet service | `loadAccountBalance()` falls back only when the route/API client is unavailable or throws. Successful route responses suppress local balance fallback. | Cycle KT wires visible Portfolio and bottom-tab balance state to `loadAccountBalance()` in server mode. |
| Legacy wallet balance compatibility | `/api/wallet/balance` | GET | Legacy session user | None | Legacy `balance`, `availableUSDC`, `lockedUSDC`, `totalUSDC`, `updatedAt` | Existing `UserBalance` | Compatibility route only; not the canonical server-mode mobile contract. | Eventual cleanup after visible UI is fully canonical-route backed. |

## Cycle KT - Account Balance UI Wiring

Cycle KT wires visible Portfolio and bottom-tab balance state to the canonical account balance service:

- UI proof: `docs/mobile/harness/cycle-KT-account-balance-ui-wiring/cycle-KT-account-balance-ui-wiring.json`.
- Proof script: `scripts/prove_mobile_account_balance_ui_wiring.ts`.
- Reuses route proof: `docs/mobile/harness/cycle-KI-account-balance-route-contract/cycle-KI-account-balance-route-contract.json`.
- Focused mobile tests: `mobile/src/__tests__/accountBalanceService.test.ts`, `mobile/src/__tests__/api.test.ts`, and `mobile/src/__tests__/profileSummaryService.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio cash balance display | `/api/account/balance` | GET | Canonical actor with `account:read` | None | `availableUSDC` mapped to the shared `balance` state passed into `Portfolio` | Existing `UserBalance` via custody wallet service | Mock order mode keeps existing local balance state. In server mode failed route reads do not overwrite visible balance with fallback. | None for focused visible balance wiring. |
| Bottom tab portfolio value | `/api/account/balance` plus existing local positions already refreshed by `/api/portfolio` | GET | Same canonical actor | None | `availableUSDC` contributes to `accountPortfolioValue`, which is passed to `BottomTabs` | Existing `UserBalance`, plus existing Portfolio position rows | Same as above | Legacy `/api/wallet/balance` cleanup remains P1 after non-mobile web wallet compatibility review. |

## Cycle KH - Event Market Catalog Contract

Cycle KH proves the Event Detail/Game Lines market catalog route/service contract without editing dirty Event Detail UI files:

- Event market catalog proof: `docs/mobile/harness/cycle-KH-event-market-catalog-contract/cycle-KH-event-market-catalog-contract.json`.
- Proof script: `scripts/prove_mobile_event_market_catalog_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts`, `mobile/src/__tests__/eventMarketCatalogService.test.ts`, and `mobile/src/__tests__/marketLineOptionsService.test.ts`.
- Focused backend tests: `src/__tests__/public.event-markets.no-leak.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail/Game Lines market catalog | `/api/events/:slug/markets` | GET | Public/mobile route; auth header tolerated but not required | Event slug path param | `markets[]`, `marketType`, `marketGroupKey`, `marketGroupTitle`, `period`, `line`, `outcomes[]`, outcome price/bid/ask/tradability, provider ids when present | Existing `Event`, public listed `Market`, active `Outcome`, optional quote/read-model rows | `loadEventMarketCatalog()` falls back only to caller-provided local markets when route loading fails or no API is supplied. Successful route reads are authoritative, including empty market arrays. | Cycle KN wires this to visible Event Detail/Game Lines in server mode; optional Android proof if visual proof becomes required again. |
| Event Detail unsupported market filtering | Same `/api/events/:slug/markets` route | GET | Public route visibility filter | None | Only public/listed rows; private/unlisted rows must be absent | Existing `Market.visibility` and `Market.isListed` fields | No frontend fallback may re-add private/unlisted rows after a successful route read. | Optional Android proof that visible chips refresh from this route if visual proof becomes required again. |

## Cycle KG - Event Detail Hydration Contract

Cycle KG proves the Event Detail hydration route/client contract without editing dirty Event Detail UI files:

- Event Detail hydration proof: `docs/mobile/harness/cycle-KG-event-detail-hydration-contract/cycle-KG-event-detail-hydration-contract.json`.
- Proof script: `scripts/prove_mobile_event_detail_hydration_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts` and `mobile/src/__tests__/worldCupAdapter.test.ts`.
- Focused backend tests: `src/__tests__/mobile-live-event-detail.test.ts` and `src/__tests__/mobile-event-market-rules-contract.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail compact hydration | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug path param | `event.marketProfile`, `event.resultMode`, `event.gameRules`, `event.supportedMarketTypes`, event status/time/team fields, compact `markets[]`, market `marketType/period/line`, outcome `side/label/referenceTokenId`, availability/depth/chart fields when present | Existing `Event`, public LIVE `Market`, active `Outcome`, optional `MarketOutcomeSnapshot`, orderbook snapshot read model | `PolyApi.getEvent()` only falls back to `/api/events/:slug` if compact live-detail fails. Successful compact payload is preferred. | Cycle KM wires visible Event Detail hydration; production real-provider replay remains under provider lanes. |
| Event Detail legacy fallback | `/api/events/:slug` | GET | Public route | Event slug path param | Full legacy event/market read model when compact route fails | Same existing event/market/outcome rows | Fallback exists for compatibility, not as preferred server-mode data. | Production real-provider replay remains under provider mapping/provider refresh lanes. |

## Cycle KF - Ticket Quote Route Contract

Cycle KF proves the mobile ticket quote service route dependency without editing dirty Trade Ticket/Event Detail UI files:

- Ticket quote proof: `docs/mobile/harness/cycle-KF-ticket-quote-route-contract/cycle-KF-ticket-quote-route-contract.json`.
- Proof script: `scripts/prove_mobile_ticket_quote_route_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/quoteService.test.ts` and `mobile/src/__tests__/api.test.ts`.
- Focused backend tests: `src/__tests__/market.quote.route.test.ts` and `src/__tests__/orderbook-pricing.quote-size.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ticket quote load | `/api/markets/:id/quote?outcomeId=<outcome-id>` | GET | Public market visibility; optional session user for private visibility guard | None | `quotes[].outcomeId`, `outcomeName`, `bestBid`, `bestAsk`, `bestBidSize`, `bestAskSize`, `midPrice`, `lastPrice` | Existing `Market`, `Outcome`, `Order`, `Fill`, public orderbook snapshot read model | Existing local outcome probabilities remain only when quote loading is not wired or a market quote call fails. Successful quote data is mapped by `loadTicketQuotes()`. | P1: wire dirty visible Trade Ticket/Event Detail quote refresh behavior after screen churn is reconciled. |
| Multi-outcome market quote refresh | `/api/markets/:id/quote` | GET | Same market visibility | None | All active outcome quotes for the market | Same existing tables; no schema migration | `loadMarketQuotesById()` skips failed markets instead of inventing successful quote rows. | Production provider quote breadth remains in provider mapping/provider refresh lanes. |

## Cycle KE - Portfolio Sync Route Contract

Cycle KE proves the combined Portfolio server sync service without editing dirty Portfolio UI files:

- Portfolio sync proof: `docs/mobile/harness/cycle-KE-portfolio-sync-route-contract/cycle-KE-portfolio-sync-route-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_sync_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/portfolioSyncService.test.ts`, `mobile/src/__tests__/portfolioSnapshotService.test.ts`, and `mobile/src/__tests__/portfolioHistoryService.test.ts`.
- Focused backend tests: `src/__tests__/portfolio.open-orders.route.test.ts` and `src/__tests__/portfolio.history.route.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio server snapshot sync | `/api/portfolio` | GET | Canonical actor with `account:read`; legacy session fallback remains route compatibility only | None | `walletAvailableUSDC`, `positions[]`, `positions[].selection`, `positions[].bestBid/bestAsk`, `openOrders[]`, `openOrders[].selection`, order status/remaining/createdAt | Existing `UserBalance`, `Position`, `Order`, `Market`, `Outcome`, `ApiOrderRequest`, quote read model | `loadServerPortfolioState()` can still report partial sync if history fails. It does not invent server positions when the snapshot route succeeds. | P1: wire dirty Portfolio UI files to `loadServerPortfolioState()` in server mode. |
| Portfolio activity/history sync | `/api/portfolio/history` | GET | Same `account:read` actor | None | `history[]`, `canceledOrders[]`, `recentTrades[]`, selection metadata for canceled/recent activity rows | Existing `Trade`, `Order`, `LedgerEntry`, `Market`, `Outcome`, `ApiOrderRequest` | `loadServerPortfolioState()` can still report partial sync if snapshot fails. It does not replace successful history with local activity. | Optional Android proof if visual proof becomes required again. |

## Cycle KD - Home Event Filter Contract

Cycle KD adds a focused Home feed status-filter route contract. Cycle KK wires Live UI to it, and Cycle KV wires visible Home filter chips to it:

- Home filter proof: `docs/mobile/harness/cycle-KD-home-event-filter-contract/cycle-KD-home-event-filter-contract.json`.
- Proof script: `scripts/prove_mobile_home_event_filter_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/homeEventFeedService.test.ts` and `mobile/src/__tests__/api.test.ts`.
- Focused backend tests: `src/__tests__/public.events.no-leak.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home filtered event feed | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&status=<status>&limit=<n>&cursor=<event-id>` | GET | Public/mobile route | Query params only | `events[]`, `events[].status`, compact `events[].markets[]`, `nextCursor`, `page.limit`, `page.nextCursor`, `page.hasMore` | Existing `Event`, listed public `Market`, active `Outcome` rows | `loadHomeEventFeedPage()` falls back to local status filtering only when the API client is absent or the route throws. Server-mode visible Home wiring is covered by Cycle KV. | Calendar-accurate `today` date-window semantics only if product keeps a date-window tab. |
| Home all-events feed | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=<n>&cursor=<event-id>` | GET | Public/mobile route | Query params only; no `status` for all-events feed | Same event page and compact market fields | Same existing tables; no schema migration | Successful route data is not replaced by frontend-invented rows. | P1: add calendar/date-window route filtering only if the product keeps a true `today` tab. |

## Cycle KC - Profile Summary Contract

Cycle KC adds a focused Account/profile summary route and mobile mapper without editing dirty Account UI files:

- Profile summary proof: `docs/mobile/harness/cycle-KC-profile-summary-contract/cycle-KC-profile-summary-contract.json`.
- Proof script: `scripts/prove_mobile_profile_summary_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/profileSummaryService.test.ts` and `mobile/src/__tests__/api.test.ts`.
- Focused backend tests: `src/__tests__/profile.summary.route.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account/profile summary | `/api/profile/summary` | GET | Canonical actor with `account:read`; route id `account:summary` | None | `profile.id/username/displayName/email/image/hasCustomAvatar/isAdmin`; `preferences.locale/ticketDefaultAmount/ticketDefaultSide/ticketDefaultSlippage/savedEventIds`; `account.walletTotalUSDC/portfolioValue/openPositionCount/openOrderCount/openOrderValue/totalExposure/tradingMode`; `menuItems[]` | Existing `User`, `UserBalance`, `Position`, `Order`, `UserProfilePreference`; no table needed for static MVP menu availability | Mobile `loadProfileSummary()` has no mock preference over successful route data. Cycle KL wires summary props; Cycle KY wires menu availability. | Full account/security/session/funding settings remain outside this focused MVP summary route. |
| Account visible values mapper | Same `/api/profile/summary` route | GET | Same `account:read` actor | None | Numeric conversion for balance, portfolio value, order value, exposure; local side mapping `BUY/SELL` to `buy/sell`; saved market count from preferences | Same existing tables; no schema migration | Non-server Account state remains local/demo by design. | Full account/security/session/funding settings remain outside this focused MVP summary route. |

## Cycle KB - Search Event Service Contract

Cycle KB adds a mobile service-layer boundary for Search backend pages without editing dirty Search UI files:

- Search service proof: `docs/mobile/harness/cycle-KB-search-event-service-contract/cycle-KB-search-event-service-contract.json`.
- Proof script: `scripts/prove_mobile_search_event_service_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/searchEventService.test.ts` and `mobile/src/__tests__/api.test.ts`.
- Focused backend tests: `src/__tests__/public.events.no-leak.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search event service page load | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&search=<query>&limit=<n>&cursor=<event-id>` | GET | Public/mobile route | Query params only | `events[]`, compact `events[].markets[]`, `nextCursor`, `page.limit`, `page.nextCursor`, `page.hasMore` | Existing `Event`, listed public `Market`, active `Outcome` rows | `loadSearchEventPage()` falls back to local event/team/market/outcome text filtering only when the API client is absent or the route throws. Cycle KJ wires the visible Search tab to this service in server mode. | P1: ranked/faceted discovery if World Cup MVP Search scope expands. |
| Search compact market display data | Same `/api/events` route | GET | Public/mobile route | `includeMobileMarkets=1` | `markets[].title`, `markets[].marketType`, `markets[].period`, `markets[].line`, `outcomes[].name/label/price/bestBid/bestAsk/isTradable` | `Market`, `Outcome`, quote/read-model serialization | No frontend-only compact market rows are invented when route data is available. | P1: ranked/faceted discovery if World Cup MVP Search scope expands. |

## Cycle KA - Trade Ticket Submit Route Contract

Cycle KA proves the mobile Trade Ticket server-mode submit dependency through the real HTTP order route without editing dirty Trade Ticket/Event Detail UI files:

- Submit route proof: `docs/mobile/harness/cycle-KA-trade-ticket-submit-route-contract/cycle-KA-trade-ticket-submit-route-contract.json`.
- Proof script: `scripts/prove_mobile_trade_ticket_submit_route_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/orderService.test.ts` and `mobile/src/__tests__/api.test.ts`.
- Focused backend tests: `src/__tests__/orders.internal-trading-gate.route.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket server submit | `/api/orders` | POST | Canonical actor with `orders:write`; internal trading beta gate must pass before order submission | `marketId`, `outcomeId`, `side`, `type=LIMIT`, `price`, `size`, `contractSide`, `clientOrderId`, `selection`; `Idempotency-Key` header | `order.id`, `order.status`, `order.size`, `order.remaining`, `fills[]`; mobile result preserves selection and status | `ApiCredential`, `ApiOrderRequest`, `Order`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `UserBalance` | Mock mode still creates local fake-token orders. Server mode must call the route through `PolyApi.placeLimitOrder()`. Cycle KQ proves visible Trade Ticket submit uses this route. | P1: broader provider-family submit breadth if future gates require it. |
| Portfolio open order after submit | `/api/portfolio` | GET | Canonical actor with `account:read` | None | `openOrders[]` including `selection` market/outcome/line/period/provider token fields | `Order`, `Market`, `Outcome`, `ApiOrderRequest` selection snapshot | Local UI fallback must not replace server-mode open order hydration. | P1: broader provider-family submit breadth if future gates require it. |

## Cycle JZ - Open Order Cancel Route Contract

Cycle JZ proves the visible Portfolio open-order cancel dependency without editing dirty Portfolio UI files:

- Cancel route proof: `docs/mobile/harness/cycle-JZ-open-order-cancel-route-contract/cycle-JZ-open-order-cancel-route-contract.json`.
- Proof script: `scripts/prove_mobile_open_order_cancel_route_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/openOrderService.test.ts`.
- Focused backend tests: `src/__tests__/orders.cancel.route.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio open-order cancel | `/api/orders/:id` | DELETE | Canonical actor with `orders:write`; route scopes order lookup to actor user id | Order id path param only | `order.id`, `order.status=CANCELED`, `type`, `clientOrderId`, `apiKeyId`, `canceledByApiKeyId`, `balance`, `position` | `Order`, `Market`, `ApiCredential`, `ApiOrderRequest`, `UserBalance`, `Position` | Mock mode does not call backend cancel. Server mode must call the route. Cycle KR proves the visible Portfolio cancel control uses this route. | P1: broader family breadth if future provider gates require it. |
| Portfolio refresh after cancel | `/api/portfolio` and `/api/portfolio/history` | GET | Canonical actor with `account:read` | None | Open orders after cancel; `canceledOrders[]` with `selection` identity; mobile activity mapping preserves market/outcome/line/period/provider token fields | `Order`, `Market`, `Outcome`, `ApiOrderRequest` selection snapshots | Local canceled activity helper can update optimistic UI but does not replace server refresh proof. | P1: broader family breadth if future provider gates require it. |

## Cycle JY - Portfolio Value History Service Contract

Cycle JY adds a focused mobile service-layer loader for the backend Portfolio value-history route without editing dirty Portfolio UI files:

- Value-history service proof: `docs/mobile/harness/cycle-JY-portfolio-value-history-service-contract/cycle-JY-portfolio-value-history-service-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_value_history_service_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/portfolioValueHistoryService.test.ts`.
- Focused backend tests: `src/__tests__/portfolio.value-history.route.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio value history service load | `/api/portfolio/value-history?range=1D|1W|1M|All` | GET | Session user or canonical API key with `account:read` | Query params only | `range`, `ranges`, `source`, `status`, `generatedAt`, `lastUpdated`, `emptyState`, `points[].timestamp/value/cash/positionsValue/pnl` | Existing `UserBalance`, `Position`, `MarketOutcomeSnapshot` route inputs | `loadPortfolioValueHistory()` uses deterministic backend-shaped data only when the API client is absent or route loading fails. It preserves the route payload when available. | Cycle KU wires visible Portfolio chart to this service in server mode. |

## Cycle KU - Portfolio Value History UI Wiring

Cycle KU wires the visible Portfolio performance chart to the value-history service in server mode:

- UI proof: `docs/mobile/harness/cycle-KU-portfolio-value-history-ui-wiring/cycle-KU-portfolio-value-history-ui-wiring.json`.
- Proof script: `scripts/prove_mobile_portfolio_value_history_ui_wiring.ts`.
- Reuses service proof: `docs/mobile/harness/cycle-JY-portfolio-value-history-service-contract/cycle-JY-portfolio-value-history-service-contract.json`.
- Focused tests: `mobile/src/__tests__/portfolioValueHistoryService.test.ts`, `mobile/src/__tests__/api.test.ts`, and `src/__tests__/portfolio.value-history.route.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio performance chart | `/api/portfolio/value-history?range=<range>` | GET | Session user or canonical API key with `account:read` | Query param `range` | `source`, `status`, `range`, `points[]`, timestamps, empty state | Existing `UserBalance`, `Position`, `MarketOutcomeSnapshot` route inputs | Mock mode uses deterministic backend-shaped fallback. Server mode uses `loadPortfolioValueHistory()` and falls back only when route loading fails. | Persisted account-level value snapshots remain future hardening; current route reconstructs from wallet, positions, and market snapshots. |
| Portfolio range selector | Same route with `range=1D|1W|1M|All` | GET | Same actor | Query param `range` | Route result for the active range; visible proof markers include `portfolio-chart-source-*`, `portfolio-chart-status-*`, and point count | Same as above | Same as above | Optional Android proof if visual/device proof becomes required again. |

## Cycle JX - Line Options Contract

Cycle JX adds a focused mobile service contract for backend-backed line/period availability:

- Line options proof: `docs/mobile/harness/cycle-JX-line-options-contract/cycle-JX-line-options-contract.json`.
- Proof script: `scripts/prove_mobile_line_options_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/marketLineOptionsService.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Game Lines line/period options | `/api/mobile/events/:slug/live-detail` and compact `events[].markets[]` | GET | Public/mobile route | Event slug or list query | `markets[].marketType`, `markets[].period`, `markets[].line`, `markets[].outcomes[]` | Existing `Market.marketType`, `Market.period`, `Market.line`, active `Outcome` rows | Service returns empty options when backend lacks a line/period. It does not invent choices. | Cycle KS wires visible Event Detail/Game Lines chips to the service; optional Android proof remains only if visual proof becomes required again. |
| Provider market type aliases | Same market payloads | GET | Public/mobile route | Event slug or list query | `marketType=total_goals/team_total_goals` mapped to totals/team-total families | Existing provider-ingested market rows | Alias handling only maps provided backend rows; it does not create rows. | P1: broader provider-backed family coverage when available. |

## Cycle JW - Portfolio Activity Mapper Contract

Cycle JW tightens the mobile service-layer route contract for visible Portfolio positions and history without redesigning Portfolio:

- Mapper proof: `docs/mobile/harness/cycle-JW-portfolio-activity-mapper-contract/cycle-JW-portfolio-activity-mapper-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_activity_mapper_contract.ts`.
- Focused mobile tests: `mobile/src/__tests__/portfolioHistoryService.test.ts` and `mobile/src/__tests__/portfolioSnapshotService.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio positions | `/api/portfolio` | GET | Session user or canonical API key with `account:read` | None | `positions[].selection.marketType=to_advance`, market/outcome ids, display label, period, side, provider source, external market id, condition id, reference token id, reference outcome label | `Position`, `Market`, `Outcome`, `ApiOrderRequest` selection snapshots | If backend selection is absent, legacy title/outcome fallback remains but is not accepted as JW proof. | P1: UI-level proof once dirty Portfolio screen churn is reconciled. |
| Portfolio recent activity/history | `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `recentTrades[].orderId`, `selection`, market/outcome ids, cost, shares, createdAt; grouped into one row with `fillCount` when fills share an order or execution window | `Trade`, `Order`, `Market`, `Outcome`, order request selection snapshots | Recent trades without order ids can still group by equivalent selection fields and execution window. | P1: broader real-provider lifecycle repetition across more market families. |

## Cycle JV - Mobile API Route Contract Backfill

Cycle JV consolidates mobile client/type definitions required by already-gated backend routes without touching dirty UI files:

- Route/client proof: `docs/mobile/harness/cycle-JV-mobile-api-route-contract-backfill/cycle-JV-mobile-api-route-contract-backfill.json`.
- Proof script: `scripts/prove_mobile_api_route_contract_backfill.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts`.
- Focused backend regression tests: `src/__tests__/public.events.no-leak.test.ts` and `src/__tests__/portfolio.value-history.route.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Search event pages | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=<n>&cursor=<event-id>&search=<query>` | GET | Public/mobile route | Query params only | `events[]`, `nextCursor`, `page.limit`, `page.nextCursor`, `page.hasMore`, compact `events[].markets[]` | Existing `Event`, `Market`, `Outcome` | Cycle KJ wires visible Search pagination, and Cycle KV wires visible Home filters plus active-filter pagination to backend pages in server mode. | Calendar/date-window filtering only if product later changes the `Today` chip semantics. |
| Event rule fields on summaries | Same `/api/events` route and event detail routes | GET | Public/mobile route | Query params or event slug | `marketProfile`, `resultMode`, `gameRules`, `supportedMarketTypes` | Existing `Event`, `Market`, `Outcome` | Mobile fallback derivation remains only a fallback when backend fields are absent. | P1: broader real-provider replay for more event profiles. |
| Portfolio value history client | `/api/portfolio/value-history?range=1D|1W|1M|All` | GET | Session user or canonical API key with `account:read` | Query params only | `range`, `ranges`, `source`, `status`, `generatedAt`, `lastUpdated`, `emptyState`, `points[]` | `UserBalance`, `Position`, `MarketOutcomeSnapshot` | Standalone/mock mode still uses deterministic fallback; server mode passes a service-backed loader to Portfolio. | Cycle KU closes visible Portfolio chart server-mode loader wiring. |

## Cycle JU - Profile Preferences Route Contract

Cycle JU proves the backend/mobile payload contract for the visible account/settings preference fields. Cycle KW wires the focused visible preference UI state to this route in server mode:

- Route/payload proof: `docs/mobile/harness/cycle-JU-profile-preferences-route-contract/cycle-JU-profile-preferences-route-contract.json`.
- Proof script: `scripts/prove_mobile_profile_preferences_contract.ts`.
- Focused backend tests: `src/__tests__/profile.preferences.route.test.ts` and `src/server/services/__tests__/profilePreferences.test.ts`.
- Focused mobile tests: `mobile/src/__tests__/profilePreferencesService.test.ts` and selected `mobile/src/__tests__/api.test.ts` cases.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account/settings preference load | `/api/profile/preferences` | GET | Canonical actor with `account:read` | None | `preferences.locale`, `ticketDefaultAmount`, `ticketDefaultSide`, `ticketDefaultSlippage`, `savedEventIds` | `UserProfilePreference.preferences` JSON payload keyed by user | Local app preferences remain the non-server-mode fallback. | P1: full account/settings shell contract for profile identity, auth/session, notifications, wallet controls, and security settings. |
| Account/settings preference save | `/api/profile/preferences` | PUT | Canonical actor with `account:write` | Canonical `ProfilePreferences` payload | Saved canonical preferences, mapped back to local mobile side/slippage/default amount state | `UserProfilePreference` upsert via existing service | Mobile mapper defaults legacy missing slippage to `1%`; invalid canonical payloads are rejected before storage. Server-mode visible UI sync is covered by Cycle KW. | Broader account/settings shell only if visible MVP scope expands. |

## Cycle JT - Search Event Route Contract

Cycle JT tightens backend search for the visible mobile Search tab without touching currently dirty mobile UI files:

- Route proof: `docs/mobile/harness/cycle-JT-search-event-route-contract/cycle-JT-search-event-route-contract.json`.
- Proof script: `scripts/prove_mobile_search_event_route_contract.ts`.
- Focused route tests: `src/__tests__/public.events.no-leak.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search result route data | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&search=<query>&limit=<n>&cursor=<event-id>` | GET | Public/mobile route | Query params only | `events[]`, compact `events[].markets[]`, `nextCursor`, `page.limit`, `page.nextCursor`, `page.hasMore` | Existing `Event`, listed public `Market`, active `Outcome` rows | Cycle KJ wires the visible Search tab to backend result pages in server mode. Local filtering remains non-server/route-unavailable fallback only. | P1: ranked/faceted search and localized aliases for production-scale discovery. |
| Backend search matching | Same `/api/events` route | GET | Public/mobile route | Search query | Query matches event title/description, home/away team names, listed public market title/description, and outcome `name`/`label` | `Event.homeTeamName`, `Event.awayTeamName`, `Market.title`, `Market.description`, `Outcome.name`, `Outcome.label` | No frontend-only result invention in the route proof. | P1: ranked/faceted search and localized aliases for production-scale discovery. |

## Cycle JS - Cashout Route Sell Safety

Cycle JS hardens and proves the server-mode cashout/sell route contract for the visible Portfolio cashout flow:

- Route/service proof: `docs/mobile/harness/cycle-JS-cashout-route-sell-safety/cycle-JS-cashout-route-sell-safety.json`.
- Proof script: `scripts/prove_mobile_cashout_route_sell_safety.ts`.
- Focused backend tests: `src/server/services/__tests__/canonical_order_submission.phase5.test.ts`.
- Focused mobile tests: `mobile/src/__tests__/positionCloseService.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio full-position cashout / sell | Canonical order submission backing `/api/orders` | POST | Existing canonical API key/session order auth; proof uses the route service directly to avoid external auth harness noise | `marketId`, `outcomeId`, `side=SELL`, `type=LIMIT`, finite full-position `size`, and current close `price` | Success: `order.id/status/side/size/remaining`, `position.shares/reservedShares`. Failure: `error.code=INSUFFICIENT_BALANCE`, clear insufficient-share message, `responseStatus=409` stored on `ApiOrderRequest` | Existing `Position`, `Order`, `ApiOrderRequest`, `Market`, `Outcome`, `UserBalance`; valid proof shares come from complete-set minting so collateral invariants remain intact | Server mode does not fall back to mock cashout. Mobile blocks zero, missing, and non-finite shares before submit. | P1: optional full external HTTP auth-stack smoke for `POST /api/orders`; canonical route submission and stored response shape are proven. |

## Cycle JR - Home Event List and Pagination

Cycle JR wires the visible Home event list "Load more" flow to backend cursor pagination in server market-data mode:

- Route proof: `docs/mobile/harness/cycle-JR-home-event-list-pagination/cycle-JR-home-event-pagination.json`.
- Proof script: `scripts/prove_mobile_home_event_pagination.ts`.
- Focused route tests: selected cases in `src/__tests__/public.events.no-leak.test.ts`.
- Focused mobile tests: `mobile/src/__tests__/api.test.ts` and `mobile/src/__tests__/homePaginationService.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home event list initial page | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public/mobile route | Query params only | `events[]` with compact `markets[]`, plus `nextCursor` and `page.hasMore` | Existing `Event`, `Market`, `Outcome` rows; listed public markets only | In mock market-data mode Home still uses local fixture pagination. In server mode the initial Home list comes from the backend page, and Cycle KV wires visible Home filter chips to the route. | P1: calendar/date-window filtering only if product changes the `Today` chip semantics. |
| Home "Load more" | `/api/events?...&limit=10&cursor=<event-id>` | GET | Public/mobile route | Query params only | Next `events[]` page, `nextCursor`, `page.limit`, `page.hasMore` | Cursor resolves against `Event.id` and stable route ordering by `updatedAt`, `createdAt`, `id` descending | Failed next-page loads do not replace loaded server events with local mocks. | P1: Android device proof for pressing Load more in server mode if visual regression evidence becomes required again. |

## Cycle JQ - Backend-Driven Event Rules and Sell Safety

Cycle JQ tightens backend-owned market-rule contracts for visible Event Detail/Game Lines UI and verifies sell/cashout safety:

- Route proof: `docs/mobile/harness/cycle-JQ-backend-event-market-cashout-safety/cycle-JQ-market-rule-profiles.json`.
- Focused backend tests: `src/__tests__/mobile-event-market-rules-contract.test.ts` and selected sell-safety cases in `src/server/services/__tests__/phase7_kalshi_model.test.ts`.
- Focused mobile tests: `mobile/src/__tests__/worldCupAdapter.test.ts` and `mobile/src/__tests__/positionCloseService.test.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail/Game Lines market-rule rendering | `/api/mobile/events/:slug/live-detail` and event summary serialization | GET | Public/mobile route | Event slug | `event.marketProfile`, `event.resultMode`, `event.gameRules.allowDraw`, `event.gameRules.includesOvertime`, `event.supportedMarketTypes`, plus backend markets/outcomes/period/line/type | Existing `Event`, `Market`, and `Outcome` fields: `sportKey`, `leagueKey`, `eventType`, `description`, `marketType`, `marketGroupKey`, `marketGroupTitle`, `period`, `line`, outcomes with `side/label/name` | Mobile preserves backend-provided rule fields first. Local derivation is fallback only and now uses the same explicit `to_advance`/`to_qualify` key detection instead of guessing from event/team names. | P1: production real-provider replay across more World Cup event profiles. No new schema migration required for this cycle. |
| Regulation draw versus knockout advance profile | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | Regulation profile returns `marketProfile=regulation_90`, `resultMode=can_draw`, `supportedMarketTypes` containing `regulation_90`, `spread`, `totals`. Knockout profile returns `marketProfile=full_match_with_overtime`, `resultMode=can_draw`, and supports both separate `to_advance` and `regulation_90`. | Same existing event/market/outcome tables | No frontend-invented market rows are accepted by the proof. Backend availability determines which market groups are present. | P1: broader provider-backed family availability beyond disposable contract proof rows. |
| Cashout/sell safety | Canonical order submission backing `POST /api/orders`; mobile `closePositionOnServer()` submits a full-position `SELL` | POST | Existing canonical API key/session order auth | `marketId`, `outcomeId`, `side=SELL`, `type=LIMIT`, full `size` from position shares, price from current/best price, `selection` identity | Backend rejects no-position and oversell attempts; mobile blocks no-share and oversize sell attempts before submit. Valid sell within available position can proceed. | Existing `Position`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | No mock fallback may permit server-mode naked sells. Local fake-token UI remains test-only and must keep the same safety checks. | P1: full HTTP route proof under production-like auth flags; current focused proof exercises canonical backend service and mobile service guards. |

## Cycle ET - Period-Safe Retail Line Matching

Cycle ET changes mobile route-data selection rules, not backend schema/routes:

- Android proof: `docs/mobile/harness/cycle-ET-local-mvp-period-safe-line-family/cycle-ES-local-mvp-line-family-breadth-proof.json`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed retail line ticket matching | Existing `/api/mobile/events/:slug/live-detail` data when in server mode; local proof uses fixture fallback | GET | Public/mobile route | Event slug | Mobile requires each backend line market to expose `marketType`, `line`, `period`, outcomes, provider ids/tokens, and availability so the selected retail ticket can match family + line + period | Existing `Market.period`, `Market.line`, `Market.marketType`, `Outcome.referenceTokenId`, provider snapshot tables | If backend family/line/period does not match, mobile falls back to deterministic contract-shaped fixture instead of using wrong route data | P1: route proof with real provider-backed spread/totals/team-total rows through the simple ticket path. |

## Cycle ES - Local MVP Line-Family Ticket Breadth

Cycle ES changes mobile contract-shaped fallback coverage and Android proof, not backend schema/routes:

- Android proof: `docs/mobile/harness/cycle-ES-local-mvp-line-family-breadth/cycle-ES-local-mvp-line-family-breadth-proof.json`.
- Visible Book/orderbook controls remain hidden by default and debug/internal via `EXPO_PUBLIC_SHOW_ORDERBOOK=1`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Default Local MVP Totals and Team Total tickets | No new endpoint; proof exercises existing mobile fake-token ticket state and line-ticket resolver | N/A for ES proof | N/A for ES proof | N/A until submit; ticket opens with selected market family/type, line, period, display label, and contract side | Mobile consumes line-family ticket fields for `totals` and `team-total`, including `ticket-line`, `ticket-period`, `ticket-display-label`, and outcome identity | Future backend route should provide provider-backed `Market`/`Outcome` rows for spread/totals/team-total with `marketType`, `line`, `period`, provider ids/tokens, availability, and price fields | Deterministic Team Total fallback is contract-shaped and used only when backend team-total line market is absent | P1: replace deterministic Team Total fallback with real Polymarket-backed route data where available, or explicit unavailable/stale route status where Polymarket does not expose that market. |

## Cycle ER - Local MVP Retail Status Flow

Cycle ER changes proof coverage, not backend schema/routes:

- Android proof: `docs/mobile/harness/cycle-ER-local-mvp-status-flow/cycle-ER-local-mvp-status-flow-proof.json`.
- Visible Book/orderbook controls remain hidden by default and debug/internal via `EXPO_PUBLIC_SHOW_ORDERBOOK=1`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Default local MVP retail status surface | No new endpoint; proof exercises existing mobile event-detail fallback/status state | N/A for ER proof | N/A for ER proof | N/A | Mobile renders chart route status, ticket handoff provider lifecycle, selected line identity, and hidden orderbook state markers | Future provider-backed route should continue using `Event.liveDataStatus`, `Market.availability`, chart history status/source, and selected market/outcome identity fields | Deterministic line/status fixture is accepted only for local UI proof | P1: route-backed loading/stale/unavailable status breadth for provider-backed retail tickets, without requiring users to open Book. |

## Cycle EQ - Local MVP Sell Flow

Cycle EQ changes mobile ticket identity and proof coverage, not backend schema/routes:

- Android proof: `docs/mobile/harness/cycle-EQ-local-mvp-sell-flow/cycle-EQ-local-mvp-trade-flow-proof.json`.
- Visible Book/orderbook controls remain hidden by default and debug/internal via `EXPO_PUBLIC_SHOW_ORDERBOOK=1`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Default local MVP simple Sell ticket | No new endpoint; fixture proof exercises existing mobile fake-token trading state and selected-ticket/portfolio mappers | N/A for EQ proof | N/A for EQ proof | Ticket submit uses existing fake-token order shape with selected spread line identity, `side=sell`, and `contractSide=no` | Mobile consumes the same selection envelope in ticket, latest order, activity, and position rows: market family/type, line, period, side, contract side, display label, order status, and fake-token activity text | Future backend route remains existing `Event`, `Market`, `Outcome`, `Order`, `Position`, `Trade`, and selection snapshot fields; no new schema | Deterministic line fixture is accepted only for local UI proof and is shaped like backend selection data, not arbitrary display-only strings | P1: repeat Buy/Sell simple-ticket flow with real provider-backed spreads, totals, and team totals. Production backend order route should preserve the same `side` plus `contractSide` envelope into portfolio/history. |

## Cycle EP - Local MVP Trade Flow Steering

Cycle EP changes the default mobile surface, not backend schema/routes:

- Android proof: `docs/mobile/harness/cycle-EP-local-mvp-trade-flow/cycle-EP-local-mvp-trade-flow-proof.json`.
- Visible Book/orderbook controls are hidden by default and remain debug/internal via `EXPO_PUBLIC_SHOW_ORDERBOOK=1`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Default local MVP event detail and simple ticket | No new endpoint; fixture proof exercises existing mobile mock trading state and existing selected-ticket/portfolio mappers | N/A for EP proof | N/A for EP proof | Ticket submit uses existing mobile fake-token order shape with selected `marketId`/`outcomeId` where available, market family/type, line, period, side, contract side, probability/price, and display label | Mobile consumes the same selection envelope in ticket, latest order, activity, and position rows | Future backend route remains existing `Event`, `Market`, `Outcome`, `Order`, `Position`, `Trade`, and selection snapshot fields; no new schema | Deterministic line fixture is accepted only for UI proof and is shaped like backend selection data, not arbitrary display-only strings | P1: repeat the same simple-ticket flow with real provider-backed spread/totals/team-total routes and Sell-side order/portfolio history. Loading/stale/unavailable states should stay visible in the retail flow without forcing Book. |

## Cycle EO-A - Route-Backed Lifecycle Breadth

Cycle EO-A extends backend/provider route proof beyond the prior selected ask/Buy lifecycle:

- Backend proof: `docs/mobile/harness/cycle-EO-A-route-breadth/proof.json`.
- Proof script: `scripts/prove_mobile_eo_a_route_breadth.ts`.

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Totals provider-depth Sell selection source | `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book?maxLevels=24` | GET / GET | Public/mobile routes | Event slug and selected market id | Live-detail `markets[].selection`, `markets[].outcomes[]`, `markets[].orderbookDepth[]`, `orderbookIdentity`, `providerLifecycle`, and Book `marketIdentity`, `availability`, `levels[]` preserve totals family/type/group, `2H`, line `3.5`, selected outcome token, provider source, and bid ladder price/share identity | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, `MarketOutcomeSnapshot` | No frontend-only fixture is accepted by the proof; disposable provider rows are backend-shaped Polymarket/Gamma/CLOB data | Production replay on a real live Polymarket event remains future coverage. |
| Bid-side Sell limit order creation | Canonical order service backing `POST /api/orders` | POST | Canonical API key/idempotency flow in production; EO-A uses the route-backed service entry to avoid local trading-beta env flags | `marketId`, `outcomeId`, `side=SELL`, `type=LIMIT`, bid-row `price`, `size`, `contractSide=YES`, and `selection` born from Book provider depth, including `limitPrice`, `limitSide=bid`, and `limitShares` | Order response echoes `order.side=SELL` and `order.selection` with selected totals/provider/bid identity intact | `ApiOrderRequest`, `Order`, `Market`, `Outcome`; sell leg also uses existing share collateral/position state | None. Limit fields are sanitized into existing request JSON. | First-class immutable order/fill/trade/position selection columns remain future hardening. |
| Bid-side Sell portfolio/history lifecycle | `/api/portfolio` and `/api/portfolio/history` | GET / GET | Session user or canonical API key with `account:read` | None | `openOrders[].selection`, `positions[].selection`, `canceledOrders[].selection`, and `recentTrades[].selection` preserve totals market/outcome/type/group/line/period/side/contract side/provider ids/tokens plus `limitPrice`, `limitSide=bid`, and `limitShares`; open/canceled/recent activity preserve `side=SELL` | `Order`, `ApiOrderRequest`, `Position`, `Trade`, `Market`, `Outcome` with the guarded request snapshot bridge | None in backend proof. Mobile fixtures are not used for EO-A identity. | Same-market/outcome multi-selection history still depends on the latest matching request snapshot until durable trade/position snapshots are approved. |

Cycle EO-A implementation notes:

- The proof starts from both route origins required by mobile, `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book`, then uses the Book route bid level as the staged limit source.
- Focused route tests assert `/api/portfolio` and `/api/portfolio/history` preserve bid-side Sell totals snapshots with provider token identity.
- `OPTIC_ODDS_API_KEY` remains optional/unconfigured and non-blocking; the proven path uses Polymarket-first quote and CLOB depth rows.

## Cycle EN Integrated - Route-Backed Provider-Depth Limit Lifecycle

Cycle EN integrated pairs backend/provider route proof with visible Android proof:

- Backend proof: `docs/mobile/harness/cycle-EN-A-route-limit-lifecycle/proof.json`.
- Integrated Android proof: `docs/mobile/harness/cycle-EN-integrated-route-limit-lifecycle/cycle-EN-B-visible-route-limit-lifecycle-proof.json`.

Backend/data dependency notes:

- Mobile consumes `/api/mobile/events/:slug/live-detail`, `/api/orderbook/:marketId/book`, `/api/markets/:marketId/quote`, and `/api/markets/:marketId/chart` from backend `http://127.0.0.1:3002` in server market-data mode.
- The integrated Android proof uses mock trading mode for submit/cancel, but the selected market/depth identity is route-backed from provider-depth rows and not arbitrary local UI-only data.
- Backend EN-A separately proves the selected provider-depth Book limit identity through the canonical order service contract, `/api/portfolio`, and `/api/portfolio/history` mapping.
- Production hardening still needs HTTP `POST /api/orders` route proof under the trading-beta environment, broader market-family/bid-side route-backed Android proof, and first-class immutable order/fill/trade/position selection snapshots.

## Cycle EN-A - Route-Backed Provider-Depth Limit Lifecycle

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-depth Book selection source | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | `markets[].selection`, `markets[].outcomes[]`, `markets[].orderbookDepth[]`, `markets[].orderbookIdentity`, `markets[].providerLifecycle`, and `markets[].providerOrderbookDepth` provide the selected `marketId`, `outcomeId`, market group/type, line, period, side, provider source, external market/condition ids, token ids, and tapped Book ask/bid price/share level | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, `MarketOutcomeSnapshot` | No frontend-only fixture is accepted by the proof; disposable provider rows are backend-shaped Polymarket/Gamma/CLOB data | Production replay on a real live Polymarket event remains future coverage. |
| Book-staged limit order creation | Canonical order service backing `POST /api/orders` | POST | Canonical API key/idempotency flow in production; EN-A uses the route-backed service entry to avoid local trading-beta env flags | `marketId`, `outcomeId`, `side`, `type`, `price`, `size`, `contractSide`, and `selection` born from live-detail provider depth, including `limitPrice`, `limitSide`, and `limitShares` | Order response echoes `order.selection` and `order.contractSide` with selected provider and limit identity intact | `ApiOrderRequest`, `Order`, `Market`, `Outcome` | None. Limit fields are sanitized into existing request JSON. | First-class immutable order/fill/trade/position selection columns remain future hardening. |
| Route-backed limit portfolio/history lifecycle | `/api/portfolio` and `/api/portfolio/history` | GET / GET | Session user or canonical API key with `account:read` | None | `openOrders[].selection`, `positions[].selection`, `canceledOrders[].selection`, and `recentTrades[].selection` preserve selected market/outcome/type/group/line/period/side/contract side/provider ids/tokens plus `limitPrice`, `limitSide`, and `limitShares` | `Order`, `ApiOrderRequest`, `Position`, `Trade`, `Market`, `Outcome` with the guarded request snapshot bridge | None in backend proof. Mobile fixtures are not used for EN-A identity. | Same-market/outcome multi-selection history still depends on the latest matching request snapshot until durable trade/position snapshots are approved. |

Cycle EN-A implementation notes:

- Proof script: `scripts/prove_mobile_en_a_route_limit_lifecycle.ts`.
- Proof artifact: `docs/mobile/harness/cycle-EN-A-route-limit-lifecycle/proof.json`.
- The proof starts from `/api/mobile/events/:slug/live-detail` provider orderbook depth, selects an ask ladder level, and derives the order `selection` from that route payload before open/cancel/fill lifecycle assertions.
- Focused route tests now assert `/api/portfolio` and `/api/portfolio/history` preserve `limitPrice`, `limitSide`, and `limitShares` with provider token identity after current market metadata drift.
- `OPTIC_ODDS_API_KEY` remains optional/unconfigured and non-blocking; the proven path uses existing Polymarket-first quote, CLOB depth, and CLOB chart rows.

## Cycle EM Integrated - Book-Staged Limit Lifecycle Proof Pairing

Cycle EM integrated pairs two evidence types:

- Service/backend contract proof: `docs/mobile/harness/cycle-EM-A-limit-lifecycle/proof.json`.
- Android-visible lifecycle proof: `docs/mobile/harness/cycle-EM-integrated-limit-lifecycle/cycle-EM-B-visible-limit-lifecycle-proof.json`.

Backend/data dependency notes:

- The selected staged limit fields use the existing `/api/orders`, `/api/portfolio`, and `/api/portfolio/history` selection envelopes documented in Cycle EM-A.
- The integrated tablet proof was accepted as a fake-token visible lifecycle proof because it exercised the mobile state surfaces and was paired with EM-A's service proof. It did not prove a live route-backed provider-depth lifecycle from the tablet because backend health was unavailable in that launch context.
- No new schema migration or route shape was introduced in Lead integration.
- Remaining backend work is P1: route-backed provider-depth lifecycle execution through order/portfolio/history and durable first-class DB snapshots for same market/outcome multi-selection history.

## Cycle EM-A - Book-Staged Limit Lifecycle Service Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Book-staged limit order creation | Mobile `submitTicketOrder()` -> `/api/orders` via `placeLimitOrder()` and canonical order normalization | POST | Server mode uses existing canonical API key/idempotency flow | `selection` now preserves `limitPrice`, `limitSide`, and `limitShares` with selected `marketId`, `outcomeId`, family/line/period/side, display label, contract side, and provider identity | Immediate mobile order result keeps the staged Book limit fields in `result.selection`; backend `sanitizeTicketSelectionSnapshot()` keeps the same fields in `ApiOrderRequest.requestBody.selection` | Existing `ApiOrderRequest.requestBody` JSON snapshot; no schema migration | Mock order mode uses the same mobile `selectionForOrder()` path, so the service contract is identical for local ticket tests | Live Android route proof and immutable first-class order/trade selection columns remain future hardening. |
| Book-staged limit open orders and positions | `/api/portfolio` | GET | Session user or canonical API key with `account:read` | None | `openOrders[].selection.limitPrice`, `openOrders[].selection.limitSide`, `openOrders[].selection.limitShares`, and matching fields on `positions[].selection` survive mobile portfolio mapping | `Order`, `ApiOrderRequest`, `Position`, `Market`, `Outcome` with existing request snapshot bridge for matching market/outcome | Mobile portfolio service tests use backend-shaped payloads, not UI-only fields | Filled positions still depend on the latest matching request snapshot or current market/outcome fallback; no immutable position snapshot column. |
| Book-staged limit activity/history | `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `canceledOrders[].selection.*` and `recentTrades[].selection.*` carry `limitPrice`, `limitSide`, and `limitShares` into mobile activity rows | `Order`, `ApiOrderRequest`, `Trade`, `Market`, `Outcome` | Mobile history mapper tests use backend-shaped canceled/recent trade payloads | Same-market/outcome multi-selection history remains limited by existing request JSON lookup until durable trade snapshots are added. |

Cycle EM-A implementation notes:

- Proof artifact: `docs/mobile/harness/cycle-EM-A-limit-lifecycle/proof.json`.
- Focused tests cover mobile order creation, mobile portfolio snapshot mapping, mobile history/activity mapping, and backend selection metadata sanitization/building for `selection.limitPrice`, `selection.limitSide`, and `selection.limitShares`.
- `sanitizeTicketSelectionSnapshot()` now preserves finite numeric `limitPrice`/`limitShares` and normalized `limitSide=bid|ask`, so Book-staged fields survive canonical request storage and later portfolio/history serialization through the existing selection snapshot JSON.
- No visible mobile UI, mobile smoke scripts, shared audit gate docs, Prisma schema, or migration files were changed.

## Cycle EL Integrated - Route-Backed Book/Ticket Limit Handoff

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route-backed Book ladder to staged ticket | `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book?maxLevels=24` | GET / GET | Public/mobile routes for live-detail and orderbook. Server order mode uses existing API key handling when a ticket is submitted. | Live-detail uses event slug. Book uses selected `marketId`, `maxLevels`, and mobile cache-buster `_ts`. Future order payloads preserve `selection.limitPrice`, `selection.limitSide`, and `selection.limitShares` from the tapped Book row. | Live-detail selected market/outcome identity, `orderbookIdentity`, provider lifecycle, chart status, and route-backed depth readiness. Book `levels[].side/price/shares/value`, `marketIdentity`, and availability. Mobile ticket consumes the selected `limitPrice/limitSide/limitShares` so price display and future order snapshots stay tied to the tapped ladder row. | Reads provider-backed `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot`. Future order/portfolio/history flows use existing order selection snapshot fields. | The integrated proof uses the disposable EL-A provider event seeded through route/provider services, not arbitrary frontend-only data. No frontend fixture is accepted for the selected integrated pass. | Production proof still needs live real Polymarket mapped events and scheduled refresh breadth. A future backend/order cycle should assert `limitPrice/limitSide/limitShares` through server order creation, portfolio, and history. |

Cycle EL integrated implementation notes:

- Proof artifacts: `docs/mobile/harness/cycle-EL-integrated-live-depth/cycle-EL-A-provider-breadth.json` and `docs/mobile/harness/cycle-EL-integrated-live-depth/cycle-EL-B-visible-live-depth-proof.json`.
- The Samsung tablet proof used backend event slug `mobile-el-a-provider-breadth-bc35089a` against `http://127.0.0.1:3002`.
- The selected ask row staged Buy at `0.55` / 55c for 150 shares; the selected bid row staged Sell at `0.50` / 50c for 180 shares; both ticket price lines preserved the tapped Book level.

## Cycle EL-A - Provider Line-Family Breadth Route Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-detail/provider-refresh line-family breadth | `/api/mobile/events/:slug/live-detail` before and after `/api/mobile/events/:slug/provider-refresh` | GET / POST / GET | Live-detail is public/mobile. Provider-refresh remains protected by internal/admin auth in production; the proof calls the shared route execution helper used by the protected POST. | Provider-refresh body uses `allowContractProofFallback=false`. | Refresh now returns `refresh.lineFamilyCoverage.source/generatedAt/compactMarketCount/familyCount/providerRefreshableFamilyCount/providerRefreshableMarketCount/readyProviderRefreshableMarketCount/hasProviderMappedBreadth/hasReadyProviderMappedBreadth/optionalLineProviderBlocking`, `families[]`, and per-market `markets[].selectorKey/marketFamily/period/line/providerRefreshable/status/ready/quote/orderbookDepth/chartHistory`. Live-detail after refresh continues to expose each compact market's `providerLifecycle.quote/orderbookDepth/chartHistory`, `orderbookIdentity`, `chartHistoryStatus`, and `orderbookDepthStatus`. | Creates disposable `Event`, `Market`, and `Outcome` rows. Refresh writes/reads `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` through the existing Polymarket Gamma/CLOB services. | Contract-proof fallback is disabled and asserted null. Provider fetches are deterministic Polymarket Gamma/CLOB-shaped responses scoped to disposable proof slugs/tokens. Missing `OPTIC_ODDS_API_KEY` remains optional and non-blocking. | Production breadth still depends on live Polymarket mappings for actual World Cup events. Android-visible proof remains outside Agent A ownership. |
| Focused EL-A proof harness | `scripts/prove_mobile_el_a_provider_breadth.ts` | Local script calling route modules | Local development database only | Optional `--output` / `--summaryPath` | JSON artifact records before unavailable compact markets, provider refresh completion, Gamma quote/CLOB depth/CLOB chart refresh counts for three mapped families, line-family coverage, cache invalidation for all family routes, after-refresh live-detail readiness, and optional/non-blocking line-provider state | Same backend provider tables as live-detail/provider-refresh; no schema migration | No frontend fallback. The proof uses route/service calls and fails unless moneyline, spread, and totals all become provider-ready without contract fallback. | Requires local database and dependency runtime. It is backend/provider route proof only. |

Cycle EL-A implementation notes:

- Proof artifact: `docs/mobile/harness/cycle-EL-A-provider-breadth/cycle-EL-A-provider-breadth.json`.
- `refresh.lineFamilyCoverage` is backend-owned route proof metadata; mobile can use it for diagnostics or readiness gating without deriving provider breadth from UI state.
- The proof shows three compact market families ready after refresh: moneyline, spread, and totals. Each preserves Polymarket quote, CLOB orderbook depth, CLOB chart history, selected market identity, selector key, line/period, and cache invalidation paths.
- No visible mobile UI, shared audit gate docs, Prisma schema, or migration files were changed.

## Cycle EK Integrated - Visible Provider Transition Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-detail stale/refreshing/ready transition on tablet | `/api/mobile/events/:slug/live-detail`, `/api/orderbook/:marketId/book?maxLevels=24`, and the provider-refresh route execution helper used by `/api/mobile/events/:slug/provider-refresh` | GET / GET / local route helper | Live-detail and orderbook are public/mobile routes. Provider refresh remains internal/admin protected in production; the integrated proof calls the shared route execution body locally. | Live-detail uses event slug. Orderbook uses selected `marketId` and `maxLevels`. Refresh helper uses `allowContractProofFallback=false` for the existing disposable EK event. | `event.liveDataStatus.source/status/reason/lastUpdated`, `markets[].providerLifecycle.status/quote/orderbookDepth/chartHistory`, `markets[].availability.status/source/reason`, selected `markets[].selection`, selected `markets[].orderbookIdentity`, Book `availability.status/source/reason`, Book `providerOrderbookDepth.status`, and ticket handoff fields from the selected market/line/outcome. | Reads live `Event`, provider-shaped `Market`, active `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot`. The proof helper refreshes the existing disposable EK event with scoped Polymarket Gamma/CLOB-shaped provider stubs. | No frontend fallback is accepted for the selected transition. The tablet proof checks a stale/refresh-due state, runs refresh, then requires route-backed ready labels. Mobile orderbook requests add a timestamp query parameter so the tablet cannot reuse stale Book data. | Production scheduler execution and real provider-backed line-family breadth are still not complete. The helper proves the route path for one selected EK transition, not universal production refresh coverage. |
| EK integrated proof harness | `mobile/scripts/smoke-tablet.ps1 -EventDetailVisibleStatusTransition` plus `scripts/refresh_mobile_ek_provider_transition.ts` | Local harness | Local development device/database only | Device, backend URL, event slug, screenshot output, hierarchy output, and refresh summary path | JSON proof records before-refresh status, in-flight refresh UI, after-refresh live-detail status, Book/orderbook readiness, ticket settings handoff, route-backed labels, and provider refresh summary with `fallbackApplied=false` | Same provider snapshot tables as above; no schema migration | No arbitrary UI fixture is added. Existing deterministic provider responses are contract-shaped and only scoped to the proof refresh execution. | Fresh S23 Polymarket recapture and repeated production-family Android proof remain P1 follow-up work. |

Cycle EK integrated implementation notes:

- Proof artifacts: `docs/mobile/harness/cycle-EK-integrated-provider-transition/cycle-EK-B-visible-status-transition-proof.json` and `docs/mobile/harness/cycle-EK-integrated-provider-transition/cycle-EK-B-visible-status-transition-refresh-route.json`.
- Live-detail now lets provider lifecycle downgrade a live event from ready to stale/unavailable when the provider route data is not ready, so the app no longer hides refresh debt behind stale top-level metadata.
- When provider lifecycle becomes ready after refresh, selected market availability and Book availability can be promoted from stale to route-backed ready only when provider quote/depth evidence is fresh.
- Mobile Book requests include a cache-buster query value to prevent stale device responses from masking the provider transition.

## Cycle EK-A - Provider Transition Route Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-detail provider transition breadth | `/api/mobile/events/:slug/live-detail` before and after `/api/mobile/events/:slug/provider-refresh` | GET / POST / GET | Live-detail is public/mobile. Provider-refresh remains protected by internal/admin auth in production; the proof calls the route execution helper used by the protected POST. | Provider-refresh body uses `allowContractProofFallback=false`; no expire-first fallback is required. | Live-detail `markets[].providerLifecycle.status/ready/stale/refreshDue/unavailable/empty/notReady`, `markets[].providerLifecycle.quote/orderbookDepth/chartHistory.source/status/reason/nextRefreshAt/lastFetchedAt`, `markets[].providerOrderbookDepth.status`, `markets[].chartHistoryStatus.status`, `markets[].selection`, and `markets[].orderbookIdentity`. Provider-refresh `providerLifecycle.refreshStarted/refreshStatus/refreshStartedAt/refreshCompletedAt/ready/fallbackApplied`, `refresh.provider`, `refresh.providerDepth`, `refresh.providerHistory`, `refresh.contractProofFallback`, `refresh.mappingReadiness`, and `cacheInvalidation.invalidated`. | Creates disposable `Event`, `Market`, and `Outcome` rows. Reads/writes `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` through the existing provider refresh services. | Contract-proof fallback is disabled and asserted null. Provider fetches are deterministic Polymarket Gamma/CLOB-shaped responses scoped to the disposable proof slugs/tokens; missing `OPTIC_ODDS_API_KEY` stays optional/unconfigured. | Android-visible refresh/loading/ready pairing remains Agent B/Lead scope. Production line-family breadth still depends on real mapped Polymarket markets being available. |
| Focused EK-A proof harness | `scripts/prove_mobile_ek_a_provider_transition.ts` | Local script calling route modules | Local development database only | Optional `--output` / `--summaryPath` | JSON artifact records ready Moneyline, selected stale/refresh-due Spread before refresh, provider-refresh completed lifecycle, selected Spread ready after refresh, unavailable Totals before/after, cache invalidation paths, no fallback, and selected identity preservation | Same existing backend provider tables as live-detail/provider-refresh; no schema migration | No frontend fallback. The proof fails if `mock-ready`, `fixture-ready`, `frontend-fixture`, `default-ready`, fallback depth, or first-row fallback markers appear. | Requires local database and dependency runtime. It is backend route proof only. |

Cycle EK-A implementation notes:

- Proof artifact: `docs/mobile/harness/cycle-EK-A-provider-transition/cycle-EK-A-provider-transition.json`.
- `executeMobileLiveProviderRefreshRoute()` is the shared route execution body used by protected `POST`; production auth behavior is unchanged.
- Selected transition identity is preserved by market id, selector key, family, period, line, and token ids across before live-detail, route refresh response, and after live-detail.
- Unavailable/not-ready Totals stays explicit and is not counted as ready evidence.

## Cycle EJ-A - Provider Status Breadth Route Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-detail provider status breadth | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | `event.liveDataStatus`, top-level and `contract.providerLifecycle`, `contract.batchedProviderOrderbookDepthReadyCount/StaleCount/RefreshDueCount`, `contract.batchedChartHistoryReadyCount/StaleCount/RefreshDueCount`, compact `markets[].providerLifecycle.status/ready/stale/refreshDue/unavailable/empty/notReady`, `markets[].providerLifecycle.quote/orderbookDepth/chartHistory.source/status/reason/nextRefreshAt/lastFetchedAt`, `markets[].providerOrderbookDepth.status`, `markets[].chartHistoryStatus.status`, `markets[].selection`, and `markets[].orderbookIdentity` | Reads compact live `Event`, provider-shaped `Market`, active `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` rows | None. The EJ-A proof fails if `mock-ready`, `fixture-ready`, `frontend-fixture`, or `default-ready` appears in the route payload. Missing `OPTIC_ODDS_API_KEY` is non-blocking. | Android visible consumption and production mapped-market breadth remain Agent B/production coverage work. |
| Focused EJ-A proof harness | `scripts/prove_mobile_ej_a_provider_status_breadth.ts` | Local script calling the route module | Local development database only | Optional `--output` / `--summaryPath` | JSON artifact records a ready moneyline, refresh-due quote plus stale depth/chart spread, unavailable/not-ready totals market, aggregate contract counts, Polymarket/CLOB sources, and no fixture/mock/default-ready markers | Creates one disposable live event with three compact markets and seeds only the backend provider snapshot tables needed for each state | No frontend fallback. The unavailable market intentionally has no provider snapshot rows and is not counted as ready evidence. | Requires local database and dependency runtime. It is backend route proof only. |

Cycle EJ-A implementation notes:

- Proof artifact: `docs/mobile/harness/cycle-EJ-A-provider-status-breadth.json`.
- The ready market proves `providerLifecycle.status=ready`, `orderbookDepthSource=provider-orderbook-depth`, and `orderbookIdentity.ready=true`.
- The stale market proves `providerLifecycle.quote.status=refresh_due` while orderbook depth and chart history are `stale`.
- The unavailable market proves `providerLifecycle.status=unavailable`, `empty=true`, `notReady=true`, and route identity remains present without provider-ready labeling.

## Cycle EI-A - Route-Backed Provider Status Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tablet live-detail provider lifecycle/status rendering | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | `event.liveDataStatus.source/status/lastUpdated/reason`, top-level and `contract.providerLifecycle.status/source/reason/ready/stale/refreshDue/unavailable/empty/notReady/nextRefreshAt/lastFetchedAt`, selected `markets[].providerLifecycle.quote/orderbookDepth/chartHistory.source/status/reason/nextRefreshAt/lastFetchedAt/ready/notReady`, `markets[].chartHistoryStatus.status/source/lastUpdated/nextRefreshAt`, `markets[].orderbookDepthSource/orderbookDepthStatus/providerOrderbookDepth.status`, and selected `markets[].selection` plus `markets[].orderbookIdentity` | Reads compact live `Event`, mapped `Market`, active `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` | None. The EI-A route proof fails if `mock-ready`, `fixture-ready`, or `frontend-fixture` markers appear in the route payload. Missing `OPTIC_ODDS_API_KEY` is non-blocking for this live-detail route proof. | Visible tablet rendering remains Agent B scope. Production line-family coverage still depends on mapped provider markets and scheduled refresh coverage. |
| Focused EI-A proof harness | `scripts/prove_mobile_ei_a_route_backed_status.ts` | Local script calling the route module | Local development database only | Optional `--output` / `--summaryPath` | JSON artifact records liveDataStatus, chart status, orderbook/availability status, selected market identity, provider source/reason/freshness fields, aggregate lifecycle status, missing Optic Odds non-blocking state, and no fixture/mock-ready markers | Creates a disposable provider-backed event and seeds provider quote, provider orderbook depth, and chart snapshot rows consumed by the real live-detail route | No frontend fallback and no mobile smoke fixture. Disposable backend rows use the same snapshot tables as production refresh code. | Requires local database. It is backend proof only and does not replace Android/tablet UI proof. |

Cycle EI-A implementation notes:

- `docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-A-route-backed-status.json` records the focused route proof for PM-GAP-084.
- `docs/mobile/harness/cycle-EI-integrated-route-backed-status/cycle-EI-B-route-backed-status-proof.json` pairs the route proof with Samsung tablet UI proof for the same disposable event slug.
- The tablet proof consumes `/api/mobile/events/:slug/live-detail` through `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3002`, requires `/api/health`, and preserves route-backed provider/source/status identity through live page, Book/orderbook, ticket handoff, and ticket settings.
- No backend route/service or schema source change was required after EH-A; EI integrated work changed proof seeding and mobile harness routing/expectations only.

## Cycle EH-A - Provider Status Surface Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-detail provider lifecycle status | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | Top-level/event/contract `providerLifecycle.status/ready/stale/refreshDue/refreshing/refreshStarted/unavailable/empty/notReady/source/reason/nextRefreshAt/lastFetchedAt/fallback/fallbackApplied/fallbackReason`, plus `markets[].providerLifecycle.quote/orderbookDepth/chartHistory` with the same status/freshness vocabulary | Reads compact live `Event`, mapped `Market`, active `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` | None in the route. Empty provider rows remain explicit as `status=unavailable`, `empty=true`, `notReady=true` | Real provider coverage for every production line-family compact market still depends on mapping and scheduled refresh coverage. |
| Provider refresh status transition | `/api/mobile/events/:slug/provider-refresh` then `/api/mobile/events/:slug/live-detail` | POST / GET | Provider refresh uses internal admin guard; live-detail is public/mobile | Optional `expireFirst`, `staleSeconds`, `allowContractProofFallback` | Refresh route `providerLifecycle.status`, `refreshStartedAt`, `refreshCompletedAt`, `refreshStarted`, `refreshing`, `refreshStatus`, `lastFetchedAt`, `fallbackApplied`, `fallbackReason`, and optional `lineProvider.status=unconfigured` when `OPTIC_ODDS_API_KEY` is absent | Writes/reads `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot`; refreshes Polymarket Gamma/CLOB for mapped markets | Contract-proof fallback remains opt-in and is labelled through `fallbackApplied/fallbackReason`; missing Optic Odds is optional/unconfigured, not blocking | Visible mobile rendering of the new status surface remains Agent B scope. |
| Focused EH-A proof harness | `scripts/prove_mobile_eh_a_provider_status_surface.ts` | Local script | Local development database only | Optional `--output` / `--summaryPath` | JSON artifact with before stale/refresh-due market lifecycle, refresh-start/completion lifecycle, optional/unconfigured line-provider state, after ready market lifecycle, and unavailable control market lifecycle | Creates a disposable provider-backed event with one mapped market and one intentionally empty compact market; seeds provider quote/depth/chart rows for state transition | Deterministic CLOB-shaped proof fetches are explicit; quote fallback is marked when used | Requires local database. It is backend proof only and does not replace Android UI proof. |

Cycle EH-A implementation notes:

- `docs/mobile/harness/cycle-EH-A-provider-status-surface.json` records the focused backend proof.
- PM-GAP-084 backend surface is closed for route shape: mobile can render ready, refresh-due, stale, refresh-started/completed, unavailable/empty, source, reason, next refresh, last fetch, fallback, and not-ready flags from backend responses.
- No mobile visible UI, mobile scripts, Prisma schema, or global audit docs were changed.

## Cycle EG-A - Provider Refresh Lifecycle Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Polymarket-first live-detail/provider refresh lifecycle | `/api/mobile/events/:slug/provider-refresh` then `/api/mobile/events/:slug/live-detail` | POST / GET | Provider refresh uses internal admin guard; live-detail is public/mobile | Optional `expireFirst`, `staleSeconds`, `allowContractProofFallback` | Refresh route now returns top-level `providerLifecycle.source/generatedAt/quote/orderbookDepth/chartHistory/ready/refreshDue/stale/nextRefreshAt`, plus `refresh.postRefreshDepth.lifecycle` and `refresh.postRefreshHistory.lifecycle`. Live-detail now exposes `markets[].chartHistoryStatus.stalenessSeconds/staleAfterSeconds/refreshTtlSeconds/nextRefreshAt/shouldRefresh/isStale` and contract `batchedChartHistoryReadyCount/StaleCount/RefreshDueCount/NextRefreshAt`. Book/live-detail depth continues to expose `providerOrderbookDepth.status/nextRefreshAt/shouldRefresh/isStale`. | Reads compact live `Event`, mapped `Market`, active `Outcome`; writes/reads `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot`. | Production route uses Polymarket Gamma/CLOB by default. The EG-A proof uses deterministic CLOB-shaped depth/history responses only after Gamma quote refresh reports skipped, and labels that path with explicit `contractProofFallback`/fixture status. Missing `OPTIC_ODDS_API_KEY` does not block the Polymarket path. | Production recurring refresh and full real-provider coverage for line-family markets remain outside this focused lifecycle proof. |
| EG-A proof harness | `scripts/prove_mobile_eg_a_provider_refresh_lifecycle.ts` | Local script | Local development database only | Optional `--output` / `--summaryPath` | JSON artifact with before stale live-detail contract, provider refresh lifecycle, CLOB depth/history refresh reports, skipped line-provider state, after ready live-detail contract, and assertions | Creates a disposable provider-backed event/market/outcome set, seeds stale quote/depth/chart rows, refreshes CLOB-shaped depth/history, and records the resulting route-shaped lifecycle state | Deterministic fixture is explicit: `providerSource=polymarket-first-with-deterministic-clob-fixture` and `fixtureStatus=explicit_contract_proof_fallback_for_gamma_quote_only` | Real Gamma quote success depends on live Polymarket slug availability for production-mapped events. |

Cycle EG-A implementation notes:

- `docs/mobile/harness/cycle-EG-A-provider-refresh-lifecycle.json` proves stale -> ready for provider orderbook depth and chart history, with quote fallback explicitly reported and `lineProvider.status=skipped` not blocking the pass.
- The refresh path invalidates live-detail, event, chart, and orderbook route paths and now reports the lifecycle fields mobile needs to distinguish `ready`, `refresh_due`, `stale`, and `unavailable`.
- No mobile visible UI files were changed.

## Cycle EC-A - Provider Orderbook Identity Parity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-detail compact market to Book identity carry-through | `/api/mobile/events/:slug/live-detail` then `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public/mobile route then public visibility guard | Event slug; selected compact `marketId` for Book route | Live-detail compact `markets[].selection.selectorKey`, `markets[].orderbookIdentity.route/marketId/marketGroupId/selectorKey/marketFamily/period/line/outcomeIds/tokenIds/providerSource/providerStatus/depthSource/depthStatus/depthProviderStatus/depthProviderSources/refreshedAt/nextRefreshAt/shouldRefresh/isStale/ready/reason`, plus Book `marketIdentity.marketId/marketGroupId/selectorKey/marketFamily/period/line/outcomes[].id/outcomeId/tokenId`, `depthSource`, `providerOrderbookDepth.status/sources/latestFetchedAt/nextRefreshAt/isStale/shouldRefresh/reason`, and `levels[]`. | `Event`, `Market`, active `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`; local `Order` rows still take precedence in Book snapshot resolution | None in backend. The EC proof fails unless live-detail selects a provider-backed compact market and the corresponding Book route returns the same identity with ready provider depth | Real production line-family provider mappings/refresh coverage remain incomplete; EC documents the line gap when only match-winner is provider-backed. |
| Focused EC-A proof harness | `scripts/prove_mobile_ec_provider_orderbook_identity.ts` | Local script calling both routes | Local development/server only | Optional `--baseUrl`, `--eventSlug`, `--output` | JSON artifact with live-detail selected compact identity, matching Book identity, provider depth summary, token equality, selector equality, and line-market gap note | Upserts a disposable World Cup-style event with match-winner and Totals markets, writes provider quote/depth rows for match winner, clears local open orders/provider rows for proof markets | None. Disposable provider rows use the same reference snapshot tables as production refresh code | Requires local database and a Next server running the current worktree code. |
| Focused route/service unit proof | `src/__tests__/mobile-live-event-detail.test.ts`, `src/__tests__/public.orderbook-book.no-leak.test.ts` | Jest | Local development only | Mocked service/route requests | Asserts live-detail `orderbookIdentity` and Book `marketIdentity.outcomes[].tokenId` align with compact selector identity while no private account/order fields leak | Prisma and orderbook snapshot service are mocked | None | Broader end-to-end visible mobile proof remains outside Agent A backend scope. |

Cycle EC-A implementation notes:

- `selection.selectorKey` is now compact and route-compatible: `marketGroupKey:period:line-or-default`. `marketId` remains explicit for uniqueness.
- Book `marketIdentity.outcomes[].tokenId` is a public provider contract id, not an auth token or credential. Sensitive owner/user/order fields remain excluded by no-leak tests.
- `docs/mobile/harness/cycle-EC-A-provider-orderbook-identity.json` passed with `sameMarketId`, `sameSelectorKey`, `sameOutcomeIds`, `sameTokenIds`, provider source, ready depth status, and freshness assertions all true.

## Cycle EA-A - Live Detail Per-Market Chart Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live event page selected-market chart behavior | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | Top-level `event.chartHistory` remains primary-market scoped. Each compact `markets[]` row now includes `chartHistory[]` and `chartHistoryStatus.source/status/pointCount/outcomeCount/lastUpdated/stalenessSeconds/staleAfterSeconds/refreshTtlSeconds/nextRefreshAt/shouldRefresh/isStale/emptyState/range/ranges`. `contract` now includes `batchedChartHistorySource`, `batchedChartHistoryMarketCount`, `batchedChartHistoryPointCount`, `batchedChartHistoryReadyCount`, `batchedChartHistoryStaleCount`, `batchedChartHistoryRefreshDueCount`, `batchedChartHistoryNextRefreshAt`, `batchedChartHistoryRequestedMarketCount`, and `batchedChartHistoryRequestedMarketIds`. | Reads compact live `Event`, `Market`, active `Outcome`, provider quote/depth snapshots through existing Book snapshot service, and `MarketOutcomeSnapshot` rows for every compact market id. | None in backend. Markets with no history return `chartHistory=[]`, `chartHistoryStatus.status=unavailable`, and `emptyState=no-history`. | Real Polymarket/CLOB history ingestion for mapped Spread/Totals/Team Total line markets still depends on provider token mapping and refresh coverage. |
| Focused backend unit proof | `src/__tests__/mobile-live-event-detail.test.ts` | Jest service test | Local development only | Mocked event/market/snapshot inputs | Proves primary `event.chartHistory` remains separate from non-primary `market.chartHistory`, and proves selected line-market chart readiness can be audited by `marketId`. | No DB writes; orderbook snapshot service is mocked. | None | DB-backed route probe needs a seeded World Cup proof event in the active local database. |

Cycle EA-A implementation notes:

- The route now fetches chart snapshots for all `selectCompactLiveMarkets()` market ids with a bounded `compactMarketIds.length * 240` cap.
- Per-market chart status is backend-shaped and replaceable by real provider history: it carries source, status, point count, outcome count, last update, range, and empty state.
- This narrows the chart parity gap for line selector work because mobile no longer has to assume the primary market chart applies to the selected line market.

## Cycle DU-A - Provider Ready Line Orderbook Depth Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Book ready provider line ladder | `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public visibility guard; private markets still use existing access checks | Query params only: optional `outcomeId`, optional `maxLevels` capped at 200 | `depthSource=provider-orderbook-depth`, `availability.status=ready`, `providerOrderbookDepth.status=ready`, `providerOrderbookDepth.sources[]`, `marketIdentity.selectorKey`, `marketIdentity.marketFamily`, `marketIdentity.marketType`, `marketIdentity.marketGroupKey`, `marketIdentity.marketGroupId`, `marketIdentity.period`, `marketIdentity.line`, `marketIdentity.unit`, `marketIdentity.outcomes[].id`, `marketIdentity.outcomes[].side`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].value`, legacy `levels[].total`, `bids[]`, `asks[]` | `Market`, active `Outcome`, `ReferenceOrderbookDepthSnapshot`; local `Order` rows still have precedence if present | None in backend. The route reports `emptyState=no-depth` when neither local nor provider depth exists | Production-mapped World Cup line-family markets still need recurring provider refresh coverage outside disposable proof rows. |
| Focused DU-A proof harness | `scripts/prove_mobile_du_provider_line_orderbook_depth.ts` | Local script calling route | Local development/server only | Optional `--baseUrl`, `--eventSlug`, `--output` | JSON artifact with route URL, compact first-half spread identity, provider depth source/status, selector key `spreads:first-half:1.5`, outcome ids, and side-labelled Price/Shares/Value rows | Upserts a disposable World Cup-style `Event`/`Market`/`Outcome` set, clears local open orders for that proof market, then writes provider depth rows | None. The proof fails if the route does not return provider-backed ready depth and line selector identity together | Requires an available local database and Next server for the HTTP route probe. |

Cycle DU-A implementation notes:

- `docs/mobile/harness/cycle-DU-A-provider-line-orderbook-depth-proof.json` proves provider-backed ready ladder depth for a compact World Cup first-half spread market.
- The Book route now emits `levels[].value` as an additive alias for the existing notional `levels[].total`, making mobile XML/accessibility proof labels easier without breaking existing consumers.
- The DU-A artifact closes the backend half of PM-GAP-075 for provider-ready line identity: source/status, ready availability, selector key, family/type/group, period, line, outcome ids, level side, price, shares, and value are all route-backed in one response.
- Visible tablet proof still needs to consume this provider-backed route state in the same UI run before PM-GAP-075 can pass end to end.

## Cycle DT-A - Provider Ready Orderbook Depth Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Book ready provider ladder | `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public visibility guard; private markets still use existing access checks | Query params only: optional `outcomeId`, optional `maxLevels` capped at 200 | `marketIdentity`, `availability`, `depthSource=provider-orderbook-depth`, `providerOrderbookDepth.status=ready`, `levels[].price`, `levels[].shares`, `levels[].total`, `bids[]`, `asks[]` | `Market`, active `Outcome`, `ReferenceOrderbookDepthSnapshot`; local `Order` rows still have precedence if present | None in backend. The route reports `emptyState=no-depth` when neither local nor provider depth exists | Production World Cup compact markets still need mapped provider identity and recurring depth refresh coverage. |
| Focused DT proof harness | `scripts/prove_mobile_dt_ready_orderbook_depth.ts` | Local script calling route | Local development/server only | Optional `--baseUrl`, `--eventSlug`, `--output` | JSON artifact with route URL, compact market identity, provider depth summary, and Price/Shares/Value row evidence | Upserts a disposable World Cup-style `Event`/`Market`/`Outcome` set and provider depth rows | None. The proof fails if the route does not return provider-backed ready depth | Requires an available local database and Next server for the HTTP route probe. |
| Focused route unit proof | `src/__tests__/public.orderbook-book.no-leak.test.ts` | Jest route test | Local development only | Mocked route request | Asserts provider-ready ladder shape, selector identity, numeric Price/Shares/Value rows, and no sensitive key leakage | Prisma and snapshot service are mocked | None | Broader live provider mappings remain outside this unit test. |

Cycle DT-A implementation notes:

- `marketIdentity` and provider depth are proven together so the Book UI can render a selected compact market without using fallback/unavailable depth.
- Earlier DT-A proof kept provider token IDs out of the Book identity. Cycle EC-A intentionally adds public provider `tokenId` to `marketIdentity.outcomes[]` for cross-route identity proof while credentials, owner IDs, user IDs, private order state, and condition IDs remain excluded.
- The route's depth precedence is unchanged: local orderbook, provider ladder snapshot, provider quote top-of-book estimate, then empty.

## Cycle DS-A - Orderbook Selector Identity Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Book selector/depth identity | `/api/orderbook/:marketId/book` | GET | Public visibility guard; private market access still uses existing user visibility checks | Query params: optional `outcomeId`, optional `maxLevels` capped at 200 | Existing `marketId`, `outcomeId`, `availability`, `emptyState`, `levels[]`, `bids[]`, `asks[]`, provider depth metadata; new `marketIdentity.selectorKey`, `marketFamily`, `marketType`, `marketGroupKey`, `marketGroupId`, `marketGroupTitle`, `displayOrder`, `period`, `line`, `unit`, `displayUnits`, `outcomes[]` | Reads `Market` plus active `Outcome`; reads local orderbook/provider snapshots through `buildPublicOrderbookSnapshot()` | None. The route reports no-depth/availability truthfully and does not synthesize frontend-only family data | Broader production provider mappings for live line-family markets remain outside this route contract. |
| Focused backend proof | `src/__tests__/public.orderbook-book.no-leak.test.ts` | Jest unit route test | Local development only | Mocked route request for Moneyline, Spread, and Totals markets | Asserts selector-ready identity, public ladder units, active outcome list, and no sensitive key leakage | No DB writes; Prisma is mocked | None | Add integration proof against a seeded real event if Agent B needs an end-to-end sibling selector proof. |

Cycle DS-A implementation notes:

- `docs/mobile/harness/cycle-DS-A-orderbook-selector-contract.json` records the focused backend proof.
- Cycle EC-A intentionally exposes public provider `tokenId` in `marketIdentity.outcomes[]` so live-detail and Book can prove the same outcome/token identity. Condition IDs, credentials, owner IDs, user IDs, and private order state remain excluded.
- This closes the backend-side compact market identity gap for Book selector/depth parity; mobile can switch/select line markets without inventing family, line, period, outcome, or display-unit labels.

## Cycle DS-B/Integrated - Visible Orderbook Selector And Ladder

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Orderbook overlay selector/ladder | `/api/orderbook/:marketId/book` plus existing event/live-detail data | GET | Public/mobile visibility guard | Optional selected market/outcome and max depth through existing mobile flow | `marketIdentity` when route-backed; existing `levels[]`, bid/ask prices, shares, value, `availability`, `emptyState`, source/status labels | `Market`, `Outcome`, local orderbook/provider snapshot rows | Existing contract-shaped fallback depth renders with explicit `Fallback depth` and unavailable labels when route-backed ready depth is absent | Need integrated provider-backed ready depth proof and selector carry-through for Moneyline -> Spread/Totals. |
| Tablet orderbook smoke proof | `mobile/scripts/smoke-tablet.ps1 -EventDetailOrderBook` | Local harness | Local device proof only | `-OutputDir`, `-HierarchyOutputDir`, `-Port` | Screenshots/XML for event detail, Book overlay, Book ticket, close state | No DB writes | Uses current mobile app state and backend availability | Add interaction steps for Yes/No tab switching, selector choice changes, and Decimalize/equivalent settings. |

Cycle DS-B/Integrated implementation notes:

- `docs/mobile/harness/cycle-DS-integrated-orderbook-ui-proof.json` records the integrated partial proof.
- The Book overlay now depends on stable market/outcome identity and explicit depth status labels. It must not hide fallback/unavailable state as a ready provider-backed ladder.
- PM-GAP-075 remains open until selector changes, Yes/No tab switching, settings, and provider-backed ready depth are proven together.

## Cycle DR-A - Scheduled Provider Refresh Run Reporting

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Scheduled provider refresh run report | `runScheduledMobileLiveProviderRefresh()` | Local scheduler service | Backend-only trusted caller | Optional `eventSlugs`, `maxEvents`, `refreshTtlSeconds`, `dryRun` | Backend operator/worker fields: `runId`, `startedAt`, `completedAt`, `durationMs`, `status`, `attemptedEventCount`, `successfulEventCount`, `failedEventCount`, `dryRunEventCount`, `refreshed[].status`, `refreshed[].error` | Reads `Event`, `Market`, `Outcome`, and `ReferenceQuoteSnapshot`; scheduled execution writes provider quote/depth/history through existing refresh services | None. Scheduled execution keeps `allowContractProofFallback=false`; failed refresh attempts are reported, not filled with proof data | Durable run-history table, production retry/alert policy, and cron/queue registration remain future infrastructure work. |
| Scheduled provider refresh proof harness | `scripts/prove_mobile_scheduled_provider_refresh.ts` | Local script | Local development only | Optional `--eventSlug`, `--output`, `--staleSeconds` | JSON artifact with `expired`, `before`, `scheduler`, `after`, run-status assertions, and `pass` | Ages `ReferenceQuoteSnapshot.fetchedAt`, then refreshes through the scheduler service | None. The script fails if stale-to-ready or run reporting assertions do not pass | Keep the harness as backend evidence until deployed worker observability exists. |

Cycle DR-A implementation notes:

- `docs/mobile/harness/cycle-DR-A-mobile-scheduled-provider-refresh-run-report.json` proves stale/refresh-due -> scheduler run report `status=completed` -> ready for `mobile-provider-refresh-proof-live`.
- The refreshed item reports `status=completed` with cache invalidation paths for live-detail, event, chart, and orderbook surfaces.
- The failure contract is unit-tested: provider refresh exceptions produce `status=completed_with_errors`, `failedEventCount=1`, and a sanitized per-event error while keeping contract-proof fallback disabled.

## Cycle DQ-A - Scheduled Provider Refresh Lifecycle

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Scheduled provider refresh assessment | `runScheduledMobileLiveProviderRefresh()` | Local scheduler service | Backend-only trusted caller | Optional `eventSlugs`, `maxEvents`, `refreshTtlSeconds`, `dryRun` | `candidateCount`, `dueEventCount`, `candidates[].dueMarketIds`, missing/stale outcome counts, `nextAction` | Reads `Event`, `Market`, `Outcome`, and `ReferenceQuoteSnapshot` | None. The service only marks a market due when provider snapshots are missing or stale | Deploying this service behind a cron/queue worker remains future infrastructure work. |
| Scheduled provider refresh execution | `refreshMobileLiveProviderQuoteSnapshots()` via scheduler | Local scheduler service | Backend-only trusted caller | Due event slug; `allowContractProofFallback=false` | `provider.snapshotsUpdated`, `providerDepth.depthRowsUpdated`, `providerHistory.snapshotsCreated`, `lineProvider.status`, `postRefresh`, `postRefreshHistory` | Writes/reads `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, and `MarketOutcomeSnapshot` for mapped compact markets | Contract-proof fallback is disabled in the scheduled path | Production error taxonomy/retry policy is still light; line-provider enrichment can remain skipped without blocking Polymarket parity. |
| Mobile live-detail readiness after schedule | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile route | Event slug | `contract.batchedProviderQuoteSnapshotReadyCount`, `batchedProviderQuoteSnapshotStaleCount`, `batchedProviderQuoteSnapshotRefreshDueCount`, `batchedProviderOrderbookDepthReadyCount`, `chartHistorySource` | Reads compact live event, provider quote snapshots, depth snapshots, and chart history | None for the proof event; stale state is reported truthfully before refresh | Android smoke failed before provider assertions in this pass, so the route proof is the authoritative DQ-A evidence. |
| Scheduled refresh proof harness | `scripts/prove_mobile_scheduled_provider_refresh.ts` | Local script | Local development only | Optional `--eventSlug`, `--output`, `--staleSeconds` | JSON artifact with `expired`, `before`, `scheduler`, `after`, `assertions`, and `pass` | Ages `ReferenceQuoteSnapshot.fetchedAt`, then refreshes through the scheduler service | None. The script fails if stale-to-ready does not happen | Keep the harness as a backend proof until a deployed scheduler cadence exists. |

Cycle DQ-A implementation notes:

- `docs/mobile/harness/cycle-DQ-A-mobile-scheduled-provider-refresh.json` proves stale/refresh-due -> scheduler refresh -> ready for `mobile-provider-refresh-proof-live`.
- Missing `OPTIC_ODDS_API_KEY` is not required for this Polymarket-first path. The proof event has no line-provider fixture, so `lineProvider.status=skipped` is expected while Gamma/CLOB quote, depth, and history refresh still pass.
- The scheduler returns cache invalidation paths for live-detail, event, chart, and orderbook consumers so mobile routes know which provider-backed surfaces changed.

## Cycle DF - Provider Mapping Operator UI

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Operator readiness review | `/api/mobile/events/:slug/provider-mapping` | GET | Internal admin key or admin session | None | `compactMarketCount`, `providerRefreshableMarketCount`, `providerRefreshableOutcomeCount`, `totalOutcomeCount`, missing field counts, `markets[]`, `markets[].outcomes[]`, `nextRequiredAction` | Reads compact `Event`, `Market`, and active `Outcome` provider identity fields | None | Need real provider line-market slug source to reduce remaining missing mappings. |
| Operator dry-run review/apply | `/api/mobile/events/:slug/provider-mapping` | POST | Internal admin key or admin session | `reviews[]`, `dryRun`, `confirmApply` generated from parsed operator input | `blocked`, `blockReason`, `preview.failedReviews[]`, `preview.attachReadyReviewCount`, `attach.validation`, `nextRequiredAction` | On confirmed all-pass apply, writes existing provider identity fields on `Market` and `Outcome` | None. UI dry-run and apply both use the protected route; failed reviews block in backend | Durable operator review audit log/table remains future work. |
| Operator input parser | `parseProviderSlugReviewInput()` | Local UI helper | Admin page only | JSON array/object or `marketId=slug1,slug2` lines | Normalized `{ marketId, slugs[] }[]` | None | None | No persistence of draft review input yet. |

Cycle DF implementation notes:

- The UI does not bypass the backend review gate. It only packages operator input for the protected `/provider-mapping` workflow.
- Confirmed apply is disabled until the operator checks `Confirm apply`.
- The UI is intentionally admin-only and separate from Holiwyn user mobile surfaces.

## Cycle DE - Bulk Review Apply Workflow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Review-first bulk provider mapping apply | `/api/mobile/events/:slug/provider-mapping` | POST | Internal admin key or admin session | `reviews[]`, optional `dryRun`, optional `confirmApply` | `mode=bulk-manual-slug-review-apply`, `blocked`, `blockReason`, `preview.reviewCount`, `preview.attachReadyReviewCount`, `preview.failedReviews[]`, `attach`, `nextRequiredAction` | Reads compact `Event`, `Market`, and active `Outcome`; fetches exact Gamma `/markets?slug=...`; on confirmed all-pass apply writes `Market.referenceSource`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, `Outcome.referenceTokenId`, and `Outcome.referenceOutcomeLabel` | None. Failed review blocks all attach; no partial success is written | Need operator/admin UI to collect captured slugs and call this route. |
| Existing direct mapping apply | `/api/mobile/events/:slug/provider-mapping` | POST | Internal admin key or admin session | Existing `mappings[]`, `dryRun`, `confirmApply` | Existing validation and before/after readiness report | Same provider identity fields as above | None | Kept for lower-level tooling; operator flow should prefer `reviews[]` so relevance/family checks happen in the same apply cycle. |
| Bulk review/apply proof harness | `scripts/prove_mobile_provider_bulk_review_apply_workflow.ts` | Local script | Local development only | `--providerEventSlug`, `--eventSlug`, `--output` | Proof artifact showing blocked mixed review, unchanged readiness, all-valid dry-run, confirmed apply, and after-apply readiness | Upserts local proof event/market/outcome rows shaped like compact live markets; applies real provider IDs only after all reviews pass | Uses real Polymarket slugs/tokens for match-winner mappings; guard totals market remains unmapped | Real line-market slugs are still needed before line markets can pass review/apply. |

Cycle DE implementation notes:

- `reviews[]` on `/provider-mapping` is the protected high-level apply path: review first, block on any failure, then dry-run or confirmed apply only when every review is attach-ready.
- The pass proof shows a bad totals review cannot be silently skipped while 3 match-winner markets are attached.
- The route returns `nextRequiredAction=fix_failed_slug_reviews_before_bulk_apply` for blocked review sets and `nextRequiredAction=run_provider_refresh_without_contract_fallback` after confirmed all-pass apply.

## Cycle DC - Bulk Manual Slug Review Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bulk exact provider slug review | `/api/mobile/events/:slug/provider-candidates` | POST | Internal admin key or admin session | `reviews[]` where each review has `marketId` and `slugs[]` | `mode=bulk-manual-slug-preview`, `reviewCount`, `attachReadyReviewCount`, `candidateCount`, `attachReadyCandidateCount`, `mappings[]`, `results[].expectedProviderFamily`, `bestCandidate.attachReadiness.reasons`, `nextRequiredAction` | Reads compact `Event`, `Market`, and active `Outcome`; fetches exact Gamma `/markets?slug=...`; returned mappings can later be sent to `/provider-mapping` | None. The route is read-only and does not attach provider IDs | Need operator UI/admin flow to submit bulk reviews and then apply only all-approved mappings. |
| Bulk provider identity apply | `/api/mobile/events/:slug/provider-mapping` | POST | Internal admin key or admin session | Existing `mappings[]`, `dryRun`, `confirmApply` | Existing validation and before/after readiness report | Writes `Market.referenceSource`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, `Outcome.referenceTokenId`, and `Outcome.referenceOutcomeLabel` | None | Not changed this cycle; applying remains separate by design. |
| Bulk slug proof harness | `scripts/prove_mobile_provider_bulk_slug_review.ts` | Local script | Local development only | `--providerEventSlug`, `--eventSlug`, `--output` | Proof artifact showing 3 attach-ready match-winner reviews and 1 rejected wrong-family totals review | Upserts local proof event/market/outcome rows shaped like compact live markets; does not apply returned mappings | Uses real Polymarket slugs/tokens for preview; no frontend-only mapping fixture | Real line-market slugs are still needed before line markets can pass bulk review. |

Cycle DC implementation notes:

- The bulk preview contract deliberately stops before attach.
- `nextRequiredAction=fix_failed_slug_reviews_before_bulk_apply` when any review fails, preventing partial silent completion.
- The proof shows wrong-family match-winner slugs cannot satisfy totals markets in bulk mode.

## Cycle DB - Provider Line Source Probe

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Line-market provider source probe | `scripts/prove_mobile_provider_line_source_probe.ts` | Local script | Local development only | `--providerEventSlug`, `--output` | Exact event family summary, exact slug guess results, broad line-query ranked candidates, attach-ready counts, rejection reasons, `nextRequiredAction` | No DB writes. In-memory targets are shaped like compact `Market.marketType`, `Market.line`, `Market.period`, and active `Outcome` identity | None. The script does not attach provider identity or count local mock data as provider-backed | Need an actual provider source or operator-reviewed real exact slugs for line markets. |
| Exact provider event source | `https://gamma-api.polymarket.com/events?slug=...` | GET | Public provider endpoint | Query `slug=fifwc-col-gha-2026-07-03` | Provider event markets with `slug`, `question`, `id`, `conditionId`, `outcomes`, `clobTokenIds` | Would map into `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, and `Outcome.referenceTokenId` if a line family candidate existed | None. Current exact event exposes only match-winner candidates | Line-family markets are absent from the exact event payload for this checked event. |
| Exact line slug guesses | `https://gamma-api.polymarket.com/markets?slug=...` | GET | Public provider endpoint | 23 generated line slug guesses for spread, totals, team totals, first half, corners, and correct score | Exact market preview fields if a guessed slug exists | Same provider identity fields as above | None. Missing slugs return no candidates and are not treated as mappings | Need real slugs from reference app/operator review or another source; guessed patterns did not resolve. |
| Broad line search probe | `https://gamma-api.polymarket.com/markets?search=...` | GET | Public provider endpoint | Normalized line-market search queries per backend-shaped target | Ranked candidate `attachReadiness.reasons`, family, relevance report | None unless a candidate passes attach gates; none did | None. Broad candidates are rejected by family/relevance gates | Broad search still returns unrelated markets and is not a safe line mapping source. |

Cycle DB implementation notes:

- This cycle is read-only for provider mapping and DB state.
- The checked surfaces yielded 0 attach-ready line targets; this is documented as a source gap, not a feature-complete line-market claim.
- The existing match-winner provider mapping from Cycle DA remains healthy on Samsung tablet proof.

## Cycle DA - Provider Discovery Expansion

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Exact event plus manual slug fallback provider discovery | `/api/mobile/events/:slug/provider-candidates` | GET | Internal admin key or admin session | Query params: `providerSearchMode=sports-events`, optional `marketId`, optional `maxCandidatesPerMarket` | `providerEventSlugs`, `providerEventSlugSource`, `manualSlugFallbacks`, `manualSlugFallbackCandidateCount`, `providerCandidateFamilySummary`, `targets[].attachProposal`, `attachReadyCandidateCount` | Reads compact `Event`, `Market`, and active `Outcome`; fetches Gamma `/events?slug=...` and exact Gamma `/markets?slug=...`; attach writes `Market.referenceSource`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, and `Outcome.referenceTokenId` | None. Fallback slugs are exact provider slugs and still pass the same family, token, and relevance gates before attach | Need real provider source/slugs for line market families beyond match winner. |
| Provider discovery expansion proof | `scripts/prove_mobile_provider_discovery_expansion.ts` | Local script | Local development only | `--providerEventSlug`, `--eventSlug`, `--output` | Proof artifact showing initial missing mapping, fallback slugs, 3 attach-ready candidates, attach result, no-fallback refresh, quote snapshots, and CLOB depth rows | Upserts local proof `Event`, `Market`, `Outcome` rows shaped like provider-backed compact markets; uses existing attach and refresh services | No frontend-only fixture. Local proof rows are populated with real Polymarket identity and token IDs before refresh | Production importer should persist trusted provider event slugs and eventually include provider line-market slugs when available. |

Cycle DA implementation notes:

- The manual slug fallback is narrow and match-winner-only: `fifwc-col-gha-2026-07-03-col`, `-draw`, and `-gha`.
- The pass proof attached 3 real provider markets, refreshed 6 outcome quote snapshots, and wrote 246 provider CLOB depth rows without contract-proof fallback.
- Broad Gamma search remains unsafe for automatic line-market attach and is still blocked by the relevance/family gate.

## Cycle CZ - Line Slug Family Gate

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Manual exact provider slug review for line markets | `/api/mobile/events/:slug/provider-candidates` | POST | Internal admin key or admin session | `marketId`, `slugs[]` | `expectedProviderFamily`, `bestCandidate.attachReadiness.expectedFamily`, `candidateFamily`, `reasons[]`, `attachReadyCandidateCount`, `attachProposal` | Reads compact `Event`, `Market`, and active `Outcome`; exact slug data comes from Gamma `/markets?slug=...` | None. Wrong-family exact slugs are rejected before attach; no local fixture counts as provider-backed | Need actual exact provider line slugs or another provider source for production line markets. |
| Line slug family gate proof | `scripts/prove_mobile_provider_line_slug_family_gate.ts` | Local script | Local development only | `--output` | Proof artifact showing accepted same-family total-goals candidate and rejected match-winner candidate for a totals target | In-memory market-shaped target only; does not write DB | No provider identity mutation | Replace synthetic candidate proof with real exact line slug preview when a provider line slug exists. |

Cycle CZ implementation notes:

- The route contract remains protected and read-only for previews.
- `provider_family_mismatch` is additive; relevance and token completeness remain required.
- Generic Over/Under line markets can pass only when the expected family matches and important match tokens overlap.

## Cycle CY - Provider Line Market Availability Diagnostic

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider market-family diagnostics | `/api/mobile/events/:slug/provider-candidates` | GET | Internal admin key or admin session | Existing discovery params; exact sports-event mode can derive event slug from `Event` data | `providerCandidateFamilySummary`, `providerEventSlugs`, `providerEventSlugSource`, `targets[].attachProposal` | Reads `Event`, compact `Market`, and active `Outcome`; exact provider candidates come from Gamma `/events?slug=...` | None. Missing line families are reported as zero counts; no local line fixture is treated as provider-backed | Need a real source for provider-owned line markets or reviewed exact provider line slugs. |
| Provider line availability proof | `scripts/prove_mobile_provider_line_market_availability.ts` | Local script | Local development only | `--providerEventSlug`, `--output` | Exact event family summary, synthetic Holiwyn-shaped line target search results, attach-ready counts, insufficient-relevance counts, `nextRequiredAction` | Does not write DB. Uses provider candidates plus in-memory line target contracts shaped like `Market.marketType`, `line`, `period`, and `Outcome` identities | None. The script is read-only and must not attach or fabricate provider IDs | Production provider/import path still needs line-market provider identities for spreads, totals, team totals, halves, corners, and props. |

Cycle CY implementation notes:

- Exact event discovery for `fifwc-col-gha-2026-07-03` classified all 3 provider candidates as `match_winner`.
- Broad line searches returned noisy candidates, but the relevance gate kept attach-ready count at 0.
- This is a diagnostic contract improvement, not a claim that line-market provider parity is complete.

## Cycle CX - Provider Event Slug Hint Discovery

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider event slug hint discovery | `/api/mobile/events/:slug/provider-candidates` | GET | Internal admin key or admin session | Query params: optional `providerEventSlug(s)` override, `providerSearchMode`, `marketId`, `fetchProvider`, `maxCandidatesPerMarket` | `providerEventSlugs`, `providerEventSlugSource`, `targets[].attachProposal`, `attachReadyCandidateCount`, `nextRequiredAction` | Reads `Event.externalSlug`, `Event.externalEventId`, `Event.source`, `Event.metadata`, compact `Market`, and active `Outcome`; does not write DB | None. Exact provider event hints only narrow provider search; candidates still must pass relevance and token completeness | Need provider event slug metadata on all imported World Cup fixtures; line markets still need provider slugs when available. |
| Event-derived provider attach proof | `scripts/prove_mobile_provider_sports_event_discovery.ts` | Local script | Local development only | `--providerEventSlug`, `--eventSlug`, `--output` for setup; discovery call intentionally omits `providerEventSlugs` | Proof requires `providerEventSlugSource=event`, `providerEventSlugs[]`, 3 attach-ready markets, no-fallback refresh, and depth rows | Upserts a local proof `Event` with provider event metadata, compact `Market` rows, active `Outcome` rows; writes provider IDs through existing attach service | No frontend-only fixture. Local rows are provider-shaped and then populated with real Polymarket token IDs | Replace proof setup with production importer that persists exact provider event slugs for real World Cup fixtures. |

Cycle CX implementation notes:

- Request-provided provider event slugs still override event-derived hints for manual audit work.
- If an exact event hint is available, discovery uses `/events?slug=...` without broad tag discovery, so high-volume unrelated World Cup futures are not mixed into the focused live-match proof.
- The relevance gate from Cycle CV remains required before any attach proposal is considered ready.

## Cycle CV - Provider Candidate Relevance Gate

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider candidate discovery safety gate | `/api/mobile/events/:slug/provider-candidates` | GET | Internal admin key or admin session | Query params: `marketId`, `fetchProvider`, `maxCandidatesPerMarket` | `targets[].bestCandidate.attachReadiness.reasons`, `attachReadiness.relevance`, `attachReadyCandidateCount`, `providerErrorCount`, `nextRequiredAction` | Reads compact `Event`, `Market`, and active `Outcome`; does not write DB | None. Real provider search is allowed, but unrelated candidates are reported as not attach-ready | Real matching World Cup soccer provider slugs/token IDs remain missing. |
| Manual slug preview safety gate | `/api/mobile/events/:slug/provider-candidates` | POST | Internal admin key or admin session | `marketId`, `slugs[]` | Same candidate `attachReadiness` and `relevance` fields before any attach proposal can be used | Reads compact market/outcome identity only; attach still happens through `/provider-mapping` | No automatic attach. Even exact slugs must pass relevance and token completeness | Need reviewed exact soccer market slugs when provider search is noisy. |

Cycle CV implementation notes:

- A candidate can no longer be attach-ready only because it has `conditionId`, `externalMarketId`, `externalSlug`, and token IDs.
- The relevance report records `matchedImportantTokens`, `outcomeNameMatches`, required outcome matches, and score.
- The proof used real provider search and found 42 candidates, all rejected for relevance or outcome-shape mismatch.

## Cycle CU - Provider CLOB Depth Fetcher

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Real provider CLOB refresh for compact live markets | `/api/mobile/events/:slug/provider-refresh` | POST | Internal admin key or admin session | Optional `expireFirst`, `staleSeconds`, `allowContractProofFallback` | `refresh.providerDepth.generatedAt`, `source=polymarket-clob`, `requestedMarketCount`, `refreshedCount`, `depthRowsUpdated`, `skippedCount`, `refreshed[]`, `skipped[]`; post-refresh live-detail/orderbook cache invalidation remains owned by the route | `Event`, provider-mapped compact `Market`, active `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot` | No frontend-only mock. The route fetches real provider CLOB data for mapped markets; disposable proof uses real provider identity on local proof rows | Real World Cup compact soccer markets still need provider mapping before this can cover production soccer events. |
| Selected Book after CLOB refresh | `/api/orderbook/:marketId/book?maxLevels=...` | GET | Optional public viewing | None | `depthSource=provider-orderbook-depth`, `depthReason`, `providerOrderbookDepth.status`, `levelCount`, `snapshotCount`, `sources`, `bids[]`, `asks[]`, `levels[]` | Reads local `Order` rows first, then `ReferenceOrderbookDepthSnapshot` rows written by the CLOB fetcher, then `ReferenceQuoteSnapshot` top-quote fallback | No arbitrary local UI data. If CLOB rows are absent, the route truthfully falls back to provider quote top-of-book or empty state | Retention/cleanup of old provider depth snapshots remains open. |
| External provider order book dependency | `https://clob.polymarket.com/book?token_id=...` | GET | Public provider endpoint | Query string `token_id` from `Outcome.referenceTokenId` | Provider `bids[]` and `asks[]` price/size rows plus provider timestamp when present | Requires `Market.referenceSource=polymarket`, `Market.externalSlug`, and complete active outcome `referenceTokenId` values | Unit tests mock this provider endpoint; production refresh uses live fetch | Need production error taxonomy and retry policy beyond the current skipped/error report. |

Cycle CU implementation notes:

- The CLOB fetcher writes `ReferenceOrderbookDepthSnapshot.source=polymarket-clob`.
- Row freshness uses refresh time so route precedence is stable even when the provider book timestamp is older than the current process time; provider timestamp is still reported in refresh diagnostics.
- Cycle CU closes the real provider-owned depth fetcher gap for mapped markets, not the real World Cup provider-mapping gap.

## Cycle CT - Provider Orderbook Depth Snapshot Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider ladder-backed selected Book | `/api/orderbook/:marketId/book?maxLevels=...` | GET | Optional public viewing | None | `depthSource=provider-orderbook-depth`, `depthReason`, `providerOrderbookDepth.status`, `levelCount`, `snapshotCount`, `sources`, `levels[]`, `bids[]`, `asks[]` | `ReferenceOrderbookDepthSnapshot`, `Market`, `Outcome`, existing local `Order` rows, `ReferenceQuoteSnapshot` fallback | No frontend-only mock. Proof rows use the same `ReferenceOrderbookDepthSnapshot` shape intended for future provider ingestion | Real provider CLOB fetcher is still missing. Real World Cup compact markets still need provider mapping. |
| Compact live-detail provider ladder summary | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `markets[].providerOrderbookDepth`, `markets[].orderbookDepthSource`, `contract.batchedProviderOrderbookDepthSource`, ready/stale/refresh-due counts | Same provider depth table plus compact selected `Market`/`Outcome` rows | No mobile local fixture. The adapter continues to consume backend route depth | The UI does not yet display a provider-specific ladder source label; it shows route depth. |

Cycle CT implementation notes:

- `ReferenceOrderbookDepthSnapshot` stores durable provider ladder rows separately from local orders and top-quote snapshots.
- `buildPublicOrderbookSnapshot()` source precedence is now local orders, provider ladder snapshots, provider quote top-of-book estimates, then empty.
- Local proof applied the Cycle CT SQL directly because the workstation database has migration-history drift.

## Cycle CS - Provider Quote Top-Of-Book Depth Bridge

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider quote top-of-book depth bridge | `/api/orderbook/:marketId/book?maxLevels=...` | GET | Optional public viewing | None | `depthSource`, `depthReason`, `providerQuoteDepth.levelCount`, `providerQuoteDepth.sizeSource`, `providerQuoteDepth.isEstimatedSize`, `emptyState`, `levels[]`, `bids[]`, `asks[]`, `providerQuoteSnapshot.status` | Reads local open `Order` rows first; if no local ladder exists, reads `ReferenceQuoteSnapshot.bestBid`, `bestAsk`, `liquidityClob`, `liquidity`, `volume24hr`, and `volume` | No frontend-only mock. Provider top levels are generated only when provider snapshots expose prices plus liquidity/volume basis; otherwise the route keeps `emptyState=no-depth` | Full provider CLOB depth ladder is still missing. Cycle CS exposes truthful top-of-book provider quote depth only. |
| Server-hydrated EventDetail depth state | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `markets[].orderbookDepth[]`, `markets[].outcomes[].bestBidSize`, `bestAskSize`, selected event `orderbookDepthSource=orderbook-route`, `orderbookDepthStatus=ready`, `orderbookAvailability` | Same selected `Market`, `Outcome`, `ReferenceQuoteSnapshot`, and local `Order` rows | No mobile local fixture. Adapter preserves backend route depth when route returns it | Samsung tablet proof passed for the scoped provider quote bridge after reconnect. |

Cycle CS implementation notes:

- The provider quote depth bridge is intentionally labeled `provider-quote-snapshot`, not full provider orderbook depth.
- Size is estimated from provider liquidity fields and exposed through `providerQuoteDepth.isEstimatedSize=true`.
- Route proof and Samsung tablet proof passed for the scoped provider quote bridge.

## Cycle CR - Provider-Owned Refresh And Cache Invalidation

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Real provider-owned compact live refresh | `/api/mobile/events/:slug/provider-refresh` | POST | Internal admin key or admin session | Optional `expireFirst`, `staleSeconds`, `allowContractProofFallback` | `refresh.provider.attempted`, `refresh.providerMappedMarketCount`, `refresh.provider.snapshotsUpdated`, `refresh.provider.refreshedCount`, `refresh.provider.skippedCount`, `refresh.contractProofFallback.applied`, `refresh.postRefresh.readyCount`, `refresh.postRefresh.staleCount`, `refresh.postRefresh.refreshDueCount`, `cacheInvalidation.invalidated`, `cacheInvalidation.errors` | Reads `Event`, compact `Market`, active `Outcome`; writes `ReferenceQuoteSnapshot`; calls Polymarket Gamma using provider-owned `Market.externalSlug` / `externalMarketId` and `Outcome.referenceTokenId` identity | Explicit fallback remains opt-in. Cycle CR proof used `allowContractProofFallback=false`, so no local contract-proof fallback was applied | Real World Cup compact soccer event still lacks provider mappings for all compact markets; proof used a disposable mapped provider market. |
| Refreshed compact live-detail consumption | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `contract.batchedProviderQuoteSnapshotReadyCount`, `batchedProviderQuoteSnapshotStaleCount`, `batchedProviderQuoteSnapshotRefreshDueCount`, `markets[].providerQuoteSnapshot.status`, `shouldRefresh`, `refreshKey`, provider best bid/ask fields surfaced by mobile | Reads `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, and local order/depth data where available | No frontend-only mock. Missing rows report unavailable/stale instead of fake readiness | Provider-owned quote snapshots do not currently create local orderbook depth ladders. |
| Selected orderbook after provider refresh | `/api/orderbook/:marketId/book?maxLevels=2` | GET | Optional public viewing | None | `providerQuoteSnapshot.status`, `shouldRefresh`, `refreshKey`, `snapshotCount`, `bestBid`, `bestAsk`, `levels[]`, `emptyState` | Reads selected `Market`, `Outcome`, `ReferenceQuoteSnapshot`, and open `Order` rows for local ladder depth | No fake depth is created; Cycle CR tablet proof shows provider best bid/ask with no local depth | Need a future provider/orderbook bridge if product requires provider-owned depth ladders, not only top quote snapshots. |
| Disposable provider proof setup | `scripts/prepare_mobile_provider_refresh_proof_event.ts` | Local script | Local development only | Optional `--providerSlug`, `--eventSlug`, `--output` | Proof artifact with `eventSlug`, `providerSlug`, `eventId`, `marketId`, `conditionId`, `outcomeCount`, `snapshotCount`, `staleFetchedAt` | Upserts disposable `Event`, `Market`, `Outcome`, and stale `ReferenceQuoteSnapshot` rows using real Gamma market identity | Fixture rows match the provider data contract and are intentionally disposable | Replace disposable proof setup with real World Cup provider import once soccer market provider slugs are confirmed. |

Cycle CR implementation notes:

- The provider refresh route now owns cache invalidation for the compact live-detail route, public event route, and affected orderbook routes through `next/cache` `revalidatePath`.
- The response is marked `no-store` so the refresh result itself is not cached.
- The proof route changed from stale/refresh-due to ready after real provider refresh, with `fallbackApplied=false`.

## Cycle CQ - Manual Provider Slug Preview Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Manual compact-market provider slug preview | `/api/mobile/events/:slug/provider-candidates` | POST | Internal admin key or admin session | `marketId`, `slugs[]` | `mode`, `marketId`, `requestedSlugs`, `providerError`, `candidateCount`, `bestCandidate`, `attachProposal`, `attachReadyCandidateCount`, `nextRequiredAction` | Reads compact `Event`, `Market`, `Outcome`; provider preview uses Polymarket Gamma `/markets?slug=...`; does not write DB | None. The route returns explicit provider errors instead of fake candidates | Current proof environment still returns `fetch failed` for Gamma fetch, so real provider candidate preview remains open. |

Cycle CQ implementation notes:

- The route is protected because successful previews can expose provider market IDs, condition IDs, and token IDs.
- The route is read-only and prepares data for the existing provider identity attach endpoint.

## Cycle CP - Provider Candidate Discovery Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live provider candidate discovery | `/api/mobile/events/:slug/provider-candidates` | GET | Internal admin key or admin session | Query params: `marketId`, `fetchProvider`, `maxCandidatesPerMarket` | `result.targets[].queries`, `candidateCount`, `providerError`, `candidates[]`, `bestCandidate`, `attachProposal.mapping`, `attachReadyCandidateCount`, `nextRequiredAction` | Reads compact `Event`, `Market`, `Outcome`; provider search uses Polymarket Gamma `/markets` and maps candidate fields to the existing attach contract shape | `fetchProvider=false` returns query contract only and does not call Gamma | In this run, provider fetch returned `fetch failed` for all 14 compact targets. Real provider identity import remains open. |

Cycle CP implementation notes:

- The route is protected because it can expose provider identity candidates and token IDs.
- The route never mutates `Market`, `Outcome`, or `ReferenceQuoteSnapshot`; it only prepares reviewable candidate and attach-proposal data.

## Cycle CO - Provider Identity Attach Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live provider identity attach | `/api/mobile/events/:slug/provider-mapping` | POST | Internal admin key or admin session | `dryRun`, `confirmApply`, `mappings[].marketId`, `referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `mappings[].outcomes[].outcomeId`, `referenceTokenId`, `referenceOutcomeLabel` | `result.validation.valid`, `errors[]`, `before.providerRefreshableMarketCount`, `after.providerRefreshableMarketCount`, `applied` | `Event`, compact `Market`, active `Outcome`; writes `Market.referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `Outcome.referenceTokenId`, `referenceOutcomeLabel` only when confirmed | Dry-run projection uses future-backend-shaped IDs and does not mutate local DB | Real provider candidate discovery/import for every compact World Cup live market remains missing. |

Cycle CO implementation notes:

- POST defaults to dry-run to prevent accidental fake provider mapping.
- A real write requires `dryRun=false` plus `confirmApply=true`, and each mapped compact market must include every active compact outcome.

## Cycle CN - Provider Mapping Readiness Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live provider mapping readiness | `/api/mobile/events/:slug/provider-mapping` | GET | Internal admin key or admin session | None | `readiness.compactMarketCount`, `providerRefreshableMarketCount`, `unsupportedSourceMarketCount`, `missingOutcomeTokenMarketCount`, `isProviderRefreshReady`, `nextRequiredAction`, `markets[].missingFields`, `markets[].outcomes[].missingFields` | `Event`, compact `Market`, active `Outcome`; required provider fields are `Market.referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `Outcome.referenceTokenId`, and `referenceOutcomeLabel` | None. The route is a readiness gate and must not fabricate provider identity. | Current local World Cup compact event has 14 compact markets but 0 provider-refreshable markets. |
| Compact live provider refresh blocked state | `/api/mobile/events/:slug/provider-refresh` | POST | Internal admin key or admin session | optional `allowContractProofFallback` | `refresh.mappingReadiness`, `providerMappedMarketCount`, `unsupportedMarketCount`, `provider.attempted`, `contractProofFallback` | Same compact `Market`/`Outcome` identities plus `ReferenceQuoteSnapshot` when refresh can run | Fallback remains opt-in and was not used in the no-fallback proof | Real no-fallback refresh still requires imported Polymarket or production sports-provider market/outcome identities. |

Cycle CN implementation notes:

- The mapping readiness route is protected because it exposes provider identity and missing provider-token fields.
- This cycle is intentionally a structural gate. It prevents UI parity cycles from claiming provider readiness while compact live markets remain unmapped.

## Cycle CM - Provider Refresh Execution Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live provider refresh execution | `/api/mobile/events/:slug/provider-refresh` | POST | Internal admin key or admin session | `expireFirst`, `staleSeconds`, `allowContractProofFallback` | `expired.expiredSnapshotCount`, `refresh.provider.attempted`, `snapshotsUpdated`, `unsupportedMarketCount`, `contractProofFallback`, `postRefresh.snapshotCount` | `Event`, compact `Market`, `Outcome`, `ReferenceQuoteSnapshot`; real refresh path uses Polymarket Gamma via `refreshPolymarketReferenceSnapshots()` | Explicit `allowContractProofFallback=true` can upsert future-backend-shaped rows only for local QA after the real provider mapping is reported unsupported | Current local World Cup compact event has `referenceSource=fifa_schedule`, so real Polymarket Gamma mapping is missing. |
| Live-detail stale-to-ready proof | `/api/mobile/events/:slug/live-detail` and `/api/orderbook/:marketId/book?maxLevels=2` | GET | Optional public viewing | None | `batchedProviderQuoteSnapshotReadyCount`, `StaleCount`, `RefreshDueCount`, selected `providerQuoteSnapshot.status`, `shouldRefresh`, `refreshKey` | Same `ReferenceQuoteSnapshot` rows and selected `Order` depth rows | No frontend-only mock data; fallback writes the same provider snapshot table shape | Real provider refresh cannot complete until compact markets are imported/mapped from Polymarket or another sports odds provider. |

Cycle CM implementation notes:

- The route is protected because provider refresh mutates backend snapshot state.
- This cycle proves cache invalidation and refresh-state transitions, but it does not claim full real-provider parity for the local fixture event.

## Cycle CL - Provider Refresh Policy Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live-detail provider refresh policy | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `contract.batchedProviderQuoteSnapshotReadyCount`, `batchedProviderQuoteSnapshotStaleCount`, `batchedProviderQuoteSnapshotRefreshDueCount`, `batchedProviderQuoteSnapshotNextRefreshAt`, plus existing provider snapshot source/count | `ReferenceQuoteSnapshot` rows joined to compact `Market`/`Outcome` pairs | If snapshot rows are absent, counts remain zero and per-market snapshots report unavailable with `shouldRefresh=true` | Real provider-owned refresh execution, cache invalidation, and external error classification. |
| Selected orderbook provider refresh policy | `/api/orderbook/:marketId/book?maxLevels=...` | GET | Optional public viewing | None | `providerQuoteSnapshot.refreshTtlSeconds`, `nextRefreshAt`, `shouldRefresh`, `refreshKey`, `status`, `stalenessSeconds`, `levels[]` | `ReferenceQuoteSnapshot`, `Market`, `Outcome`, open `Order` rows | Deterministic local proof rows are future-backend-shaped and keyed by `marketId`/`outcomeId`/`source`; route stays truthful when rows are missing or stale | Real external provider ingestion should update rows continuously and own invalidation/update sequence. |
| Provider refresh policy proof | `mobile:live-provider-quote-snapshot-seed` plus direct route probe | Local script / GET routes | Local development only | `--eventSlug`, `--summaryPath`, `--apply` | Seed artifact plus route proof showing 14 ready markets, refresh TTL 60s, next-refresh timestamp, and selected second-half book policy | `ReferenceQuoteSnapshot` | N/A | Replace deterministic proof rows with real provider feed once production ingestion is in scope. |

Cycle CL implementation notes:

- This cycle does not invent frontend-only refresh state; it exposes refresh policy from backend-shaped provider snapshot rows.
- It is still a partial PM-GAP-067 pass because the actual provider refresh worker/cache invalidator does not exist yet.

## Cycle CK - Live Provider Quote Snapshot Ready Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live-detail provider snapshot ready proof | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `contract.batchedProviderQuoteSnapshotSource`, `contract.batchedProviderQuoteSnapshotMarketCount`, `markets[].providerQuoteSnapshot.status`, `snapshotCount`, `acceptingOrders` | `ReferenceQuoteSnapshot` rows seeded for compact `Market`/`Outcome` pairs | Deterministic local rows are future-backend-shaped and keyed by `marketId`, `outcomeId`, and `source` | Real external provider ingestion/refresh still missing. |
| Selected second-half orderbook provider snapshot ready proof | `/api/orderbook/:marketId/book?maxLevels=2` | GET | Optional public viewing | None | `providerQuoteSnapshot.source`, `status`, `snapshotCount`, `latestFetchedAt`, `acceptingOrders`, `levels[]` | Same `ReferenceQuoteSnapshot` rows plus open `Order` rows for depth | If snapshot rows are absent, route truthfully reports `unavailable`; Cycle CK proves the ready path | Provider cache invalidation/update sequence and provider-owned depth ladders remain missing. |
| Provider-shaped proof seed | `mobile:live-provider-quote-snapshot-seed` | Local script | Local development only | `--eventSlug`, `--summaryPath`, `--apply` | Summary artifact: compact market count, provider snapshot row count, upsert count, market preview | `ReferenceQuoteSnapshot`, compact live `Market`, active `Outcome` | N/A | Replace deterministic proof rows with real provider refresh when external ingestion is in scope. |

Cycle CK implementation notes:

- This cycle proves the same contract added in Cycle CJ can move into a ready state for all 14 compact live markets.
- It does not mark backend provider parity complete because the rows are deterministic local proof data.

## Cycle CJ - Provider Quote Snapshot Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected orderbook provider snapshot status | `/api/orderbook/:marketId/book?maxLevels=...` | GET | Optional public viewing | None | `providerQuoteSnapshot.source`, `status`, `snapshotCount`, `latestFetchedAt`, `latestUpdatedAt`, `stalenessSeconds`, `staleAfterSeconds`, `isStale`, `acceptingOrders`, `outcomeIds`, `sources`, `reason` | `ReferenceQuoteSnapshot` joined by `marketId` and optional `outcomeId`; existing open `Order` rows for depth | If no provider rows exist, route returns `status: unavailable` rather than fake readiness | Provider ingestion must write current World Cup live quote snapshots. |
| Compact live-detail provider snapshot status | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `markets[].providerQuoteSnapshot`, `contract.batchedProviderQuoteSnapshotSource`, `contract.batchedProviderQuoteSnapshotMarketCount` | Compact `Market` rows, active `Outcome` rows, open `Order` rows, optional `ReferenceQuoteSnapshot` rows | Existing local/proof depth still renders; provider snapshot metadata can be unavailable | Provider-owned cache/invalidation and live liquidity remain missing. |

Cycle CJ implementation notes:

- This cycle uses the existing `ReferenceQuoteSnapshot` schema instead of inventing frontend-only provider state.
- The public route intentionally excludes sensitive/provider-internal fields such as token IDs, external market IDs, condition IDs, credentials, owners, and users.

## Cycle CI - Depth Batching Policy Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live-detail depth policy metadata | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `contract.generatedAt`, `contract.maxMarkets`, `contract.marketCount`, `contract.batchedOrderbookDepthRequestedMarketCount`, `contract.batchedOrderbookDepthRequestedMarketIds`, `contract.batchedOrderbookDepthMaxLevels`, `contract.batchedOrderbookDepthCacheTtlSeconds`, plus existing `markets[].orderbookDepth[]` and outcome quote fields | Selected compact `Market` rows, active `Outcome` rows, open `Order` rows through `buildPublicOrderbookSnapshot()` | Local rows still render without provider depth; policy metadata stays present for route-backed compact responses | Real provider cache/invalidation layer, provider snapshot status per market depth response, and provider-owned liquidity ingestion remain missing. |
| Visible depth regression proof | Samsung tablet smoke against server-backed live detail | GET / device proof | Optional public viewing | None | `event-detail-market-depth-second-half-winner`, `market-depth-batched`, selected orderbook `orderbook-source-orderbook-route` | Same as above, with selected second-half market `ed121b08-88bd-4735-9793-64a0022e9696` | N/A | Need provider-scale batching/prefetch implementation behind the documented policy shape. |

Cycle CI implementation notes:

- This cycle reduces PM-GAP-067's repeated production batching/prefetch debt by defining and testing route-level limits, requested market IDs, max depth levels, generated time, and TTL.
- It does not mark backend parity complete because the route still uses current route-backed/local open orders rather than a provider cache with invalidation.

## Cycle CH - Batched Live Market Depth Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live market depth batching | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `contract.batchedOrderbookDepthSource`, `contract.batchedOrderbookDepthMarketCount`, `markets[].liquidity`, `markets[].orderbookDepth[]`, `markets[].outcomes[].bestBid`, `bestAsk`, `bestBidSize`, `bestAskSize` | Selected compact `Market` rows, active `Outcome` rows, open `Order` rows through `buildPublicOrderbookSnapshot()` | Local rows still render without `Route depth` when no server depth exists | Provider-owned liquidity ingestion and production-scale batching/prefetch policy remain missing. |
| Visible row batched-depth proof | Samsung tablet smoke against server-backed live detail | GET / device proof | Optional public viewing | None | `event-detail-market-depth-second-half-winner`, `market-depth-batched`, selected orderbook `orderbook-source-orderbook-route` | Same as above, with selected second-half market `ed121b08-88bd-4735-9793-64a0022e9696` | N/A | Need all visible provider markets to have live provider liquidity, not only seeded proof markets. |

Cycle CH implementation notes:

- This cycle closes a structural gap: compact live-detail no longer limits route-backed depth to the primary market.
- Direct route probe showed 14 compact markets and 6 markets with batched route-backed depth in local proof data.
- PM-GAP-067 remains open for real provider ingestion, provider-owned live stats only if product keeps that tab, production batching/prefetch, and provider-wide liquidity for all line markets.

## Cycle CG - Second-Half Orderbook Depth Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected second-half orderbook proof | `/api/orderbook/:marketId/book?maxLevels=24` for second-half winner market `ed121b08-88bd-4735-9793-64a0022e9696` | GET | Optional public viewing | None | `marketId`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total`, `availability.status` | Open `Order` rows from deterministic depth seed, selected `Market(period=second-half)`, active `Outcome` rows | N/A | Provider-owned live liquidity remains required before backend parity can be marked complete. |
| Second-half seed/proof harness | `mobile:live-second-half-orderbook-depth-seed` and `smoke:tablet:server-live-second-half-order-book` | Local scripts / device proof | Local development only | `--eventSlug`, `--period=second-half`, `--summaryPath`, `--apply` | Summary artifact records event, market id, market type, period, outcome ids, created order count, and depth preview | `Market`, `Outcome`, `User`, `Order` | N/A | Real provider market discovery/ingestion should own second-half pricing and market freshness. |

Cycle CG implementation notes:

- This cycle closes the repeated second-half separate depth proof debt left by Cycle CF.
- Halves orderbook parity is now proven for both first-half and second-half selected period markets.
- PM-GAP-067 remains open for real provider ingestion, provider-owned live stats, production batching/prefetch, and provider-wide liquidity for all line markets.

## Cycle CF - Halves Orderbook Depth Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live first/second-half winner markets | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `markets[].id`, `marketType: match_winner_1x2`, `period: first-half/second-half`, `marketGroupKey: halves`, `availability`, `outcomes[]` | `Event`, `Market.period`, `Market.marketGroupKey`, `Outcome`, `Market.sourceUpdatedAt` | Local Halves rows remain fallback-only when server markets are unavailable | Real provider market discovery/ingestion should create/update half-period markets. |
| Selected first-half orderbook proof | `/api/orderbook/:marketId/book?maxLevels=24` for first-half winner market `be4ab6f8-c054-4f6b-a6d9-7d857f7655ca` | GET | Optional public viewing | None | `marketId`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total`, `availability.status` | Open `Order` rows from deterministic depth seed, selected `Market`, active `Outcome` rows | N/A | Provider-owned live liquidity remains required before backend parity can be marked complete. |
| Halves seed harness | `mobile:live-halves-markets-seed` and `mobile:live-first-half-orderbook-depth-seed` | Local scripts | Local development only | `--eventSlug`, `--period=first-half`, `--summaryPath`, `--apply` | Summary artifacts record event, half markets, market ids, period, outcome ids, order depth preview | `Market`, `Outcome`, `User`, `Order` | N/A | Current database lacks a usable `Outcome(marketId, code)` conflict target, so the seed uses find-then-update. Production migration should confirm the intended constraint. |

Cycle CF implementation notes:

- This cycle closes the selected Halves proof item that was repeatedly deferred under PM-GAP-067.
- Halves are now backend-shaped and period-addressable instead of ad hoc local UI rows.
- PM-GAP-067 remains open for real provider ingestion, provider-owned live stats, production batching/prefetch, and all-line provider liquidity. Second-half separate depth proof is closed in Cycle CG.

## Cycle CE - Compact Market Availability Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible live line-market availability | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `markets[].availability.source`, `status`, `marketStatus`, `lastUpdated`, `stalenessSeconds`, `staleAfterSeconds`, `isStale`, `isSuspended`, `isDelayed`, `reason`; existing market `id`, `marketType`, `period`, `line`, outcomes | `Market.status`, `Market.sourceUpdatedAt`, `Market.updatedAt`, `Market`, `Outcome`; selected primary depth still uses open `Order` rows | Local fixtures may omit availability; server mode uses route-shaped `availability` when present | Real provider heartbeat/ingestion must update per-market timestamps/status before fresh provider parity can pass. |
| Team Totals pre-open availability proof | Samsung tablet smoke against server-backed live detail | GET / device proof | Optional public viewing | None | `event-detail-market-availability-team-total-goals`, `market-availability-stale`, `market-status-LIVE`, selected book `orderbook-availability-stale` | Same as above plus selected Team Totals orderbook rows | N/A | Provider-owned availability and all-line refresh remain missing. |

Cycle CE implementation notes:

- This cycle closes the repeated compact-route per-visible-market availability gap without inventing frontend-only state.
- The fixture/proof shape matches the intended backend contract, so future provider ingestion can replace the timestamp source without changing the mobile UI contract.
- PM-GAP-067 remains open for real provider ingestion, provider-owned live stats, selected Halves proof, and provider-wide live liquidity.

## Cycle CD - Selected Orderbook Availability Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected market orderbook availability | `/api/orderbook/:marketId/book?maxLevels=24` | GET | Optional public viewing | None | `availability.source`, `status`, `marketStatus`, `lastUpdated`, `stalenessSeconds`, `staleAfterSeconds`, `isStale`, `isSuspended`, `isDelayed`, `reason`; existing `levels[]` depth | `Market.status`, `Market.sourceUpdatedAt`, `Market.updatedAt`, open `Order` rows | Existing fallback orderbook data remains display-only when server mode is unavailable; server mode now exposes selected-market availability | External provider heartbeat/ingestion should own `sourceUpdatedAt` updates before production parity. |
| Selected Team Totals stale-state proof | `/api/orderbook/408ffb79-3492-4fd0-b31b-87a26f8b9dd5/book?maxLevels=2` and tablet smoke | GET / device proof | Optional public viewing | None | `availability.status: stale`, `marketStatus: LIVE`, route-backed bid/ask levels | Same as above | N/A | Need provider refresh path to turn stale live line books into ready/fresh state. |

Cycle CD implementation notes:

- This cycle closes the selected-market availability contract gap without pretending stale data is fresh.
- The proof shows a Polymarket-like distinction: the Team Totals market has depth but its source timestamp is stale.
- PM-GAP-067 remains open for real provider ingestion, per-line provider status sourced externally, provider-owned live stats, and broader liquidity.

## Cycle BC - Live Provider Freshness Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live event provider freshness | `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | `event.liveDataStatus.source`, `status`, `lastUpdated`, `stalenessSeconds`, `staleAfterSeconds`, `isStale`, `isSuspended`, `isDelayed`, `reason`; `contract.liveDataStatus` | `MarketOutcomeSnapshot` rows provide proof timestamps; `Event.metadata.mobileLiveDetail.liveDataStatus` can override provider state | If no timestamp or metadata exists, route returns `status: unavailable` instead of inventing fresh data | Real provider heartbeat/ingestion route and per-market/per-line availability fields remain missing. |
| Live game UI freshness proof | Server-backed mobile event detail | Client render | Optional viewing | None | Mobile `Event.liveDataStatus` displayed as `event-detail-live-data-inline live-data-status-* live-data-source-*` | Same route contract | Local event fixtures only omit this field; server mode displays it when present | Per-market status beside each adjustable line remains future work. |

Cycle BC implementation notes:

- This cycle closes the repeated unknown-contract part of provider freshness for live event detail.
- The contract is future-backend-shaped and uses stable fields that can be replaced by provider ingestion later.
- PM-GAP-067 remains in progress for real provider ingestion, provider-owned live stats, per-line freshness, and all-line liquidity.

## Cycle BB - Selected Team Totals Ready Depth

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected Team Totals orderbook with ready depth | `/api/orderbook/:marketId/book?maxLevels=24` for market `408ffb79-3492-4fd0-b31b-87a26f8b9dd5` | GET | Optional public viewing | None | `marketId`, `emptyState: null`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total` | Open `Order` rows for selected `team_total_goals` market through `buildPublicOrderbookSnapshot()` | Local Team Total rows remain fallback only when server mode is unavailable | Real provider liquidity ingestion and freshness/stale/suspended metadata remain missing. |
| Team Totals market-type normalization | Compact live event markets from `/api/mobile/events/:slug/live-detail` | GET | Optional public viewing | None | backend `marketType: team_total_goals`, `line: 1.5`, outcome ids/sides/prices | `Market`, `Outcome` | Adapter aliases backend type to mobile `team-total` contract | Canonical market-type alias list should be documented before production ingestion. |
| Targeted Team Totals depth seed harness | `mobile:live-team-totals-orderbook-depth-seed` | Local script | Local development only | `--eventSlug`, `--marketType=team_total_goals`, `--line=1.5`, `--summaryPath`, `--apply` | Summary artifact records event, market id/type/group/line, outcome ids, created order count, and preview rows | `User`, `Order`, `Market`, `Outcome` | N/A | Provider-owned live liquidity remains required for production parity. |

Cycle BB implementation notes:

- This cycle closes selected Team Totals ready-depth proof after Cycle BA reserved Team Totals in the compact route.
- The proof uses stable backend market/outcome ids and public orderbook route fields, not frontend-only mock data.
- PM-GAP-067 remains in progress for provider ingestion, Halves selected depth, and freshness/stale/suspended states.

## Cycle BA - Compact Line Group Coverage And Totals Ready Depth

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live game line group coverage | `/api/mobile/events/:slug/live-detail` | GET | Optional for public viewing; bearer token may be sent by runtime client | None | `markets[].id`, `marketType`, `marketGroupKey`, `line`, `period`, `outcomes[]`; route now reserves representative primary, Spread, Totals, and Team Total markets | `Event`, `Market`, `Outcome`; selected compact markets are still capped by mobile payload budget | Local line groups remain fallback only when server mode is unavailable | Provider/live availability states and broader market pagination remain missing. |
| Selected Totals line orderbook with ready depth | `/api/orderbook/:marketId/book?maxLevels=24` for market `a552efe6-3147-4573-be95-8fe15c068c08` | GET | Optional public viewing | None | `marketId`, `emptyState: null`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total` | Open `Order` rows for the selected `total_goals` market through `buildPublicOrderbookSnapshot()` | Existing local Totals rows are only display fallback; server proof uses backend `total_goals` market identity | Real provider liquidity ingestion, market freshness, and selected Team Total/Halves depth proof remain missing. |
| Targeted Totals depth seed harness | `mobile:live-totals-orderbook-depth-seed` | Local script | Local development only | `--eventSlug`, `--marketType=total_goals`, `--line=2.5`, `--summaryPath`, `--apply` | Summary artifact records event, market id/type/group/line, outcome ids, created order count, and preview rows | `User`, `Order`, `Market`, `Outcome` | N/A | Provider-owned live liquidity remains required for production parity. |

Cycle BA implementation notes:

- This cycle fixes a backend/mobile contract mismatch: the server used `total_goals`, while the UI group is labeled Totals.
- The compact route now keeps representative rendered line groups instead of spending the whole cap on many Spread rows.
- PM-GAP-067 remains in progress because seeded Totals depth is proof data, not external provider liquidity.

## Cycle AZ - Selected Line Market Seeded Ready Depth

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected Spread line orderbook with ready depth | `/api/orderbook/:marketId/book?maxLevels=24` for market `ac527022-07f3-4abb-90f0-b291466e8459` | GET | Optional for public viewing; bearer token may be sent by runtime client | None | `marketId`, `generatedAt`, `emptyState: null`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total` | `Market`, `Outcome`, open `Order` rows created by the deterministic seed harness and read through `buildPublicOrderbookSnapshot()` | Existing local/embedded depth remains fallback only when server mode or route depth is unavailable | Real provider liquidity ingestion and freshness/stale/suspended metadata for all line markets remain missing. |
| Targeted line-depth seed harness | `mobile:live-spread-orderbook-depth-seed` running `scripts/seed_mobile_live_orderbook_depth.ts --marketType=spread --line=1.5` | Local script | Local development only | Optional `--eventSlug`, `--marketId`, `--marketType`, `--line`, `--summaryPath`, `--apply` | Summary artifact records event id/slug/title, selected market id/title/type/group/line, outcome ids, created/deleted order counts, and preview bid/ask rows | `User`, `Order`, `Market`, `Outcome` | N/A | Provider-owned orderbook ingestion remains required before backend parity can be marked complete. |

Cycle AZ implementation notes:

- This cycle uses backend-shaped proof liquidity: every displayed bid/ask row maps to stable `marketId`, `outcomeId`, `side`, `price`, `shares`, and `total` fields from the public orderbook route.
- The tablet proof moves the selected Spread line market from `empty/no-depth` to `ready` route-backed depth while preserving selected market identity.
- PM-GAP-067 remains in progress because the real route/schema/provider pipeline still needs continuous live liquidity and availability state across all line-market groups.

## Cycle AY - Selected Line Market Depth Identity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected live line market order book | `/api/orderbook/:marketId/book?maxLevels=24` through `PolyApi.getOrderbook()` and `loadMarketDepthState(api, event, marketId)` | GET | Optional for public viewing; bearer token may be sent by runtime client | None | `marketId`, `generatedAt`, `emptyState`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total` | `Market`, `Outcome`, open `Order` rows through `buildPublicOrderbookSnapshot()` | UI keeps showing the selected market and truthful route empty state when no backend depth exists | Seeded/provider liquidity is still missing for most spread/totals/team-total line markets. |
| Live game order-book state identity | Client state plus orderbook route | Client state -> GET | Optional viewing | None | `orderbookDepthMarketId`, `orderbookDepthSource`, `orderbookDepthStatus`, `orderbookDepthEmptyState` | Same orderbook route plus selected mobile `Market.id` | Local fixtures remain fallback only when server mode is unavailable | Need on-demand depth hydration for every market group and a provider/source freshness model before production parity. |

Cycle AY implementation notes:

- This cycle closes a repeated structural ambiguity: the app can now prove which market id its order-book state belongs to.
- Empty depth is a valid backend state and is now visible for unseeded line markets instead of falsely reusing primary-market route depth.
- Backend parity is still incomplete until real or seeded liquidity exists for line markets beyond the primary winner market.

## Cycle AX - Compact Live Detail Route And Route-Backed Depth Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live game detail | `/api/mobile/events/:slug/live-detail` through `PolyApi.getEvent()` compact-first fallback | GET | Optional for public viewing; bearer token may be sent by runtime client | None | `event.id`, `event.slug`, `event.title`, `event.status`, `event.startsAt`, `event.teams[]`, `event.liveStats`, `event.chartHistory[]`, `markets[]`, `marketGroupId`, `marketType`, `period`, `line`, `outcomes[]`, outcome `id`/`side`/`probability`/`bestBid`/`bestAsk`, primary-market `orderbookDepth[]`, and `contract` metadata | `Event`, `Market`, `Outcome`, `MarketOutcomeSnapshot`, open `Order` rows through `buildPublicOrderbookSnapshot()` | Falls back to legacy `/api/events/:slug` if compact route fails; local fixtures remain last-resort app fallback | Real provider ingestion, provider-owned live stats, event-wide depth hydration, and richer suspended/stale states remain missing. |
| Live orderbook depth in game page | Embedded primary market `orderbookDepth[]` from the compact route | GET | Optional for viewing | None | `orderbookDepth[].outcomeId`, `side`, `price`, `shares`, `total`; EventDetail derives best bid/ask/spread and orderbook rows | `Order`, `Market`, `Outcome` | Existing fixture depth uses the same outcome-addressable shape | Full per-market depth on every compact market is intentionally not embedded yet; dedicated book route remains available for deeper views. |
| Backend event launch proof | Expo deep link `forceBackendEventSlug=<slug>` then `PolyApi.getEvent(slug)` | Client launch -> GET | Optional viewing; server mode uses API base URL | None | Compact route result normalized into selected event/ticket state | Same as compact live detail route | If compact route fails, `PolyApi.getEvent()` falls back to legacy route | Production/native route restoration should be revisited when Holiwyn moves from Expo Go to dev build/APK. |

Cycle AX implementation notes:

- This cycle closes the repeated mobile payload/depth proof gap for PM-GAP-067: the tablet now proves route-backed live orderbook depth on the actual game page instead of only backend route tests.
- The compact route avoids heavy quote fan-out by hydrating depth for the selected primary market and capping the market list to a mobile-sized subset.
- Backend parity is still not complete until real live-football provider data populates live stats, chart history, and market availability states continuously.

## Cycle AU - Live Chart Route States

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live game chart lifecycle state | `/api/markets/:marketId/chart?range=<1D\|1W>` through `PolyApi.getMarketChart()` | GET | Optional for public markets; bearer token may be sent by runtime client | None | `range`, `lastUpdated`, `emptyState`, `history[].outcomeId`, `history[].timestamp`, `history[].probability` | `Market`, `Outcome`, `MarketOutcomeSnapshot`, market visibility guard | Embedded/local chart history remains visible, but route status is now explicit as `loading`, `empty`, or `error` | Real provider ingestion and a live server-hydrated device proof are still missing. |

Cycle AU implementation notes:

- This cycle closes the silent-fallback part of the chart route gap: empty/error/loading route states are now user-visible and XML-auditable.
- No new schema or route is required for the basic lifecycle contract because `/api/markets/:marketId/chart` already exposes `emptyState`, `range`, and `lastUpdated`.
- Server proof still needs the Cycle AT seed harness or real provider snapshots when backend services are available.

## Cycle AT - Live Chart Snapshot Seeding Harness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Server-hydrated live chart proof data | Seed script writes `MarketOutcomeSnapshot`; mobile reads via `/api/markets/:marketId/chart?range=1D` and `/api/events/:slug` | Script plus GET routes | Script uses local backend database access; GET routes remain public-visible guarded | Script args: optional `eventSlug`, `baseTime`, `summaryPath`, `--apply` | Route consumers use `history[].outcomeId`, `history[].timestamp`, `history[].probability`, and `emptyState` | `Event`, `Market`, `Outcome`, `MarketOutcomeSnapshot` | Existing EventDetail fallback remains active when backend is unavailable or no snapshots exist | Real provider ingestion is still missing; Cycle AT only adds deterministic local/proof snapshot seeding. |

Cycle AT implementation notes:

- The seeding harness uses the same `MarketOutcomeSnapshot` table already consumed by event detail and chart routes.
- Fixture/dummy data is now future-backend-shaped because it is literally written as backend chart snapshot rows when the script can run.
- Backend/Docker was unavailable during proof, so the next active PM-GAP-067 cycle should run `npm run mobile:live-chart-snapshot-seed` and capture server-hydrated chart-source device XML once services are available.

## Cycle AS - Event Detail Chart Route Hydration

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible live event chart hydration | `/api/markets/:marketId/chart?range=<1D\|1W>` through `PolyApi.getMarketChart()` | GET | Optional for public markets; bearer token may be sent by runtime client | None | `history[].outcomeId`, `history[].timestamp`, `history[].probability`; mobile derives visible `event.chartHistory[]` and `chartHistorySource` | `Market`, `Outcome`, `MarketOutcomeSnapshot`, market visibility guard | EventDetail keeps embedded `/api/events/:slug` chart history and local fixture chart arrays when the chart route is empty or unavailable | Real live-football snapshot ingestion, loading/error/empty UI states, and server-hydrated tablet proof remain missing. |

Cycle AS implementation notes:

- This cycle consumes the Cycle AR chart contract inside the game page instead of leaving it as an unused client method.
- The fixture fallback remains allowed because it already uses backend-shaped `outcomeId`/`timestamp`/`probability` points.
- Backend parity is still incomplete until real live provider snapshots are present and a device proof shows `chartHistorySource: "market-chart-route"` from the server.

## Cycle AR - Range-Aware Market Chart Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected market chart/history | `/api/markets/:marketId/chart?range=<1D\|1W\|1M\|MAX>` through `PolyApi.getMarketChart()` | GET | Optional for public markets; visibility guard still applies | None | `marketId`, `range`, `ranges[]`, `generatedAt`, `lastUpdated`, `emptyState`, `outcomes[]`, `history[].outcomeId`, `history[].timestamp`, `history[].price`, `history[].probability`, compatibility `series` | `Market`, `Outcome`, `MarketOutcomeSnapshot`, market visibility/owner guard | Existing embedded `event.chartHistory` and local fixture arrays remain fallback until EventDetail consumes the route | Provider ingestion must write live snapshots; EventDetail still needs a UI integration cycle to replace local chart arrays with route data. |

Cycle AR implementation notes:

- This cycle closes the route/client-contract portion of the repeated chart-history gap.
- The endpoint remains public-safe and keeps the existing `series` field for web compatibility while adding mobile-ready `history[]`.
- Backend parity is still incomplete until real World Cup live market snapshots are ingested and device proof uses server-hydrated chart data.

## Cycle AQ - Live Chart History And Depth Identity Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live event chart history | `/api/events/:slug` | GET | Optional for viewing | None | `event.chartHistory[].outcomeId`, `timestamp`, `probability`; mobile filters by selected outcome id | `MarketOutcomeSnapshot`, `Market`, `Outcome`, `Event` | Event metadata `chartHistory` and local fixture chart arrays remain fallback when no snapshots exist | Real football provider ingestion and a range-aware dedicated history endpoint are still missing. |
| Live orderbook/depth identity | Embedded in `/api/events/:slug` market objects | GET | Optional for viewing | None | `orderbookDepth[].outcomeId`, `side`, `price`, `shares`, `total` plus outcome best bid/ask fields | Open `Order` rows through existing quote/orderbook aggregation; `Market`, `Outcome` | Fixture `orderbookDepth` uses the same outcome-addressable shape | Full depth ladder, timestamps, suspended/no-liquidity state, and per-market book range controls remain missing. |

Cycle AQ implementation notes:

- This cycle converts chart history from a metadata-only optional shape into a route-backed read model sourced from existing `MarketOutcomeSnapshot` rows.
- The route still falls back to metadata when snapshots are absent, which keeps fixture/server compatibility during provider rollout.
- Backend parity remains incomplete until live provider ingestion and dedicated/range-aware chart and depth routes exist.

## Cycle AP - Live Line Order Identity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live/line ticket submit | `/api/orders` through `PolyApi.placeLimitOrder()` | POST | Required in server mode; fake-token mock can run locally | `marketId`, `outcomeId`, `side`, `contractSide`, `price`, `size`, `selection.marketId`, `selection.outcomeId`, `selection.marketGroupId`, `selection.marketType`, `selection.line`, `selection.period`, `selection.side`, `selection.displayLabel` | order id/status/size/remaining/fills and preserved request metadata | `ApiOrderRequest.requestBody`, `Order`, `Market`, `Outcome` | Mock orders now also carry full `selection` identity | First-class `Order.selection`/`Trade.selection` columns do not exist yet; request-body reconstruction is the current bridge. |
| Portfolio open orders and positions | `/api/portfolio` | GET | Required for server portfolio; session fallback exists for web | `Authorization` bearer only | `positions[].selection` and `openOrders[].selection` with market/outcome/group/type/line/period/side/display label/contract side | `Position`, `Order`, `ApiOrderRequest`, `Market`, `Outcome`, `UserBalance` | Local Portfolio state uses the same `TicketSelection` shape | Filled position selection is inferred from market/outcome fields; exact submitted request metadata is only available for open orders. |
| Portfolio history/activity | `/api/portfolio/history` | GET | Required for server history; session fallback exists for web | `Authorization` bearer only | `canceledOrders[].selection`, `recentTrades[].selection` | `Order`, `ApiOrderRequest`, `Trade`, `Market`, `Outcome`, `LedgerEntry` | Local activity uses the same `TicketSelection` shape | Recent trades still infer selection from market/outcome schema because `Trade` has no direct order/request relation. |

Cycle AP implementation notes:

- This cycle closes the live line-order identity bridge for request, open order, canceled order, recent trade, position, and mobile Portfolio mapping.
- It intentionally avoids a schema migration by using existing `ApiOrderRequest.requestBody` and market/outcome line fields.
- A future backend cleanup can promote `selection` to first-class `Order`/`Trade` fields once the live market schema stabilizes.

## Cycle AO - Live Event Detail Backend Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live World Cup event detail | `/api/events/:slug` | GET | Optional for viewing; authenticated order routes later | None | `event.liveStats`, `event.chartHistory`, `market.id`, `marketGroupId`, `marketGroupKey`, `marketGroupTitle`, `marketType`, `period`, `line`, `liquidity`, `orderbookDepth[]`, `outcome.id`, `outcome.side`, `price`, `bestBid`, `bestAsk`, `bestBidSize`, `bestAskSize` | `Event.metadata` for optional provider-shaped `liveStats` and `chartHistory`; `Market.marketGroupKey`, `marketGroupTitle`, `marketType`, `period`, `line`; `Outcome.side`; `Order` depth through orderbook snapshot aggregation | Mobile local fixture remains fallback, but the mobile adapter now consumes the same route-shaped fields when server mode hydrates event detail | Real external live-football provider ingestion is still missing; event metadata must be populated before chart/live-stat panels show real values. |
| Live orderbook/depth | Embedded in `/api/events/:slug` market objects for top-level depth; existing dedicated book routes can still be used later for full depth | GET | Optional for viewing | None | `orderbookDepth[].outcomeId`, `side`, `price`, `shares`, `total`, plus outcome-level best bid/ask sizes | `Order` grouped open/partial orders through `buildPublicOrderbookSnapshot()` and `getOutcomeQuotes()` | Fixture `orderbookDepth` shape matches the embedded contract | Full depth by price ladder/range, depth timestamps, and no-liquidity/suspended states still need a dedicated route or richer embedded object. |
| Live ticket identity source | Event detail payload feeding existing ticket state | Client state, then existing order routes when submitting | Mock mode no auth; server submit requires API key | Future submit must preserve `marketId`, `outcomeId`, `marketGroupId`, `marketType`, `period`, `line`, `side`, amount, order side | selected event/market/outcome/line identity now survives backend route -> mobile adapter -> `EventDetail` model | Orders, positions, fills, open orders, activity/history | Existing fake-token ticket can open from backend-shaped live markets | Order submission/portfolio/history proof for live line markets is still PM-GAP-068 and not completed by this contract cycle. |

Cycle AO implementation notes:

- This cycle closes the repeated unknown-contract part of PM-GAP-067 for market groups, line identity, outcome side, top depth, and optional chart/live-stat payload shape.
- Backend parity is still not complete because real live-football provider ingestion, full chart history, and full depth routes are not implemented.
- The mobile adapter no longer drops backend market line identity, so future Samsung proof can test real route hydration instead of relying only on local fixture state.

## Cycle AN - Live Event Detail Structural Parity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live World Cup event detail | Intended `/api/events/:slug` live-detail payload or `/api/mobile/events/:slug/live-detail`; current cycle uses local fallback only | GET | Optional for viewing; authenticated order routes later | None | `event.id`, `title`, `status`, `startsAt`, `teams[]`, `markets[]`, `marketGroupId`, `marketId`, `marketType`, `period`, `line`, `outcomeId`, `side`, `probability`, `bestBid`, `bestAsk`, `liquidity`, `chartHistory`, `orderbookDepth`, `liveStats` | Events, teams, markets, market groups, line markets, outcomes, live score/state, quote snapshots, orderbook depth, market history, live stats | `worldCupEvents` live fixture now uses backend-shaped fields for Australia vs Egypt | Real backend route/schema does not yet provide grouped live game detail, live score, line markets, chart history, orderbook depth, or live stats. |
| Live ticket open | Client state from selected live market/outcome; existing order submit routes only after amount/order | Client state, then POST order when submitting | Mock mode no auth; server order mode requires API key | Future submit must include `marketId`, `outcomeId`, `marketGroupId`, `marketType`, `period`, `line`, `side`, amount, order side | selected event/market/outcome identity, live clock, quote/probability, line metadata | Orders, positions, fills, open orders, activity/history with live line identity | Tablet proof opens a live Australia ticket and preserves event/market/outcome in the ticket | Live order-to-portfolio/history identity is not yet re-proven with backend-shaped line fields. |
| Live chart/history | Intended `/api/markets/:marketId/history?range=live` or embedded event detail `chartHistory` | GET | Optional for viewing | None | timestamped `outcomeId`, probability/price points, range, lastUpdated | Market history, outcome price snapshots | Event `chartHistory` fixture feeds the chart series | No real chart-history route/schema currently backs mobile event detail. |
| Live orderbook/depth | Intended `/api/markets/:marketId/book` or embedded `orderbookDepth` | GET | Optional for viewing; authenticated for user-specific order actions | None | bid/ask levels with price, shares, total, spread, liquidity, lastUpdated | Order book, orders, liquidity/depth snapshots | Primary live market includes `orderbookDepth` fixture fields | Existing UI still partly uses local display rows; backend depth contract is not wired end to end. |
| Live stats | Intended `/api/events/:slug/live-stats` or embedded event detail `liveStats` | GET | Optional | None | stat id, label, home value, away value, timeline events, lastUpdated | Live match stats provider/cache | Event `liveStats` fixture feeds the Live stats panel | No real route/provider/schema for live football stats yet. |

Cycle AN implementation notes:

- This cycle intentionally does not mark backend parity complete.
- Frontend dummy data is now shaped like the intended backend contract, so future route integration can replace the fixture without changing the UI model.
- The next structural milestone should inspect Prisma/API support and implement or stub the real route/schema before more visual-only live-detail passes.

## Cycle T - Whole-App Navigation And Page Map

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home / World Cup discovery | `/api/events?category=sports&sportKey=soccer&leagueKey=world_cup&search=World+Cup` | GET | Optional; bearer token sent if runtime API key exists | None | `events[]`, event id/slug/title/status/startsAt/markets/outcomes/volume/liquidity/traders | Events, markets, outcomes, sports/league taxonomy | `worldCupEvents` local mock data if server hydration is unavailable | Backend should eventually expose Polymarket-style sports/category rail metadata and page-map ordering. |
| Event detail entry from navigation | `/api/events/:slug` | GET | Optional; bearer token sent if runtime API key exists | None | event detail, markets, outcomes, line/selection metadata when available | Events, markets, outcomes, market groups, lines | Local event detail mock data from `worldCupEvents` | Full page-map route metadata is not provided by backend. |
| Live tab | Same event list route with local live filtering today | GET | Optional | None | event status and live clock-like fields when available | Events, market status, live state | Local filtering of mock events where `status === "live"` | Backend should provide a dedicated live sports feed or `status=live` filter. |
| Portfolio tab | `/api/portfolio` and `/api/portfolio/history` when server mode is active | GET | Required for real user data; demo can run without auth in mock mode | None | wallet balance, positions, open orders, history/recent trades/canceled orders | Users, wallets, positions, orders, fills/trades, activities | Local fake 10000 USDT balance, local positions/open orders/activity | Auth/session model and production wallet are intentionally not complete. |
| Search tab | Same event list route with `search=<query>` | GET | Optional | None | filtered `events[]` | Events/search index, markets/outcomes | Local filtering over mock events/futures | Backend search ranking/categories are still thinner than Polymarket. |
| Account header entry | `/api/profile/preferences` when server mode and API key are available | GET/PUT | Required for server preferences; mock mode local only | PUT sends `ProfilePreferences` | language, ticket defaults, saved/profile preferences when supported | Users, profiles, preferences | Local AsyncStorage/preferences and mock signed-in state | Full auth, profile, KYC, wallet settings, notification settings are incomplete. |

Navigation-only implementation notes:

- This cycle does not add new backend calls.
- The main frontend state transition is `setMainTab()`.
- Account moved from bottom nav to header, but backend dependencies for account/profile remain unchanged.
- Polymarket reference shows Settings/profile outside the four bottom tabs, so future backend/profile work should treat account/settings as a top-level utility route rather than a primary market-browsing tab.

## Cycle U - Event Page Top Shell/Action Controls

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event detail top shell | `/api/events/:slug` through the existing event detail hydration path when server mode is active | GET | Optional; bearer token sent if runtime API key exists | None | event id/slug/title/status/startsAt, markets, outcomes, probabilities, prices, volume/liquidity/depth-like fields when present | Events, markets, outcomes | `worldCupEvents` local event detail data | Backend should expose enough metadata to identify primary market and top-shell context consistently. |
| Event Order Book overlay | No dedicated route in this cycle; derived from loaded market/outcome data | N/A | N/A | N/A | primary market title/outcomes, bestBid, bestAsk, bidSize/askSize or equivalent fallback values | Markets, outcomes, order book/depth snapshots, liquidity | Local deterministic depth rows from primary market outcomes | A dedicated live order-book/depth route is needed, for example `/api/markets/:id/book`, or included market depth snapshots in `/api/events/:slug`. |
| Event share sheet | No backend route | N/A | N/A | N/A | event title/slug and app-generated share copy/link | Events/shareable routes | Local share panel only | Production share links need canonical deep-link/web-link generation and localized copy. |

Cycle U implementation notes:

- This cycle does not create or modify backend routes.
- The top book action now maps to Order Book behavior, matching the Polymarket reference better than the previous watchlist notice.
- The future backend/schema milestone should treat order-book depth as a first-class data contract for mobile.

## Cycle V - Futures Market Rows

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Futures market rows | `/api/events?category=sports&sportKey=soccer&leagueKey=world_cup` when server discovery is active | GET | Optional; bearer token sent if runtime API key exists | None | future market id/title/type, outcome id/label/probability/color, volume/liquidity when available | Events, markets, outcomes, sports/league taxonomy | `worldCupFutures` local fallback data | Backend should expose complete futures outcome catalogs, outcome-level volume, and ordering. |
| Futures Buy Yes ticket | Existing ticket/order flow after local selection | Client state, then existing order routes when submitting | Auth required for server order submit; mock mode local | Ticket submit uses selected market/outcome/side/amount through existing order services | market id, outcome id, side, probability/price, liquidity/depth | Orders, positions, fills, wallets | Fake-token mock ticket and portfolio state | Route contracts need explicit binary YES/NO side semantics beyond generic buy/sell. |
| Futures Buy No button | No dedicated backend route in this cycle | N/A until submit | N/A | N/A | Uses selected outcome and `side: sell` approximation locally | Binary outcome order book, NO shares, order side model | Opens sell/no-side approximation | Backend/mobile contract needs true NO share or complementary-outcome order semantics. |

Cycle V implementation notes:

- This cycle does not create or modify backend routes.
- The mobile UI now expects outcome-level futures data that the backend should eventually own.

## Cycle AK - Futures Catalog Expansion

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Collapsed World Cup Winner futures catalog | `/api/events?category=sports&sportKey=soccer&leagueKey=world_cup` when server discovery is active | GET | Optional; bearer token sent if runtime API key exists | None | future market id/title/type, ordered outcomes, probability/price, outcome display label, volume/liquidity when available | Events, markets, outcomes, sports/league taxonomy | `worldCupFutures` now provides 21 local World Cup Winner outcomes and collapses to the first three plus `18 more` | Backend should own full futures catalogs, ordering, and the collapsed row count. |
| Expanded futures catalog | Same discovery/detail payload when available | GET | Optional | None | all outcomes for a futures market, stable outcome ids, yes/no price, outcome volume, visual metadata | Futures markets, outcomes, quote snapshots, market stats | Expanded local fallback list renders all 21 outcomes | Backend should return full outcome catalogs and pagination/expansion hints for large markets. |
| Expanded-row ticket open | Existing ticket/order state after local selection | Client state; existing order routes when submitting | Auth required for server submit; fake-token mock can run without auth | Ticket submit uses selected market/outcome/side/amount through existing order services | market id, outcome id, contract side, probability/price | Orders, positions, fills, wallets | England expanded-row Buy Yes opens fake-token ticket locally | Backend order/quote routes should accept canonical outcome ids from expanded futures catalogs. |

Cycle AK implementation notes:

- No backend route was created or changed.
- The mobile fallback catalog now mirrors the logged-in Polymarket collapse/expand structure, but backend discovery should eventually replace the static catalog and provide live ranking, prices, volume, and availability states.

## Cycle W - Futures Chart Range

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Futures chart/ranges | No dedicated route in this cycle; rendered from local future market/outcome data | N/A | N/A | N/A | outcome label, probability, color, market-level volume | Market history, outcome price history, time buckets | Local deterministic chart lines and local `selectedRange` state | Backend should expose market/outcome history series by range, for example `/api/markets/:id/history?range=1D`. |

Cycle W implementation notes:

- No backend route was created or changed.
- The future API should return timestamped probability/price points per outcome, volume per range, and unavailable/empty states.

## Cycle X - Match Market Tabs And Cards

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event detail market tabs/cards | `/api/events/:slug` through the existing event detail hydration path when server mode is active | GET | Optional; bearer token sent if runtime API key exists | None | event id/slug/title/status/startsAt, market groups, outcomes, probabilities, prices, volume/liquidity when available | Events, markets, market groups, outcomes, line markets | Local `worldCupEvents` detail data and local tab/card renderers | Backend should expose explicit market tabs/groups such as Game Lines, Exact Score, Halves, and Player Props. |
| Team to Advance card | No dedicated route in this cycle; derived from loaded event/primary outcome data | N/A | N/A | N/A | outcome label/probability/color, card volume, depth-like rows | Markets, outcomes, order book/depth snapshots | Local card volume `$60.9K Vol.` and deterministic depth rows | Backend should identify card type, card volume, outcome prices, and market depth for `Team to Advance`. |
| Inline card graph | No dedicated route in this cycle | N/A | N/A | N/A | selected card/outcome identity and local graph state | Market history, outcome history | Local inline graph text/visual state | Backend should provide chart/history data for card-level market detail. |
| Exact Score tab | `/api/events/:slug` if server event detail eventually includes exact-score group | GET | Optional | None | exact score outcomes, prices/probabilities, volume/depth | Exact score markets, outcomes, order books | Local sample score rows | Backend should provide exact-score market groups and prices. |
| Halves tab | `/api/events/:slug` if server event detail includes halves groups | GET | Optional | None | first-half and second-half markets/outcomes | Half markets, outcomes, line groups | Existing local first-half/second-half groups | Backend should expose grouped first-half/second-half markets with ordering and prices. |

Cycle X implementation notes:

- This cycle does not create or modify backend routes.
- The mobile UI now expects event detail payloads to support explicit market tabs, card-level depth, card-level history, and grouped exact-score/halves markets.

## Cycle Y - Line Adjustment

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Spread line selector | `/api/events/:slug` when server event detail is active | GET | Optional; bearer token sent if runtime API key exists | None | spread market group, line options, selected line, outcomes, prices/probabilities, period | Events, markets, line markets, outcomes, line quotes | Local line options and deterministic probability math | Backend should expose all spread lines by period with outcome ids, labels, prices, and market ids. |
| Totals line selector | `/api/events/:slug` when server event detail is active | GET | Optional | None | totals market group, line options, selected line, over/under outcomes, prices/probabilities, period | Events, markets, line markets, outcomes, line quotes | Local line options and deterministic probability math | Backend should expose all totals lines by period with stable market ids and prices. |
| Line ticket carry-through | Existing ticket/order flow after local selection | Client state, then existing order routes when submitting | Auth required for server order submit; mock mode local | Ticket submit uses selected market/outcome/side/amount plus line selection metadata | selected market type, line, period, display label, price/probability | Orders, positions, fills, wallets, line-market orders | Fake-token mock ticket and portfolio state | Backend order routes need explicit line market ids and line metadata to preserve identity in positions/history/open orders. |

Cycle Y implementation notes:

- No backend route was created or changed.
- Future backend work should treat line markets as first-class markets, not display-only modifiers.

## Cycle Z - Trade Ticket

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ticket open from event outcome | Loaded event data from `/api/events/:slug` when server mode is active | GET | Optional for viewing | None | event title, market id/title, outcome id/label/probability, selection metadata | Events, markets, outcomes | Local `worldCupEvents` fallback data | Backend should provide canonical market/outcome ids and line selection metadata for every ticket entry point. |
| Ticket amount and estimate | No dedicated route in this cycle; computed client-side | N/A | N/A | N/A | outcome probability, balance, side, amount | Quotes, order book, wallet balance | Local fake-token balance and deterministic estimates | Backend quote route should return live price, fees, estimated shares, payout/proceeds, and slippage impact. |
| Ticket submit readiness | Existing fake-token order path; server order routes when enabled | POST on existing order route when server mode submits | Required for real server order | market id, outcome id, side, amount, selection metadata | order id/status, filled shares, execution price, portfolio updates | Orders, fills, wallets, positions, open orders | Mock order state in fake-token mode | Server orders must preserve selected line/period/outcome and return enough data for portfolio/open-order/activity parity. |

Cycle Z implementation notes:

- No backend route was created or changed.
- Mobile now expects the same quick amount presets observed in Polymarket, but estimates still need backend quote support for production parity.

## Cycle AA - Portfolio

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fake-token Portfolio after mock order | Local mock state; `/api/portfolio` when server mode is active | GET in server mode | Required for server user data; not required for fake-token mock mode | None | balance, positions, open orders, recent activity, closed trades | Users, wallets, positions, orders, fills, activities | Local fake balance, local positions/activity after mock order | Server Portfolio must preserve selected line market ids and fill economics. |
| Open-order cancel | Local mock cancel path; `DELETE /api/orders/:id` in server mode | DELETE in server mode | Required for server cancel | order id | canceled order id/status, remaining/fill state, canceled activity metadata | Orders, order status, activity/history | Local open-order fixture and local canceled receipt | Server same-cycle Portfolio cancel proof should be rerun when backend parity is next prioritized. |
| Position re-trade/close entry points | Existing ticket open and close handlers | Client state; server order routes when submitting | Required for server trading | selected position, side, amount when ticket submits | position market/outcome/selection metadata | Positions, orders, fills | Local fake-token position actions | Backend should return canonical close/retrade quote and order status for each position. |

Cycle AA implementation notes:

- No backend route was created or changed.
- Portfolio docs now explicitly require server contracts to preserve selected line-market identity across positions, open orders, and activity.

## Cycle AB - Search/Explore

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search/Explore default list | `/api/events` through existing event hydration path when server mode is active | GET | Optional for public discovery | Query params currently handled by existing event list behavior | event id/title/status/tag/teams/markets/outcomes/probabilities | Events, markets, outcomes, market stats | Local `worldCupEvents` sorted by market/outcome depth | Backend should expose Search/Explore-ranked rows, not only raw event lists. |
| Typed World Cup query | `/api/events?search=<query>` when server mode is active | GET | Optional | Search query in URL params | matching events, teams, markets, outcomes | Event search index, team aliases, market text index | Client filters local events/teams/markets/outcomes | Backend should support ranked search across event, team, market, outcome, and localized names. |
| Search filter/sort | No dedicated route in this cycle; state is client-side over loaded events | N/A | N/A | status filter and sort mode | filtered/sorted rows | Search facets, status aggregates, market category counts | Local status filter and popular/live-first sort | Backend should provide category/facet counts, server-side rank, and cursor pagination. |
| Search result navigation | Existing event detail path after selecting an event | GET `/api/events/:slug` when server detail is active | Optional for viewing | event slug/id | full event detail markets and outcomes | Events, market groups, outcomes, order books | Local selected event opens detail | Backend route should preserve selected search result id/slug and hydrate detail consistently. |

Cycle AB implementation notes:

- No backend route was created or changed.
- Mobile now presents Search as an Explore-style page, so future backend work should treat Search as a ranked discovery endpoint with facets and row metrics.

## Cycle AC - Account/settings

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account/settings shell | `/api/profile/preferences` when profile sync is enabled | GET | Required when server profile sync is active | None | locale, saved event ids, ticket defaults, profile sync status | Users, profile preferences | Local AsyncStorage and app state | Backend should provide full account/settings menu state and auth/session state. |
| Mock login/logout | Local AsyncStorage only in this cycle | N/A | N/A | N/A | signed-in boolean | User session | Local mock session flag | Production auth route is intentionally deferred. |
| Fake-token balance safety | Portfolio/account state; `/api/portfolio` when server mode is active | GET | Required for server mode | None | wallet balance, open positions/orders, total exposure | Wallets, positions, orders | Local 10,000 USDT fake balance | Real deposit/withdraw/EBPay routes are intentionally not implemented. |

Cycle AC implementation notes:

- No backend route was created or changed.
- Account documentation now requires a future session/profile contract before production auth or real-money wallet actions.

## Cycle AD - Chart Behavior

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event detail chart display | `/api/events/:slug` through the existing event detail hydration path when server mode is active | GET | Optional for public viewing | None | event id/slug/title/status, primary market/outcome probability, selected outcome label, current event status | Events, markets, outcomes | Local `worldCupEvents` event detail data and deterministic chart point math | Event detail does not provide timestamped chart/history series, target/reference line metadata, or per-outcome historical probabilities. |
| Chart press/tooltip state | No dedicated route in this cycle; computed client-side from selected point | N/A | N/A | N/A | selected chart point label/value/time derived locally | Market history, outcome history, time buckets | Local `latest`/`mid`/`target` point states | Backend should expose nearest-point chart data so tooltip values reflect real historical ticks. |
| Chart filter state | No dedicated route in this cycle | N/A | N/A | N/A | local chart filter labels such as All/Game/Live | Market history ranges, period filters, live tick history | Local filter state and event status | Backend should support range/filter query params for market chart series. |

Cycle AD implementation notes:

- No backend route was created or changed.
- A future route such as `/api/markets/:id/history?range=1D&outcomeId=<id>` or `/api/mobile/events/:slug/chart` should return timestamped probability/price points, selected outcome metadata, target/reference lines when applicable, loading/empty states, and range/filter support.

## Cycle AE - Market Page

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Market/Live stats body switch | No dedicated route in this cycle; event context comes from `/api/events/:slug` when server mode is active | GET for event context | Optional for public viewing | None | event id/slug/title/status, teams, volume, current market probabilities | Events, teams, match state | Local `activeBodyTab` state | Backend should identify whether live stats are available and expose a stats route/state. |
| Live Stats panel | No backend route in this cycle | N/A | N/A | N/A | possession, shots, shots on target, corners, expected goals, match-flow events | Match stats, live feeds, timeline events | Local deterministic stats rows | Add route such as `/api/events/:slug/live-stats` with home/away stats, timestamps, availability, and empty/error states. |
| Grouped market tabs/cards | `/api/events/:slug` when server detail is active | GET | Optional for viewing | None | market groups/tabs, outcomes, probabilities, line metadata | Events, markets, market groups, line markets | Existing local/fallback event groups | Backend still needs richer group metadata for exact Polymarket-style ordering and Player Props scoping. |

Cycle AE implementation notes:

- No backend route was created or changed.
- Mobile now expects a future live-stats data contract in addition to grouped market metadata, line-market identity, market depth, and chart history.

## Cycle AF - Reference Device Preflight Harness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Reference device preflight | None | N/A | N/A | N/A | N/A | N/A | N/A | None; this is an ADB/device harness. |

Cycle AF implementation notes:

- No backend route was created or changed.
- The harness only inspects ADB device state and writes `docs/mobile/harness/cycle-current-polymarket-reference-device-preflight.json`.

## Cycle AG - Trade Ticket

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ticket open from event outcome | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | event id/slug/title/status, market id/title/type, outcome id/label/probability/color, quote/depth fields when present | Events, markets, outcomes, order books | Local `worldCupEvents` event/outcome objects | Backend should provide ticket-ready market title, display period, selected outcome, opposite outcome, binary side semantics, and price/quote metadata. |
| Ticket amount and payout calculation | No dedicated route in this cycle; computed client-side from selected outcome probability | N/A | N/A | N/A | selected outcome probability, balance | Quotes, market depth, wallet balance | Local probability math and fake balance | Backend quote route should return executable price, payout, fees, min/max order size, and slippage bounds. |
| Advanced ticket details | Existing quote/orderbook fields when available through event/outcome hydration | GET for source event/quote context | Optional for viewing | None | best bid/ask, sizes, spread, trading mode | Order books, quote snapshots | Local fallback depth sizes and fake-token mode | Add a dedicated ticket quote/depth endpoint if event hydration is too coarse. |
| Submit fake-token order | Existing ticket order flow through `submitTicketOrder()`; server mode uses order API when enabled | POST in server mode | Required for server mode | market id, outcome id, side, amount, price/selection metadata | order id/status/fill/open-order/position metadata | Orders, fills, positions, activity | Mock order placement in fake-token mode | Binary NO/share side and production trading eligibility gates are not fully modeled. |

Cycle AG implementation notes:

- No backend route was created or changed.
- Mobile first-view ticket now expects market/outcome identity, quote/price, payout, and advanced depth/estimate data to be available in a ticket-ready shape.

## Cycle AH - Binary Side Ticket

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Futures Buy No ticket | Existing futures data from local/server event hydration | GET for market context | Optional for viewing | None | market id/title/type, outcome id/label/probability/color | Markets, outcomes, binary contracts | Local `worldCupFutures` rows | Backend should expose YES and NO contract ids/prices separately for each binary outcome. |
| Submit Buy No order | `/api/orders` through `PolyApi.placeLimitOrder()` in server mode | POST | Required in server mode | `marketId`, `outcomeId`, transaction `side`, `contractSide`, `price`, `size`, optional `selection`, `type`, `clientOrderId` | order id/status/size/remaining/fills | Fake-token mock order in local mode | Backend must accept and persist `contractSide` as separate from transaction side. |
| Portfolio display for No contracts | `/api/portfolio` and `/api/portfolio/history` in server mode | GET | Required in server mode | None | positions/orders/history need selected outcome plus `contractSide` | Positions, orders, fills, activity/history | Local Portfolio state stores `contractSide` | Backend snapshot/history routes should return `contractSide` for positions, orders, canceled orders, and recent trades. |

Cycle AH implementation notes:

- Mobile now sends `contractSide: "YES" | "NO"` with server-mode order payloads.
- No backend route was changed in this cycle; this is a forward-compatible mobile contract update.

## Cycle AI - Trade Ticket Surface

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tall ticket open from game outcome | `/api/events/:slug` when server detail is active | GET | Optional for viewing | None | event title/status, market title/type, outcome label/probability/color, selection metadata | Events, markets, outcomes | Local event/outcome data | Backend should return ticket-ready display metadata and eligibility state with event detail or a ticket quote route. |
| Swipe-ready amount state | No dedicated route in this cycle; calculated client-side | N/A | N/A | N/A | amount, selected side, selected contract side, probability | Quotes, wallet, eligibility | Local fake-token balance and probability math | A future ticket quote route should return executable price, payout/proceeds, fee, max/min, and whether swipe confirmation is allowed. |
| Production eligibility/location state | Not implemented in Holiwyn fake-token mode | N/A | Required for real-money mode later | N/A | eligibility status, block reason, support action, login/location state | Users, sessions, geo/eligibility checks | Fake-token mode always allows mock submit when amount is valid | Add server-authoritative `tradingEligibility` before real-money trading. |

Cycle AI implementation notes:

- No backend route was created or changed.
- This cycle changes the mobile ticket surface only; server-mode order submission continues to use the existing order path.

## Cycle AJ - Game Page Compact Scrolled Header

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact scrolled match header | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | event title/status/start time, teams, primary outcome probabilities/colors | Events, teams, markets, outcomes | Local event/team/outcome data | Backend should provide stable team codes, localized short names, and current probabilities for compact game headers. |
| Scrolled market rows proof | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | market groups, line values, periods, outcome probabilities | Market groups, line markets, outcomes | Local deterministic game-line groups and probabilities | Backend should provide Polymarket-style ordered market groups, line selectors, and per-period prices. |

Cycle AJ implementation notes:

- No backend route was created or changed.
- This is a presentation-layer parity cycle; future backend work should make compact header and market rows server-authoritative.

## Cycle AL - Game Page Sticky Market Tabs

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sticky market tab rail | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | event title/status/start time, teams, primary outcome probabilities, market tab/group availability | Events, teams, markets, market groups | Local event/team/outcome data and local tab list | Backend should expose ordered market tabs/groups and whether Player Props is available or empty for a given match. |
| Sticky Player Props switch | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | player props group rows, player names, stat type, prices, probabilities | Markets, player props, players, outcomes | Local Player Props rows | Backend should provide soccer player-prop availability and empty/loading states rather than relying on local fallback props. |

Cycle AL implementation notes:

- No backend route was created or changed.
- This is a presentation-layer parity cycle; future backend work should return market-tab metadata and grouped rows in the same order the mobile page displays them.

## Cycle AM - Player Props Unavailable State

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Player Props unavailable state | `/api/events/:slug` when server event detail is active | GET | Optional for viewing | None | event id/slug/title and eventual Player Props availability flag | Events, markets, players, player props | Local unavailable state | Backend should eventually provide `playerPropsAvailability` and prop rows only when supported. |

Cycle AM implementation notes:

- No backend route was created or changed.
- Mobile intentionally avoids local fake player-prop rows until backend-supported Player Props data exists.

## Cycle AV - Live Orderbook Depth Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live event orderbook overlay | `/api/orderbook/:marketId/book?outcomeId=<optional>&maxLevels=<optional>` | GET | Public viewing | None | `marketId`, `outcomeId`, `generatedAt`, `emptyState`, `levels[]`, legacy `bids[]`, legacy `asks[]` | Markets, outcomes, orders/orderbook snapshots | Embedded `market.orderbookDepth[]` remains visible and labeled as fallback when route data is unavailable | Real provider/orderbook ingestion, server-hydrated device proof, stale/delayed route states, and richer depth aggregation remain open. |
| Route-backed market depth hydration | `PolyApi.getOrderbook()` consuming `/api/orderbook/:marketId/book` | GET | Public viewing | None | `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total`, `emptyState`, `generatedAt` | Market/outcome identity, orderbook depth rows | `marketDepthService` only applies route-shaped data when the route returns levels; otherwise it preserves fallback rows and records `empty`/`error` state | Backend must guarantee that `marketId`/`outcomeId` match ticket/order/portfolio identity for selected line markets. |

Cycle AV implementation notes:

- The existing public orderbook route now returns a mobile-ready `levels[]` ladder while preserving legacy `bids[]` and `asks[]`.
- `maxLevels` is accepted and clamped server-side to avoid unbounded mobile responses.
- Mobile is wired to consume the route in server mode and exposes source/status labels so fallback proof cannot be confused with route-backed parity.
- Tablet proof was fallback-mode because backend health was unavailable; the backend route contract is covered by route/API tests.

## Cycle AW - Route-Backed Live Depth Seed Harness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live event orderbook proof data | `/api/orderbook/:marketId/book?maxLevels=24` after `mobile:live-orderbook-depth-seed` | GET | Public viewing | None | `emptyState: null`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total` | `User`, `Order`, `Market`, `Outcome` | Existing fixture depth still drives tablet UI in mock mode | Mobile server-mode proof still needs an event/detail payload path that can hydrate the seeded market quickly and select the same market. |
| Live depth seeding harness | `mobile:live-orderbook-depth-seed` script | Local script | Local development only | Optional `--eventSlug`; default first live public World Cup orderbook event | Summary artifact with event id/slug/title, market id/title/type/group, proof users, deleted/created order counts, and preview rows | `User`, `Order`, `Market`, `Outcome` | N/A | Real provider/liquidity ingestion remains missing; this is deterministic proof data only. |

Cycle AW implementation notes:

- The depth seed harness created 12 open proof orders for `world-cup-2026-curacao-vs-cote-divoire-2026-06-25` / `aca976d2-2bad-416c-b010-c874c0ee493f`.
- A direct orderbook route probe returned seeded `levels[]` with `emptyState: null`.
- `/api/events/:slug` returned a very large event-detail payload, while `/api/markets/:id/chart?range=1D` timed out during a 20-second probe. This promotes a mobile-optimized live detail/chart/depth payload to active structural work.

## Cycle CW - Provider Sports Event Discovery Expansion

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider candidate discovery by exact sports event | `/api/mobile/events/:slug/provider-candidates?providerSearchMode=sports-events&providerEventSlug=fifwc-col-gha-2026-07-03` | GET | Internal admin guard | None | `targets[].bestCandidate`, `attachProposal.mapping`, candidate `slug`, `externalMarketId`, `conditionId`, outcome `tokenId`, relevance result | `Event`, `Market`, `Outcome`; provider identity fields on markets/outcomes | None for exact provider-event proof; broad tag discovery remains available when no exact event slug is supplied | More exact event/market slugs are needed for spreads, totals, team totals, halves, and props. |
| Provider identity attach for compact live markets | `attachMobileLiveProviderIdentities()` local/service path, same contract as protected provider-mapping route | Service/API contract | Internal admin guard when called through route | provider mappings with market id, external slug/id, condition id, outcome token ids | readiness moves to provider-refreshable compact markets | `Market.referenceSource`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, `Outcome.referenceTokenId`, `Outcome.referenceOutcomeLabel` | None for the proof event | UI/admin apply workflow should eventually review/apply mappings outside the proof harness. |
| Provider refresh and CLOB depth | `/api/mobile/events/:slug/provider-refresh` equivalent service path | POST/service | Internal admin guard through route | `allowContractProofFallback=false` | refreshed count, snapshots updated, CLOB depth rows, post-refresh snapshot status | `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot` | Contract fallback explicitly disabled | Broader provider ingestion scheduler remains needed. |
| Server-backed live detail proof | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | None | `event`, compact `markets[]`, `availability`, `providerQuoteSnapshot`, `providerOrderbookDepth`, `orderbookDepth`, contract readiness counts | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot` | Mobile fallback remains for non-server mode | First dev compile can be slow; production/dev-build route warmup should be included in harness setup. |

Cycle CW implementation notes:

- Exact provider event slug fallback prevents broad World Cup futures from being attached to the live match.
- The Samsung tablet proof uses `world-cup-2026-colombia-vs-ghana-2026-07-03` and confirms route-backed Book UI after provider refresh.

## Cycle DG - Provider Fixture Metadata Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider mapping readiness with fixture metadata | `/api/mobile/events/:slug/provider-mapping` | GET | Internal admin guard | None | Existing readiness fields plus `providerFixture.providerEventSlug`, `opticOddsFixtureId`, `opticOddsGameId`, `opticOddsNumericalId`, `sportradarGameId`, `teams[]`, `moneylineMarkets[]`, and `lineMarketSourceContract` | `Event.metadata.providerFixture`; existing `Event`, `Market`, `Outcome` provider identity fields | None; proof extracts from real Gamma event metadata and stores the contract-shaped object on the local proof event | Real OpticOdds/API ingestion route for line-market families is still missing. |
| Provider fixture extraction proof | `scripts/prove_mobile_provider_fixture_metadata_contract.ts` against `https://gamma-api.polymarket.com/events?slug=fifwc-col-gha-2026-07-03` | Local proof script | Local development only | Exact provider event slug | Extracted fixture IDs, provider team IDs, 3 moneyline markets, readiness compact-market counts, and future line-market source contract | `Event.metadata` stores the extracted provider fixture contract for later route use | None | Production importer should persist this metadata automatically for every trusted World Cup fixture. |

Cycle DG implementation notes:

- No public user route changed.
- The provider mapping readiness route now surfaces stored fixture metadata so future admin/operator and ingestion cycles can target the correct provider fixture instead of repeating broad Gamma line searches.
- The intended line-market source is recorded as `optic_odds`; this is a contract definition, not proof that line odds have been ingested.

## Cycle DH - OpticOdds Line Ingestion Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Line provider refresh report | `/api/mobile/events/:slug/provider-refresh` | POST | Internal admin guard | Existing body: optional `expireFirst`, `staleSeconds`, `allowContractProofFallback` | Existing refresh report plus `lineProvider.source`, `attempted`, `status`, `fixtureId`, `matchedMarketCount`, `snapshotRowsBuilt`, `snapshotsUpdated`, `skippedReason` | `Event.metadata.providerFixture`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | None. Missing credentials return `skippedReason=missing_optic_odds_api_key`. | Real OpticOdds credentials and reviewed per-line identity before applying live line rows. |
| OpticOdds fixture odds fetch | Official OpticOdds `https://api.opticodds.com/api/v3/fixtures/odds` | GET | `X-Api-Key: OPTIC_ODDS_API_KEY` | Query: repeated `sportsbook`, repeated `market`, `fixture_id`, `odds_format=PROBABILITY` | Fixture `id`, `game_id`, competitors, odds `id`, `sportsbook`, `market_id`, `selection`, `selection_line`, `team_id`, `price`, `points`, `is_main` | `ReferenceQuoteSnapshot` rows with `source=optic_odds`; eventual first-class provider line mapping table if line identity review becomes durable | Contract proof uses official-response-shaped fixture data only; it does not write fake live rows | OpticOdds orderbook/depth support is not implemented; quote snapshots only. |

Cycle DH implementation notes:

- The endpoint contract follows the official OpticOdds docs for `/fixtures/odds`, including repeated sportsbook/market query params and API-key header auth.
- The current event diagnostic intentionally reports `readyForLiveProviderApply=false` until credentials and reviewed per-line provider market identity exist.
- This cycle moves the backend closer to real line ingestion without weakening the provider relevance gate.

## Cycle DI - Reviewed Line Provider Identity Gate

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Reviewed line-provider identity readiness | Future protected provider-mapping/admin workflow using `reviewMobileLiveLineProviderIdentities()` | Future POST/service | Internal admin guard when routed | `reviews[]` containing `marketId`, `providerSource=optic_odds`, provider market id/name/type/period/points, and every local outcome mapped to a provider odd id | Readiness counts and validation failures for exact market/line/outcome identity | `Market.referenceMetadata.lineProviderIdentity`, `Outcome.referenceMetadata.lineProviderIdentity`; existing `Market`, `Outcome` | None. Dry-run projection is contract-shaped and does not mutate the database. | Protected route/UI for collecting confirmed line identity reviews and applying them with `confirmApply=true`. |
| OpticOdds row matching with reviewed identity | `/api/mobile/events/:slug/provider-refresh` through existing refresh service once credentials and reviews exist | POST/service | Internal admin guard through route | Existing refresh request plus stored reviewed metadata | `ReferenceQuoteSnapshot` rows matched by provider market and provider odd ID when reviewed identity exists | `ReferenceQuoteSnapshot`, `Market.referenceMetadata`, `Outcome.referenceMetadata` | None. Missing reviews fall back to existing family/line/outcome matching for contract tests only. | Real `OPTIC_ODDS_API_KEY`, approved sportsbooks, and confirmed reviewed identities before live apply. |

Cycle DI implementation notes:

- No public user route changed.
- The service can apply reviewed line identity later, but the Cycle DI proof stayed dry-run to avoid writing unreviewed provider identity into the local database.
- The row builder now supports exact reviewed provider IDs, closing the ambiguity between same-family lines before the next live OpticOdds refresh attempt.

## Cycle DJ - Line Provider Refresh Execution

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Reviewed line identity apply | `/api/mobile/events/:slug/provider-mapping` | POST | Internal admin guard | `lineIdentityReviews[]`, `dryRun`, `confirmApply`; each review includes local `marketId`, `providerSource=optic_odds`, provider fixture/market/line/period, and every outcome's provider odd id | Route returns review validation, before/after `lineProviderIdentityReadiness`, `applied`, `blocked`, and `nextRequiredAction` | `Market.referenceMetadata.lineProviderIdentity`, `Outcome.referenceMetadata.lineProviderIdentity` | None. Route defaults to dry-run and requires `confirmApply=true` for mutation. | Operator/admin UI fields for line identity capture can be added on top of the route. |
| Line-provider refresh execution | `/api/mobile/events/:slug/provider-refresh` plus service `refreshMobileLiveProviderQuoteSnapshots()` | POST | Internal admin guard | Existing refresh body; production uses env `OPTIC_ODDS_API_KEY`/sportsbooks, proof injects official-shaped provider response | Mobile consumes refreshed `markets[].providerQuoteSnapshot` and `contract.batchedProviderQuoteSnapshot*` from `/api/mobile/events/:slug/live-detail` | `ReferenceQuoteSnapshot` rows with `source=optic_odds`; reviewed market/outcome metadata | Contract fallback remains disabled in Cycle DJ proof. | Real API key/network proof, provider-owned ladder depth, and lifecycle ticket/order/portfolio/history proof. |

Cycle DJ implementation notes:

- `/api/mobile/events/:slug/provider-mapping` now exposes the reviewed line identity apply path instead of requiring direct script access.
- The proof harness shows target line markets moving from stale/refresh-due to ready in the same live-detail contract that the mobile page reads.
- Cache invalidation remains owned by `/provider-refresh` through `revalidatePath` for live-detail, event-detail, and affected orderbook paths.

## Cycle DK - Polymarket-First Provider Path

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Polymarket event discovery and mapping | Polymarket Gamma `https://gamma-api.polymarket.com/events?slug=fifwc-col-gha-2026-07-03` through provider candidate services | GET/service | Public provider API; internal apply path remains guarded | Exact event slug plus generated manual slug fallbacks | Provider event title/slug, candidate market slug/question, external market id, condition id, outcome token ids, family/relevance fields | `Event`, `Market`, `Outcome`; provider identity fields on market/outcome records | None for the match-winner proof; irrelevant candidates are rejected instead of mocked | Exact line-family provider markets remain absent for this event through current Gamma discovery. |
| Provider identity attach | Existing provider mapping service path, same contract as `/api/mobile/events/:slug/provider-mapping` | POST/service | Internal admin guard when routed | 3 verified Polymarket match-winner mappings for Colombia, draw, and Ghana | Readiness changes to 3 provider-refreshable markets and 6 provider-refreshable outcomes | `Market.referenceSource`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, `Outcome.referenceTokenId`, `Outcome.referenceOutcomeLabel` | None | Operator UI can reuse this route for reviewed exact slugs. |
| Polymarket quote and CLOB depth refresh | Existing provider refresh service path, same contract as `/api/mobile/events/:slug/provider-refresh` | POST/service | Internal admin guard when routed | `allowContractProofFallback=false`; `OPTIC_ODDS_API_KEY` unset | `providerQuoteSnapshot.status=ready`, provider source, bid/ask/spread, `providerOrderbookDepth`, depth rows | `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot` | Contract-proof fallback disabled | Scheduled/background refresh still needs production orchestration. |
| Server-backed live detail and orderbook proof | `/api/mobile/events/:slug/live-detail`; `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public viewing | Event slug and selected market id | `liveDataStatus`, `liveDataSource`, compact markets, selected orderbook route source/status, levels, empty state | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot` | Expo/mobile fallback remains for offline mode, but Cycle DK tablet proof is server-backed | Chart history remains fallback until Polymarket-backed history is wired. |

Cycle DK implementation notes:

- Polymarket Gamma/CLOB is the default provider source for markets that exist on Polymarket.
- Missing OpticOdds credentials are optional/unconfigured and must not block this parity milestone.
- The relevance gate now blocks wrong-team binary winner attachment before provider identity is applied.

## Cycle DL - Polymarket CLOB Chart History

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider chart history ingestion | Polymarket CLOB `https://clob.polymarket.com/prices-history?market=:tokenId&interval=1d&fidelity=5` | GET/service | Public provider API | Token ID in `market` query param, interval, fidelity | Provider points `{ t, p }` converted to timestamp, price, probability | `Market`, `Outcome.referenceTokenId`, `MarketOutcomeSnapshot` | None in Cycle DL proof; empty history is recorded as skipped | First-class snapshot source column is still missing. |
| Mobile market chart route | `/api/markets/:id/chart?range=1D` | GET | Public viewing with existing market visibility guard | Market id and range | `source`, `history[]`, `lastUpdated`, `emptyState`, `range`, `series` | `MarketOutcomeSnapshot`, `Market.referenceSource`, `Outcome` | If no rows exist, route returns `source=empty` and `emptyState=no-history` | Range downsampling/pagination can be added later if history grows. |
| Provider refresh orchestration | `/api/mobile/events/:slug/provider-refresh` service path | POST/service | Internal admin guard through route | Existing refresh request | New `providerHistory` report with source, interval, fidelity, refreshed count, snapshots created, skipped rows | `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, `MarketOutcomeSnapshot` | Contract fallback still applies only to quote snapshots, not chart history | Background scheduler remains open. |
| Samsung tablet live-detail proof | `/api/mobile/events/:slug/live-detail` plus `/api/markets/:id/chart` from the mobile app | GET | Public viewing | Event slug and selected primary market id | EventDetail XML marker `chart-source-polymarket-clob-prices-history chart-status-ready chart-range-1D` | `Event`, `Market`, `Outcome`, `MarketOutcomeSnapshot` | None for the chart marker in Cycle DL | Provider event is closed/resolved, so live-data status is stale by design. |

Cycle DL implementation notes:

- Official Polymarket docs name the CLOB price-history query parameter `market`, but it takes the outcome token ID.
- The current Colombia vs Ghana provider event is closed/resolved. Holiwyn keeps a live-detail proof page for parity work, while the provider freshness label remains stale.

## Cycle DM - Provider Token Lifecycle

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Server-backed live event provider identity | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug | `markets[].referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `outcomes[].referenceTokenId`, `referenceOutcomeLabel` | `Market.referenceSource`, `Market.externalSlug`, `Market.externalMarketId`, `Market.conditionId`, `Outcome.referenceTokenId`, `Outcome.referenceOutcomeLabel` | Mobile fallback events have null provider fields and are not marked provider-backed | None for Polymarket match-winner identity; line-family markets remain unavailable unless mapped. |
| Ticket order provider selection | `/api/orders` | POST | Canonical API key with `orders:write` and internal trading beta | Existing limit-order body plus `selection` provider fields | Order response id/status/size/remaining; request metadata later consumed by portfolio routes | `ApiOrderRequest.requestBody.selection`; existing `Order`, `Market`, `Outcome` | Mock orders preserve the same selection object locally | First-class `Order.selection` column is not present. |
| Portfolio provider identity echo | `/api/portfolio` | GET | Session user or canonical API key with `account:read` | None | `positions[].selection` and `openOrders[].selection` include market/outcome plus provider market/condition/token fields | `Position`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | Server-unavailable mobile fallback omits provider fields | No production migration yet for storing selection directly on positions/orders. |
| Portfolio history provider identity echo | `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `canceledOrders[].selection`, `recentTrades[].selection` provider fields | `Trade`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | None for Cycle DM proof | Recent trades without original request body rely on market/outcome provider fields. |

Cycle DM implementation notes:

- Provider lifecycle proof is Polymarket-first and does not depend on `OPTIC_ODDS_API_KEY`.
- Android proof uses accessibility markers only; provider IDs are not visible UI copy.
- `mobile/scripts/smoke.ps1` now honors `-BackendBaseUrl` for server live-detail proof and asserts provider identity on the server-backed page and ticket.

## Super Round DN - Provider Chart Cache + Visible Orderbook

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider refresh cache lifecycle | `/api/mobile/events/:slug/provider-refresh` | POST | Provider refresh admin/internal guard | Optional refresh execution options | `cacheInvalidation.chartPaths`, `cacheInvalidation.orderbookPaths`, `postRefreshHistory` | `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `MarketOutcomeSnapshot`, orderbook depth rows | None | Scheduled/background refresh remains future work. |
| Visible orderbook ladder | `/api/orderbook/:marketId/book?maxLevels=...` through live-detail hydration | GET | Public viewing | Market id and max levels | `market.orderbookDepth[]`, `orderbookDepthStatus`, `orderbookDepthSource`, bid/ask price, shares, total | Orderbook depth snapshots keyed by market/outcome/side | Deterministic quote-shaped UI fallback when route levels are absent | Full provider-owned line-family depth remains unavailable unless Polymarket exposes matching line markets. |

Super Round DN implementation notes:

- Cache invalidation now includes `/api/markets/:marketId/chart` for every compact provider market, using the same market set as orderbook invalidation.
- Samsung tablet proof asserts `route-depth-ladder`, bid/ask level labels, provider source, provider market, provider condition, and provider token markers.

## Cycle DO - Provider Filled Lifecycle

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed filled order creation | `/api/orders` equivalent canonical service path in proof | POST | Canonical mobile API key with `orders:write` and internal trading beta | `marketId`, `outcomeId`, `side`, `type`, `price`, `size`, `contractSide`, `selection` with provider fields | Filled order id/status, fills, position | `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, `Outcome` | None in backend proof | Production route/device proof with a currently active real Polymarket market remains future work. |
| Portfolio provider position | `/api/portfolio` | GET | Session user or canonical API key with `account:read` | None | `positions[].selection.referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `referenceTokenId`, `referenceOutcomeLabel` | `Position`, `Market`, `Outcome` | None in proof | First-class immutable order/trade selection columns remain future hardening. |
| Recent provider trade activity | `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `recentTrades[].selection` provider fields | `Trade`, `Market`, `Outcome` | None in proof | Resolved-history settlement proof remains separate from filled-trade activity proof. |

Cycle DO implementation notes:

- `scripts/prove_mobile_filled_trade.ts` now creates provider-shaped market/outcome identity and submits the taker order through canonical order submission so the original ticket selection is preserved in `ApiOrderRequest`.
- Samsung tablet proof uses the existing Portfolio history smoke and asserts the provider-filled proof trade is visible.

## Super Round DT Integrated - Orderbook Interaction And Ready Depth

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Book surface selected market/depth | `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public viewing | Market id and max levels | `marketId`, `depthSource`, `availability.status`, `marketIdentity.selectorKey`, `marketIdentity.marketFamily`, `marketIdentity.marketType`, `marketIdentity.marketGroupKey`, `marketIdentity.period`, `marketIdentity.line`, `marketIdentity.outcomes[]`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].total`, `providerOrderbookDepth.status` | `Market`, `Outcome`, `ReferenceOrderbookDepthSnapshot`, open `Order` rows when non-provider depth is used | DT-B tablet proof uses deterministic contract-shaped mobile fixtures for interaction proof when provider route data is not active in the Expo session | Same visible UI run still needs provider-backed ready depth; sibling selector route may be needed for all family/period/line choices. |
| Book tab/selector/ticket interaction | Mobile client state plus existing ticket/order services | Client state -> eventual order route | Fake-token trading only for this milestone | `TicketSelection` includes selected market, outcome, side, family, line, period, odds/probability when present | Existing order routes consume selected market/outcome IDs; portfolio/history later depend on the same identity | Fixture markets carry backend-shaped IDs, market type, line/period fields, and outcome IDs | Spread/period/line identity must be proven with a live backend-shaped route payload, not only fixture `line-none`/`period-none`. |

DT integrated implementation notes:

- Backend proof `docs/mobile/harness/cycle-DT-integrated-ready-orderbook-depth-proof.json` shows `provider-orderbook-depth`, `availability.status=ready`, `providerOrderbookDepth.status=ready`, and 12 Price/Shares/Value rows.
- Tablet proof `docs/mobile/harness/cycle-DT-B-orderbook-interactions/cycle-DT-B-holiwyn-orderbook-proof.json` shows Yes/No side switching, selector carry-through into ticket, and side-labelled bid/ask ladder markers.
- The backend contract is ahead of the visible UI proof. Do not mark PM-GAP-075 complete until the same tablet UI run consumes provider-backed ready depth and proves Spread/period/line carry-through.

## Cycle DV - Same-Market Provider-Ready Book UI

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed live detail market hydration | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug `cycle-du-a-world-cup-provider-line-depth` launched through the mobile deep link | Event title, markets, market group/type, period, line, outcome ids/labels, provider source, external market id, condition id, outcome token id, orderbook route status/source | `Event`, `Market`, `Outcome`, `ReferenceOrderbookDepthSnapshot` | None in DV proof. The route uses the seeded provider-backed disposable event. | Broader sibling selector/options route is still useful for full Polymarket Book selector parity. |
| Provider-ready Book ladder | `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public viewing | Market id `d08da13e-80b8-4452-9067-f91d08f6fba4` and max levels | `marketId`, `depthSource=provider-orderbook-depth`, `availability.status=ready`, `marketIdentity.selectorKey=spreads:first-half:1.5`, `marketIdentity.marketType=spread`, `marketIdentity.period=first-half`, `marketIdentity.line=1.5`, `levels[].side`, `price`, `shares`, `value`, `providerOrderbookDepth.status=ready` | `Market`, `Outcome`, `ReferenceOrderbookDepthSnapshot` | None for DV route proof. | Current route is selected-market focused; full Polymarket selector sheet may need event/family sibling market data. |
| Ticket identity from provider-backed Book | Existing mobile ticket state and order service contract | Client state -> future `/api/orders` | Fake-token trading only for current milestone | `TicketSelection` built from selected provider-backed market/outcome | Event, market id, outcome id, side, market type, line, period, provider source, external market id, condition id, provider token marker | Existing mobile ticket/order service types and eventual `ApiOrderRequest.requestBody.selection` | None in DV proof. | Submit/order/portfolio/history lifecycle for this exact provider-ready Spread path remains future scope if required. |

Cycle DV implementation notes:

- The focused smoke command first runs the backend provider depth proof and then the Samsung tablet proof, so the app-visible markers are tied to the same seeded market id and selector key as the route JSON.
- The mobile UI now exposes `selected-selector-key-*` accessibility metadata for audit proof only; provider ids are not user-facing copy.
- DV closes the previous backend-only evidence gap for PM-GAP-075 without weakening the requirement that provider-backed ready depth must be Android-visible.

## Cycle DW-A - Provider Orderbook State Matrix

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider Book ready/non-ready state matrix | `/api/orderbook/:marketId/book?maxLevels=24` | GET | Public visibility guard; private markets still use existing access checks | Query params only: optional `outcomeId`, optional `maxLevels` capped at 200 | `depthSource`, `availability.status`, `providerOrderbookDepth.status`, `providerOrderbookDepth.reason`, `emptyState`, `marketIdentity.marketId`, `marketIdentity.selectorKey`, `marketIdentity.period`, `marketIdentity.line`, `marketIdentity.outcomes[].id`, `levels[].outcomeId`, `levels[].side`, `levels[].price`, `levels[].shares`, `levels[].value` | `Market`, active `Outcome`, `ReferenceOrderbookDepthSnapshot`; proof clears local `Order` rows and `ReferenceQuoteSnapshot` rows for the disposable market | None. The unavailable state returns `depthSource=empty`, `providerOrderbookDepth.status=unavailable`, and `emptyState=no-depth`; it is not counted as ready route depth | Event-level sibling selector/options and production recurring provider refresh remain outside this focused backend state proof. |
| Focused DW-A proof harness | `scripts/prove_mobile_dw_provider_orderbook_state_matrix.ts` | Local script calling route | Local development/server only | Optional `--baseUrl`, `--eventSlug`, `--output` | Writes `docs/mobile/harness/cycle-DW-A-provider-orderbook-state-matrix.json` with unavailable, stale, and ready route snapshots for one provider-shaped totals market | Upserts a disposable World Cup-style `Event`/`Market`/`Outcome` set, clears proof-market local and quote fallback inputs, then writes stale and fresh provider ladder rows | None. The proof fails if fresh ready state is not `provider-orderbook-depth` or if empty/unavailable is treated as ready evidence | Requires an available local database and Next server for the HTTP route probe. |

Cycle DW-A implementation notes:

- The DW-A matrix closes the DV harness gap by proving one provider-shaped selected market can report unavailable/empty, stale, and ready provider ladder states through the same Book route contract.
- Ready evidence is accepted only when `depthSource=provider-orderbook-depth` and `providerOrderbookDepth.status=ready`; the unavailable state clears quote snapshots so fallback quote rows cannot satisfy the ready assertion.
- The artifact records selector identity (`totals:regulation:2.5`), period, line, selected market id, and outcome ids in each matrix state.

## Cycle DX-A - Selected Line Order, Portfolio, And History Lifecycle

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected World Cup line order creation | Canonical order service backing `/api/orders` | POST | Canonical API key with `orders:write` | `marketId`, `outcomeId`, `side`, `type`, `price`, `size`, `contractSide`, and `selection` containing `marketType`, `marketGroupId`, `line`, `period`, `side`, `displayLabel`, provider source/market/condition/token ids | Order response now echoes `order.contractSide` and `order.selection` | `ApiOrderRequest`, `Order`, `Market`, `Outcome` | None in backend proof | First-class immutable `Order.selection` column remains future hardening. |
| Selected line open order and position snapshot | `/api/portfolio` | GET | Session user or canonical API key with `account:read` | None | `openOrders[].selection`, `positions[].selection` with selected line and provider identity | `Order`, `ApiOrderRequest`, `Position`, `Market`, `Outcome` | Mobile fallback fixtures are separate and not used in DX-A proof | Positions infer display label/contract side from market/outcome rows when original order request is not directly joined. |
| Selected line history activity | `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `canceledOrders[].selection`, `recentTrades[].selection` with selected line and provider identity | `Order`, `ApiOrderRequest`, `Trade`, `Market`, `Outcome` | None in backend proof | Trade rows still rely on market/outcome metadata rather than an immutable trade selection snapshot. |

Cycle DX-A implementation notes:

- Proof artifact: `docs/mobile/harness/cycle-DX-A-line-order-portfolio-history.json`.
- The proof creates a disposable World Cup Spread line market and verifies the same `marketId`, `outcomeId`, `marketType`, `marketGroupId`, `line`, `period`, `side`, `displayLabel`, `contractSide`, `referenceSource`, `externalMarketId`, `conditionId`, and `referenceTokenId` through request, order response, portfolio open order, canceled activity, portfolio position, and recent trade activity.
- No visible UI, smoke script, Prisma schema, or central tracker edits were required.

## Cycle ED-A - Book Provider Identity Through Order, Portfolio, And History

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected provider-backed Book line order creation | `/api/orderbook/:marketId/book?maxLevels=24` for selected identity, then canonical order service backing `/api/orders` | GET, POST | Book route uses public visibility guard; order submit uses canonical API key with `orders:write` | `marketId`, `outcomeId`, `side`, `type`, `price`, `size`, `contractSide`, and `selection` containing Book/provider identity: `marketType`, `marketGroupId`, `line`, `period`, `side`, `displayLabel`, `providerSource`/`referenceSource`, `externalSlug`, `externalMarketId`, `conditionId`, `tokenId`/`referenceTokenId` | Book `marketIdentity.outcomes[].tokenId`; order response `order.contractSide` and `order.selection` with both provider and reference source/token aliases | `Market`, `Outcome`, `ReferenceOrderbookDepthSnapshot`, `ApiOrderRequest`, `Order` | None in backend proof | First-class immutable `Order.selection` column remains future hardening. |
| Selected Book open order and position snapshot | `/api/portfolio` | GET | Session user or canonical API key with `account:read` | None | `openOrders[].selection` and `positions[].selection` preserve provider source, external market id, condition id, token id, line, period, side, and contract side | `Order`, `ApiOrderRequest`, `Position`, `Market`, `Outcome` | None in backend proof | Positions still infer identity from current market/outcome rows when original request metadata is not joined. |
| Selected Book history activity | `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `canceledOrders[].selection` and `recentTrades[].selection` preserve provider source, external market id, condition id, token id, line, period, side, and contract side | `Order`, `ApiOrderRequest`, `Trade`, `Market`, `Outcome` | None in backend proof | Trade rows still rely on market/outcome metadata rather than an immutable trade selection snapshot. |

Cycle ED-A implementation notes:

- Proof artifact: `docs/mobile/harness/cycle-ED-A-book-order-portfolio-history.json`.
- The proof creates a disposable provider-backed Spread Book market, seeds provider ladder rows, reads `/api/orderbook/:marketId/book`, and verifies the selected outcome token survives through order request, order response, portfolio open order, canceled activity, portfolio position, and recent trade activity.
- `selection.providerSource`/`selection.tokenId` are now preserved alongside existing `selection.referenceSource`/`selection.referenceTokenId`, so Book-style and current mobile-style names can round-trip without a schema migration.
- No visible UI, smoke script, Prisma schema, or audit/tracker files were changed.

## Cycle EE-A - Book Lifecycle Selection Snapshots

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected Book order response/open order/cancel lifecycle | `/api/orders` backed by canonical order service, `/api/portfolio`, `/api/portfolio/history` | POST, GET | Canonical API key with `orders:write` for submit and `account:read` for portfolio reads | Order submit includes normalized `selection` from Book: `marketId`, `outcomeId`, `marketType`, `marketGroupId`, `line`, `period`, `side`, provider source/market/condition/token, and `contractSide` | `order.selection`, `openOrders[].selection`, `canceledOrders[].selection` are normalized by the shared ticket selection snapshot helper | `ApiOrderRequest`, `Order`, `Market`, `Outcome` | None in backend proof | First-class order selection columns remain future production hardening. |
| Selected Book filled position and recent trade snapshot | `/api/portfolio`, `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `positions[].selection` and `recentTrades[].selection` prefer the latest matching same-user/same-market/same-outcome `ApiOrderRequest.requestBody.selection`, guarded by matching `marketId` and `outcomeId`, then fall back to current `Market`/`Outcome` metadata | `Position`, `Trade`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | None in backend proof | There is still no immutable `Trade`/`Position` selection snapshot column; same market/outcome multiple-selection history can only use the latest matching request snapshot until schema work is approved. |

Cycle EE-A implementation notes:

- Proof artifact: `docs/mobile/harness/cycle-EE-A-lifecycle-snapshots.json`.
- `sanitizeTicketSelectionSnapshot()` is now shared by canonical order submission and portfolio metadata serialization, so Book aliases (`providerSource`, `tokenId`) and reference aliases (`referenceSource`, `referenceTokenId`) normalize identically.
- Filled position and recent trade routes now avoid moneyline/default fallback for a selected Spread/line/period/provider token when a matching order request snapshot exists.
- No visible mobile UI, mobile scripts, Prisma schema, migrations, audit-gate docs, or Polymarket gate/index files were changed.

## Cycle EF-A - Snapshot Durability After Metadata Drift

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Historical Portfolio open/canceled/filled selection display after mutable metadata changes | `/api/portfolio`, `/api/portfolio/history` | GET | Session user or canonical API key with `account:read` | None | `openOrders[].selection`, `positions[].selection`, `canceledOrders[].selection`, and `recentTrades[].selection` prefer the matching order-time/fill-time `ApiOrderRequest.requestBody.selection` for market/outcome/type/group/line/period/side/display label/source/market/condition/token fields | `ApiOrderRequest`, `Order`, `Position`, `Trade`, `Market`, `Outcome` | Current `Market`/`Outcome` fields remain a guarded fallback only when no matching request snapshot exists | First-class immutable `Trade`/`Position` selection columns remain future production hardening for arbitrary remaps and same market/outcome multi-selection history. |

Cycle EF-A implementation notes:

- Proof artifact/status: `docs/mobile/harness/cycle-EF-A-snapshot-durability.json`.
- The EF proof script creates a selected provider-backed Book Spread order, then mutates current market/outcome labels, selector-like defaults, and provider metadata to moneyline/default-looking values before reading Portfolio/history. The local run was blocked by missing `DATABASE_URL`; focused route/helper tests cover the durability assertions in this worktree.
- Focused route tests now assert open orders, filled positions, canceled history, and recent trades keep the selected Spread/line/period/provider token snapshot and do not fall back to mutated moneyline/current metadata.
- No mobile source, mobile scripts, Prisma schema, or migration files were changed.

## Cycle EB-A - Live Detail Selector And Selected Chart Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live game selected market/line selector | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug | `markets[].selection.selectorKey`, `marketId`, `marketGroupKey`, `marketGroupId`, `marketGroupTitle`, `marketType`, `marketFamily`, `displayLabel`, `period`, `line`, `lineValue`, `unit`, `outcomes[]` | `Event`, `Market`, active `Outcome` | None in the route contract. UI fixtures, when used, should match this shape exactly. | Event-level sibling selector breadth is still limited to compact markets returned by the route. |
| Selected market chart state | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug | `markets[].chartHistory[]`, `markets[].chartHistoryStatus`, `markets[].selection.chart.targetMarketId`, `status`, `source`, `pointCount`, `outcomeCount`, `range`, `ranges`, `emptyState` | `MarketOutcomeSnapshot` keyed by compact `marketId`/`outcomeId` | None. Empty history is represented as `selection.chart.status=unavailable` and `emptyState=no-history`. | Real CLOB history for line-family markets requires mapped Polymarket token IDs or an explicitly optional enrichment source. |

Cycle EB-A implementation notes:

- The live-detail response now carries a backend-owned `selection` block per compact market so mobile can change selected market, period, line, and chart state without constructing UI-only selector structures.
- `scripts/probe_mobile_live_detail_route.ts` now fails its route proof if any compact market lacks a matching `selection.marketId`, selector key containing the market id, or chart target matching the market id.
- No schema change was required. Existing `Market` fields (`marketGroupKey`, `marketGroupTitle`, `marketType`, `period`, `line`, `unit`), active `Outcome` rows, provider outcome fields, and `MarketOutcomeSnapshot` rows cover the contract.

## Cycle EU - Route-Backed Retail Ticket Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Backend event open for Local MVP retail ticket | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug from deep link `forceBackendEventSlug` | `event.title`, `event.liveDataStatus`, `markets[].id`, `marketType`, `period`, `line`, `referenceSource`, `externalMarketId`, `conditionId`, `outcomes[].id`, `outcomes[].referenceTokenId`, `outcomes[].referenceOutcomeLabel`, `outcomes[].price/bestBid/bestAsk` | `Event`, `Market`, active `Outcome`, provider quote/depth/history snapshots for proof event | None for spread/totals in EU proof. If a matching backend line is absent, mobile falls back to deterministic contract-shaped fixture and the row is not counted as route-backed. | Team-total provider rows are not covered by the disposable EU route event. |
| Local MVP fake-token order from route-backed ticket | Local mobile mock order path using backend-shaped ticket selection | Client-side mock | No auth for MVP fake-token order | Ticket amount/side plus market/outcome/selection identity | Portfolio cards consume order-time selection fields generated from backend market/outcome fallback metadata | Mobile local state only for EU order/Portfolio proof | This is intentional for the Local MVP. Market data is server-backed, order placement is mock/fake-token. | Server order lifecycle for this exact retail path remains a later milestone when fake-token order APIs are promoted. |

Cycle EU implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-EU-local-mvp-route-ticket-flow/cycle-EU-route-backed-retail-event.json`.
- Backend proof artifact slug: `mobile-el-a-provider-breadth-4f35da22`; tablet proof slug: `mobile-el-a-provider-breadth-b917234c`.
- Mobile launched against `EXPO_PUBLIC_MARKET_DATA_MODE=server` and `EXPO_PUBLIC_ORDER_MODE` unset, proving server market data plus mock fake-token trading.
- `full-game` backend line periods are treated as retail `Reg. Time`; `first-half` and `second-half` remain distinct and period-safe.

## Cycle EV - Route-Backed Server Order Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Backend event open for Local MVP server-order ticket | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug from deep link `forceBackendEventSlug` | `event.title`, `event.liveDataStatus.source`, `markets[].id`, `marketType`, `period`, `line`, `referenceSource`, `externalMarketId`, `conditionId`, `outcomes[].id`, `outcomes[].referenceTokenId`, `outcomes[].price/bestBid/bestAsk` | `Event`, `Market`, active `Outcome`, provider quote/depth/history snapshots for proof event | None for the selected spread proof. If a backend line is absent, deterministic fixtures are not accepted as EV P0 evidence. | Production active-event provider line-family breadth remains incomplete. |
| Local MVP fake-token order from route-backed ticket | `/api/orders` via mobile order service | POST | Mobile dev API key with order write scope; backend local flags `INTERNAL_TRADING_BETA_ENABLED=true` and `TRADING_KILL_SWITCH=false` | `marketId`, `outcomeId`, `side`, `type`, `price`, `size`, `contractSide`, and `selection` with `marketType=spread`, line `1.5`, period `Reg. Time`, provider source/market/condition/token identity | Order response success plus order identity; mobile transitions to Portfolio after submit | `ApiKey`, `ApiOrderRequest`, `Order`, `Market`, `Outcome` | None. EV runs with `EXPO_PUBLIC_ORDER_MODE=server`. | Filled lifecycle/history for this exact route-backed retail path remains follow-up. |
| Server Portfolio sync after route-backed order | `/api/portfolio` | GET | Same mobile dev API key with account read scope | None | `openOrders[]`, `openOrders[].selection`, open order count, side, label, provider source/token, line, period | `Order`, `ApiOrderRequest`, `Market`, `Outcome`, optional `Position` if filled later | None. EV requires `Server portfolio synced`. | Longer activity/history proof beyond open order is not covered in EV. |

Cycle EV implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-EV-local-mvp-route-server-order-flow/cycle-EV-route-backed-retail-event.json`.
- Tablet proof slug: `mobile-el-a-provider-breadth-5f9e2d3f`.
- Mobile launched against `EXPO_PUBLIC_MARKET_DATA_MODE=server` and `EXPO_PUBLIC_ORDER_MODE=server`, proving server market data plus server fake-token order placement.
- The proof uses LAN backend URL `http://172.16.200.14:3002` because wireless tablet ADB reverse/localhost is unreliable for this device.

## Cycle EW - Route-Backed Server Cancel And Activity Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route-backed server order cancel | `/api/orders/:id` | DELETE | Mobile dev API key with order cancel scope; backend local flags `INTERNAL_TRADING_BETA_ENABLED=true` and `TRADING_KILL_SWITCH=false` | Order id from server open order row | Cancel response status; mobile then refreshes Portfolio state | `Order`, `ApiOrderRequest`, `Market`, `Outcome`, user balance/locked funds | None. EW runs with `EXPO_PUBLIC_ORDER_MODE=server`. | Filled lifecycle for this retail path remains follow-up. |
| Server Portfolio/history sync after cancel | `/api/portfolio`, `/api/portfolio/history` | GET | Same mobile dev API key with account read scope | None | `openOrders[]` count drops, `canceledOrders[]` maps into mobile activity with selected spread/provider identity | `Order`, `ApiOrderRequest`, `Market`, `Outcome` | None. EW requires `Server portfolio synced` and Android-visible canceled activity. | Recent filled trade history is not covered in EW. |

Cycle EW implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-EW-local-mvp-route-server-cancel-flow/cycle-EW-route-backed-retail-event.json`.
- Tablet proof slug: `mobile-el-a-provider-breadth-35441a1a`.
- Mobile launched against `EXPO_PUBLIC_MARKET_DATA_MODE=server` and `EXPO_PUBLIC_ORDER_MODE=server`, then used the visible Portfolio Cancel control to hit server cancel.
- The proof uses LAN backend URL `http://172.16.200.14:3002`.

## Cycle EX - Route-Backed Server Filled Trade And Activity Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route-backed filled retail order | `/api/orders` | POST | Mobile dev API key with order write scope; backend local flags `INTERNAL_TRADING_BETA_ENABLED=true` and `TRADING_KILL_SWITCH=false` | `marketId`, `outcomeId`, `side=BUY`, `type=LIMIT`, price near `0.52`, size from `$25`, `contractSide=YES`, and selected spread/provider metadata | Order response status `FILLED`, filled shares, execution price, selection identity | `ApiKey`, `ApiOrderRequest`, `Order`, `Fill`, `Trade`, `Position`, `Market`, `Outcome` | None. EX runs with `EXPO_PUBLIC_ORDER_MODE=server`. | Production non-disposable liquidity and line-family breadth are still follow-up. |
| Counterparty liquidity seed | `scripts/seed_mobile_route_spread_counterparty.ts` using `mintCompleteSetForPublicOrderbook` and `placeOrderAndMatch` | Local script/service | Local development/server only | Event slug; selects spread/home outcome and seeds SELL `0.52` size `60` | Writes seeded maker order, market id, outcome id, provider source/condition/token | `User`, `UserBalance`, `Position`, `Order`, `Market`, `Outcome` | None. The seed is proof liquidity, not UI fallback. | Production liquidity provider strategy remains separate. |
| Server Portfolio/history sync after fill | `/api/portfolio`, `/api/portfolio/history` | GET | Same mobile dev API key with account read scope | None | `positions[]`, `recentTrades[]`, `latest-activity-card`, position and activity selection metadata | `Position`, `Trade`, `ApiOrderRequest`, `Market`, `Outcome` | None. EX requires Android-visible position and recent activity. | Totals/team-total filled lifecycle is not covered in EX. |

Cycle EX implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-EX-local-mvp-route-server-filled-flow/cycle-EX-route-backed-retail-event.json`.
- Counterparty liquidity proof: `docs/mobile/harness/cycle-EX-local-mvp-route-server-filled-flow/cycle-EX-route-backed-counterparty.json`.
- Tablet proof slug: `mobile-el-a-provider-breadth-9bd275c5`.
- Mobile launched against `EXPO_PUBLIC_MARKET_DATA_MODE=server` and `EXPO_PUBLIC_ORDER_MODE=server`, then filled the visible simple retail spread ticket against the seeded maker ask.

## Cycle EY - Route-Backed Server Filled Totals Trade And Activity Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route-backed filled totals retail order | `/api/orders` | POST | Mobile dev API key with order write scope; backend local flags `INTERNAL_TRADING_BETA_ENABLED=true` and `TRADING_KILL_SWITCH=false` | `marketId`, `outcomeId`, `side=BUY`, `type=LIMIT`, price near `0.46`, size from `$25`, `contractSide=YES`, and selected totals/provider metadata | Order response status `FILLED`, filled shares, execution price, selection identity | `ApiKey`, `ApiOrderRequest`, `Order`, `Fill`, `Trade`, `Position`, `Market`, `Outcome` | None. EY runs with `EXPO_PUBLIC_ORDER_MODE=server`. | Team-total route-backed filled lifecycle is not covered yet. |
| Counterparty liquidity seed for totals | `scripts/seed_mobile_route_spread_counterparty.ts` using `mintCompleteSetForPublicOrderbook` and `placeOrderAndMatch` | Local script/service | Local development/server only | Event slug, `marketGroupKey=totals`, `outcomeSide=over`, `askPrice=0.46`, `askSize=60` | Writes seeded maker order, market id, outcome id, provider source/condition/token | `User`, `UserBalance`, `Position`, `Order`, `Market`, `Outcome` | None. The seed is proof liquidity, not UI fallback. | Production liquidity provider strategy remains separate. |
| Server Portfolio/history sync after totals fill | `/api/portfolio`, `/api/portfolio/history` | GET | Same mobile dev API key with account read scope | None | `positions[]`, `recentTrades[]`, `latest-activity-card`, position and activity selection metadata for totals line `2.5` | `Position`, `Trade`, `ApiOrderRequest`, `Market`, `Outcome` | None. EY requires Android-visible position and recent activity. | Team-total filled lifecycle and production active-event provider liquidity remain follow-up. |

Cycle EY implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-EY-local-mvp-route-server-filled-totals-flow/cycle-EY-route-backed-retail-event.json`.
- Counterparty liquidity proof: `docs/mobile/harness/cycle-EY-local-mvp-route-server-filled-totals-flow/cycle-EY-route-backed-totals-counterparty.json`.
- Tablet proof slug: `mobile-el-a-provider-breadth-62990515`.
- Mobile launched against `EXPO_PUBLIC_MARKET_DATA_MODE=server` and `EXPO_PUBLIC_ORDER_MODE=server`, then filled the visible simple retail Totals ticket against the seeded maker ask.

## Cycle EZ - Route-Backed Server Filled Team Total Trade And Activity Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route-backed Team Total provider fixture | `/api/mobile/events/:slug/live-detail`, `/api/mobile/events/:slug/provider-refresh` | GET / refresh helper | Public viewing for live-detail; local proof helper for refresh | Event slug from deep link `forceBackendEventSlug`; provider refresh uses event slug | Compact `markets[]` now includes `marketGroupKey=team-totals`, `marketType=team_total_goals`, `marketFamily=team_total`, line `1.5`, provider market/condition/token fields, quote/depth/history ready states | `Event`, `Market`, active `Outcome`, provider quote/depth/history snapshots | None for EZ proof. Team Total is route-backed provider-shaped data. | Production active-event provider mapping still depends on real Gamma/CLOB event matching. |
| Route-backed filled Team Total retail order | `/api/orders` | POST | Mobile dev API key with order write scope; backend local flags `INTERNAL_TRADING_BETA_ENABLED=true` and `TRADING_KILL_SWITCH=false` | `marketId`, `outcomeId`, `side=BUY`, `type=LIMIT`, price near `0.52`, size from `$25`, `contractSide=YES`, and selected team-total/provider metadata | Order response status `FILLED`, filled shares, execution price, selection identity | `ApiKey`, `ApiOrderRequest`, `Order`, `Fill`, `Trade`, `Position`, `Market`, `Outcome` | None. EZ runs with `EXPO_PUBLIC_ORDER_MODE=server`. | Production non-disposable liquidity remains follow-up. |
| Counterparty liquidity seed for Team Total | `scripts/seed_mobile_route_spread_counterparty.ts` using `mintCompleteSetForPublicOrderbook` and `placeOrderAndMatch` | Local script/service | Local development/server only | Event slug, `marketGroupKey=team-totals`, `outcomeSide=over`, `askPrice=0.52`, `askSize=60` | Writes seeded maker order, market id, outcome id, provider source/condition/token | `User`, `UserBalance`, `Position`, `Order`, `Market`, `Outcome` | None. The seed is proof liquidity, not UI fallback. | Production liquidity provider strategy remains separate. |
| Server Portfolio/history sync after Team Total fill | `/api/portfolio`, `/api/portfolio/history` | GET | Same mobile dev API key with account read scope | None | `positions[]`, `recentTrades[]`, `latest-activity-card`, position and activity selection metadata for team-total line `1.5` | `Position`, `Trade`, `ApiOrderRequest`, `Market`, `Outcome` | None. EZ requires Android-visible position and recent activity. | Production active-event provider liquidity remains follow-up. |

Cycle EZ implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-EZ-local-mvp-route-server-filled-team-total-flow/cycle-EZ-route-backed-retail-event.json`.
- Counterparty liquidity proof: `docs/mobile/harness/cycle-EZ-local-mvp-route-server-filled-team-total-flow/cycle-EZ-route-backed-team-total-counterparty.json`.
- Tablet proof slug: `mobile-el-a-provider-breadth-477e6b35`.
- Mobile launched against `EXPO_PUBLIC_MARKET_DATA_MODE=server` and `EXPO_PUBLIC_ORDER_MODE=server`, then filled the visible simple retail Team Total ticket against the seeded maker ask.

## Cycle FA - Route-Backed Retail Status States

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Route-backed retail status event | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug from deep link `forceBackendEventSlug` | `event.liveDataStatus`, `markets[].availability.source/status/marketStatus/reason`, `marketType`, `period`, `line`, provider source/market/condition/token fields, outcome prices | `Event`, `Market`, active `Outcome`, provider quote/depth/history snapshots | None for FA proof. The route creates provider-backed ready/stale/unavailable states. | Production active-event stale/unavailable status breadth still needs real mapped Polymarket data. |
| Provider-status disposable setup | `scripts/prove_mobile_ej_a_provider_status_breadth.ts` | Local script/route handler call | Local development only | Output path | Creates disposable live event and reads `/api/mobile/events/:slug/live-detail` to verify ready, stale, unavailable route states | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, `MarketOutcomeSnapshot` | None. Disposable provider-shaped data is used as contract proof data. | This is not production provider ingestion. |
| Simple TradeTicket status rendering | Mobile local component state from selected route market | N/A | N/A | Selected market/outcome from EventDetail | `ticket.market.availability.status`, `reason`, provider identity, line/period/marketType | No additional backend model | None. The ticket reads route-shaped selected market data. | Backend order rejection for unavailable provider markets should be hardened separately. |

Cycle FA implementation notes:

- `availability.source=provider-lifecycle` is now emitted for provider-backed stale/unavailable compact markets.
- Mobile launched with `EXPO_PUBLIC_MARKET_DATA_MODE=server`, `EXPO_PUBLIC_ORDER_MODE` unset, and `EXPO_PUBLIC_SHOW_ORDERBOOK` unset.
- Tablet proof slug: `mobile-ej-a-provider-status-breadth-6b9b3845`.

## Cycle FB - Provider Unavailable Order Guard

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Server fake-token order on provider-backed ticket | `/api/orders` | POST | Mobile/API credential with `orders:write`; internal trading gate enabled | `marketId`, `outcomeId`, `side`, `type`, `price`, `size`, optional `contractSide`, and `selection` | Success path unchanged; unavailable path returns/stores `{ error: { code: "MARKET_UNAVAILABLE" } }` with HTTP `409` | `ApiOrderRequest`, `Market`, `ReferenceQuoteSnapshot`, `Order` only on accepted path | None. Provider-backed unavailable markets require provider quote data. | Future: expose this server rejection in mobile only if a submit bypass/error path becomes visible. |
| Provider quote tradability guard | Latest `ReferenceQuoteSnapshot` for market/outcome | Internal Prisma read | Backend only | Selected `marketId` and `outcomeId` from order payload | `acceptingOrders`, `reason`, `fetchedAt`, provider identity on `Market` | `ReferenceQuoteSnapshot`, provider identity fields on `Market` | Non-provider markets keep existing local behavior. | Production provider refresh breadth must keep quote snapshots fresh for real active events. |

## Cycle FC - Route-Backed Event Discovery Cards

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Search/Live World Cup discovery | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1` | GET | Public viewing | None | `events[].slug`, title/team/status/live clock fields, `marketCount`, `activeMarketCount`, and opt-in `events[].markets[]` compact market data | `Event`, `Market`, `Outcome`, quote/depth read models via `serializeMarketReadModel` | Mobile keeps local World Cup fixtures if backend discovery fails or returns no usable markets. | Production active Polymarket event breadth remains P1. |
| Compact route-backed event card markets | `events[].markets[]` from `/api/events` opt-in payload | GET payload field | Public viewing | Query param `includeMobileMarkets=1` | `id`, `marketGroupKey`, `marketGroupTitle`, `marketType`, `period`, `line`, provider source/market/condition/token fields, outcomes, best bid/ask, price | `Market`, `Outcome`, `ReferenceQuoteSnapshot`, orderbook pricing read model | None for returned events; no ad hoc frontend-only market structure is created. | The route currently returns compact market data, not full event-detail chart/live stats. Detail route still owns rich game-page data. |

Cycle FC implementation notes:

- Mobile discovery no longer sends a default text search for `World Cup`; structured `sportKey=soccer` and `leagueKey=world_cup` prevent valid team-titled World Cup events from being hidden.
- Tablet evidence proves the route-backed disposable event `mobile-el-a-provider-breadth-e0acffe0` appears on Home with compact outcomes and no default orderbook UI.

## Cycle FD - Route Discovery Opens Route-Backed Event Detail

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Search/Live discovery card entry | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1` | GET | Public viewing | None | `events[].slug`, `events[].id`, `events[].title`, status/live clock fields, compact `events[].markets[]`, outcome labels/prices, provider source markers | `Event`, `Market`, `Outcome`, provider quote/read-model fields | If the event list route fails or has no usable markets, mobile still has local fixtures as fallback. FD proof requires the route-backed card. | Production active Polymarket World Cup breadth remains P1. |
| Event Detail hydration from discovery card | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event id/slug from the selected discovery event | Full event title/status, chart/probability fields, Game Lines market groups, market/outcome identity, provider source/market/condition/token fields | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, chart history snapshots | If hydration fails, the compact event remains selected; FD proof requires successful same-event route hydration. | A later cycle should prove the same Home-opened event through Buy/Sell ticket, server fake-token order, and Portfolio/history. |

Cycle FD implementation notes:

- `openEventDetail` uses the compact discovery event for instant navigation, then hydrates the same event through the live-detail route when server market-data mode is active.
- This cycle does not add or expose orderbook, chat, live stats, deposit, location, or social routes.
- Tablet proof slug: `mobile-el-a-provider-breadth-de83f85d`.

## Cycle FE - Home Route Event Opens Simple Ticket

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home card entry to ticket-ready Event Detail | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1` | GET | Public viewing | None | Event slug/id/title/status, compact markets/outcomes, provider source markers | `Event`, `Market`, `Outcome`, provider quote/read-model fields | FE proof requires the route-backed card. Local fixtures remain only as app fallback. | Production active Polymarket World Cup breadth remains P1. |
| Spread ticket opened from Home-opened detail | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event id/slug from Home card | Chart/probability fields, Game Lines, `marketType=spread`, line `1.5`, period mapped to `Reg. Time`, outcome id, provider source, provider token | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, chart history snapshots | No arbitrary frontend-only data. The ticket consumes route-shaped market/outcome identity. | Submit/Portfolio proof from this Home-opened path remains follow-up. |

Cycle FE implementation notes:

- No route or schema changes were made.
- The same backend contract from FD now proves the next visible user step: selected Spread outcome -> simple ticket.
- Tablet proof slug: `mobile-el-a-provider-breadth-3eeba606`.

## Cycle FF - Home Route Ticket Submit And Portfolio History

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home card entry to fake-token order | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail` | GET | Public viewing | None for event list; event id/slug for detail | Event title/status, chart/probability, Game Lines, selected Spread market/outcome identity, provider source/token | `Event`, `Market`, `Outcome`, provider quote/read-model fields | FE/FF use local mock fake-token order state after route-backed market selection. | Production active Polymarket event breadth remains P1. |
| Fake-token order and Portfolio/history from Home-opened ticket | Mobile local mock order path | Client state | No auth for MVP fake-token order | Ticket amount `$25`, side `buy`, contract side `yes`, and selected Spread identity | Portfolio/latest order/latest activity/position consume order-time selected identity and fake-token status | Mobile local state only for FF order/Portfolio proof | Intentional Local MVP mock mode. | Server order mode for this exact Home-opened path remains follow-up. |

Cycle FF implementation notes:

- No route or schema changes were made.
- FF uses route-backed market data, then local fake-token order state.
- Tablet proof slug: `mobile-el-a-provider-breadth-ad48c541`.

## Cycle FG - Home Route Server Order And Portfolio Open Order

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home card entry to server fake-token order | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail` | GET | Public viewing | None for event list; event id/slug for detail | Event title/status, chart/probability, Game Lines, selected Spread market/outcome identity, provider source/token | `Event`, `Market`, `Outcome`, provider quote/read-model fields | FG proof requires the route-backed card. Local fixtures remain only as app fallback. | Production active Polymarket event breadth remains P1. |
| Server fake-token order submit from Home-opened ticket | `/api/orders` | POST | Temporary mobile dev API credential with order scope | Ticket amount `$25`, side `buy`, order type/price/size, selected `marketId`, `outcomeId`, contract side `yes`, and selected Spread metadata | Order success state and Portfolio navigation after submit | `ApiOrderRequest`, `Order`, `Market`, `Outcome`, provider snapshot/read-model fields | None for FG. The order submit uses server mode. | Filled/cancel lifecycle from the exact Home-opened path remains P1. |
| Server Portfolio/history sync after Home-opened order | `/api/portfolio`, `/api/portfolio/history` | GET | Same mobile dev API key with account read scope | None | `latest-order-card`, `portfolio-open-order-count`, open order row, market type `spread`, line `1.5`, period `Reg. Time`, provider source/token | `Order`, `ApiOrderRequest`, `Market`, `Outcome`, portfolio/history read models | None for FG. Portfolio is server-synced. | Production active-event provider liquidity remains follow-up. |

Cycle FG implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-FG-home-route-server-order/cycle-FG-home-route-server-order-event.json`.
- A temporary mobile dev credential was created by `npm run mobile:dev-credential`.
- Tablet proof slug: `mobile-el-a-provider-breadth-61978ca5`.
- Mobile launched with `EXPO_PUBLIC_MARKET_DATA_MODE=server`, `EXPO_PUBLIC_ORDER_MODE=server`, and a real in-process mobile API key.

## Cycle FH - Home Route Server Cancel And Portfolio Activity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home card entry to cancelable server order | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail` | GET | Public viewing | None for event list; event id/slug for detail | Event title/status, chart/probability, Game Lines, selected Spread market/outcome identity, provider source/token | `Event`, `Market`, `Outcome`, provider quote/read-model fields | FH proof requires the route-backed card. Local fixtures remain only as app fallback. | Production active Polymarket event breadth remains P1. |
| Server fake-token order submit from Home-opened ticket | `/api/orders` | POST | Temporary mobile dev API credential with order scope | Ticket amount `$25`, side `buy`, order type/price/size, selected `marketId`, `outcomeId`, contract side `yes`, and selected Spread metadata | Order success state and Portfolio navigation after submit | `ApiOrderRequest`, `Order`, `Market`, `Outcome`, provider snapshot/read-model fields | None for FH. The order submit uses server mode. | Filled lifecycle from the exact Home-opened path remains P1. |
| Server order cancel from Portfolio | `/api/orders/:id` | DELETE | Same mobile dev API key with order cancel scope | Order id from visible open order row | Canceled state via refreshed Portfolio/history, `activity-canceled`, `status-canceled`, selected market metadata | `Order`, `ApiOrderRequest`, `Market`, `Outcome`, portfolio/history read models | None for FH. The cancel uses server mode. | Production active-event provider liquidity remains follow-up. |
| Server Portfolio/history sync after cancel | `/api/portfolio`, `/api/portfolio/history` | GET | Same mobile dev API key with account read scope | None | `latest-activity-card`, canceled activity row, market type `spread`, line `1.5`, period `Reg. Time`, provider source/token | `Order`, `ApiOrderRequest`, `Market`, `Outcome`, portfolio/history read models | None for FH. Portfolio/history is server-synced. | Production active-event provider liquidity remains follow-up. |

Cycle FH implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-FH-home-route-server-cancel/cycle-FH-home-route-server-cancel-event.json`.
- A temporary mobile dev credential was created by `npm run mobile:dev-credential`.
- Tablet proof slug: `mobile-el-a-provider-breadth-4f7f2397`.
- Mobile launched with `EXPO_PUBLIC_MARKET_DATA_MODE=server`, `EXPO_PUBLIC_ORDER_MODE=server`, and a real in-process mobile API key.

## Cycle FI - Home Route Server Filled Position And Activity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home card entry to fillable server order | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail` | GET | Public viewing | None for event list; event id/slug for detail | Event title/status, chart/probability, Game Lines, selected Spread market/outcome identity, provider source/token | `Event`, `Market`, `Outcome`, provider quote/read-model fields | FI proof requires the route-backed card. Local fixtures remain only as app fallback. | Production active Polymarket event breadth remains P1. |
| Server fake-token order submit from Home-opened ticket | `/api/orders` | POST | Temporary mobile dev API credential with order scope | Ticket amount `$25`, side `buy`, order type/price/size, selected `marketId`, `outcomeId`, contract side `yes`, and selected Spread metadata | Filled order state and Portfolio navigation after submit | `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, `Outcome`, provider snapshot/read-model fields | None for FI. The order submit uses server mode and fills against seeded liquidity. | Production active-event provider liquidity remains follow-up. |
| Counterparty liquidity seed for fill proof | `scripts/seed_mobile_route_spread_counterparty.ts` | Local script/Prisma write | Local development only | Event slug, optional market group/outcome/price/size | Creates a maker SELL order at `0.52` for the selected route-backed spread outcome | `User`, `Order`, `Market`, `Outcome` | None. This is deterministic backend-shaped proof liquidity. | Replace with real production liquidity/provider depth when active event breadth is ready. |
| Server Portfolio/history sync after fill | `/api/portfolio`, `/api/portfolio/history` | GET | Same mobile dev API key with account read scope | None | `latest-order-card`, `latest-activity-card`, `position-card-`, `status-filled`, filled shares, exec price, market type `spread`, line `1.5`, period `Reg. Time`, provider source/token | `Order`, `Trade`, `Position`, `ApiOrderRequest`, `Market`, `Outcome`, portfolio/history read models | None for FI. Portfolio/history is server-synced. | Production active-event provider liquidity remains follow-up. |

Cycle FI implementation notes:

- The backend route event was created by `scripts/prove_mobile_el_a_provider_breadth.ts` into `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-event.json`.
- Counterparty liquidity was created by `scripts/seed_mobile_route_spread_counterparty.ts` into `docs/mobile/harness/cycle-FI-home-route-server-filled/cycle-FI-home-route-server-filled-counterparty.json`.
- A temporary mobile dev credential was created by `npm run mobile:dev-credential`.
- Tablet proof slug: `mobile-el-a-provider-breadth-0ca8dfb3`.
- Mobile launched with `EXPO_PUBLIC_MARKET_DATA_MODE=server`, `EXPO_PUBLIC_ORDER_MODE=server`, and a real in-process mobile API key.

## Cycle FU - Portfolio Value History Backend Route

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio performance chart range data | `/api/portfolio/value-history?range=1D|1W|1M|All` | GET | Session user or mobile API key with `account:read` | Query param `range`; defaults to `1D` when omitted | `range`, `ranges`, `source=portfolio-value-history-route`, `status`, `generatedAt`, `lastUpdated`, `emptyState`, `points[].timestamp/value/cash/positionsValue/pnl` | `UserBalance`, `Position`, `MarketOutcomeSnapshot` | Standalone mobile still has deterministic fallback data with the same response shape until route wiring is enabled. | Persisted account-level value snapshots remain future work; this route reconstructs value history from market outcome snapshots and current wallet/position state. |

Cycle FU implementation notes:

- The route reuses the same auth model as `/api/portfolio`.
- Invalid ranges return `400` before account state queries.
- Empty accounts return `status=empty`, `emptyState=no-history`, and no points.
- No orderbook, deposit, withdraw, chat, live stats, or social behavior was added.

## Cycle LI - Inactive Futures Surface Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Home match list | `/api/events?includeMobileMarkets=1` in server market-data mode | GET | Public viewing | Query filters/cursor/page size | Event identity, status, teams, compact markets/outcomes, market profile/rules for Home card outcome selection | `Event`, `Market`, `Outcome`, provider/read-model event fields | Existing local `worldCupEvents` remains standalone fallback. | Production active provider breadth remains P1. |
| Old Home Futures tab/list/chart | None after LI | N/A | N/A | N/A | None; the inactive surface was removed from visible app wiring | None for visible MVP | No visible fallback; stale local chart/stat invention removed from source | If Futures browsing returns, backend must own catalog, ordering, quotes, outcome volume/liquidity, and YES/NO contract ids. |

Cycle LI implementation notes:

- No backend route or schema change was required.
- The cleanup narrows visible Home to match/event routes that already have backend contracts.
- Local futures mock data can still support legacy position target lookup and proof fixtures, but no Home Futures browsing surface is exposed.

## Cycle LJ - MVP Backend Readiness Gate

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MVP route readiness inventory | Existing visible MVP route set: `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/events/:slug/markets`, `/api/markets/:id/quote`, `/api/orders`, `/api/orders/:id`, `/api/portfolio`, `/api/portfolio/history`, `/api/portfolio/value-history`, `/api/account/balance`, `/api/profile/summary`, `/api/profile/preferences` | GET/POST/DELETE/PUT as documented per route | Public for event discovery/detail where applicable; account/order routes require canonical mobile API/session scopes | Same as each route contract | Event pages, Game Lines, quotes, order submit/cancel state, Portfolio state/history/chart, account summary/preferences | Existing `Event`, `Market`, `Outcome`, `Order`, `ApiOrderRequest`, `Fill`, `Position`, `Trade`, `UserBalance`, `UserProfilePreference`, snapshot/read-model tables | Mock/offline mode remains. Server-mode Home no longer renders bundled event fallback after route failure; Portfolio value-history route failure remains visible; server cancel waits for backend success. | Public launch still needs production provider breadth, real liquidity, public auth/session/funding/compliance, and dedicated cashout preview/proceeds semantics. |

Cycle LJ implementation notes:

- No backend route or schema change was required.
- LJ turns the full MVP readiness audit into a proof gate and hardens the main server-mode masking risks discovered by the audit.
- Internal local readiness is limited to fake-token/internal server-mode MVP flows.

## Cycle LN - Match Line Service Readiness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home match event with line markets | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1` | GET | Public viewing | Query filters/page size | Event slug/title/status, `marketProfile=regulation_90`, compact `markets[]` with `marketType`, `marketGroupTitle`, `line`, `period`, outcomes, prices | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | No frontend-only fallback added. Local seed writes backend-shaped contract rows. | Real Polymarket match line-market discovery/attachment remains P1. |
| Event Detail line market route | `/api/mobile/events/switzerland-vs-colombia/live-detail` | GET | Public viewing | Event slug | 7 route markets after LN: Regulation Winner, Spread, Totals, Team Totals; outcome ids/token ids/prices; chart/provider lifecycle metadata where available | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `MarketOutcomeSnapshot` | Contract-fixture line markets are marked `referenceSource=contract-fixture`. | Replace contract-fixture line rows with Polymarket-backed rows when available. |
| Local MVP line-market readiness seed | `scripts/seed_mobile_mvp_match_line_markets.ts` | Local script/Prisma write | Local development only | `--eventSlug`, optional `--summaryPath` | Proof JSON with before/after route market types and groups | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | Intended temporary bridge for local MVP UI proof. | Production provider breadth and real liquidity remain outside this cycle. |

Cycle LN implementation notes:

- Before LN, `switzerland-vs-colombia` and `argentina-vs-egypt` only served `match_winner_1x2`.
- `mobile-fj-real-world-cup-winner` is provider-backed but is a futures/outright surface, not a match-betting line surface.
- LN enriches the live match path only and keeps futures as a separate surface.

## Cycle LO - Enriched Match Line Order Lifecycle

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Simple Buy ticket for enriched match Spread | `/api/orders` | POST | Canonical mobile API key with `orders:write`; internal trading beta enabled for local proof user | `marketId`, `outcomeId`, `side=BUY`, `type=LIMIT`, `price=0.52`, `size=10`, `contractSide=YES`, and `selection` snapshot for Spread line `1.5` | Order id/status/fills, filled order selection, balance, position | `ApiCredential`, `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, `Outcome`, `UserBalance` | None in LO. The proof uses the real order route and matching service. | S23 visible ticket proof remains open. Production line liquidity remains open. |
| Filled Portfolio position after enriched match line BUY | `/api/portfolio` | GET | Canonical mobile API key with `account:read` | None | Filled `positions[]` with selected market/outcome, line `1.5`, period `regulation`, provider/source fields, reference token id | `Position`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | None in LO. Server route is source of truth. | Public provider-backed line data remains P1. |
| Recent trade activity after enriched match line BUY | `/api/portfolio/history` | GET | Canonical mobile API key with `account:read` | None | `recentTrades[]` selection preserving Spread identity, line, period, source, token | `Trade`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | None in LO. Server route is source of truth. | S23 Portfolio/history visible proof remains P0. |
| Maker liquidity for local fill proof | Matching service via `scripts/prove_mobile_mvp_match_line_order_lifecycle.ts` | Local script/Prisma write | Local development only | Market/outcome, ask price `0.52`, ask size `25` | Creates a resting SELL order so the mobile-style BUY fills | `User`, `UserBalance`, collateral/position/order/trade tables | Deterministic backend liquidity only; not frontend mock state. | Replace with production liquidity/provider depth before public readiness. |

Cycle LO implementation notes:

- LO is a server-mode lifecycle pass, not a device Audit Gate pass.
- ADB showed no attached devices, and the S23 wireless debug hostname did not resolve, so Android proof remains the next P0.

## Cycle LP - Provider Match Line Availability

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail provider availability audit | Polymarket Gamma `https://gamma-api.polymarket.com/events?slug=fifwc-che-col-2026-07-07` | GET | Public provider API | Exact provider event slug | Provider event title, market ids, market slugs, questions, condition ids | None directly; compared against local `Event.externalSlug` and market mapping fields | None. This is a provider inspection. | Gamma exposes only Regulation Winner markets for the selected event; no provider-backed Spread/Totals/Team Totals are available through this surface. |
| Holiwyn Event Detail route comparison | `/api/mobile/events/switzerland-vs-colombia/live-detail` | GET | Public viewing | Event slug | `markets[]` with `marketType`, `marketGroupTitle`, `line`, `period`, `referenceSource`, `externalMarketId` | `Event`, `Market`, `Outcome`, provider/read-model quote fields | Contract-fixture line markets are allowed for Local MVP UI/order proof when the exact Polymarket event has no real line markets. | Replace fixture line rows with real provider mappings when available. |

Cycle LP implementation notes:

- No schema or order-route change was required.
- `Regulation Winner` is real Polymarket-backed data for the selected match.
- `Spread`, `Totals`, and `Team Totals` are route-visible only through backend-shaped `contract-fixture` rows.
- `OPTIC_ODDS_API_KEY` remains optional and is not a blocker for this Polymarket-first MVP path.

## Cycle LQ - Market Source Summary Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home event source readiness | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1` | GET | Public viewing | Query filters and page size | `events[].marketSourceSummary.totalMarketCount`, `sourceBreakdown`, `regulationWinner.status`, `lineMarkets.status`, `lineMarkets.families`, `lineMarkets.reason` | `Event`, `Market`, `Outcome` source/mapping fields | None added. Existing contract fixtures remain backend rows. | Real provider-backed line markets remain absent for selected Gamma event. |
| Event Detail source readiness | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug | `event.marketSourceSummary`, `contract.marketSourceSummary`; same source/family/status fields as Home | `Event`, `Market`, `Outcome` source/mapping fields | None added. Existing contract fixtures remain backend rows. | Real provider-backed line markets remain absent for selected Gamma event. |

Cycle LQ implementation notes:

- No schema migration was required.
- The summary is derived from existing `referenceSource`, `marketType`, `marketGroupKey`, and `marketGroupTitle` fields.
- Home and Event Detail now expose the same source-readiness classification for the selected MVP match.

## Cycle LR - Portfolio Selection Source Summary

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio position/open-order source readiness | `/api/portfolio` | GET | Session user or mobile API key with `account:read` | None | `selectionSourceSummary.positions`, `selectionSourceSummary.openOrders`, `selectionSourceSummary.combined`; section source counts and line-market status/families | `Position`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | None added. Summary derives from stored order selection snapshots and market/outcome fallback fields. | Real provider-backed line markets remain absent for selected Gamma event. |
| Portfolio recent-trade/cancel source readiness | `/api/portfolio/history` | GET | Session user or mobile API key with `account:read` | None | `selectionSourceSummary.recentTrades`, `selectionSourceSummary.canceledOrders`, `selectionSourceSummary.combined`; section source counts and line-market status/families | `Trade`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | None added. Summary derives from stored order selection snapshots and market/outcome fallback fields. | Real provider-backed line markets remain absent for selected Gamma event. |

Cycle LR implementation notes:

- No schema migration was required.
- Portfolio/history selection summaries classify the same line-market source that was submitted through the ticket.
- The LR proof shows a contract-fixture Spread order becomes a contract-fixture Portfolio position and contract-fixture recent trade.

## Cycle LT - Home To Portfolio Route Journey

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home MVP event selection | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public viewing | Query filters/page size | Event slug/title, `marketSourceSummary`, compact market rows | `Event`, `Market`, `Outcome`, source/read-model fields | None added. Existing contract-fixture line rows remain backend rows. | Real provider-backed line markets remain absent for selected Gamma event. |
| Event Detail line selection | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug from Home | Event source summary, line-market row, outcome identity, token/source ids | `Event`, `Market`, `Outcome`, quote/chart/read-model fields | None added. Existing contract-fixture line rows remain backend rows. | Real provider-backed line markets remain absent for selected Gamma event. |
| Fake-token Buy submit | `/api/orders` | POST | Canonical mobile API key with order scope | Selected `marketId`, `outcomeId`, BUY side, LIMIT price/size, and line-market `selection` snapshot | Filled order status and preserved selection identity | `ApiCredential`, `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, `Outcome` | Deterministic maker liquidity is seeded for local proof. | Production liquidity remains future work. |
| Portfolio proof after Home-selected trade | `/api/portfolio`, `/api/portfolio/history` | GET | Canonical mobile API key with `account:read` | None | Filled position, recent trade, `selectionSourceSummary`, selected line/source/token identity | `Position`, `Trade`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | None added. Route proof uses real server state. | S23 visible proof remains open. |

Cycle LT implementation notes:

- The proof starts from the public Home route rather than direct database lookup.
- The selected Event Detail line market, order request, Portfolio position, and History trade all preserve `referenceSource=contract-fixture`.
- S23 was visible during the cycle but visual Android proof was intentionally left for the next UI Audit Gate cycle.

## Cycle LU - Current State Inspection And Home MVP Feed Tightening

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home MVP match feed | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public viewing | Query filters/page size; mobile now passes `leagueKey=world_cup` | Match `slug`, `title`, `eventType`, `sportKey`, `leagueKey`, live/status fields, compact Regulation Winner outcomes, `marketSourceSummary` | `Event`, `Market`, `Outcome`, provider/read-model fields | Server-mode Home still clears events instead of rendering bundled fallback if the route fails. | Backend route can still return futures; mobile filters to match events for Local MVP. |
| Event Detail source inspection | `/api/mobile/events/switzerland-vs-colombia/live-detail` | GET | Public viewing | Event slug | `event.marketSourceSummary`, market rows, `referenceSource`, `marketType`, line/period/outcome identity | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | Contract-fixture line rows remain backend-written Local MVP bridge data. | Real provider-backed Spread/Totals/Team Total rows are not attached for the selected Gamma event. |

Cycle LU implementation notes:

- No backend route or schema change was required.
- Mobile Home feed now asks for `leagueKey=world_cup` and drops non-match/futures provider records.
- S23 proof used Expo Go because the installed `com.holiwyn.mobile` package is stale and still shows older local Home UI.

## Cycle LV - Event Detail Layout Tightening

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail visible chart and line-market layout | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug selected from Home | Event title/teams/status, primary market outcomes, `chartHistory`, market `marketType`, `marketGroupTitle`, `line`, `period`, outcome probabilities, source identity fields | `Event`, `Market`, `Outcome`, provider/read-model quote fields | No new mock added. Existing backend-written `contract-fixture` line rows are rendered when provider line markets are absent. | Real provider-backed Spread/Totals/Team Total markets remain absent for `switzerland-vs-colombia`. |

Cycle LV implementation notes:

- No backend route or schema changed.
- The mobile page now consumes the existing Event Detail route in a denser Polymarket-like layout.
- The chart uses route `chartHistory` when present and falls back to deterministic display points from current probabilities.

## Cycle LW - S23 Line Ticket To Portfolio History Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Spread line Buy submit | `/api/orders` | POST | Mobile dev API key with `orders:write`; internal trading beta enabled | `marketId`, `outcomeId`, `side=BUY`, `type=LIMIT`, price/size derived from `$25` at `52%`, line-market `selection` snapshot | Order response status, filled/open order fields, resulting Portfolio refresh | `ApiCredential`, `ApiOrderRequest`, `Order`, `Trade`, `Position`, `Market`, `Outcome`, `UserBalance` | None added. Existing backend-shaped `contract-fixture` line row selected from Event Detail. | Runtime deep-link API-key injection is unreliable in current Expo Go session; Expo env startup path is required for proof. |
| Portfolio after line Buy | `/api/portfolio` | GET | Mobile dev API key with `account:read` | None | Position title/outcome, cost, to-win, entry probability, cash/value totals | `Position`, `Order`, `Trade`, `UserBalance`, `Market`, `Outcome` | None. Route-backed Portfolio state shown on S23. | None for local fake-token MVP proof. |
| History after line Buy | `/api/portfolio/history` | GET | Mobile dev API key with `account:read` | None | Recent trade/activity row with event, line, side, amount, timestamp | `Trade`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | None. Route-backed History state shown on S23. | None for local fake-token MVP proof. |

Cycle LW implementation notes:

- `/api/orders` correctly rejected unauthenticated mobile submit with `Authentication required`.
- With the dev API key loaded into the Expo process environment, the same S23 flow submitted and appeared in Portfolio/history.

## Cycle LX - Local MVP S23 Startup Harness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local MVP S23 proof startup | `/api/health` and Expo `/status` | GET | Public | None | Backend health availability and Expo packager status | None | None | None for startup; proof still requires generated mobile dev API key for authenticated routes. |
| Mobile dev credential generation | Local `scripts/create_mobile_dev_credential.ts` | Local script | Local development database access | Optional env overrides for username/balance/policy | Redacted credential metadata, configured API key status | `User`, `UserBalance`, `ApiCredential`, ledger deposit records | Fake-token local balance top-up to 10000 USDT equivalent | Production auth/session model remains outside local MVP proof scope. |

Cycle LX implementation notes:

- No API route or schema changed.
- Startup now makes the server-mode mobile proof dependency explicit instead of relying on fragile runtime deep-link API-key injection.

## Cycle LY - Portfolio Chart Containment

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio header chart/range display | `/api/portfolio` and `/api/portfolio/value-history?range=1D` | GET | Mobile dev API key with `account:read` when server mode is active | None | Portfolio balance/positions plus value-history `points`, `range`, `source`, and `status` | `UserBalance`, `Position`, portfolio value history read model | Deterministic value history remains the fallback if route history is unavailable. | None for chart containment; broader production value-history richness remains P1. |

Cycle LY implementation notes:

- No backend route or schema changed.
- The UI now constrains route/fallback value-history points to the visual chart band before the range selector.

## Cycle LZ - Current State Reinspection And Portfolio Account Entry

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current Local MVP route inspection | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` and `/api/mobile/events/switzerland-vs-colombia/live-detail` | GET | Public viewing | Query filters and event slug | Event/match list, `eventType`, `marketSourceSummary`, `markets[].referenceSource`, `marketType`, `line`, `period` | `Event`, `Market`, `Outcome`, provider/read-model fields | Existing backend `contract-fixture` line rows remain visible when provider lines are absent. | Real provider-backed Spread/Totals/Team Totals are not attached for the selected Gamma event. |
| Provider line availability confirmation | Polymarket Gamma `https://gamma-api.polymarket.com/events?slug=fifwc-che-col-2026-07-07` | GET | Public provider API | Exact provider event slug | Provider market ids, slugs, questions, condition ids, derived market-family count | Compared to local `Event.externalSlug`, `Market.externalMarketId`, `Market.referenceSource` | None; this is provider inspection only. | Gamma exposes 0 checked line-market families for this event. |
| Portfolio account entry | Existing `AccountScreen` tab state | Local navigation | No new route | Tap Portfolio top-left profile/avatar | Existing Account screen props already loaded by App state and profile/account routes when available | No new database dependency | None | No backend route is required for the navigation change. |

Cycle LZ implementation notes:

- No backend route or schema changed.
- `mobile:mvp:inspect` now exists for repeatable Local MVP route inspection.
- Portfolio account entry is frontend navigation only; account data dependencies remain the existing Account screen routes.

## Cycle MA - Argentina vs Egypt Line Fixtures And Detail Hydration

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home match feed inspection | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public viewing | Query filters/page size | Match `slug`, `title`, `eventType`, compact `markets`, `marketSourceSummary`, line families | `Event`, `Market`, `Outcome`, provider/read-model fields | Mobile filters out futures and does not invent Home matches in server mode. | Route still includes a future record; mobile filters it for Local MVP. |
| Argentina vs Egypt detail hydration | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | 7 markets, `marketSourceSummary`, market `referenceSource`, `marketType`, `marketGroupTitle`, `line`, `period`, outcome prices, condition/token/source fields | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, local orderbook quote snapshots | Existing backend-written `contract-fixture` lines are consumed for Local MVP UI proof. | Real provider-backed Spread/Totals/Team Total markets are absent for the inspected Polymarket match. |
| Local MVP line fixture seeding | `scripts/seed_mobile_mvp_match_line_markets.ts` | Local script | Local development database access | `--eventSlug`, `--cycle`, `--summaryPath` | Writes backend-shaped line markets and quote snapshots; proof reads route back | `Market`, `Outcome`, `ReferenceQuoteSnapshot` | This creates contract-shaped line rows only when provider-backed rows are unavailable. | Replace with provider-backed line ingestion when approved provider rows exist. |

Cycle MA implementation notes:

- No schema migration was added.
- No order route behavior changed.
- Event Detail now uses `event.slug ?? event.id` for hydration, matching the mobile live-detail route contract.

## Cycle MB - Current MVP Inspection, Swipe Submit, And S23 Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current Home route inspection | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public viewing | Query filters/page size | Event slug/title/type/status, compact markets, `marketSourceSummary` | `Event`, `Market`, `Outcome`, provider/read-model fields | None added. Existing contract-fixture rows are returned from backend. | Route still includes one future; mobile filters it for Local MVP match flow. |
| Event Detail line market proof | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | 7 markets, provider-backed Regulation Winner, contract-fixture line markets, selected `marketId`, `outcomeId`, `line`, `period`, source/token/condition identity | `Event`, `Market`, `Outcome`, provider quote/read-model fields | Contract-shaped line rows are backend records, not frontend-only random mock data. | Real provider-backed Spread/Totals/Team Total rows are not available for the inspected Polymarket match. |
| Visible S23 swipe order | `/api/orders` | POST | Mobile dev API key with order scope | Selected line market/outcome, side, price/size, selection snapshot | Open order/Portfolio refresh; selected line/source identity | `ApiCredential`, `Order`, `ApiOrderRequest`, `UserBalance`, `Market`, `Outcome` | None added. | UI proof lands as open order unless crossing liquidity is available. |
| Portfolio open order and history empty state | `/api/portfolio`, `/api/portfolio/history` | GET | Mobile dev API key with account scope | None | Portfolio cash/open order plus History empty state; selection identity remains present in labels/state | `UserBalance`, `Order`, `Trade`, `Market`, `Outcome` | None added. | Filled History from visible UI requires seeded/crossing liquidity or a fill path. |

Cycle MB implementation notes:

- No schema migration was added.
- Backend route proof verified a filled order/history using seeded counterparty liquidity.
- S23 visible proof verified the retail open-order path and History empty state after an unfilled order.

## Cycle MC - Visible Filled History For Local MVP Line Ticket

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home MVP match selection | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public viewing | Query filters/page size | Event slug/title/type/status, compact markets, `marketSourceSummary` | `Event`, `Market`, `Outcome`, provider/read-model fields | None added. Existing contract-fixture rows are returned from backend. | Route still includes one future; mobile filters it for Local MVP match flow. |
| Event Detail line market selection | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | 7 markets, provider-backed Regulation Winner, selected Spread `1.5` line, source/token/condition identity | `Event`, `Market`, `Outcome`, provider quote/read-model fields | Contract-shaped line rows are backend records, not frontend-only random mock data. | Real provider-backed Spread/Totals/Team Total rows are not available for the inspected Polymarket match. |
| Visible S23 filled swipe order | `/api/orders` | POST | Mobile dev API key with order scope | Selected line market/outcome, BUY side, price/size, selection snapshot | Filled order/Portfolio refresh; selected line/source identity | `ApiCredential`, `Order`, `ApiOrderRequest`, `Trade`, `Position`, `UserBalance`, `Market`, `Outcome` | Local proof seeds deterministic counterparty liquidity before the S23 submit. | Production liquidity remains future work. |
| Portfolio filled position and history | `/api/portfolio`, `/api/portfolio/history` | GET | Mobile dev API key with account scope | None | Filled position and recent trade row with selected Spread line/source/token identity | `UserBalance`, `Position`, `Trade`, `Order`, `Market`, `Outcome` | None added. Routes read real server state after the visible S23 submit. | None for local fake-token MVP proof. |

Cycle MC implementation notes:

- No schema migration was added.
- Proof cleanup cancels only stale automated proof BUY orders on the exact selected market/outcome before seeding maker liquidity.
- S23 visible proof now verifies filled History, closing the prior MB gap where the visible UI landed only on an open order.

## Cycle ME - Event Detail Line Section Clearance

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail Game Lines layout | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | Market group/title, `marketType`, `line`, `period`, outcome probability, source/token/condition identity | `Event`, `Market`, `Outcome` | Existing backend-shaped `contract-fixture` rows are rendered. | Real provider-backed line rows remain unavailable for the inspected match. |
| Visible S23 regression path | `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | POST/GET | Mobile dev API key for order/account routes | Selected Spread `1.5` BUY selection snapshot | Filled order, refreshed Portfolio position, History trade row | `ApiCredential`, `Order`, `ApiOrderRequest`, `Trade`, `Position`, `UserBalance`, `Market`, `Outcome` | Local proof seeds deterministic counterparty liquidity before submit. | Production liquidity remains future work. |

Cycle ME implementation notes:

- No backend route or schema changed.
- The API dependency remains the same as Cycle MC; this cycle only improved Event Detail layout/proof stability.

## Cycle MF - Home Compact Feed And Proof Hygiene

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home compact match feed | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public viewing | Query filters/page size | Event `slug`, `title`, `eventType`, `status`, `sportKey`, `leagueKey`, `homeTeamName`, `awayTeamName`, `liveStatus`, `clock`, `period`, compact markets and outcomes | `Event`, `Market`, `Outcome`, provider/read-model fields | None added. Mobile filters the existing route to active match-like rows only. | Route should eventually return only Local MVP match rows for this view instead of requiring mobile-side future filtering. |
| Event Detail line selection | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | Provider-backed Regulation Winner rows plus backend-shaped Spread/Totals line rows, `marketType`, `line`, `period`, outcome ids/source/price fields | `Event`, `Market`, `Outcome`, provider quote/read-model fields | Existing `contract-fixture` line rows remain the local MVP fallback. | Real provider-backed line rows remain unavailable for the inspected Polymarket event. |
| Visible S23 filled swipe order | `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | POST/GET | Mobile dev API key for order/account routes | Selected Spread `1.5` BUY selection snapshot | Filled order, refreshed Portfolio position, History trade row | `ApiCredential`, `Order`, `ApiOrderRequest`, `Trade`, `Position`, `UserBalance`, `Market`, `Outcome` | Local proof seeds deterministic counterparty liquidity before submit. | Production liquidity/execution behavior remains future work. |

Cycle MF implementation notes:

- No backend route or schema changed.
- The harness now proves Home is clean before route navigation by dismissing Expo developer-menu overlays.
- Home filtering now avoids treating missing `eventType` as match evidence; match-like fields or live status must be present.

## Cycle MG - Home MVP Match Route Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home Local MVP match feed | `/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query filters/page size | Event `slug`, `title`, `eventType`, `status`, `liveStatus`, team names, compact `markets`, `marketSourceSummary`, `page.nextCursor`, `page.hasMore` | `Event`, `Market`, `Outcome`, provider/read-model fields | None added. Home still has local fallback only if the backend route is unreachable. | None for match-only Home contract. A dedicated mobile Home endpoint remains optional future cleanup. |
| Event Detail line selection | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | Provider-backed Regulation Winner rows plus backend-shaped Spread/Totals line rows, `marketType`, `line`, `period`, selected outcome identity | `Event`, `Market`, `Outcome`, provider quote/read-model fields | Existing `contract-fixture` line rows remain the Local MVP fallback. | Real provider-backed line rows remain unavailable for the inspected Polymarket events. |
| Visible S23 filled swipe order | `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | POST/GET | Mobile dev API key for order/account routes | Selected Spread `1.5` BUY selection snapshot | Filled order, refreshed Portfolio position, History trade row | `ApiCredential`, `Order`, `ApiOrderRequest`, `Trade`, `Position`, `UserBalance`, `Market`, `Outcome` | Local proof seeds deterministic counterparty liquidity before submit. | Production liquidity/execution behavior remains future work. |

Cycle MG implementation notes:

- `/api/events` now supports `mobileMvpMatches=1` as an explicit Local MVP Home feed contract.
- Route proof returned 2 active match events and 0 futures.
- No schema migration was added.

## Cycle NK - Current Provider Winner Chart Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current Home match feed | `/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query filters/page size | Current match slug/title plus compact markets and `marketSourceSummary` | `Event`, `Market`, `Outcome` | None added. | None for current match discovery. |
| Event Detail provider chart | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | `event.chartHistory`, `event.chartHistorySource`, `event.chartHistoryStatus`, `event.chartHistoryRange`, `event.chartHistoryLastUpdated`, `contract.batchedChartHistorySource`, market-level `chartHistoryStatus` | `Event`, `Market`, `Outcome`, `MarketOutcomeSnapshot` | Existing synthetic chart drawing remains only a visual fallback when history is empty. | Automated provider refresh scheduling is still separate; this cycle proves the refresh path and route contract. |
| Primary market chart route | `/api/markets/:id/chart?range=1D` | GET | Public viewing plus market visibility guard | Market id/range | `source`, `history`, `lastUpdated`, `emptyState`, `series` | `Market`, `Outcome`, `MarketOutcomeSnapshot` | Empty route returns `emptyState: no-history`. | None for provider-backed Regulation Winner history after refresh. |
| Provider CLOB history refresh | `scripts/prove_current_match_polymarket_chart_history.ts` -> `refreshPolymarketPriceHistorySnapshots` | Local script/provider fetch | Local development database and public Polymarket CLOB | Event slug, provider-backed market ids | Refresh report, snapshot counts, skipped reasons | `Market`, `Outcome`, `MarketOutcomeSnapshot` | None added. | Freshness depends on provider availability and current market token ids. |
| Visible S23 provider winner order | `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | POST/GET | Mobile dev API key for order/account routes | Provider-backed Regulation Winner selection snapshot | Filled order, Portfolio position/activity/history with provider source and no line | `ApiCredential`, `Order`, `ApiOrderRequest`, `Trade`, `Position`, `UserBalance`, `Market`, `Outcome` | Proof seeds deterministic counterparty liquidity. | Production liquidity remains future work. |

Cycle NK implementation notes:

- No schema migration was added.
- `/api/mobile/events/:slug/live-detail` now surfaces route-visible chart source/status fields for mobile proof.
- Current line-market route rows remain `contract-fixture`; this is documented and not claimed as Polymarket-backed parity.

## Cycle NL - Provider Refresh And Local MVP Liquidity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current Home match feed | `/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query filters/page size | Current match slug/title plus compact markets and source summary | `Event`, `Market`, `Outcome` | None added. Restore script rebuilds backend records when tests reset DB. | Dedicated provider-owned active match discovery remains future work. |
| Event Detail current match | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | 3 provider-backed Regulation Winner markets, 4 contract-fixture line markets, chart source/status, selection identity fields | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `MarketOutcomeSnapshot` | Backend-shaped line fixtures remain for MVP line UI. | Real provider-backed Spread/Totals/Team Total rows remain unavailable for this inspected event. |
| Provider quote refresh | `/api/mobile/events/:slug/provider-refresh` via `executeMobileLiveProviderRefreshRoute` | Route/service proof | Local backend/proof context | Event slug, `allowContractProofFallback=false` | Provider refresh status, refreshed/skipped counts, quote lifecycle fields | `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `MarketOutcomeSnapshot` | Optic Odds is optional/unconfigured and non-blocking. | Orderbook depth remains internal and not required for Local MVP. |
| Visible S23 provider winner order | `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | POST/GET | Mobile dev API key for order/account routes | Provider-backed Regulation Winner BUY selection snapshot | Filled order, Portfolio position, History activity with provider market/token/source identity | `ApiCredential`, `Order`, `ApiOrderRequest`, `Trade`, `Position`, `UserBalance`, `Market`, `Outcome` | Proof seeds deterministic local counterparty liquidity. | Production liquidity/execution behavior remains future work. |

Cycle NL implementation notes:

- No schema migration was added.
- Gamma market refresh now supports grouped soccer event fallback.
- Provider-mapped fake-token orders can execute when Holiwyn has local crossing liquidity even if the old provider book is unavailable.

## Cycle NM - Current Line Ticket S23 Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current Home/Live match entry | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public viewing | Query filters/page size | Event slug/title, compact market source summary, provider winner/local line disclosure | `Event`, `Market`, `Outcome` | None added. | Dedicated active provider match feed remains future cleanup. |
| Event Detail line selection | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | Spread line `1.5`, outcome ids, source, token, condition, line, period | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | Existing backend `contract-fixture` line rows. | Real provider-backed Spread/Totals/Team Total rows remain unavailable. |
| Server ticket submit | `/api/orders` | POST | Mobile dev API key | BUY limit order with selection snapshot for `Egypt +1.5` | Filled order id/status and selection snapshot | `ApiCredential`, `ApiOrderRequest`, `Order`, `Trade`, `Position`, `UserBalance` | Proof seeds local counterparty liquidity. | Production liquidity remains future work. |
| Portfolio/history confirmation | `/api/portfolio`, `/api/portfolio/history` | GET | Mobile dev API key | None | Position, recent trade, selected line/source identity | `Position`, `Trade`, `Order`, `Market`, `Outcome` | None added. | None for Local MVP fake-token proof. |

Cycle NM implementation notes:

- No backend route/schema changed.
- The route and S23 proofs validate the current route-backed line-ticket flow after Cycle NL restored service readiness.

## Cycle NN - Current Line Cashout S23 Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current Home/Live match entry | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public viewing | Query filters/page size | Event slug/title, compact market source summary, provider winner/local line disclosure | `Event`, `Market`, `Outcome` | None added. | Dedicated active provider match feed remains future cleanup. |
| Event Detail line selection | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | Spread line `1.5`, outcome ids, source, token, condition, line, period | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | Existing backend `contract-fixture` line rows. | Real provider-backed Spread/Totals/Team Total rows remain unavailable. |
| Server buy ticket submit | `/api/orders` | POST | Mobile dev API key | BUY limit order with selection snapshot for `Egypt +1.5` | Filled order id/status and selection snapshot | `ApiCredential`, `ApiOrderRequest`, `Order`, `Trade`, `Position`, `UserBalance` | Proof seeds local SELL counterparty liquidity. | Production liquidity remains future work. |
| Cashout sell submit | `/api/orders` | POST | Mobile dev API key | SELL order for the owned `marketId`/`outcomeId`/line with full position size | Filled SELL order/trade, updated position, sold activity | `ApiCredential`, `ApiOrderRequest`, `Order`, `Trade`, `Position`, `UserBalance` | Proof seeds local BUY counterparty liquidity at a crossing bid. | Production liquidity and price preview hardening remain future work. |
| Portfolio/history confirmation | `/api/portfolio`, `/api/portfolio/history` | GET | Mobile dev API key | None | Position, sold activity, selected line/source identity | `Position`, `Trade`, `Order`, `Market`, `Outcome` | None added. | None for Local MVP fake-token cashout proof. |

Cycle NN implementation notes:

- No backend route/schema changed.
- The proof confirms the existing backend order route can support the Local MVP sell/cashout path when crossing liquidity exists.

## Cycle NO - Provider Line Fallback Discovery

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail provider discovery | `discoverMobileLiveProviderCandidates()` via provider-candidate scripts/routes | Service / proof script | Local backend context | Event slug, provider search mode, optional provider event slugs | `manualSlugFallbacks`, `providerCandidateFamilySummary`, `targets[].attachProposal`, `targets[].bestCandidate.attachReadiness` | `Event`, `Market`, `Outcome` | None added. Existing line fixtures remain explicit route data. | Real provider-backed Spread/Totals/Team Total markets remain unavailable for current event. |
| Current provider line availability | Polymarket Gamma `/events?slug=fifwc-arg-egy-2026-07-07` | GET | Public provider API | Event slug | Provider event markets, family counts, line market count | None directly; compared to local `Event`/`Market`/`Outcome` route data | None added. | Gamma exposes only match-winner markets for this inspected event. |
| Current Event Detail route | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | `marketSourceSummary.regulationWinner.status`, `marketSourceSummary.lineMarkets.status`, market source fields | `Event`, `Market`, `Outcome` | Backend `contract-fixture` line rows remain. | Provider line ingestion can only attach real lines once attach-ready provider candidates exist. |

Cycle NO implementation notes:

- No backend route/schema changed.
- Discovery now searches line-family exact slug fallbacks and keeps strict attach-readiness gates.

## Cycle NP - Line Family Readiness Contract

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home current match source disclosure | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query filters/page size | `marketSourceSummary.regulationWinner.status`, `marketSourceSummary.lineMarkets.status`, `lineMarkets.familyReadiness` | `Event`, `Market`, `Outcome` | None added. | Real provider-backed line markets remain unavailable for this event. |
| Event Detail source disclosure | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | `event.marketSourceSummary.lineMarkets.familyReadiness[]`, family counts/status/reasons, provider availability reason | `Event`, `Market`, `Outcome` | Existing backend `contract-fixture` line rows remain explicit route data. | Provider-backed Spread/Totals/Team Total rows are missing until a provider exposes attach-ready markets. |
| Samsung Event Detail proof | `mobile/scripts/smoke.ps1 -EventDetailSummary` through `mobile/scripts/smoke-samsung.ps1` | Device smoke | Expo Go/device reachability | Deep-link startup | Event Detail summary labels, game lines, player props, no old stats requirement | None | Uses existing mock Event Detail proof path when backend health check is unavailable. | Server-mode visible proof should be rerun for the next full MVP journey cycle. |

Cycle NP implementation notes:

- No schema migration was added.
- The route now answers which line families are provider-backed vs fixture-backed.
- The proof gate no longer requires old Volume/Liquidity/Traders copy that conflicts with the Local MVP simple event-info direction.

## Cycle NQ - Server-Mode Line Family Readiness Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current Home/Live match entry | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public viewing | Query filters/page size | Event slug/title, compact market source summary, provider winner/local line disclosure | `Event`, `Market`, `Outcome` | None added. | Active provider-backed soccer line breadth remains missing. |
| Event Detail line readiness | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | `marketSourceSummary.regulationWinner.status`, `lineMarkets.status`, `lineMarkets.familyReadiness[]`, line market ids/outcome ids/source/line/period | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | Existing backend `contract-fixture` line rows for spread, total, and team-total. | Real provider-backed Spread/Totals/Team Total rows are not available for the inspected event. |
| Server ticket submit | `/api/orders` | POST | Mobile dev API key | BUY limit order with `marketId`, `outcomeId`, `marketType=spread`, `line=1.5`, `providerSource=contract-fixture` | Open order id/status and selection snapshot | `ApiCredential`, `ApiOrderRequest`, `Order`, `Market`, `Outcome` | No counterparty liquidity was seeded in this proof; order rests open. | Production liquidity remains future work. |
| Portfolio open-order confirmation | `/api/portfolio` | GET | Mobile dev API key | None | Open order row, market type, line, provider source badge | `Order`, `Market`, `Outcome`, `UserBalance` | None added. | None for current Local MVP open-order proof. |

Cycle NQ implementation notes:

- No schema migration was added.
- No backend route changed.
- This cycle promoted the S23 proof from generic Event Detail smoke to server-mode route proof for the current source/readiness state.

## Cycle NR - Service State Inspection And Path Adjustment

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home current match inventory | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query filters/page size | Match count, event slug, source summary, line families | `Event`, `Market`, `Outcome` | None added. | More current provider-backed match inventory remains missing. |
| Event Detail current market inventory | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | Market source summary, provider winner count, fixture line count/families, compact market rows | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | Existing backend `contract-fixture` line rows. | Real provider-backed Spread/Totals/Team Total rows for the selected match. |
| Provider event availability | Polymarket Gamma `/events?slug=fifwc-arg-egy-2026-07-07` | GET | Public provider API | Provider event slug | Event market count, market questions, condition ids, classified family counts | None directly; compared to local route data | None added. | Gamma exposes only match-winner markets for this event. |
| Provider candidate discovery | `discoverMobileLiveProviderCandidates()` | Local service/proof | Local backend context and public Gamma | Event slug, combined provider search mode | Attach-ready candidate count and family mismatch reasons | `Event`, `Market`, `Outcome` | None added. | 0 attach-ready line candidates. |
| Active sports scan | Gamma `/markets?active=true&closed=false&archived=false&limit=200` | GET | Public provider API | Active market filters | Read-only sports candidates | None directly | None added. | First active sports scan returns World Cup outright futures, not match line markets. |

Cycle NR implementation notes:

- No route/schema/code changed.
- The inspection confirms current service readiness: provider-backed Regulation Winner plus explicit backend-shaped line fixtures.

## Cycle NS - Live Freshness Empty State

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home all-match feed | `/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query filters/page size | Current MVP match, source summary, compact markets | `Event`, `Market`, `Outcome` | None added. | Broader current match inventory remains missing. |
| Live feed | `/api/events?...&status=live` | GET | Public viewing | Live status filter | Empty event list when provider-dated match is stale | `Event`, `Market`, `Outcome` | Mobile no longer falls back to all-match route for Live. | Real current live game discovery remains missing. |
| Android proof | `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1 -ExpectLiveEmptyOnly` | Device proof | Temporary mobile dev API key | Expo deep link with API key | Home and Live UI hierarchy/screenshot proof | `ApiCredential` for app launch only | None added. | None for the empty-state proof. |

Cycle NS implementation notes:

- No schema migration was added.
- No order or portfolio route changed.
- The route freshness guard uses event `startTime` first, then provider/date text from `externalSlug` or title when `startTime` is absent.

## Cycle NT - Stale Match Mobile Label Guard

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home card status label | `/api/events?...includeMobileMarkets=1&mobileMvpMatches=1` | GET | Public viewing | Query filters/page size | `status`, `liveStatus`, `startTime`, `externalSlug`, title | `Event` | None added. | First-class provider event end/freshness field remains missing. |
| Live empty-state proof | `/api/events?...&status=live` plus S23 UI | GET/device proof | Public viewing plus temporary mobile dev API key for app launch | Live status filter and Expo deep link | Home `Active` / `Time TBD`, Live empty state | `Event`, `ApiCredential` for proof launch | None added. | Real current live match/provider feed remains missing. |

Cycle NT implementation notes:

- No backend route changed.
- Mobile now consumes `externalSlug` as part of the event summary contract.

## Cycle NU - Stale Event Detail Status Honesty

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home current match entry | `/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query filters/page size | `status`, `liveStatus`, `startTime`, `externalSlug`, `liveDataStatus`, market source summary | `Event`, `Market`, `Outcome` | None added. | Real current live World Cup feed remains missing. |
| Event Detail stale status | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | `status=active`, `liveStatus=LIVE`, `startTime=null`, `liveDataStatus.status=stale`, `period`, market source summary | `Event`, `Market`, `Outcome`, `MarketOutcomeSnapshot`, `ReferenceQuoteSnapshot` | None added. Mobile downgrades stale/no-clock live-detail data for display only. | First-class provider event freshness/end state and reliable start/end time remain missing. |
| Android proof | `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1 -ExpectDetailStaleOnly` | Device proof | Temporary mobile dev API key | Expo deep link with API key | Home and Event Detail hierarchy/screenshot proof | `ApiCredential` for app launch only | None added. | None for the focused status-honesty proof. |

Cycle NU implementation notes:

- No backend route/schema changed.
- The mobile client now treats stale/no-clock live-detail responses as non-live for display.
- The route still needs a better backend-owned freshness contract so mobile does not infer this from stale provider lifecycle fields.

## Cycle NV - Live Detail Display Status Contract

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail display status | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | `event.displayStatus.mobileStatus`, `event.displayStatus.label`, `event.displayStatus.startsAt`, `event.displayStatus.reason`, plus raw `status`, `liveStatus`, `liveDataStatus` | `Event`, `Market`, `Outcome`, provider snapshot tables for lifecycle status | None added. | Real current live match/provider breadth remains missing. |
| Mobile adapter display mapping | Backend event payload from live-detail and events routes | Client normalization | N/A | Route payload | `displayStatus` is preferred over local status/time inference when present | None | None added. | `/api/events` can later emit the same displayStatus contract for Home if needed. |
| Android proof | `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1 -ExpectDetailStaleOnly` | Device proof | Temporary mobile dev API key | Expo deep link with API key | Home and Event Detail hierarchy/screenshot proof | `ApiCredential` for app launch only | None added. | None for the focused display-status proof. |

Cycle NV implementation notes:

- No schema migration was added.
- The route now exposes a first-class display-status field for stale/unavailable no-clock live-detail data instead of forcing mobile to infer it.

## Cycle NW - Home Display Status Contract

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home event card display status | `/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query filters/page size | `event.displayStatus.mobileStatus`, `event.displayStatus.label`, `event.displayStatus.startsAt`, `event.displayStatus.reason`, raw `status`, `liveStatus`, `clock`, `externalSlug` | `Event`, `Market`, `Outcome` | None added. | Real current live World Cup feed remains missing. |
| Public event summary serialization | `serializeEventSummary()` | Service serializer | N/A | Event row and optional markets | `displayStatus` for stale/no-clock raw live/active summaries | `Event`, `Market` | None added. | Provider import should eventually write reliable event freshness/end fields. |
| Android proof | `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1 -ExpectDetailStaleOnly` | Device proof | Temporary mobile dev API key | Expo deep link with API key | Home and Event Detail hierarchy/screenshot proof | `ApiCredential` for app launch only | None added. | None for focused display-status proof. |

Cycle NW implementation notes:

- No schema migration was added.
- Home/event-list route now emits the same display-status contract style as live-detail.

## Cycle NX - Provider Line Query Breadth Inspection

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail Regulation Winner | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | Provider-backed match-winner rows, `referenceSource=polymarket`, `externalMarketId`, market source summary | `Event`, `Market`, `Outcome` | None for Regulation Winner. | None for current winner rows. |
| Event Detail line markets | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | Spread/Totals/Team Total rows, line, period, market/outcome identity, `referenceSource=contract-fixture`, family readiness summary | `Event`, `Market`, `Outcome` | Existing backend-shaped `contract-fixture` lines are still used for Local MVP. | Real provider-backed Spread/Totals/Team Total rows. |
| Polymarket provider event availability | Gamma `/events?slug=fifwc-arg-egy-2026-07-07` and `/events?slug=fifwc-col-gha-2026-07-03` | GET | Public provider API | Provider event slug | Market count, questions, condition ids, token completeness, family classification | None directly; used by provider mapping/proof | None added. | Gamma returned 0 attach-ready line markets for checked events. |
| Provider candidate discovery | `buildProviderCandidateSearchQueries()` and `discoverMobileLiveProviderCandidates()` | Local service/proof using public Gamma search | Local backend context | Compact market title/event/outcomes/line/family | Candidate query list, family relevance, attach-ready decision reasons | `Event`, `Market`, `Outcome` | None added. | Need a real source exposing line-market condition/token data. |
| Android visible sanity | `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1 -ExpectDetailStaleOnly` | Device proof | Temporary mobile dev API key | Expo deep link with API key | Home and Event Detail rendered route state | `ApiCredential` for proof launch only | None added. | None for sanity proof. |

Cycle NX implementation notes:

- No schema migration was added.
- No order, portfolio, or ticket backend route changed.
- Query breadth improved, but provider-backed line parity remains open until real attach-ready line markets exist.

## Cycle NY - MVP Source Label Cleanup

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home source label | `/api/events?...includeMobileMarkets=1&mobileMvpMatches=1` | GET | Public viewing | Event-list query filters | `marketSourceSummary.regulationWinner.status`, `marketSourceSummary.lineMarkets.status`, line families | `Event`, `Market`, `Outcome` | Existing contract-fixture line disclosure. | Real provider-backed line market source remains missing. |
| Event Detail source label | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug | `marketSourceSummary`, market `referenceSource`, family readiness/provider availability markers | `Event`, `Market`, `Outcome` | Existing contract-fixture line disclosure. | Real provider-backed Spread/Totals/Team Total rows. |
| Trade Ticket and Portfolio source chips | Existing ticket/order/portfolio payloads | Mixed | Existing server-mode auth when ordering | No request contract change | `selection.referenceSource` and market `referenceSource` | Existing order/portfolio identity fields | Existing contract-fixture selection identity remains supported. | None for wording; real line provider remains missing. |

Cycle NY implementation notes:

- No backend route or schema changed.
- This is a visible wording cleanup over the existing provider/source contract.

## Cycle NZ - Server Order Path Inspection

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home MVP event discovery | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public viewing | Query filters/page size | `events[]`, `slug`, `title`, `marketSourceSummary` | `Event`, `Market`, `Outcome` | None added. | Broader real current match inventory remains missing. |
| Event Detail line market | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | Market rows, source summary, spread line `1.5`, outcome ids, token/source identity | `Event`, `Market`, `Outcome` | Existing contract-fixture line market. | Provider-backed line market source remains missing. |
| Fake-token order placement | `/api/orders` | POST | Mobile API key with order scopes | `marketId`, `outcomeId`, `side=BUY`, `contractSide=YES`, `price`, `size`, `selection` identity | Order id/status, selection echo, fill state | `User`, `ApiCredential`, `UserBalance`, `Order`, `Trade`, collateral/accounting tables | None added. | None for local MVP order path. |
| Portfolio position | `/api/portfolio` | GET | Mobile API key | None | Positions, selection source summary, line/source/token identity | `Order`, `Trade`, `Position`/derived portfolio read model, `UserBalance` | None added. | None for verified filled line position. |
| Portfolio history | `/api/portfolio/history` | GET | Mobile API key | None | `recentTrades`, selection source summary, line/source/token identity | `Trade`, `Market`, `Outcome` | None added. | None for verified recent trade history. |
| S23 UI server-order proof | `mobile/scripts/local-mvp-home-route-server-order-proof.ps1` | Device proof | Temporary mobile API key | Deep link plus generated credential | Intended to drive visible Home -> ticket -> Portfolio | Same as above | None added. | Harness still expects retired EL-A seed text and must be updated for current MVP feed. |

Cycle NZ implementation notes:

- No schema migration was added.
- Backend/service route readiness passed for the current MVP order lifecycle.
- Android proof must be repaired to target `argentina-vs-egypt` instead of the old EL-A proof event.

## Cycle OA - Current MVP S23 Server Order Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current MVP service inspection | Local proof script plus `/api/events` and `/api/mobile/events/:slug/live-detail` | GET/proof | Public viewing | Event-list filters and `argentina-vs-egypt` slug | Event slug/title, market source summary, line family readiness, market/outcome/source/token identity | `Event`, `Market`, `Outcome` | Existing `contract-fixture` line markets for Spread/Totals/Team Total. | Real provider-backed line markets remain missing. |
| S23 Home and Event Detail | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` and `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing plus temporary mobile API key for app launch | Route filters and event slug | Home card copy, detail markets, `referenceSource`, line, period, outcome ids, provider token ids | `Event`, `Market`, `Outcome` | Existing `contract-fixture` line rows. | Broader current live World Cup inventory and real provider-backed line families. |
| Fake-token server order | `/api/orders` | POST | Mobile API key with order scopes; local backend requires internal trading beta enabled and kill switch disabled | `marketId`, `outcomeId`, `side=BUY`, selected contract side, price, size, selection identity | Order id/status, selection echo, open order state | `User`, `ApiCredential`, `UserBalance`, `Order`, related order accounting models | None added. S23 proof uses existing local line market route data. | None for open-order Local MVP proof. |
| Portfolio open order | `/api/portfolio` | GET | Mobile API key | None | Open order, line, period, market family, contract side, provider source, provider token, order value | `Order`, `Market`, `Outcome`, portfolio read model/accounting tables | None added. | None for open-order Local MVP proof. |
| Route-level filled order/history check | `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | POST/GET | Temporary proof API key | Seeded maker liquidity plus order payload | Filled order, position, recent trade/history identity | `Order`, `Trade`, portfolio/history read models | Deterministic proof liquidity only. | Production liquidity/pricing hardening remains future work. |

Cycle OA implementation notes:

- No schema migration was added.
- Mobile timeout was increased to 12 seconds to tolerate S23 local-network server-order latency.
- The Android proof harness now targets the current `argentina-vs-egypt` feed instead of retired EL-A proof data.

## Cycle OB - Current MVP Server Cancel History Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current MVP service inspection | Local proof script plus `/api/events` and `/api/mobile/events/:slug/live-detail` | GET/proof | Public viewing | Event-list filters and `argentina-vs-egypt` slug | Event title, market source summary, line family readiness, line/source/token identity | `Event`, `Market`, `Outcome` | Existing `contract-fixture` line markets. | Real provider-backed line families remain missing. |
| Server fake-token order | `/api/orders` | POST | Mobile API key with order scopes | Selected spread market/outcome, BUY side, price, size, selection identity | Open order id/status and selected identity | `User`, `ApiCredential`, `UserBalance`, `Order` | None added. | None for open-order Local MVP proof. |
| Cancel open order | `/api/orders/:id` through `api.cancelOrder(order.id)` | DELETE | Same mobile API key/order ownership | Order id in route | Server cancel success/failure; mobile removes open order and appends canceled activity | `Order`, order status/history/accounting tables | Mobile appends a canceled activity after server cancel/refresh so the user sees immediate History feedback. | Server-side canceled activity/history contract can be made more explicit later. |
| Portfolio after cancel | `/api/portfolio` plus local canceled activity append | GET/local state | Mobile API key | None | Open orders after cancel, value history, selection source summary | `Order`, portfolio read model/accounting tables | Local canceled activity is used for immediate visible history. | First-class server canceled activity in `/api/portfolio/history` remains future hardening. |

Cycle OB implementation notes:

- No schema migration was added.
- No orderbook, chat, live stats, or social features were touched.

## Cycle OC - Server-Owned Cancel History

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cancel open order | `/api/orders/:id` through `api.cancelOrder(order.id)` | DELETE | Mobile API key with order scope and order ownership | Order id in route | Cancel success and canceled order status | `Order`, order ownership/status fields | None added. | None for current local MVP cancel. |
| Portfolio refresh after cancel | `/api/portfolio` through `loadPortfolioSnapshot(api)` | GET | Mobile API key with account/portfolio read scope | None | Balance, positions, open orders after cancel | `UserBalance`, `Order`, `Trade`, portfolio read model | None added. | None for current local MVP refresh. |
| Server-owned canceled activity | `/api/portfolio/history` through `loadPortfolioHistoryActivities(api)` | GET | Mobile API key with account/history read scope | None | `canceledOrders[]`, `selection`, `marketType`, `line`, `period`, source/token identity, activity id `canceled-order-${order.id}` | `Order`, persisted order request body, market/outcome identity | Mobile only appends local canceled activity if server history does not return the canceled order. | None for current cancel/history proof. |
| S23 visible lifecycle proof | `mobile/scripts/local-mvp-home-route-server-cancel-proof.ps1` | Device proof | Temporary mobile dev API key | Expo deep link plus API key | Home event, Event Detail, ticket, Portfolio open order, canceled History row | Same as above plus temporary proof credential | None added. | Harness filename prefix cleanup remains. |

Cycle OC implementation notes:

- No backend route or schema changed; this cycle consumes the existing server history contract more correctly.
- No orderbook, chat, live stats, or social features were touched.
- Inspection confirms the remaining product-service gap is real provider-backed line market breadth: Regulation Winner is Polymarket-backed, while Spread/Totals/Team Total remain backend-shaped contract fixtures.

## Cycle OD - Current Provider Line Inspection

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home current MVP event | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Event-list query filters | Event slug/title, `marketSourceSummary`, display status | `Event`, `Market`, `Outcome` | Existing contract-fixture line markets. | Broader current match inventory and real line families. |
| Event Detail current MVP markets | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | 3 Polymarket winner markets, 4 contract-fixture line markets, `marketSourceSummary.lineMarkets.status` | `Event`, `Market`, `Outcome`, provider snapshot tables | Existing contract-fixture Spread/Totals/Team Total rows. | Real Polymarket-backed Spread/Totals/Team Total route-visible markets. |
| Provider discovery guard | `discoverMobileLiveProviderCandidates({ eventSlug: "argentina-vs-egypt", providerSearchMode: "combined" })` | Local proof/service | Local service context | Current event slug | Attach-ready match-winner candidates, line rejection reasons, manual slug fallback count | None directly; reads local compact event and public Gamma | None added. | Gamma exposes no attach-ready line markets for current event. |

Cycle OD implementation notes:

- No route, schema, mobile UI, order, portfolio, orderbook, chat, or live-stat code changed.
- This cycle adjusts the path: keep Local MVP line fixtures honest, and only replace them when real provider-backed line markets exist.

## Cycle OE - Event Detail Source Wording

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail market source pills | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | `market.referenceSource`, `marketSourceSummary`, line family source state | `Event`, `Market`, `Outcome` | Existing contract-fixture line rows still render as `Local test`. | Real Polymarket-backed Spread/Totals/Team Total rows remain unavailable for current event. |

Cycle OE implementation notes:

- No backend route or schema changed.
- Mobile now renders the existing route contract with clearer user-facing wording: `Polymarket` and `Local test`.

## Cycle OF - Ticket and Portfolio Fake-Token Source Clarity

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket source note | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | `market.referenceSource`, `selection.referenceSource`, line/period/outcome identity | `Event`, `Market`, `Outcome` | Existing `contract-fixture` line rows render as local-test fake-token lines. | Real Polymarket-backed Spread/Totals/Team Total rows remain unavailable. |
| Fake-token order placement | `/api/orders` | POST | Mobile API key with order scope | Selected line market/outcome, side, price, size, selection identity | Order id/status and selection echo | `User`, `ApiCredential`, `Order`, accounting models | None added. | None for current fake-token order path. |
| Portfolio source note/summary | `/api/portfolio` | GET | Mobile API key with portfolio scope | None | Open orders, selection source, line/source/token identity | `Order`, portfolio read model | Existing `contract-fixture` line rows render as local-test fake-token lines. | Real provider-backed line-market replacement remains future work. |

Cycle OF implementation notes:

- No backend route or schema changed.
- Mobile now renders the existing route/order/portfolio contract with clearer wording: `Local test line Ã‚Â· fake-token` and `Local test lines Ã‚Â· fake-token`.

## Cycle OG - Current State Inspection And Path Adjustment

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home current MVP event discovery | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query filters | One current match, event slug/title, market source summary | `Event`, `Market`, `Outcome` | None added. | More current match inventory remains future work. |
| Current match live detail | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | Regulation Winner provider-backed rows, local fixture line rows, source summary | `Event`, `Market`, `Outcome`, reference metadata | Existing `contract-fixture` Spread/Totals/Team Total rows. | Real Polymarket-backed line market rows are unavailable for this event. |
| Provider availability check | Polymarket Gamma `/events?slug=fifwc-arg-egy-2026-07-07` plus local live-detail route | GET/local proof | Public provider data/local route | Provider event slug and local event slug | 3 Gamma match-winner markets, 0 Gamma line markets, 4 local fixture line rows | Local event and market rows with provider identity | Existing fixtures justified for Local MVP only. | No current provider-backed line markets to attach. |
| Broader provider readiness | Polymarket Gamma/CLOB through existing real provider proof | GET/local proof | Public provider data/local route | `world-cup-winner` provider event | Multiple real provider-backed outright markets with quotes/depth | Imported provider-backed outright event/markets/outcomes | None added. | Chart history can be refresh-due while quotes/depth are fresh. |

Cycle OG implementation notes:

- No backend route or schema changed.
- The next visible MVP cycle should use current-match Regulation Winner as the real provider-backed path.

## Cycle OH - Current Match Provider Winner S23 Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home current match | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query filters | `argentina-vs-egypt`, source summary, event card identity | `Event`, `Market`, `Outcome` | None added. | More current match inventory remains future work. |
| Event Detail provider winner | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | Regulation Winner markets/outcomes, provider market ids, token/source identity | `Event`, `Market`, `Outcome`, provider metadata | None added for winner path. | None for current Regulation Winner proof. |
| Fake-token provider winner order | `/api/orders` | POST | Mobile API key with order scope | Winner `marketId`, `outcomeId`, side, price, size, provider selection identity | Order id/status and selected provider identity | `User`, `ApiCredential`, `Order`, accounting models | None added. | None for open-order fake-token provider winner proof. |
| Portfolio/history provider winner | `/api/portfolio`, `/api/portfolio/history` | GET | Mobile API key with portfolio/history scope | None | Open order/history rows with `marketType=winner`, `line=none`, `provider-source=polymarket` | `Order`, portfolio/history read models | None added. | None for current provider winner proof. |

Cycle OH implementation notes:

- No backend route or schema changed.
- S23 proof confirms the current match has a full real provider-backed Regulation Winner mobile path.

## Cycle OI - Local Line Fake-Token Disclosure

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home mixed-source label | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query filters | `marketSourceSummary.regulationWinner.status`, `marketSourceSummary.lineMarkets.status`, line families | `Event`, `Market`, `Outcome` | Existing `contract-fixture` line rows are disclosed as fake-token local test lines. | Real provider-backed line rows remain unavailable. |
| Event Detail line-source banner | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | `marketSourceSummary.lineMarkets.familyReadiness`, `providerAvailability`, market `referenceSource` | `Event`, `Market`, `Outcome` | Existing fixture rows remain local-test fake-token lines. | Real provider-backed Spread/Totals/Team Total rows remain unavailable. |
| Ticket source note | `/api/markets/:id/quote` plus existing ticket state | GET/local state | Public quote or server mode | Market/outcome id | Contract-fixture reference source and quote/probability | `Market`, `Outcome`, quote/read model | No new fallback added. | Fixture-line order submit needs cleanup after binary invariant conflict. |

Cycle OI implementation notes:

- No backend route or schema changed.
- Backend order matching was not changed in this source-disclosure cycle.

## Cycle OJ - Fixture Line Order Cleanup

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fixture-line cleanup proof | `scripts/seed_mobile_route_spread_counterparty.ts --cleanupOnly --cleanupBlockingMarketBids` | Local proof/service | Local service context | Event slug, spread group, line `1.5`, outcome side `away`, proof user prefix | Canceled stale proof order ids and target market/outcome identity | `Event`, `Market`, `Outcome`, `Order` | Existing contract-fixture spread line remains the Local MVP line source. | Real provider-backed Spread/Totals/Team Total rows remain unavailable. |
| Fixture-line fake-token submit | `/api/orders` | POST | Mobile API key with order scope | Spread `marketId`, `outcomeId`, side, price, size, line/source identity | Order id/status and selected fixture-line identity | `User`, `ApiCredential`, `Order`, accounting models | Existing `contract-fixture` line rows render as local-test fake-token lines. | None for Local MVP fake-token submit after stale proof cleanup. |
| Portfolio fixture-line result | `/api/portfolio` | GET | Mobile API key with portfolio scope | None | Open orders or positions with `marketType=spread`, `line=1.5`, `provider-source=contract-fixture` | `Order`, portfolio read model | Existing fixture-line source labels remain visible. | Real provider-backed line-market replacement remains future work. |

Cycle OJ implementation notes:

- No backend route or schema changed.
- The proof harness now removes stale proof bids before S23 submit proof so repeated local fake-token line tests do not trip binary market invariants.

## Cycle OK - Current Provider Readiness Gate

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home current MVP event discovery | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query filters | Event slug/title/type, `marketSourceSummary.regulationWinner`, `marketSourceSummary.lineMarkets` | `Event`, `Market`, `Outcome` | None added. | More current match inventory remains future work. |
| Event Detail current MVP markets | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | Provider-backed Regulation Winner rows, contract-fixture Spread/Totals/Team Total rows, provider availability reason | `Event`, `Market`, `Outcome`, provider metadata | Existing contract-fixture line rows remain Local MVP fake-token line sources. | Real provider-backed Spread/Totals/Team Total rows remain unavailable. |
| Polymarket provider event inspection | `https://gamma-api.polymarket.com/events?slug=fifwc-arg-egy-2026-07-07` | GET | Public provider data | Provider event slug | Market ids, slugs, questions, condition ids, inferred family | None directly | None added. | Gamma exposes zero line markets for this event. |
| Provider candidate discovery guard | `discoverMobileLiveProviderCandidates({ eventSlug: "argentina-vs-egypt", providerSearchMode: "combined" })` | Local proof/service | Local service context | Current event slug | Attach-ready winner candidates, line wrong-family rejection reasons, manual slug fallback count | Local event and market rows | None added. | No attach-ready line candidates. |

Cycle OK implementation notes:

- No backend route or schema changed.
- The provider availability proof default was aligned to the current Home MVP match to avoid stale event proof drift.

## Cycle OL - Provider Readiness Cleanup

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current match restore | `scripts/restore_current_mobile_mvp_match.ts` | Local restore/proof | Local service context | Provider event slug `fifwc-arg-egy-2026-07-07`, local slug `argentina-vs-egypt` | Restored event id, provider market ids, outcome ids | `Event`, `Market`, `Outcome`, quote snapshots | None added. | More provider-backed events remain future work. |
| Local line fixture restore | `scripts/seed_mobile_mvp_match_line_markets.ts` | Local restore/proof | Local service context | Event slug `argentina-vs-egypt` | Restored Spread/Totals/Team Total market ids and route market count | `Market`, `Outcome`, quote snapshots | Contract-fixture line rows restored for Local MVP testing. | Real provider-backed line rows remain unavailable. |
| Current-state route proof | `/api/events`, `/api/mobile/events/:slug/live-detail` | GET/local proof | Public viewing | World Cup match filters and event slug | Source summary, winner/line market counts | `Event`, `Market`, `Outcome` | Existing contract-fixture line rows. | Broader provider-backed event inventory. |

Cycle OL implementation notes:

- No backend route or schema changed.
- Cleanup restored local dev data after broad parallel DB tests created reset side effects.

## Cycle OM - Provider Breadth Runtime Loop

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Broad World Cup provider runtime | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public viewing | World Cup route filters without `mobileMvpMatches=1` | Multiple provider-backed events, compact markets, `marketSourceSummary`, source breakdown | `Event`, `Market`, `Outcome`, reference snapshot tables | None added. | Visible mobile Home does not yet expose this broad runtime mode. |
| Local MVP match-only Home | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | World Cup match-only route filters | Current match-only event card and source summary | `Event`, `Market`, `Outcome` | Existing contract-fixture line rows. | More current provider-backed match events remain unavailable. |
| Event Detail provider breadth check | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Provider-backed event slug | Route-visible market list, provider lifecycle/source summary | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ReferenceOrderbookDepthSnapshot`, `MarketOutcomeSnapshot` | Contract-fixture lines only for current match. | Real line markets for match events. |
| World Cup Winner import/refresh | `scripts/prove_mobile_real_provider_world_cup_winner.ts` and provider refresh services | Local proof/service | Public provider data/local DB | Provider event slug `world-cup-winner`, local slug `provider-breadth-world-cup-winner` | 8 market ids, condition ids, token ids, quote/depth/chart refresh status | `Event`, `Market`, `Outcome`, reference snapshot tables | None added. | Outrights are not part of current match-only MVP Home. |
| Bot provider price dry-run | `poly-bot` `reference:cache-dry-run` | Local dry-run | Public Polymarket data | Slug `will-france-win-the-2026-fifa-world-cup-924` | Fresh bid/ask, spread, quality status, MM eligibility | No Poly DB mutation | None. | Local live quote runtime still needs a separate tiny allowlist gate. |

Cycle OM implementation notes:

- No backend schema changed.
- No visible mobile UI code changed.
- Broad provider route now proves multiple provider-backed World Cup surfaces, while Local MVP remains match-only by design.

## Cycle OW - Provider Visible To Tradable Flow

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed event discovery | `/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&search=England&limit=10` | GET | Public viewing | Search/provider filters | Event slug/title/type, `marketSourceSummary`, provider-backed market count | `Event`, `Market`, `Outcome` | None. | Home/Live intentionally do not expose broad futures. |
| Provider-backed event detail | `/api/mobile/events/provider-breadth-world-cup-winner/live-detail` | GET | Public viewing | Event slug | Outright markets, outcome ids, provider market id, condition id, token id, probabilities | `Event`, `Market`, `Outcome`, reference metadata/snapshots | None. | Chart history remains sparse for some futures. |
| Provider quote | `/api/markets/49ca30ca-afa9-45ee-8962-1941ad7524fe/quote` | GET | Public quote route | Market id | Local bot bid/ask quotes plus provider-derived prices consumed by ticket harness | `Order`, `ReferenceQuoteSnapshot`, `Market`, `Outcome` | None. | None for selected England market. |
| Fake-token server order | `/api/orders` | POST | Mobile API key; internal trading beta must be enabled/allowlisted in local proof runtime | `marketId`, `outcomeId`, side, contract side, price, size, provider selection identity | Order id/status/fill state and selection identity | `User`, `UserBalance`, `ApiCredential`, `Order`, `Trade`, `Position` | None. | Startup flags/allowlist need a repeatable local harness command. |
| Portfolio/history result | `/api/portfolio`, `/api/portfolio/history` | GET | Mobile API key | None | Filled position and recent trade with provider token/condition/source identity | `Position`, `Trade`, portfolio/history read models | None. | None for selected provider-backed future order. |

Cycle OW implementation notes:

- No schema migration was added.
- No default order book UI was exposed.
- Backend route behavior required local internal-trading beta flags: `INTERNAL_TRADING_BETA_ENABLED=true`, `TRADING_KILL_SWITCH=false`, and `INTERNAL_TRADING_ALLOWLIST_EMAILS` containing the system liquidity bot and proof users/admins.

## Cycle OX - Internal Beta Trading Startup Harness

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal beta backend startup harness | `scripts/start_holiwyn_internal_beta_backend.ps1` plus `npm run mobile:internal-beta-backend:start` | Local script | Local developer machine only | Optional `-Port`, `-AuthBaseUrl`, `-AllowlistEmails`, `-Restart`, `-CheckOnly`, `-SummaryPath` | JSON startup/check summary: backend health URL, LAN base URL, selected `NEXTAUTH_URL`, internal beta flag, kill switch flag, allowlist emails, stopped listeners, started process, and whether backend is intentionally left running | No database tables directly; it controls runtime env for routes that use `config.internalTradingBetaEnabled`, `config.tradingKillSwitch`, `config.internalTradingAllowlistEmails`, and Google auth routes that depend on `NEXTAUTH_URL` | None. | This is local fake-token MVP infrastructure only. It must not be treated as production trading or funding readiness. Use `-AuthBaseUrl` when Google login should reuse a hosted backend auth origin. |
| Post-startup provider-backed order proof | `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Public viewing plus mobile API key for order/portfolio/history | Provider-backed future selection with market/outcome/provider token identity, price, and size | Filled order, position, and history trade preserving provider source/market/condition/token identity | `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None for the selected provider future. | Current-match Spread/Totals/Team Total provider-backed lines remain unavailable. |

## Cycle OY - Second Provider Market Tradable Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Second provider-backed future visibility | `/api/events?source=polymarket&search=France`, `/api/mobile/events/provider-breadth-world-cup-winner/live-detail` | GET | Public viewing | Search/detail params only | World Cup Winner event, France market/outcome id, probability, provider source, provider market id, condition id, token id | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | Home/Live intentionally exclude broad futures. |
| France local-MM preparation | `/api/admin/reference-markets/:id`, `/api/admin/reference-markets/:id/seed-bot` through bot admin scripts | PATCH/POST | Dev admin header and local internal bot env flags | Enable MM, seed capital/mint budget, mark live-ready/live-enabled | Runtime credential state, local bot inventory/capital, live-enabled lifecycle | `Market.referenceMetadata`, `User`, `ApiCredential`, `UserBalance`, `Position` | None. | Startup helper must carry bot-seeding env for repeatable local proof. |
| France fake-token retail order | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Mobile proof API key with order/account scopes | France YES selection, price `0.35`, amount `0.70`, provider market/condition/token identity | Filled order, Portfolio position, History trade | `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None. | No missing support for selected provider-backed future order. |

## Cycle OZ - Third Provider Market Tradable Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Third provider-backed future visibility | `/api/events?source=polymarket&search=Spain`, `/api/mobile/events/provider-breadth-world-cup-winner/live-detail` | GET | Public viewing | Search/detail params only | World Cup Winner event, Spain market/outcome id, probability, provider source, provider market id, condition id, token id | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | Home/Live intentionally exclude broad futures. |
| Spain local-MM preparation | `/api/admin/reference-markets/:id`, `/api/admin/reference-markets/:id/seed-bot` through bot admin scripts | PATCH/POST | Dev admin header and local internal bot env flags | Enable MM, seed capital/mint budget, mark live-ready/live-enabled | Runtime credential state, local bot inventory/capital, live-enabled lifecycle | `Market.referenceMetadata`, `User`, `ApiCredential`, `UserBalance`, `Position` | None. | No missing support for selected provider-backed future setup. |
| Spain fake-token retail order | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Mobile proof API key with order/account scopes | Spain YES selection, price `0.21`, amount `0.63`, provider market/condition/token identity | Filled order, Portfolio position, History trade | `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None. | No missing support for selected provider-backed future order. |

## Cycle PA - Fourth Provider Market Tradable Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fourth provider-backed future visibility | `/api/events?source=polymarket&search=Switzerland`, `/api/mobile/events/provider-breadth-world-cup-winner/live-detail` | GET | Public viewing | Search/detail params only | World Cup Winner event, Switzerland market/outcome id, probability, provider source, provider market id, condition id, token id | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | Home/Live intentionally exclude broad futures. |
| Switzerland local-MM preparation | `/api/admin/reference-markets/:id`, `/api/admin/reference-markets/:id/seed-bot` through bot admin scripts | PATCH/POST | Dev admin header and local internal bot env flags | Enable MM, seed capital/mint budget, mark live-ready/live-enabled | Runtime credential state, local bot inventory/capital, live-enabled lifecycle | `Market.referenceMetadata`, `User`, `ApiCredential`, `UserBalance`, `Position` | None. | The standalone bot runtime needs `LIVE_SYSTEM_LIQUIDITY_ENABLED=true` for quote placement. |
| Switzerland fake-token retail order | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Mobile proof API key with order/account scopes | Switzerland YES selection, price `0.04`, amount `0.12`, provider market/condition/token identity | Filled order, Portfolio position, History trade | `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None. | No missing support for selected provider-backed future order. |

## Cycle PB - Fifth Provider Market Tradable Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fifth provider-backed future visibility | `/api/events?source=polymarket&search=Argentina`, `/api/mobile/events/provider-breadth-world-cup-winner/live-detail` | GET | Public viewing | Search/detail params only | World Cup Winner event, Argentina market/outcome id, probability, provider source, provider market id, condition id, token id | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | Home/Live intentionally exclude broad futures. |
| Argentina local-MM preparation | `/api/admin/reference-markets/:id`, `/api/admin/reference-markets/:id/seed-bot` through bot admin scripts | PATCH/POST | Dev admin header and local internal bot env flags | Enable MM, seed capital/mint budget, mark live-ready/live-enabled | Runtime credential state, local bot inventory/capital, live-enabled lifecycle | `Market.referenceMetadata`, `User`, `ApiCredential`, `UserBalance`, `Position` | None. | The standalone bot runtime needs `LIVE_SYSTEM_LIQUIDITY_ENABLED=true` for quote placement. |
| Argentina fake-token retail order | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Mobile proof API key with order/account scopes | Argentina YES selection, price `0.22`, amount `0.66`, provider market/condition/token identity | Filled order, Portfolio position, History trade | `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None. | No missing support for selected provider-backed future order. |

## Cycle PC - Sixth Provider Market Tradable Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sixth provider-backed future visibility | `/api/events?source=polymarket&search=Belgium`, `/api/mobile/events/provider-breadth-world-cup-winner/live-detail` | GET | Public viewing | Search/detail params only | World Cup Winner event, Belgium market/outcome id, probability, provider source, provider market id, condition id, token id | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | Home/Live intentionally exclude broad futures. |
| Belgium local-MM preparation | `/api/admin/reference-markets/:id`, `/api/admin/reference-markets/:id/seed-bot` through bot admin scripts | PATCH/POST | Dev admin header and local internal bot env flags | Enable MM, seed capital/mint budget, mark live-ready/live-enabled | Runtime credential state, local bot inventory/capital, live-enabled lifecycle | `Market.referenceMetadata`, `User`, `ApiCredential`, `UserBalance`, `Position` | None. | The standalone bot runtime needs `LIVE_SYSTEM_LIQUIDITY_ENABLED=true` for quote placement. |
| Belgium fake-token retail order | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Mobile proof API key with order/account scopes | Belgium YES selection, price `0.05`, amount `0.15`, provider market/condition/token identity | Filled order, Portfolio position, History trade | `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None. | No missing support for selected provider-backed future order. |

## Cycle PD - Seventh Provider Market Tradable Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Seventh provider-backed future visibility | `/api/events?source=polymarket&search=Norway`, `/api/mobile/events/provider-breadth-world-cup-winner/live-detail` | GET | Public viewing | Search/detail params only | World Cup Winner event, Norway market/outcome id, probability, provider source, provider market id, condition id, token id | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | Home/Live intentionally exclude broad futures. |
| Norway local-MM preparation | `/api/admin/reference-markets/:id`, `/api/admin/reference-markets/:id/seed-bot` through bot admin scripts | PATCH/POST | Dev admin header and local internal bot env flags | Enable MM, seed capital/mint budget, mark live-ready/live-enabled | Runtime credential state, local bot inventory/capital, live-enabled lifecycle | `Market.referenceMetadata`, `User`, `ApiCredential`, `UserBalance`, `Position` | None. | The standalone bot runtime needs `LIVE_SYSTEM_LIQUIDITY_ENABLED=true` for quote placement. |
| Norway fake-token retail order | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Mobile proof API key with order/account scopes | Norway YES selection, price `0.08`, amount `0.24`, provider market/condition/token identity | Filled order, Portfolio position, History trade | `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None. | No missing support for selected provider-backed future order. |

## Cycle PE - Eighth Provider Market Tradable Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Eighth provider-backed future visibility | `/api/events?source=polymarket&search=Morocco`, `/api/mobile/events/provider-breadth-world-cup-winner/live-detail` | GET | Public viewing | Search/detail params only | World Cup Winner event, Morocco market/outcome id, probability, provider source, provider market id, condition id, token id | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | Home/Live intentionally exclude broad futures. |
| Morocco local-MM preparation | `/api/admin/reference-markets/:id`, `/api/admin/reference-markets/:id/seed-bot` through bot admin scripts | PATCH/POST | Dev admin header and local internal bot env flags | Enable MM, seed capital/mint budget, mark live-ready/live-enabled | Runtime credential state, local bot inventory/capital, live-enabled lifecycle | `Market.referenceMetadata`, `User`, `ApiCredential`, `UserBalance`, `Position` | None. | The standalone bot runtime needs `LIVE_SYSTEM_LIQUIDITY_ENABLED=true` for quote placement. |
| Morocco fake-token retail order | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Mobile proof API key with order/account scopes | Morocco YES selection, price `0.05`, amount `0.15`, provider market/condition/token identity | Filled order, Portfolio position, History trade | `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None. | No missing support for selected provider-backed future order. |

## Cycle PF - First Continent Provider Market Tradable Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Continent provider-backed future visibility | `/api/events?source=polymarket&search=Europe`, `/api/mobile/events/which-continent-will-win-the-world-cup/live-detail` | GET | Public viewing | Search/detail params only | Continent event, Europe market/outcome id, probability, provider source, provider market id, condition id, token id | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | Home/Live intentionally exclude broad futures. |
| Europe local-MM preparation | `/api/admin/reference-markets/:id`, `/api/admin/reference-markets/:id/seed-bot` through bot admin scripts | PATCH/POST | Dev admin header and local internal bot env flags | Enable MM, seed capital/mint budget, mark live-ready/live-enabled | Runtime credential state, local bot inventory/capital, live-enabled lifecycle | `Market.referenceMetadata`, `User`, `ApiCredential`, `UserBalance`, `Position` | None. | Seed allowlist must use exact provider group label `Europe (UEFA)`. The standalone bot runtime needs `LIVE_SYSTEM_LIQUIDITY_ENABLED=true` for quote placement. |
| Europe fake-token retail order | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Mobile proof API key with order/account scopes | Europe YES selection, price `0.80`, amount `2.40`, provider market/condition/token identity | Filled order, Portfolio position, History trade | `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None. | No missing support for selected provider-backed future order. |

## Cycle PG - First Golden Boot Provider Market Tradable Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Golden Boot provider-backed future visibility | `/api/events?source=polymarket&search=Messi`, `/api/mobile/events/world-cup-golden-boot-winner/live-detail` | GET | Public viewing | Search/detail params only | Golden Boot event, Messi market/outcome id, probability, provider source, provider market id, condition id, token id | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | Home/Live intentionally exclude broad futures. |
| Messi local-MM preparation | `/api/admin/reference-markets/:id`, `/api/admin/reference-markets/:id/seed-bot` through bot admin scripts | PATCH/POST | Dev admin header and local internal bot env flags | Approve tradable, enable MM, seed capital/mint budget, mark live-ready/live-enabled | Runtime credential state, local bot inventory/capital, live-enabled lifecycle | `Market.referenceMetadata`, `User`, `ApiCredential`, `UserBalance`, `Position` | None. | Newly imported player markets may start `referenceOnly=true` and need explicit internal-test tradable approval before live-ready. |
| Messi fake-token retail order | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Mobile proof API key with order/account scopes | Messi YES selection, price `0.40`, amount `1.20`, provider market/condition/token identity | Filled order, Portfolio position, History trade | `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None. | No missing support for selected provider-backed future order. |

## Cycle PH - Nation Top Goalscorer Provider Market Tradable Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nation top-goalscorer provider-backed future visibility | `/api/events?source=polymarket&search=representing%20Argentina`, `/api/mobile/events/world-cup-nation-of-top-goalscorer/live-detail` | GET | Public viewing | Search/detail params only | Nation event, Argentina market/outcome id, probability, provider source, provider market id, condition id, token id | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | S23 Search deep-link did not reliably land on this Search result; direct detail route proof passed. |
| Argentina nation local-MM preparation | `/api/admin/reference-markets/:id`, `/api/admin/reference-markets/:id/seed-bot` through bot admin scripts | PATCH/POST | Dev admin header and local internal bot env flags | Approve tradable, enable MM, seed capital/mint budget, mark live-ready/live-enabled | Runtime credential state, local bot inventory/capital, live-enabled lifecycle | `Market.referenceMetadata`, `User`, `ApiCredential`, `UserBalance`, `Position` | None. | Newly imported nation markets may start `referenceOnly=true` and need explicit internal-test tradable approval before live-ready. |
| Argentina nation fake-token retail order | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Mobile proof API key with order/account scopes | Argentina YES selection, price `0.40`, amount `1.20`, provider market/condition/token identity | Filled order, Portfolio position, History trade | `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None. | No missing support for selected provider-backed future order. |

## Cycle PI - Search Deep-Link Provider Futures Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed future Search visibility from launch | `/api/events?source=polymarket&search=representing%20Argentina`, `/api/mobile/events/world-cup-nation-of-top-goalscorer/live-detail` | GET | Public viewing for event/detail; runtime API key was present for server-mode app session | Search query and detail slug only | Nation event title, Argentina outcome, probability, provider source, provider market id `2070987`, condition id, token id | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | No backend route gap in PI. The gap was mobile launch/query reset behavior. |

## Cycle PJ - Provider Visible Market To Local Tradable Market

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Norway Nation Top Goalscorer visibility | `/api/events?source=polymarket&search=Norway`, `/api/mobile/events/world-cup-nation-of-top-goalscorer/live-detail` | GET | Public viewing | Search query and detail slug only | Event slug/title, Norway market id, provider market id `2070985`, condition id, token id, probability, provider source | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | No missing support for selected provider-backed visibility. |
| Norway internal-test MM setup | `/api/admin/reference-markets/3c089b24-8a2e-42f4-97fb-3e7422bdfa65`, bot liquidity seed/live-local scripts | PATCH/script | Dev admin header / local bot env | Approve tradable, enable MM, seed capital/mint budget, mark live-ready/live-enabled | Runtime credential state, local bot inventory/capital, bot readiness, quote placement result | `Market.referenceMetadata`, `User`, `ApiCredential`, `UserBalance`, `Position`, `Order` | None. | No missing support after local dev admin env was provided. |
| Norway fake-token retail order | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Mobile proof API key with order/account scopes | Norway YES selection, price `0.12`, amount `0.36`, provider market/condition/token identity | Filled order, Portfolio position, History trade | `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None. | No missing support for selected provider-backed future order. |

## Cycle PK - Golden Boot Haaland Tradable Flow

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Haaland Golden Boot visibility | `/api/events?source=polymarket&search=Haaland`, `/api/mobile/events/world-cup-golden-boot-winner/live-detail` | GET | Public viewing | Search query and detail slug only | Event slug/title, Haaland market id, provider market id `2069636`, condition id, token id, probability, provider source | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | No missing support for selected provider-backed visibility. |
| Haaland internal-test MM setup | `/api/admin/reference-markets/70612733-f5d4-4fcb-8561-c1e7f93be924`, bot liquidity seed/live-local scripts | PATCH/script | Dev admin header / local bot env | Approve tradable, enable MM, seed capital/mint budget, mark live-ready/live-enabled | Runtime credential state, local bot inventory/capital, bot readiness, quote placement result | `Market.referenceMetadata`, `User`, `ApiCredential`, `UserBalance`, `Position`, `Order` | None. | No missing support after local dev admin env was provided. |
| Haaland fake-token retail order | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Mobile proof API key with order/account scopes | Haaland YES selection, price `0.13`, amount `0.39`, provider market/condition/token identity | Filled order, Portfolio position, History trade | `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None. | No missing support for selected provider-backed future order. |

## Cycle PN - Provider Proof Harness And Mbappe Tradable Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mbappe Golden Boot visibility | `/api/events?source=polymarket&search=Kylian%20Mbappe`, `/api/mobile/events/world-cup-golden-boot-winner/live-detail` | GET | Public viewing | Search query and detail slug only | Event slug/title, Mbappe market id, provider market id `2069638`, condition id, token id, probability, provider source | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | No missing support for selected provider-backed visibility. |
| Mbappe internal-test MM setup | `/api/admin/reference-markets/99caf629-cb24-4fda-ae7f-3249e98778d6`, bot liquidity seed/live-local scripts | PATCH/script | Dev admin header / local bot env | Enable MM, seed capital/mint budget, run dry-run/live-local | Runtime credential state, local bot inventory/capital, bot readiness, quote placement result | `Market.referenceMetadata`, `User`, `ApiCredential`, `UserBalance`, `Position`, `Order` | None. | No missing support for selected Mbappe setup; orchestration remains split across bot commands. |
| Mbappe fake-token retail order | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Mobile proof API key with order/account scopes | Mbappe YES selection, price `0.44`, amount `1`, provider market/condition/token identity | Filled order, Portfolio position, History trade | `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None. | No missing support for selected provider-backed future order. |

## Cycle PL - Current Match Line Provider Gate

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home current match source map | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query params only | Match-only event list, market source summary, regulation winner status, line market status, line families | `Event`, `Market`, `Outcome`, provider quote snapshots, contract fixture line markets | Contract-fixture line markets remain present for Local MVP. | Provider-backed current-match line markets missing. |
| Current match detail source map | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug only | 3 Polymarket regulation-winner markets, 4 contract-fixture line markets, line family readiness, provider availability reason | `Event`, `Market`, `Outcome`, provider quote snapshots, contract fixture line markets | Contract-fixture Spread/Totals/Team Totals used for Local MVP until attach-ready provider rows exist. | Polymarket Gamma currently exposes 0 attach-ready line markets for this event. |
| Provider line availability | Polymarket Gamma `https://gamma-api.polymarket.com/events?slug=fifwc-arg-egy-2026-07-07` plus provider discovery guard | GET/service | Public provider data | Event slug | Provider market families, candidate attach readiness, family mismatch reasons | Provider candidate mapping only; no DB mutation | None added. | No real provider line rows found; wrong-family rows must remain rejected. |

## Cycle PM - France Nation Top Goalscorer Tradable Proof

| Mobile feature | API endpoint/service used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| France Nation Top Goalscorer visibility | `/api/events?source=polymarket&search=France`, `/api/mobile/events/world-cup-nation-of-top-goalscorer/live-detail` | GET | Public viewing | Search query and detail slug only | Event slug/title, France market id, provider market id `2070983`, condition id, token id, probability, provider source | `Event`, `Market`, `Outcome`, provider quote snapshots | None for selected provider future. | No missing support for selected provider-backed visibility. |
| France internal-test MM setup | `/api/admin/reference-markets/42203d58-497f-49e6-a660-87eca202bd59`, `/api/admin/reference-markets/:id/seed-bot`, bot live-local scripts | PATCH/POST/script | Dev admin header / local bot env | Enable MM, seed capital/mint budget, mark live-enabled | Runtime credential state, downsized local bot inventory/capital, bot readiness, quote placement result | `Market.referenceMetadata`, `User`, `ApiCredential`, `UserBalance`, `Position`, `Order`, `LedgerEntry` | None. | No missing support after seed downsizing fix. |
| France fake-token retail order | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Mobile proof API key with order/account scopes | France YES selection, price `0.44`, amount `1`, provider market/condition/token identity | Filled order, Portfolio position, History trade | `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None. | No missing support for selected provider-backed future order. |

## Cycle PP - Mobile Google Account Entry

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account Google sign-in entry | `/api/auth/google/start?returnTo=%2Fportfolio` | GET/browser redirect | Public start route; Google OAuth provider credentials required on backend | `returnTo=/portfolio` query param; no request body | Mobile does not consume JSON; the system browser follows redirect/session flow | `User`, `Account`, session/auth cookie tables implied by existing backend auth service | None. Fake-token trading remains usable without auth. | Native app deep-link callback/session handoff is not implemented yet. |

## Cycle PQ - Event Detail Chart Touch Handoff

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail chart touch/readout | Existing `/api/mobile/events/:slug/live-detail` and `/api/markets/:marketId/chart` data when server mode is active | GET | Public viewing for event/chart routes | Event slug, market id, optional chart range | Existing event chart history/source/status/range plus primary market/outcome identity | `Event`, `Market`, `Outcome`, provider quote/chart snapshots where available | If route history is absent, mobile uses existing local/embedded chart points but now labels selected chart state honestly. | Real Polymarket-backed chart history is still not guaranteed for every current-match/line market. |
| Chart-to-ticket handoff | Existing `/api/orders` only after the user submits the opened Trade Ticket | POST on submit | Mobile API key required only in server order mode | Normal ticket order payload with `TicketSelection` identity | Order/Portfolio result after normal ticket submit | `Order`, `ApiOrderRequest`, `Portfolio`, `Trade` if filled | Mock mode keeps local fake-token order behavior. | No new backend support needed for handoff; full provider-backed line chart breadth remains open. |

## Cycle PR - Current MVP Service Readiness Inspection

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home match-only feed | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query params only | `events[]`, `eventType`, `liveStatus`, `marketSourceSummary`, match card source labels | `Event`, `Market`, `Outcome` | None for current feed; no futures returned in MVP mode. | More provider-backed match events need import/normalization if more than one match should appear. |
| Event Detail current match | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | 3 provider-backed Regulation Winner markets; 4 contract-fixture line markets; line family readiness and provider availability reason | `Event`, `Market`, `Outcome`, provider quote snapshots, contract fixture line markets | Spread/Totals/Team Totals are contract fixtures with explicit fake-token/source labels. | Real Polymarket-backed spread/totals/team-total markets are absent for this match. |
| Fake-token line order submit | `/api/orders` | POST | Mobile API key | `marketId`, `outcomeId`, side, price, size, `TicketSelection` with line/source identity | Filled order status, order selection identity | `Order`, `Trade`, `Position`, `UserBalance`, `ApiCredential` | None during server-mode proof. | No route gap for contract-fixture line submit/fill. |
| Portfolio and history verification | `/api/portfolio`, `/api/portfolio/history` | GET | Mobile API key | Auth header only | Position, recent trade, selection source summary, market/outcome/line/source identity | `Position`, `Trade`, `Order`, selection metadata | None during server-mode proof. | No route gap for preserving contract-fixture spread identity. |

## Cycle QP - Chinese MVP Source Copy Continuity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chinese Event Detail source banner/rows | Existing `/api/mobile/events/:slug/live-detail` in server mode | GET | Public viewing | Event slug only | `marketSourceSummary`, `Market.referenceSource`, line family readiness, provider availability, selected market/outcome identity | `Event`, `Market`, `Outcome`, provider quote snapshots, contract fixture line markets | Contract-fixture line markets remain the Local MVP fallback. | No new route gap. Provider-backed current-match Spread/Totals/Team Total markets remain unavailable. |
| Chinese Trade Ticket source note | Existing `/api/orders` only after submit | POST on submit | Mobile API key in server order mode | Normal ticket submit payload with `TicketSelection.referenceSource`, market id, outcome id, line, period, contract side | Existing order response and later portfolio/history snapshots | `Order`, `Trade`, `Position`, `UserBalance`, `ApiCredential` | Mock mode keeps local fake-token orders. | No route/schema change; source note is mobile display copy. |
| Chinese Portfolio source notes/history | `/api/portfolio`, `/api/portfolio/history` | GET | Mobile API key | Auth header only | Position/open-order/history selection snapshot with source, market id, outcome id, line, period, provider ids | `Position`, `Order`, `Trade`, selection metadata | None in server-mode proof. | No new backend support needed for localization. |

## Cycle QQ - Chinese Trade Ticket Amount Copy

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chinese Trade Ticket amount entry | Existing `/api/mobile/events/:slug/live-detail` for event/market data; `/api/orders` only after submit | GET/POST | Public viewing for event data; mobile API key for server order submit | Event slug for detail; normal order payload only if user swipes above threshold | Market probability, balance from app state/account route, selected market/outcome/source identity, order result after submit | `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, `UserBalance`, `ApiCredential` | Mock mode still keeps local fake-token order behavior. | No new backend support needed. This cycle changes display copy only. |

## Cycle QR - Portfolio Login Entry Clarity

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio account/login entry | `/api/auth/google/start?returnTo=%2Fportfolio` only after user opens Account and taps Google sign-in | GET/browser redirect | Public auth-start route; Google provider credentials required on backend | `returnTo=/portfolio` query param; no JSON request body | Mobile consumes no JSON from the auth-start route; browser follows redirect/session flow | Existing backend auth/session/user tables implied | Fake-token trading remains available without Google login. | Native app deep-link callback/session/logout is still not implemented. |

## Cycle QS - Market Card Chinese Source Copy

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chinese Home/Live/Search market-card source line | Existing `/api/events?...mobileMvpMatches=1`, `/api/events` Search route, and Live feed route data when server mode is active | GET | Public viewing | Existing event feed/search/live query params | `marketSourceSummary.regulationWinner.status`, `marketSourceSummary.lineMarkets.status`, `marketSourceSummary.lineMarkets.families` | `Event`, `Market`, `Outcome`; no new tables | Local/static mode keeps existing event fixtures. | No new backend support needed for copy fix; real provider-backed current-match line markets remain missing. |

## Cycle QT - Event Detail Player Props Chinese Empty State

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail Player Props empty tab | Existing `/api/mobile/events/:slug/live-detail` only to open the event page | GET | Public viewing | Event slug | Existing event identity and market groups; no player prop data consumed in this cycle | `Event`, `Market`, `Outcome`; no player-prop schema change | Local/static mode keeps the same blank Player Props tab. | Real provider-backed player prop groups/routes remain intentionally out of MVP scope. |

## Cycle QU - Portfolio Google Login Visibility

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio account/login entry | `/api/auth/google/start?returnTo=%2Fportfolio` only after the user opens Account and taps Google sign-in | GET/browser redirect | Public auth-start route; Google provider credentials required on backend | `returnTo=/portfolio` query param; no JSON request body | Mobile consumes no JSON from the auth-start route; browser follows redirect/session flow | Existing backend auth/session/user tables implied | Fake-token trading remains available without Google login. | Native app deep-link callback/session/logout is still not implemented. |

## Cycle QV - Event Detail Source Disclosure Compact

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail Game Lines source disclosure | Existing `/api/mobile/events/:slug/live-detail` only to hydrate current event/source summary | GET | Public viewing | Event slug | `marketSourceSummary.regulationWinner`, `marketSourceSummary.lineMarkets`, provider availability, line-family readiness | `Event`, `Market`, `Outcome`; provider quote snapshots and contract fixture line markets implied by existing route | Local/static mode keeps existing line source markers. | No new route gap. Real provider-backed current-match Spread/Totals/Team Total line rows remain unavailable. |

## Cycle QW - Portfolio Google Badge Visibility

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio account/login entry | `/api/auth/google/start?returnTo=%2Fportfolio` only after the user opens Account and taps Google sign-in | GET/browser redirect | Public auth-start route; Google provider credentials required on backend | `returnTo=/portfolio` query param; no JSON request body | Mobile consumes no JSON from the Portfolio badge; Account sign-in follows the existing browser redirect path | Existing backend auth/session/user tables implied | Fake-token trading remains available without Google login. | Native app deep-link callback/session/logout remains a future auth milestone. |

## Cycle QX - Portfolio Proof Launch Reliability

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio proof startup and Account Google visibility | No new backend route. Existing `/api/auth/google/start?returnTo=%2Fportfolio` remains used only if the tester taps Google sign-in on Account. | N/A for proof startup; GET/browser redirect for auth-start | None for proof startup; public auth-start route for Google | `EXPO_PUBLIC_PROOF_INITIAL_TAB=portfolio` for proof runtime only; `returnTo=/portfolio` only after Google sign-in tap | Mobile consumes no backend JSON for proof startup; Account still exposes existing Google sign-in action | No new database model implied | Fake-token trading remains available without Google login. | Native app deep-link callback/session/logout remains a future auth milestone. |

## Cycle QY - Home/Live Retail Source Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home match cards and Live match cards | Existing `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1` and existing live event feed path through the mobile service layer | GET | Public viewing | Existing Home/Live query params only | `events[]`, `marketSourceSummary.regulationWinner`, `marketSourceSummary.lineMarkets`, market/outcome ids and probabilities | `Event`, `Market`, `Outcome`; no new table implied | Static local fixtures still expose the same hidden audit marker path. | No route gap introduced. Real provider-backed current-match Spread/Totals/Team Total line rows remain unavailable. |

## Cycle RE - Trade Ticket Header Density

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket amount-entry header | Existing `/api/mobile/events/:slug/live-detail` before opening the ticket; existing `/api/orders` only after a valid swipe submit | GET/POST | Public viewing for event detail; mobile API key for server order mode submit | Event slug for detail; unchanged order payload after swipe threshold | Existing event title, market title, outcome, probability, `referenceSource`, line/source identity, balance | Existing `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, `UserBalance`, `ApiCredential`; no new table implied | Mock mode keeps local fake-token ticket display and submit behavior. | No new route gap introduced. Native Google OAuth callback/session/logout and real provider-backed current-match line markets remain separate gaps. |

## Cycle RF - Event Detail Trade Smoke Current Ticket Gate

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail trade UI proof | Existing `/api/mobile/events/:slug/live-detail`; `/api/orders` remains unchanged but is not submitted in this proof | GET; POST only in separate submit proofs | Public viewing for event detail; mobile API key only for order submit paths | Event slug for detail; no order body in RF proof | Existing event title, market title, selected outcome, probability, source identity, amount/keypad/swipe markers | Existing `Event`, `Market`, `Outcome`; no new table implied | Smoke wrapper used app mock fallback when backend health was unavailable; this proof validates UI only. | No route gap introduced. Real provider-backed current-match line markets remain unavailable. |

## Cycle RG - Samsung Backend Port Health

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Samsung smoke backend preflight | `/api/health` | GET | None | None | `status`, `db`, `env`, `timestamp` for proof startup logging | Database connectivity is checked by the route; no new table implied | None for preflight after fix; false port-3000 fallback removed. | No route gap introduced. |
| Event Detail trade UI proof | Existing `/api/mobile/events/:slug/live-detail`; `/api/orders` unchanged and not submitted in this proof | GET; POST only in separate submit proofs | Public viewing for event detail; mobile API key only for order submit paths | Event slug for detail; no order body in RG proof | Existing event title, market title, selected outcome, probability, source identity, amount/keypad/swipe markers | Existing `Event`, `Market`, `Outcome`; no new table implied | Event Detail Trade proof remains a UI smoke path unless a server order switch is used. | Real provider-backed current-match line markets remain unavailable. |

## Cycle RH - Route-Backed Team Total Filled Order Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Disposable provider-backed event setup | Local proof script via Prisma and provider proof services | N/A | Local dev DB only | Generated event slug; provider-shaped markets for regulation winner, spread, totals, and team-total | `eventSlug`, market ids, outcome ids, provider source, external market ids, condition ids, token ids | `Event`, `Market`, `Outcome`, provider quote/depth/history snapshot models | None; setup is server-mode proof data. | Production Gamma/CLOB discovery still needs real World Cup event mappings. |
| Event Detail live route | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | `forceBackendEventSlug` in mobile proof URL | Event identity, Team Total 1.5 market/outcome, line, period, probability, `referenceSource`, provider market/condition/token ids, chart/source status | `Event`, `Market`, `Outcome`, provider quote/depth/chart snapshots | None in RH server-mode proof. | No new route gap for disposable provider-backed markets. |
| Server fake-token order submit | `/api/orders` | POST | Mobile API key | Market id, outcome id, side `buy`, amount `$75`, selected line/period/provider identity via ticket selection, idempotency headers | Order/trade result; later reflected in portfolio snapshot/history | `Order`, `Trade`, `Position`, `UserBalance`, `ApiCredential`, collateral/share accounting | Mock mode unchanged; not used in RH proof. | No route gap for local fake-token order placement. |
| Portfolio positions/orders/history | `/api/portfolio`, `/api/portfolio/history`, portfolio value-history route | GET | Mobile API key | Auth header only | Position, empty orders state, activity row, value history, source/status, selected market type, line, period, provider token | `Position`, `Order`, `Trade`, `UserBalance`, selection snapshot fields | None in RH server-mode proof. | No route gap for Team Total filled proof; native Google auth session remains separate. |

## Cycle RI - Current Route Server-Filled MVP Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current Home match feed | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query params only | Current match slug/title/status, provider source summary, provider-backed Regulation Winner availability | `Event`, `Market`, `Outcome`, provider mapping/snapshot tables | None in RI proof. | More provider-backed World Cup matches need import/normalization for a fuller Home feed. |
| Current Event Detail | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug; proof uses `forceBackendEventSlug=argentina-vs-egypt` | Parent event title/teams, Regulation Winner provider-backed markets, contract-fixture line markets, `referenceSource`, line, period, source/status markers | `Event`, `Market`, `Outcome`, provider quote snapshots, contract fixture line markets | Contract-fixture line rows are used only for missing provider-backed line-market breadth. | Real Polymarket-backed Spread/Totals/Team Total markets remain unavailable for the current route. |
| Current Team Total fake-token order | `/api/orders` | POST | Mobile API key | Market id, outcome id, side `buy`, amount `$75`, price/top probability, `TicketSelection` with market type `team-total`, line `1.5`, period `regulation`, source/token identity | Filled order result and later portfolio/history state | `Order`, `Trade`, `Position`, `UserBalance`, `ApiCredential`, share/collateral accounting | None in server-mode proof. | No route gap for contract-fixture Team Total order placement/fill. |
| Current Portfolio positions/orders/history | `/api/portfolio`, `/api/portfolio/history`, portfolio value-history route | GET | Mobile API key | Auth header only | Position, no-open-orders state, recent trade row, parent event title/slug, selected line/source/token identity, fill count | `Position`, `Order`, `Trade`, `UserBalance`, selection snapshot fields | None in server-mode proof. | Native Google auth session remains separate; real provider-backed line-market identity still depends on future provider breadth. |

## Cycle RJ - Portfolio Team Total Wording Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio/history readable Team Total label | Existing `/api/portfolio`, `/api/portfolio/history` | GET | Mobile API key | Auth header only | Existing `selection.referenceOutcomeLabel`, `outcome`, `selection.marketType`, `selection.line`, `selection.period`, and identity/source fields | Existing `Position`, `Order`, `Trade`; no new model implied | Mock/local mode uses the same display helper when selection identity exists. | No new backend support needed for wording. Real provider-backed line-market breadth remains a separate provider gap. |

## Cycle RK - Portfolio Source Label Visual Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio visible row source cleanup | Existing `/api/portfolio`, `/api/portfolio/history` | GET | Mobile API key | Auth header only | Existing selection source and identity fields remain consumed for hidden audit labels and source summaries | Existing `Position`, `Order`, `Trade`; no new model implied | Mock/local mode uses the same hidden row-source markers. | No new backend support needed. |

## Cycle RL - Portfolio Google Entry and Source Summary Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio Google/account entry | `/api/auth/google/start?returnTo=%2Fportfolio` only if the user taps `Continue with Google` | GET/browser redirect | Public auth-start route; Google provider credentials required on backend | `returnTo=/portfolio` query param; no JSON request body | Mobile consumes no JSON from this button; the browser follows the backend auth redirect path | Existing backend auth/session/user tables implied | Fake-token trading remains available without Google login. | Native app deep-link callback/session/logout remains future auth work. |
| Portfolio source summary cleanup | Existing `/api/portfolio`, `/api/portfolio/history` | GET | Mobile API key | Auth header only | Existing selection source and identity fields remain consumed for hidden audit labels | Existing `Position`, `Order`, `Trade`; no new model implied | Mock/local mode keeps the same hidden audit markers. | No new backend support needed. |

## Cycle RM - Current MVP Cashout Ticket Retail Pass

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current line-market buy before cashout | `/api/orders` | POST | Mobile API key | Market id, outcome id, side `BUY`, contract side, price, size, selection snapshot | Filled order/position reflected later through Portfolio routes | `Order`, `Trade`, `Position`, `UserBalance`, `ApiCredential` | Mock mode unchanged. | No new support needed. |
| Portfolio cashout/sell | `/api/orders` through `closePositionOnServer` | POST | Mobile API key | `marketId`, `outcomeId`, side `SELL`, price from current position price, full available share size | No JSON is directly displayed by the cashout modal; Portfolio refresh consumes resulting position/history state | `Order`, `Trade`, `Position`, `UserBalance`, share accounting | Mock mode still closes locally. | No route gap for local fake-token cashout; generic Trade Ticket sell path remains separate UI parity work. |
| Portfolio/history after cashout | `/api/portfolio`, `/api/portfolio/history` | GET | Mobile API key | Auth header only | Sold activity row, selection market type, line, period, source, market/outcome identity | `Position`, `Order`, `Trade`, selection snapshot fields | Mock/local mode uses local activity state. | No new support needed. |
# Cycle RQ - Sell Fill To Portfolio History

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Visible Home -> Sell ticket -> Portfolio History | `/api/events?includeMobileMarkets=1&mobileMvpMatches=1`; `/api/mobile/events/:slug/live-detail`; `/api/markets/:marketId/quote`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | GET/POST | Mobile dev API key generated for proof user | SELL order for seeded `marketId`, `outcomeId`, side `SELL`, type/price/size from ticket amount and quote | filled order status, market/outcome identity, activity action `sold`, history row amount/time markers, open-order count | `User`, `ApiCredential`, `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, portfolio/history read models | None in server proof; local proof liquidity creates sellable shares and maker BUY liquidity | Production liquidity/public trading policy remains future work. |

# Cycle RR - Portfolio History Match/Market Context

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio History readable match/market context after sell fill | `/api/portfolio`; `/api/portfolio/history` | GET | Mobile dev API key generated for proof user | Auth header only | activity id/action/status/side/amount/time, market title, outcome name, optional event title, selection identity | `User`, `ApiCredential`, `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position` | None in server proof; local mode uses the same Portfolio display helpers | Superseded by Cycle RS: `/api/portfolio/history` now provides canonical `market.displayTitle`, `market.eventTitle`, and `market.eventSlug`; fallback parsing remains only for older/offline payloads. |
| Portfolio Google entry | `/api/auth/google/start?returnTo=%2Fportfolio` only when the tester taps Google sign-in | GET/browser redirect | Public auth-start route; Google provider credentials required on backend | `returnTo=/portfolio` query param; no JSON body | No JSON consumed by mobile for the tap; browser follows backend redirect | Existing auth/session/user tables implied | Fake-token trading remains available without Google login | Native app OAuth callback/session/logout remains future auth work. |

# Cycle RS - Portfolio History Display Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio History canonical event/market display | `/api/portfolio/history` | GET | Mobile API key for app proof; session user for web route use | Auth header only | `market.title`, `market.displayTitle`, `market.eventTitle`, `market.eventSlug`, outcome, selection identity, trade/order timestamps and amounts | `User`, `ApiCredential`, `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, `LedgerEntry` for resolved rows | Older/mobile fixture payloads without `displayTitle` still use fallback title parsing | No route gap remains for readable event/market display fields. |

# Cycle RT - Generic Cashout Sell Ticket

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cash out through generic Sell Trade Ticket | `/api/markets/:marketId/quote`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | GET/POST | Mobile API key in server mode | Generic ticket submits `SELL` order with selected `marketId`, `outcomeId`, price/size derived from amount and quote, and order-time selection identity | Quote price, filled sell order, refreshed positions, sold history activity, selected market/outcome/line/source identity | `User`, `ApiCredential`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, balances | Mock/local mode continues to use generic ticket local order handling | No new backend route gap; production liquidity/public policy remains future work. |

# Cycle RU - Current-Match Provider Line Readiness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider line-market discovery proof | `https://gamma-api.polymarket.com/events?slug=fifwc-arg-egy-2026-07-07`; `https://gamma-api.polymarket.com/markets?slug=...`; `https://gamma-api.polymarket.com/markets?search=...` | GET | Public provider API | Provider event slug plus derived team-aware line search/slug guesses | Provider market slug, question, condition id, token completeness, market family, relevance/attach-readiness reasons | No local schema change; proof compares provider data against existing `Event`, `Market`, `Outcome` contracts | None; this is provider evidence only. | Real Polymarket-backed Spread/Totals/Team Total markets remain unavailable for the current match. |
| Current Event Detail line source summary | `/api/mobile/events/argentina-vs-egypt/live-detail` | GET | Public viewing | Event slug | `marketSourceSummary.regulationWinner.status=provider-backed`, `marketSourceSummary.lineMarkets.status=contract-fixture`, market ids, outcome ids, line, period, source | Existing `Event`, `Market`, `Outcome`; no schema change | Current line rows remain future-backend-shaped contract fixtures. | Replace contract fixture rows when Polymarket exposes attach-ready line markets or another approved provider is configured. |

# Cycle RV - Local MVP Liquidity Purpose Harness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Buy-fill liquidity preparation | Local proof script using `placeOrderAndMatch` | N/A | Local dev DB only | `liquidityPurpose=buy-fill`, event slug, spread line `1.5`, outcome side `away`, ask price/size | Resting maker order side `SELL`, price, size, market/outcome identity | `User`, `UserBalance`, `Market`, `Outcome`, `Order`, `Position`, collateral/share accounting | None; this is server-mode proof setup. | Production liquidity/public market-maker policy remains future work. |
| Cashout/sell-fill liquidity preparation | Local proof script using `placeOrderAndMatch` | N/A | Local dev DB only | `liquidityPurpose=cashout-sell-fill`, event slug, spread line `1.5`, outcome side `away`, bid price/size | Resting maker order side `BUY`, price, size, market/outcome identity | `User`, `UserBalance`, `Market`, `Outcome`, `Order`, `Position`, balances | None; this is server-mode proof setup. | Production liquidity/public market-maker policy remains future work. |
| Visible Local MVP order journey | `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | POST/GET | Mobile API key in server mode | Buy/sell ticket order body with market id, outcome id, side, price/size, selected line/source identity | Filled order, Portfolio position, sold History row, selected spread line/source identity | Existing `Order`, `Trade`, `Position`, `UserBalance`, `ApiCredential` | Mock/local mode unchanged. | S23 proof passed for RV; production liquidity/public market-maker policy remains future work. |

# Cycle RW - Event Detail Simple Market Page and Google Mobile Auth Setup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail simple market page | `/api/mobile/events/:slug/live-detail`; `/api/events?includeMobileMarkets=1&mobileMvpMatches=1`; `/api/markets/:marketId/quote`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | GET/POST | Public viewing; mobile API key for order/portfolio server mode | Event slug, market/outcome ids, line/period/source selection, order side/price/size | Event title/teams/probabilities, Game Lines, line selector, ticket selection identity, filled order, Portfolio History | Existing `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, `UserBalance`, `ApiCredential` | Mock/local mode unchanged; server proof uses local proof liquidity. | Real provider-backed Spread/Totals/Team Total markets remain unavailable for the active provider route. |
| Google mobile sign-in | `/api/auth/google/start`; Google OAuth endpoints; `/api/auth/google/callback` | GET/browser redirect | Public auth-start; backend-owned Google Cloud OAuth credentials | `returnTo=/portfolio`; `mobileReturnTo=holiwyn://auth/google` or env override | Mobile receives deep-link params `googleAuth=success`, `forcePortfolio=1`, `forceRuntimePortfolioSync=1`, and a Holiwyn API key token after successful server callback | Existing `User`, `Account`, `ApiCredential`; no Google secret on mobile | Fake-token trading still works without Google login. | Manual Expo Go OAuth return may require `EXPO_PUBLIC_GOOGLE_AUTH_RETURN_URL`; native logout/token rotation remains future auth hardening. |

# Cycle RX - Google Auth Return Portfolio Connected State

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio connected state after Google auth return | `/api/portfolio`; deep-link return from `/api/auth/google/callback` | GET plus app deep link | Mobile API key returned by backend auth callback | Deep-link params: `googleAuth=success`, `forcePortfolio=1`, `forceRuntimePortfolioSync=1`, `apiKey=<redacted>` | Portfolio route readability, Portfolio header state `Google connected`, helper `Server profile loaded`, runtime API key refresh | Existing `User`, `ApiCredential`, `UserBalance`; no schema change | Local/mock mode unaffected; proof uses generated local dev credential to simulate the callback token. | Interactive Google consent proof and token revocation/logout remain future auth hardening. |

# Cycle RY - Provider Breadth Runtime Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mobile-visible World Cup provider breadth | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public viewing | Query params only | Real provider-backed match/future events, `marketSourceSummary`, market ids, provider market ids, source breakdown | `Event`, `Market`, `Outcome` | None for server route proof; local static app data remains unchanged. | Current-match provider-backed line markets remain unavailable. |
| Local MVP match-only Home feed | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Query params only | Match-only events; proof-noise events excluded; provider-backed winner summary for `argentina-vs-egypt` | `Event`, `Market`, `Outcome` | Local/static mode still uses bundled World Cup mocks. | More real Polymarket-backed match events need import/normalization when available. |
| Provider-backed winner retail order | `/api/mobile/events/argentina-vs-egypt/live-detail`; `/api/markets/:marketId/quote`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | GET/POST | Public viewing; mobile API key for order and Portfolio routes | selected provider market `2793741`, outcome identity, fake-token amount, idempotency key | filled order, provider source markers, Portfolio position, History fill row | `User`, `ApiCredential`, `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, `UserBalance` | Proof seeds deterministic counterparty liquidity; mock mode unchanged. | Production liquidity policy remains future work. |

# Cycle RZ - Google Auth Return Persistence

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Persisted Portfolio connected state after Google mobile callback | `/api/auth/google/start`; `/api/auth/google/callback`; `/api/profile/summary`; `/api/portfolio` in proof preflight | GET/browser redirect plus API GET | Backend Google OAuth credentials for callback; Holiwyn mobile API key after callback | `mobileReturnTo`; callback returns deep-link params `googleAuth=success`, `forcePortfolio=1`, `forceRuntimePortfolioSync=1`, `apiKey=<redacted>` | Stored Holiwyn API key, profile summary, Portfolio connected label, account balance/profile state | Existing `User`, `Account`, `ApiCredential`, `UserBalance`; no schema change | Proof uses generated local mobile dev credential that matches the callback credential shape | Interactive Google consent and logout/token revocation remain future auth work. |

# Cycle SA - Google Account Sign-Out and Mobile Credential Revocation

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account Google sign-out | `/api/auth/mobile/logout` | POST | Holiwyn mobile API key with `account:write`; session also supported | No body | `ok`, `revokedApiCredential` | Existing `User`, `ApiCredential`; route calls existing `revokeApiCredential` and clears user cookie | If the network call fails, mobile still clears local MVP credential state so testers are not trapped signed in | Production secure storage and real Google consent/logout session proof remain future hardening. |

# Cycle SB - Secure Mobile Auth Credential Storage

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Secure persisted mobile credential | `/api/auth/google/callback`; `/api/profile/summary`; `/api/auth/mobile/logout` | Callback/deep link plus API GET/POST | Backend-created Holiwyn mobile API key | Deep-link `apiKey=<redacted>` from backend callback; no route body for storage | Stored API key loads server profile and is removed on logout | Existing `User`, `ApiCredential`; no schema change | If SecureStore is unavailable, mobile falls back to legacy AsyncStorage after attempting migration | Real interactive Google consent remains future proof work. |

# Cycle SC - Event Detail Chart Removal Hardening

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chart-free Local MVP Event Detail | `/api/mobile/events/:slug/live-detail`; `/api/markets/:marketId/quote`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | GET/POST | Public viewing; mobile API key for server-mode order/Portfolio routes | Event slug, selected market/outcome/line identity, fake-token order body | Event/market/line rows, quote/ticket pricing, order result, Portfolio position/history | Existing `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, `UserBalance`, `ApiCredential` | Local/mock mode unchanged. Chart UI removal does not change data mapping. | Real provider-backed current-match Spread/Totals/Team Total markets remain unavailable. Chart history data is not a Local MVP UI dependency. |

# Cycle SD - Account Fake-Token Funding Copy and Google Credential Alignment

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio/Account Google login | `/api/auth/google/start`; `/api/auth/google/callback`; Google OAuth token/userinfo endpoints | GET/browser redirect plus backend token exchange | Public auth-start route; backend uses shared Poly/Holiwyn Google Cloud OAuth client credentials | `returnTo=/portfolio`; `mobileReturnTo=holiwyn://auth/google`; callback code/state handled by backend | Deep-link params `googleAuth=success`, `forcePortfolio=1`, `forceRuntimePortfolioSync=1`, `apiKey=<redacted>` | Existing `User`, `Account`, `ApiCredential`; no schema change | Fake-token trading remains available without Google login | Real interactive Google consent proof on S23 remains P1; mobile must not store Google Cloud client secrets or Google access tokens. |
| Account fake-token copy cleanup | `/api/profile/summary`; `/api/auth/mobile/logout` during proof | GET/POST | Mobile API key after callback-shaped return | No new body fields | Profile/connected state and logout result only | Existing auth/profile models | Signed-out users still see local fake-token trading copy | Future EBPay/deposit/withdraw routes intentionally remain outside Local MVP. |

# Cycle SE - Google Mobile Return Compatibility

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Google mobile OAuth return target | `/api/auth/google/start`; `/api/auth/google/callback`; Google OAuth token/userinfo endpoints | GET/browser redirect plus backend token exchange | Public auth-start route; backend-owned Google OAuth credentials | `mobileReturnTo=holiwyn://auth/google` for dev build/APK; `mobileReturnTo=exp://.../--/auth/google` or `exps://.../--/auth/google` only in non-production Expo Go testing | Callback deep-link params `googleAuth=success`, `forcePortfolio=1`, `forceRuntimePortfolioSync=1`, `apiKey=<redacted>` | Existing `User`, `Account`, `ApiCredential`; no schema change | Fake-token trading remains available without Google login | Real interactive consent proof still requires configured Google Cloud redirect URI and a manual/device OAuth run. |

# Cycle SF - Google Mobile Return Allowlist Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Google mobile return allowlist | `/api/auth/google/start`; `/api/auth/google/callback` | GET/browser redirect plus backend token exchange | Public auth-start route; backend-owned Google OAuth credentials | Same `mobileReturnTo` contract as SE | Same callback deep-link params as SE when allowed; no callback params when blocked and falling back to web return | Existing `User`, `Account`, `ApiCredential`; no schema change | Fake-token trading remains available without Google login | Real interactive consent proof remains a manual/device proof item; this cycle adds direct backend policy tests. |

# Cycle SG - Google OAuth Base URL Alignment

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mobile Google sign-in using the shared Poly/Holiwyn Google Cloud client | `/api/auth/google/start`; `https://accounts.google.com/o/oauth2/v2/auth`; `/api/auth/google/callback`; Google token/userinfo endpoints | GET/browser redirect plus backend POST to Google token endpoint | Public auth start; backend has `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and configured `NEXTAUTH_URL` | `returnTo=/portfolio`; `mobileReturnTo=holiwyn://auth/google` or non-production Expo return URL | Deep-link params `googleAuth=success`, `forcePortfolio=1`, `forceRuntimePortfolioSync=1`, `apiKey=<redacted>` | Existing `User`, `Account`, `ApiCredential`; no schema change | Local fake-token trading still works without Google sign-in | Real Google consent proof still needs a reachable `NEXTAUTH_URL` whose `/api/auth/google/callback` is authorized on the same Google Cloud OAuth client. |

## Cycle SM - Google Auth Shared Backend Base

| Mobile feature | API endpoint used | Method | Auth requirement | Request body/query | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio/Account Google login with shared Poly/Holiwyn OAuth credential | `${EXPO_PUBLIC_GOOGLE_AUTH_BASE_URL || EXPO_PUBLIC_API_BASE_URL}/api/auth/google/start`; `https://accounts.google.com/o/oauth2/v2/auth`; `/api/auth/google/callback`; Google token/userinfo endpoints | Browser GET plus backend POST to Google token endpoint | Public auth start; backend owns `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXTAUTH_URL` | `returnTo=/portfolio`; `mobileReturnTo=holiwyn://auth/google` or allowed non-production Expo return URL | Deep-link params `googleAuth=success`, `forcePortfolio=1`, `forceRuntimePortfolioSync=1`, `apiKey=<redacted>` | Existing `User`, `Account`, `ApiCredential`; no schema change | Local fake-token trading still works without Google sign-in | Real interactive S23 Google consent still requires the backend `NEXTAUTH_URL/api/auth/google/callback` to be authorized in the same Google Cloud OAuth client. |

## Cycle SN - Portfolio Header Density

| Mobile feature | API endpoint used | Method | Auth requirement | Request body/query | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio account header / compact Google entry | No new endpoint. Existing Google entry still opens `/api/auth/google/start`; Portfolio data still uses existing Portfolio/profile routes in server mode. | Existing browser GET plus existing Portfolio GET routes | Unchanged from prior Portfolio/auth cycles | No new request fields | No new response fields | No new database model or migration | Local fake-token Portfolio remains available without Google sign-in | None introduced. Full real Google browser consent remains a P1 proof gap, not a route/schema gap. |

## Cycle SO - Portfolio History Realized Proceeds

| Mobile feature | API endpoint used | Method | Auth requirement | Request body/query | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio History buy/cashout rows | Existing fake-token order and Portfolio/history routes used by the Local MVP proof | Existing POST/GET route flow | Existing mobile API key/server-mode proof auth | No new request fields | Existing activity `action`, `amount`, `entryAmount`, `side`, `selection`, `timestamp`; no new response fields | Existing `Order`, `Trade`, `Position`, `UserBalance`/history models; no schema change | Local MVP still supports contract-shaped fake-token activity rows | Explicit row-level realized P/L is still a future backend/data contract gap if exact profit rather than proceeds should be shown per row. |

## Cycle SP - Portfolio History Realized P/L Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body/query | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Resolved Portfolio History rows | `/api/portfolio/history` | GET | Existing mobile API key/server-mode proof auth | No new request fields | Existing resolved history fields `realizedPnLTokens`, `winningsTokens`, `refundsTokens`, `netInvestedTokens`, market title/event/display fields | Existing history/market/trade/position models; no schema change | Local fake-token recent trades remain available without resolved history | Recent trade/cashout rows still need explicit row-level realized P/L/proceeds fields if backend should drive exact display before market resolution. |

## Cycle SQ - Recent Trade Proceeds Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body/query | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Recent Portfolio History sold/cashout rows | `/api/portfolio/history` | GET | Existing mobile API key/server-mode proof auth | No new request fields | `recentTrades[].proceedsTokens`, `recentTrades[].realizedPnlTokens`, trade cost/shares/fee, market/outcome/selection identity | Existing `Trade`, `Market`, `Outcome`, `Order`, `ApiOrderRequest`; no schema change | Mock mode can still render local activity rows without route data | Exact row-level recent-trade realized P/L remains unavailable until trades store or can reconstruct execution-time cost basis. |

## Cycle SR - Recent Trade Realized P/L Replay

| Mobile feature | API endpoint used | Method | Auth requirement | Request body/query | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Recent Portfolio History realized P/L rows | `/api/portfolio/history` | GET | Existing mobile API key/server-mode proof auth | No new request fields; route internally queries full trade history for recent market/outcome selections | `recentTrades[].realizedPnlTokens`, `recentTrades[].proceedsTokens`, `recentTrades[].cost`, `shares`, `fee` | Existing `Trade`, `Market`, `Outcome`, `Order`, `ApiOrderRequest`; no schema change | Mock mode still supports local activity rows; server mode now returns richer recent-trade fields when basis is reconstructable | No schema gap for normal fake-token trade replay. Exact P/L remains `null` only for inconsistent/incomplete trade history. |

## Cycle SS - Portfolio Position Row Density

| Mobile feature | API endpoint used | Method | Auth requirement | Request body/query | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio Positions tab row parity | `/api/portfolio`; `/api/portfolio/history` during server-mode sync/proof | GET | Existing mobile API key/server-mode proof auth | No new request fields | Existing position fields: `amount`, `probability`, `currentPrice`, `currentValue`, `pnl`, `shares`, `selection`, event/market/outcome identity | Existing `Position`, `Market`, `Outcome`, `Trade`, `ApiCredential`; no schema change | Mock mode renders the same position row from local Portfolio state | No new backend field required. Full Polymarket-like Portfolio Orders/History density remains separate UI work. |

## Cycle ST - Portfolio History Row Density

| Mobile feature | API endpoint used | Method | Auth requirement | Request body/query | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio History tab row parity | `/api/portfolio/history`; `/api/portfolio` during server-mode sync/proof | GET | Existing mobile API key/server-mode proof auth | No new request fields | Existing activity fields: `amount`, `proceedsAmount`, `shares`, `probability`, `action`, `side`, `selection`, event/market/outcome identity | Existing `Trade`, `Order`, `Market`, `Outcome`, `ApiCredential`; no schema change | Mock mode renders the same history metric strip from local activities | No new backend field required for this visual cycle. Full Orders tab density remains separate UI work. |

## Cycle SU - Portfolio Orders Row Density

| Mobile feature | API endpoint used | Method | Auth requirement | Request body/query | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio Orders tab row parity | `/api/portfolio`; cancel path uses existing order cancel route through `cancelOpenOrderOnServer` | GET/POST | Existing mobile API key/server-mode proof auth | No new request fields; existing cancel request when user taps Cancel | Existing open-order fields: `title`, `outcome`, `side`, `status`, `price`, `remaining`, `originalShares`, `remainingShares`, `orderValue`, `placedAt`, `selection` | Existing `Order`, `Market`, `Outcome`, `ApiCredential`; no schema change | Mock mode renders the same open-order metric strip from local open orders | No new backend field required for this visual cycle. |

# Cycle SH - Home Local MVP Focus

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home World Cup match feed | `/api/events` via `api.listWorldCupEvents()` | GET | Public viewing | `limit=10`, `cursor`, `source=polymarket`, `leagueKey=world_cup`, `mobileMvpMatches=true`, `filter=all` | event id/slug/title/status/liveStatus/home/away teams, compact market summaries, `nextCursor` | Existing `Event`, `Market`, `Outcome`; no schema change | Local/mock mode uses bundled `worldCupEvents` and reveals 10 at a time | More real provider-backed match events and line markets remain separate provider breadth work. |

# Cycle SJ - Market Page Chart Removal

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chart-free Event Detail market page | `/api/mobile/events/:slug/live-detail`; `/api/events/:slug`; `/api/markets/:marketId/quote`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | GET/POST | Public viewing; mobile API key for server-mode order/Portfolio routes | Event slug, market/outcome/line identity, fake-token order payload | Event teams/status, market groups, selected outcome probability/quote, order result, Portfolio positions/history | Existing `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, `UserBalance`, `ApiCredential` | Mock mode still uses bundled match fixtures and local fake-token order state | No missing chart backend support for Local MVP. `/api/markets/:id/chart` is intentionally not consumed by the mobile market page. |

# Cycle SK - Ticket Source Audit-Only Header

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket source identity hidden from retail header | Existing quote/order routes only when ticket is priced/submitted: `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Public viewing; mobile API key for server-mode order/Portfolio routes | Selected event/market/outcome/line/source identity; fake-token order body | Outcome probability, best bid/ask when available, order result, Portfolio/history source identity | Existing `Market`, `Outcome`, `Order`, `Trade`, `Position`; no schema change | Mock mode keeps source markers from local fixtures | No new backend support. This cycle changes only whether source labels are visible in the ticket header. |

Proof: Samsung S23 `SM-S911U1` passed `docs/mobile/harness/cycle-SK-ticket-source-audit-only/cycle-SK-current-mvp-s23-visible-flow.json`. No route contract changed.

# Cycle SL - Ticket Swipe Handle Spacing

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket swipe footer visual spacing | No new route; existing submit path remains `/api/orders` when the user completes a server-mode swipe | POST only on successful submit | Mobile API key for server-mode order placement | Existing fake-token order body with selected event/market/outcome/line/source identity | Existing order result when submitted; this cycle only changes pre-submit footer layout | Existing `Order`, `Trade`, `Position`, `UserBalance`, `ApiCredential`; no schema change | Mock mode still uses the same local fake-token order path | No missing backend support. This is a visible mobile layout fix only. |

Proof: Samsung S23 `SM-S911U1` passed `docs/mobile/harness/cycle-SL-ticket-swipe-handle-spacing/cycle-SL-current-mvp-s23-visible-flow.json`. No route contract changed.

# Cycle SV - Event Detail Chart-Free MVP Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chart-free Event Detail market page hardening | Existing Event Detail routes; no chart route consumed by default MVP UI | GET | Existing public/server-mode viewing | Event slug and existing market/outcome identity only | Existing event teams, primary outcomes, market groups, line options, and selected outcome probabilities | Existing `Event`, `Market`, `Outcome`; no schema change | Existing mock/contract event fixtures remain unchanged | None for this cleanup. Chart-history routes can remain internal/future but must not block the Local MVP trading path. |

# Cycle SW - Current Route Server-Filled Line Readiness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current World Cup match Event Detail and line ticket | `/api/mobile/events/:slug/live-detail`; proof setup scripts restore/seed provider event and line markets | GET plus local setup scripts | Public viewing for event detail; proof setup uses local server/database access | `slug=argentina-vs-egypt`; provider slug `fifwc-arg-egy-2026-07-07`; market group/outcome/line identity | event title, teams, status, regulation-winner provider source, market groups, `marketType`, `period`, `line`, `side`, `providerSource`, provider token/condition identity | Existing `Event`, `Market`, `Outcome`, provider mapping fields; no migration | Mock mode can still render bundled markets; server proof uses backend-shaped contract fixtures for line markets | Real attach-ready Polymarket spread/totals/team-total markets are still missing for this match. Contract fixtures must be replaced when provider discovery can map them safely. |
| Server fake-token team-total order and Portfolio/history proof | `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | POST/GET/GET | Mobile API key generated for proof user | Fake-token buy order with event/market/outcome/line identity; Portfolio/history GETs after submit | order result, filled position, recent order/activity/history rows, preserved `marketType=team-total`, `line=1.5`, `period=regulation`, provider source/token markers | Existing `ApiCredential`, `Order`, `Trade`, `Position`, `UserBalance`, `Market`, `Outcome` | Mock mode keeps local ticket state; server mode uses real local order/fill routes | No new route gap for the Local MVP proof. Provider line breadth remains the active P1 gap. |

# Cycle SX - Provider Breadth Readiness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Broad World Cup provider route breadth | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public viewing | `sportKey=soccer`, `leagueKey=world_cup`, `includeMobileMarkets=1`, `limit=10` | event slug/title/type/source, market count, `marketSourceSummary`, `markets[].referenceSource`, external slug/market IDs | Existing `Event`, `Market`, `Outcome`; no migration | None needed for broad route proof | Route exposes multiple Polymarket-backed events, but most are futures/outrights rather than match line markets. |
| Local MVP match-only route guard | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public viewing | Same as above plus `mobileMvpMatches=1` | event type and market source summaries | Existing `Event`, `Market`, `Outcome`; no migration | Existing local match fixtures remain available | Provider-backed match count is still one; additional match provider imports remain future work. |
| Current-match line provider availability | Gamma `/events?slug`, Gamma `/markets?slug`, Gamma `/markets?search`; `/api/mobile/events/:slug/live-detail` | GET/read-only probe | Public provider data; public backend viewing | provider event slug `fifwc-arg-egy-2026-07-07`, manual line slug guesses, line search queries | candidate family summaries, attach-readiness counts, line market status/source summaries | Existing `Event`, `Market`, `Outcome`; no migration | Contract-shaped line fixtures stay active for Local MVP | Real attach-ready Polymarket spread/totals/team-total markets are unavailable for the current match. |

# Cycle SZ - Event Detail Social Shell Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail no-social MVP game page | Existing Event Detail and order path only: `/api/mobile/events/:slug/live-detail`, `/api/events/:slug`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST | Public viewing; mobile API key for server-mode order/Portfolio routes | Existing event slug and selected market/outcome/line identity; fake-token order body only when submitting | Existing event teams, market groups, outcome probabilities, quote/order/Portfolio/history fields | Existing `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, `UserBalance`, `ApiCredential`; no schema change | Mock mode keeps bundled event/ticket/order state | No backend support needed for removed share/watchlist shell. Real provider-backed line markets remain the active P1 backend gap. |

# Cycle TA - Search Saved Control Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search results without bookmark/watchlist controls | `/api/events` through existing Search event loading; row tap opens existing Event Detail routes afterward | GET | Public viewing | Existing search query, cursor, World Cup/source filters | Event id/slug/title/teams/start time, top outcome probability, hidden source summary markers | Existing `Event`, `Market`, `Outcome`; no schema change | Local fallback search still filters bundled event fixtures | No backend support needed for removed Search bookmark controls. A future watchlist feature should define its own route/contract before returning visible controls. |

# Cycle TB - Polymarket-First Line Readiness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/provider readiness | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Compact live line-market provider readiness | `/api/mobile/events/:slug/live-detail` shape via `selectCompactLiveMarkets()`; proof script reads local DB directly | GET/read-only proof | Public viewing for route shape; local DB access for proof script | Event slug `mobile-el-a-provider-breadth-75321796` | `markets[].referenceSource`, `externalMarketId`, `conditionId`, `outcomes[].referenceTokenId`, market type, period, line | Existing `Event`, `Market`, `Outcome`; no schema change | Contract fixtures remain allowed only when they match backend-shaped identity fields | More real attach-ready Polymarket line markets are needed for human-facing current World Cup matches. |
| Optional external line-provider enrichment | Internal review service and proof script | Dry-run/apply service, no public mobile UI route | Internal/admin proof context only | Provider review payload with market IDs, fixture IDs, sportsbook, market type, line, and every outcome identity | `referenceMetadata.lineProviderIdentity` on markets/outcomes when applied; dry-run proof does not mutate DB | Existing `Market`, `Outcome`; no schema change | If Optic Odds is unconfigured, current Polymarket parity still proceeds | External enrichment remains optional and must not be a P0 blocker while Polymarket IDs/tokens exist. |

# Cycle TC - Line Provider Unavailable Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/provider readiness | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current MVP Event Detail line provider disclosure | `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event slug `argentina-vs-egypt` | `event.marketSourceSummary.lineMarkets.providerAvailability.expectedFamilies`, `providerUnavailableFamilies`, `fixtureOnlyFamilies`, `missingFamilies`, plus existing source/count/status fields | Existing `Event`, `Market`, `Outcome`; no schema change | `mobile/src/mocks/worldCup.ts` now mirrors the same family-list shape for offline/local fixtures | Real Polymarket spread/totals/team-total markets are unavailable for the current Gamma event. |
| Provider availability proof | Polymarket Gamma `/events?slug=fifwc-arg-egy-2026-07-07`; Holiwyn `/api/mobile/events/:slug/live-detail` route handler | GET/read-only proof | Public provider data and local route access | Provider event slug and Holiwyn event slug | Gamma market family counts; Holiwyn source summary family lists | Existing `Event`, `Market`, `Outcome`; no schema change | None added | If a future Gamma/CLOB event exposes line markets, importer/normalizer must replace the fixture rows instead of leaving them marked unavailable. |

# Cycle TD - Real World Cup Line Discovery

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/provider readiness | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| World Cup line-market discovery | Polymarket Gamma `/markets`; Polymarket Gamma `/events` | GET/read-only proof | Public provider data | Search queries for spread, handicap, total goals, team total, corners, halves, correct score, and `fifwc`; event tag slugs `fifa-world-cup`, `2026-fifa-world-cup`, `soccer` | Gamma market slug/question/event title/tags/condition ID/market ID/outcomes/CLOB token IDs | No local database tables touched; no schema change | Existing Local MVP contract fixtures remain honest fallback | No attach-ready Polymarket line market candidates were found; current fixture rows cannot be replaced by real Polymarket line markets yet. |

# Cycle TE - Current MVP Full Flow Reproof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/provider readiness | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S23 Home/Live/Event Detail line-market proof | `/api/events`; `/api/mobile/events/:slug/live-detail` | GET | Public viewing | `slug=argentina-vs-egypt`, World Cup match feed params, current MVP source filters | event teams/title/status, market groups, source summaries, `expectedFamilies`, `providerUnavailableFamilies`, `fixtureOnlyFamilies`, `missingFamilies`, line market identity | Existing `Event`, `Market`, `Outcome`; no schema change | Bundled mobile fixtures remain available for local/mock mode | Real attach-ready Polymarket spread/totals/team-total markets are still missing for the current user-facing match set. |
| S23 line ticket -> fake-token order -> Portfolio History proof | `/api/markets/:marketId/quote`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history`; `scripts/seed_mobile_route_spread_counterparty.ts` | GET/POST/GET/GET plus local proof setup | Mobile API key for server-mode order/Portfolio routes | selected contract-shaped market/outcome/line/source identity; fake-token buy order body; proof user/counterparty seed | quote probability/price, order result/fill state, Portfolio positions/orders, History recent trade row with preserved line/source identity | Existing `ApiCredential`, `UserBalance`, `Order`, `Trade`, `Position`, `Market`, `Outcome`; no schema change | Mock mode uses local ticket/order state; TE uses server mode with local counterparty fill | No missing route support for the Local MVP proof path. Provider line breadth remains the open P1 gap. |

# Cycle TF - Home/Live Card Simplification

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/provider readiness | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home/Live compact match card outcome rail | `/api/events` through existing Home/Live event loading | GET | Public viewing | Existing World Cup match feed params, cursor/source filters | event id/title/teams/status/start time, selected card markets/outcomes/probabilities, source readiness markers | Existing `Event`, `Market`, `Outcome`; no schema change | Bundled mobile fixtures still drive mock/offline cards | No new backend support. The cycle removes duplicate hidden frontend controls only. |
| Full flow regression proof after card cleanup | `/api/mobile/events/:slug/live-detail`; `/api/markets/:marketId/quote`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | GET/GET/POST/GET/GET | Public viewing; mobile API key for order/Portfolio routes | Same selected market/outcome/line identity as before TF | Same quote/order/Portfolio/history fields as TE | Existing `ApiCredential`, `UserBalance`, `Order`, `Trade`, `Position`, `Market`, `Outcome`; no schema change | Mock mode unchanged | Real provider-backed line markets remain open P1. |

# Cycle TG - Event Detail Advance Strip Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/provider readiness | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail Team to Advance prediction card | `/api/mobile/events/:slug/live-detail` and existing event detail data | GET | Public viewing | Event slug and selected market/outcome identity | event teams/title/status, advance/winner market rows, outcome probabilities, source readiness markers | Existing `Event`, `Market`, `Outcome`; no schema change | Bundled mobile fixtures still render Team to Advance when present | No new backend support. The cycle removes frontend-only inline detail placeholders. |
| Full flow regression proof after Event Detail cleanup | `/api/markets/:marketId/quote`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | GET/POST/GET/GET | Mobile API key for server-mode order/Portfolio routes | Same selected market/outcome/line identity as before TG | quote probability/price, order/fill state, Portfolio/history state | Existing `ApiCredential`, `UserBalance`, `Order`, `Trade`, `Position`, `Market`, `Outcome`; no schema change | Mock mode unchanged | Real provider-backed line markets remain open P1. |

# Cycle TH - Google Auth Poly Credential Setup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio/account Google login entry | `/api/auth/google/start` | GET | Public | `returnTo=/portfolio`, `mobileReturnTo=<holiwyn or dev Expo deep link>` | Redirect only; mobile opens this URL from `Linking.openURL` | OAuth state cookies only | Demo trading can still run without Google in mock mode | None. Must reuse the same server Google Cloud OAuth client and callback configured for Poly/Holiwyn. |
| Google callback to mobile API credential | `/api/auth/google/callback` | GET | Valid Google OAuth `code` and state cookie | Google callback query; backend-owned `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL` | Deep-link params `googleAuth=success`, `forcePortfolio=1`, `forceRuntimePortfolioSync=1`, `apiKey=<Holiwyn mobile API credential>` | `User`, `Account`, `ApiCredential`; existing auth/session models | If not signed in, Local MVP can still use mock mode or a dev `EXPO_PUBLIC_API_KEY` | No schema gap. Google tokens must remain backend-only and are not a mobile data contract. |
| Mobile Google sign out | `/api/auth/mobile/logout` | POST | Bearer Holiwyn mobile API credential when available | none | `{ ok, revokedApiCredential }` | `ApiCredential` revoke/update state | Local credential is cleared even if revoke call fails | None. |

# Cycle TI - Event Detail Sticky Match Context

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail sticky match context while browsing Game Lines | Existing Event Detail data from `/api/mobile/events/:slug/live-detail` or `/api/events/:slug` | GET | Public viewing | Event slug | Existing event teams, start time/status, selected winner probabilities, market groups, line rows | Existing `Event`, `Market`, `Outcome`; no schema change | Bundled fixtures still provide the same team/probability/date fields in mock mode | None for sticky context. Provider-backed line market availability remains a separate P1 gap. |
| Full Local MVP line ticket/order/Portfolio regression path | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST/GET/GET | Mobile API key for server-mode order/Portfolio routes | Existing selected market/outcome/line identity and fake-token order body | Existing quote/order/fill/Portfolio/history fields | Existing `ApiCredential`, `UserBalance`, `Order`, `Trade`, `Position`, `Market`, `Outcome`; no schema change | Mock mode unchanged | None. |

# Cycle TJ - Provider Team Flag Normalization

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed team identity display | `/api/events`; `/api/mobile/events/:slug/live-detail` | GET | Public viewing | Event feed/detail params | `homeTeamName`, `awayTeamName`, `title` fallback | Existing `Event`; no schema change | Mock fixtures can still provide explicit `teams[].flag` values | None. Mobile derives display flags/team codes from existing provider team names. |

# Cycle TK - Portfolio Line Outcome Labels

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio History selected spread label | `/api/portfolio`; `/api/portfolio/history` | GET | Mobile API key in server mode | Existing Portfolio sync after fake-token order placement | `selection.marketType`, `selection.line`, `selection.period`, `selection.referenceOutcomeLabel`, provider source/token/outcome identity, order/trade amount fields | Existing `ApiCredential`, `Order`, `Trade`, `Position`, `Market`, `Outcome`; no schema change | Mock mode uses the same `TicketSelection` shape from local order state | None for label display. Real provider-backed World Cup line market availability remains a separate provider gap. |
| Server fake-token order feeding Portfolio labels | `/api/orders`; `/api/markets/:marketId/quote` | POST/GET | Mobile API key for order write; public/route quote | Existing selected market/outcome/line identity and amount | order fill/open status, execution price, selected market/outcome snapshot, provider token/source fields | Existing trading tables/models; no schema change | Existing contract fixtures can still produce filled Portfolio rows for internal MVP proof | No new backend support required as long as `referenceOutcomeLabel` stays attached to selections/history payloads. |

# Cycle TL - Search Filter Removal Guard

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Search without filter/sort controls | Existing Search event feed path through `loadSearchEventPage` / `/api/events` when server mode is available | GET | Public viewing | Existing query/cursor/limit params | event id/title/teams/start time, top market/outcome, `marketSourceSummary` hidden audit fields | Existing `Event`, `Market`, `Outcome`; no schema change | Local fallback search still filters bundled events by query text | None for Local MVP Search. Saved/watchlist/filter facets remain out of scope until a dedicated backend contract exists. |

# Cycle TM - Search Populated Result Navigation

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Populated Search row navigation | `/api/events` through `loadSearchEventPage` when server market-data mode is active | GET | Public viewing | Search feed params with blank query, limit, cursor, source, `includeMobileMarkets=1` | event id/slug/title, team names, start/status, mobile markets/outcomes, source summary | Existing `Event`, `Market`, `Outcome`; no schema change | Mock mode uses bundled World Cup events; server Search keeps route-backed rows visible if quote decoration is unavailable | None for Search navigation. A populated proof requires the local backend to return at least one World Cup event. |

# Cycle TO - Trade Ticket Armed Swipe Copy

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket armed swipe threshold copy | Existing ticket data from Event Detail plus `/api/markets/:marketId/quote` when server mode is active | GET before submit | Public/route quote where available | Existing selected `marketId`, `outcomeId`, side, amount, line identity | outcome probability, best bid/ask where available, balance display, existing selected market/outcome/line metadata | Existing `Market`, `Outcome`; no schema change | Mock mode uses the same `TicketSelection` shape and local quote fallback | None. This is a visible interaction-state improvement only. |
| Trade Ticket submit after armed release | `/api/orders` | POST | Mobile API key in server mode | Existing fake-token order payload with `marketId`, `outcomeId`, side, price, size, `selection` | existing order result consumed by current order/Portfolio sync flow | Existing `ApiCredential`, `Order`, `Trade`, `Position`, `Market`, `Outcome`; no schema change | Mock mode keeps local order placement | None. Backend/order logic was intentionally unchanged. |

# Cycle TP - Ticket Submit To Portfolio Reproof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Full Local MVP line trade proof | `/api/events`; `/api/mobile/events/:slug/live-detail`; `/api/markets/:marketId/quote`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | GET/GET/GET/POST/GET/GET | Public viewing; mobile API key for order and Portfolio routes | Current match slug, selected spread line/outcome, fake-token order body, seeded counterparty setup for local fill | event/market/outcome identity, line readiness/source disclosure, quote price, order/fill result, Portfolio History row with selected line/source identity | Existing `ApiCredential`, `UserBalance`, `Order`, `Trade`, `Position`, `Market`, `Outcome`; no schema change | Mock mode unchanged; TP used server mode with local seeded counterparty | No new route gap for the Local MVP flow. Real provider-backed line-market breadth remains open. |

# Cycle TQ - Remove Dormant Cashout Sheet

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cashout/close position through generic Sell ticket | `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | POST/GET/GET | Mobile API key in server mode | Existing Sell order payload generated from selected position identity, amount/size, price, and selection metadata | order/fill status, Portfolio position/order state, History sold row preserving selected market/outcome/source identity | Existing `ApiCredential`, `Order`, `Trade`, `Position`, `Market`, `Outcome`; no schema change | Mock mode uses the same generic Trade Ticket local state path | None for this cleanup. The removed dedicated sheet had no separate backend route. |

# Cycle TR - Google Auth Tracker Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio/account Google login entry | `/api/auth/google/start` | GET | Public | `returnTo=/portfolio`, `mobileReturnTo=<holiwyn://auth/google or allowed non-production Expo return>` | Redirect target only; mobile opens the route from `Linking.openURL` | OAuth state/mode/return cookies | Local MVP can still use mock mode or a development Holiwyn API key without Google consent | None. This must continue reusing the existing Poly/Holiwyn backend Google Cloud OAuth client. |
| Google callback to mobile API credential | `/api/auth/google/callback` | GET | Google OAuth code and valid state cookie | Google callback query; backend-owned `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL` | Mobile deep-link params `googleAuth=success`, `forcePortfolio=1`, `forceRuntimePortfolioSync=1`, `apiKey=<Holiwyn mobile API credential>` | Existing `User`, `Account`, `ApiCredential`; no schema change | The S23 proof harness can use a generated backend-shaped credential for non-consent proof | No route/schema gap. Google tokens remain backend-only and are not a mobile data contract. |
| Mobile credential persistence/logout | `/api/auth/mobile/logout`; `/api/profile/summary`; `/api/portfolio`; `/api/portfolio/history` | POST/GET/GET/GET | Bearer Holiwyn mobile API credential after successful return | logout has no body; profile/Portfolio routes use existing server-mode requests | connected profile/Portfolio state, logout revoke result, Portfolio/history rows under authenticated identity | Existing `ApiCredential`, `User`, `Order`, `Trade`, `Position`; no schema change | SecureStore fallback migrates and clears legacy AsyncStorage key data where native secure storage is unavailable | None for Local MVP. Real manual Google consent proof remains a testing/setup gap, not a schema gap. |

# Cycle TU - History Display Contract Tracker Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio History canonical event/market context | `/api/portfolio/history` | GET | Mobile API key for app proof; session user for web route use | Auth header only | `market.displayTitle`, `market.eventTitle`, `market.eventSlug`, market/outcome identity, trade/order timestamps, amount/proceeds fields | Existing `User`, `ApiCredential`, `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, `LedgerEntry`; no schema change | Older/offline payloads without `displayTitle` still use mobile fallback title parsing | None for Local MVP readable History display. Cycle TU only corrects stale docs/tracker rows after Cycle RS. |

# Cycle TV - Ticket Submit Reproof Tracker Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Full Local MVP ticket submit to Portfolio History proof | `/api/events`; `/api/mobile/events/:slug/live-detail`; `/api/markets/:marketId/quote`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | GET/GET/GET/POST/GET/GET | Public viewing; mobile API key for order and Portfolio routes | Current match slug, selected line market/outcome, fake-token order body, seeded counterparty setup for local fill | event/market/outcome/line identity, quote price, order fill result, Portfolio/history row with selected line/source identity | Existing `ApiCredential`, `UserBalance`, `Order`, `Trade`, `Position`, `Market`, `Outcome`; no schema change | Mock mode unchanged; Cycle TP proof used server mode with local seeded counterparty | No route gap for the Local MVP submit-to-history path. Real provider-backed line-market breadth remains open. |

# Cycle TW - Provider Line Source Reprobe

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/provider readiness | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current MVP match provider-line availability | `/api/mobile/events/argentina-vs-egypt/live-detail`; Polymarket Gamma `/events?slug=fifwc-arg-egy-2026-07-07`; Gamma `/markets?search`; Gamma `/markets?slug` | GET | Public route/proof read; local DB required for Holiwyn route read | `eventSlug=argentina-vs-egypt`, `providerEventSlug=fifwc-arg-egy-2026-07-07`, generated line-target queries and exact slug guesses | Regulation Winner provider source/status, line-market provider availability, expected families, provider-unavailable families, fixture-only families, missing families, Gamma family counts, attach-ready candidate counts | Existing `Event`, `Market`, `Outcome`; no schema change | Local MVP keeps contract-shaped Spread/Totals/Team Total fixtures when provider line candidates are unavailable | Real provider-backed Spread/Totals/Team Total current-match line markets are still missing from Polymarket Gamma. Use fixtures honestly or configure/review an approved secondary provider source. |

# Cycle TX - Realized P/L Tracker Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio History recent trade proceeds and realized P/L | `/api/portfolio/history` | GET | Mobile API key or session user | Auth header only | recent trade `side`, `cost`, `fee`, `shares`, `proceedsTokens`, `realizedPnlTokens`, market/outcome/selection identity | Existing `User`, `ApiCredential`, `Market`, `Outcome`, `Order`, `Trade`, `Position`; no schema change | Older/offline payloads without `realizedPnlTokens` keep `realizedPnl` absent/null | None for reconstructable fake-token trade history. If historical basis is incomplete, backend intentionally returns `realizedPnlTokens: null` rather than guessing. |

# Cycle TY - Google Login Poly Setup Alignment

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio/account Google login setup | `/api/auth/google/start` | GET | Public | `returnTo=/portfolio`, `mobileReturnTo=<holiwyn://auth/google or allowed dev Expo return>` | Redirect only; mobile opens this URL with `Linking.openURL` | OAuth state/mode/return cookies | Local MVP can still run in mock mode or server mode with a development Holiwyn API key | None. Must reuse the same backend Google Cloud OAuth client already used by Poly/Holiwyn. |
| Backend Google callback to Holiwyn mobile API credential | `/api/auth/google/callback` | GET | Valid Google OAuth code/state cookie | Backend-owned `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`, Google callback query params | Mobile deep-link params `googleAuth=success`, `forcePortfolio=1`, `forceRuntimePortfolioSync=1`, `apiKey=<Holiwyn API key>` | Existing `User`, `Account`, `ApiCredential`; no schema change | Proof harness may use generated backend-shaped credentials for non-consent regression proof | No route/schema gap. Google access/refresh tokens are not a mobile API contract and must stay backend-only. |

# Cycle TZ - Approved Line Provider Source Summary

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail line-market source summary | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile event browse | Event slug | `markets[].approvedLineProviderReady`, `marketSourceSummary.lineMarkets.approvedLineProviderCount`, `providerAvailability.approvedLineProviderMarketCount`, provider-backed/fixture family lists | Existing `Event`, `Market`, `Outcome` `referenceMetadata.lineProviderIdentity`; no migration | Existing contract fixtures stay fixture-only unless reviewed provider identity exists on market and every outcome | Real approved provider identities for current-match Spread/Totals/Team Total rows are still not attached. |

# Cycle UA - Mobile Approved Line Provider Markers

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail approved line-provider audit markers | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile event browse | Event slug | `marketSourceSummary.lineMarkets.approvedLineProviderCount`, `providerAvailability.approvedLineProviderMarketCount`, `familyReadiness[].approvedLineProviderCount` | Existing `Event`, `Market`, `Outcome`; no schema change | Mock route data includes zero approved-provider counts to mirror current backend fixture state | Real approved provider identities still need to be attached before counts become nonzero. |

# Cycle UB - Approved Line Provider Source Copy

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail source copy for approved-provider lines | `/api/mobile/events/:slug/live-detail` | GET | Public/mobile event browse | Event slug | `marketSourceSummary.lineMarkets.approvedLineProviderCount`, `providerAvailability.approvedLineProviderMarketCount`, `providerAvailability.providerBackedLineMarketCount` | Existing `Event`, `Market`, `Outcome`; no schema change | Mock route data keeps approved-provider counts at zero, so normal mock copy remains fixture/Holiwyn line copy | Real approved provider identities still need to be attached before this path appears on device. |

# Cycle UC - Google Login Poly Credential Hardening

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio/account Google login start | `/api/auth/google/start` | GET | Public | `returnTo=/portfolio`, `mobileReturnTo=<holiwyn://auth/google or allowed dev Expo return>` | Redirect only; mobile opens the backend URL with `Linking.openURL` | OAuth state/mode/return cookies | Local MVP can still run with a dev Holiwyn API key when Google consent is not being tested | None. This continues using the same backend Google Cloud OAuth client as Poly/Holiwyn web. |
| Google callback to Holiwyn mobile credential | `/api/auth/google/callback` | GET | Valid Google OAuth code and state cookie | Backend-owned `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`, Google callback query params | Mobile deep-link params `googleAuth=success`, `forcePortfolio=1`, `forceRuntimePortfolioSync=1`, `holiwynApiKey=<Holiwyn API key>`, plus compatibility `apiKey=<Holiwyn API key>` | Existing `User`, `Account`, `ApiCredential`; no schema change | Proof harness may use generated backend-shaped credentials for non-consent regression proof | No route/schema gap. Google access/refresh tokens are backend-only and are not a mobile data contract. |

# Cycle UD - Local MVP Game Tracker Realignment

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail Local MVP tracker/proof contract | Existing `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | Existing GET/POST flow | Public event browse; mobile API key for order/Portfolio routes | No route request changed | No response fields changed | No schema change | Existing contract fixtures remain for current-match line rows when no provider-backed line identity exists | None for this documentation/proof-contract cycle. Real provider-backed line breadth remains the open P1. |

# Cycle UE - Unavailable Trade Ticket Readonly State

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket unavailable/blocked state | Existing Event Detail payload from `/api/mobile/events/:slug/live-detail` or mock event data; order route intentionally not called when blocked | GET for event/detail only | Public event browse; no order auth needed because submit remains disabled | No request body changed | `market.availability.status`, `market.availability.marketStatus`, selected market/outcome/line/source identity | Existing `Event`, `Market`, `Outcome`; no schema change | Mock/server-shaped events can set `availability.status` to `suspended` or `unavailable` for proof | No route gap for read-only ticket behavior. A device proof fixture/deep link for unavailable markets remains useful. |

# Cycle UF - Unavailable Ticket Proof Fixture

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Unavailable Trade Ticket proof deep link | None beyond app launch/deep link | N/A | None | `forceUnavailableTradeTicket=1` launch URL param | Local proof fixture sets `market.availability.status="unavailable"`, `marketStatus="PROOF_UNAVAILABLE"`, and selected market/outcome/line identity | No database model implied | Uses bundled World Cup event/market data plus route-shaped availability fields | None for fixture setup. Device proof still needs an attached Android device. |

# Cycle VX - Unavailable Ticket S23 Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S23 proof for unavailable Trade Ticket | None beyond app launch/deep link; no order route is called | N/A | None | `forceResetState=1&forceUnavailableTradeTicket=1` launch URL params | Existing `market.availability.status`, `market.availability.marketStatus`, selected market/outcome/line/source identity, and disabled ticket controls | No database model implied | Cycle UF proof fixture supplies route-shaped unavailable market data | None for this proof. Real provider-backed unavailable states should use the same availability fields. |

# Cycle VY - Dynamic Provider Line Probes

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider line breadth scan | Polymarket Gamma `/markets` and `/events`; no Holiwyn route changed | GET | Public provider data | Search queries, tag slugs, event-specific queries, exact slug guesses where real `fifwc-...date` slugs are known | Provider slug, question, event title, family classification, active/closed/archived/acceptingOrders, condition id, market id, outcomes, CLOB token ids, bid/ask/liquidity | No database model implied; read-only proof | Current mobile fixture titles generate additional provider search probes only | Real provider-backed current-match Spread/Totals/Team Total rows remain missing from scanned Gamma data. |

# Cycle UG - Chart-Free MVP Doc Alignment

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail chart-free Local MVP criteria | Existing `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | Existing GET/POST retail flow | Public event browse; mobile API key for order/Portfolio routes | No request changed | Event teams, current outcome probabilities, Game Lines market/outcome/line identity, quote/order/Portfolio fields | Existing `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, `UserBalance`, `ApiCredential`; no schema change | Mock/offline path unchanged. Bundled fixtures still provide probability/outcome and Game Lines rows. | None for chart-free MVP. `/api/markets/:id/chart` and chart-history rows can remain internal/future, but are not required by the current mobile market page. |

# Cycle UH - Partial Provider Line Readiness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail line-market readiness summary | `/api/mobile/events/:slug/live-detail`; `/api/events?includeMobileMarkets=1` summary path | GET | Public event browse | Event slug or event-list query | `marketSourceSummary.lineMarkets.status`, `providerAvailability.status`, `providerBackedFamilies`, `fixtureOnlyFamilies`, `missingFamilies`, `nextProviderAction`, `familyReadiness[]` | Existing `Event`, `Market`, `Outcome`; no schema change | Existing fixture lines stay `contract-fixture`. Mixed provider/fixture state now returns `partial-provider-backed`, not full `provider-backed`. | Real provider-backed rows for every expected MVP line family: Spread, Total, Team Total. |

# Cycle UI - Provider Line Breadth Event-Specific Scan

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider line discovery proof | Polymarket Gamma `/markets?search`, `/markets?slug`, `/events?tag_slug` | GET | Public provider data | Generic World Cup line queries, event-specific current-match queries, exact slug guesses | Proof-only counts for raw source hits, raw line-family hits, provider line candidates, attach-ready line candidates | None; read-only provider proof | Existing contract-fixture line rows remain the honest Local MVP fallback | Public Polymarket Gamma did not return attach-ready Spread/Totals/Team Total line markets for the checked current event probes. |

# Cycle UJ - Disable Default Orderbook Depth Fetch

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail quote/probability display | `/api/quotes` / existing quote route through `loadMarketQuotesById` | GET | Public market browse or configured mobile API key depending backend mode | selected event market ids | quote probability/price fields used by ticket display | Existing market/outcome quote models | Local mock/event fixtures still provide probabilities | None for this cycle. |
| Event Detail order-book depth | `/api/orderbook/:marketId/book` | GET | Public/internal route depending backend mode | market id, max levels | Not consumed by default Local MVP UI after this cycle | Existing orderbook infrastructure only | Debug-only if `EXPO_PUBLIC_SHOW_ORDERBOOK=1` | Not a Local MVP blocker; keep hidden/internal unless explicitly approved. |

# Cycle UK - Local MVP Route Baseline Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home World Cup match feed | `/api/events` | GET | Public event browse | `sportKey=soccer`, `leagueKey=world_cup`, `includeMobileMarkets=1`, `mobileMvpMatches=1`, `limit=10` | event slug/title/type/status, market count, `marketSourceSummary` | Existing `Event`, `Market`, `Outcome` | Mock Home feed still exists for offline mode | None for match-only feed baseline; proof returned 7 match events and 0 futures. |
| Event Detail Local MVP market readiness | `/api/mobile/events/:slug/live-detail` | GET | Public event browse | selected event slug `argentina-vs-egypt` | market groups, outcomes, `marketSourceSummary.regulationWinner`, `marketSourceSummary.lineMarkets`, `providerAvailability` | Existing `Event`, `Market`, `Outcome`, provider reference fields | Contract-fixture line markets remain the fallback for line-ticket proof | Real provider-backed Spread/Totals/Team Total line rows remain unavailable. |

# Cycle UL - Local MVP Order To Portfolio History Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Line ticket order submit | `/api/orders` | POST | `orders:write` mobile API credential | `marketId`, `outcomeId`, `side=BUY`, `contractSide=YES`, `price`, `size`, `selection` with market/outcome/line/source/token identity | order id/status/side/price/size/remaining and echoed `selection` | Existing `Order`, `Trade`, `Position`, `Market`, `Outcome`, `ApiCredential`, `UserBalance` | Mobile mock mode still exists, but this proof uses server route mode | None for contract-fixture line lifecycle; real provider-backed line ids remain unavailable. |
| Portfolio position after fill | `/api/portfolio` | GET | `account:read` mobile API credential | bearer token | positions and `selectionSourceSummary.positions.lineMarkets.status` | Existing `Position`/trade-derived portfolio state | Local portfolio storage exists for mock mode | None for filled position identity. |
| Portfolio history after fill | `/api/portfolio/history` | GET | `account:read` mobile API credential | bearer token | `recentTrades[]`, `selection`, `selectionSourceSummary.recentTrades.lineMarkets.status` | Existing `Trade`, `Order`, `Market`, `Outcome` | Local activity list exists for mock mode | None for recent-trade identity. |

# Cycle UM - Remove Market Page Chart Harness Debt

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail chart-free Local MVP surface | Existing Event Detail routes such as `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/quotes`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | Existing GET/POST retail flow | Public browse; mobile API credential for order/Portfolio routes | No request changed | Event teams, outcome probabilities, Game Lines, line/outcome identity, ticket/order/Portfolio fields | Existing `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`; no schema change | Local/mock Event Detail remains chart-free in default MVP mode | None. Chart-history fields may remain internal/future data, but are not required by the market page. |

# Cycle UN - Event Detail Chinese Source Copy

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail localized source copy | `/api/mobile/events/:slug/live-detail` | GET | Public event browse | selected event slug | Existing `marketSourceSummary.lineMarkets.status`, `marketSourceSummary.regulationWinner.status`, and provider availability counts/families | Existing `Event`, `Market`, `Outcome`; no schema change | Mock/server fixtures with the same `marketSourceSummary` shape | None for copy correction. Real provider-backed Spread/Totals/Team Total rows remain unavailable. |

# Cycle UO - Event Detail Exact Score Copy

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail Exact Score display copy | Existing Event Detail data from `/api/mobile/events/:slug/live-detail` or local fixture event | GET | Public event browse | selected event slug | Existing event/market display data only; Exact Score copy is currently local UI display text | Existing `Event`, `Market`, `Outcome`; no schema change | Existing Local MVP static Exact Score rows remain | None for copy correction. Real provider-backed Exact Score rows are not required for the Local MVP path. |

# Cycle UP - Portfolio Demo Copy Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio latest-order status display | `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | POST/GET/GET | Mobile API credential for order and account routes | Existing order submit and portfolio/history requests | Existing order status, activity action, selection/source identity | Existing `Order`, `Trade`, `Position`, `ApiCredential`; no schema change | Local mock Portfolio state still uses the same view model fields | None for copy cleanup. |

# Cycle UQ - Account Balance Copy Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account/Portfolio balance display copy | `/api/profile/summary`, `/api/account/balance`, `/api/portfolio` | GET | Mobile API credential when server mode/profile sync is enabled | Existing account/profile/Portfolio requests | Existing balance, portfolio value, open-order value, exposure, sign-in state | Existing `UserBalance`, `ApiCredential`, `Position`, `Order`; no schema change | Local balance remains available for mock/local mode | None for copy cleanup. Real deposit/withdraw remains out of Local MVP scope. |

# Cycle UR - Account Trading Copy Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account trading state display copy | `/api/profile/summary` when signed in; local runtime mode when signed out/offline | GET for profile summary | Mobile API credential when server mode/profile sync is enabled | Existing profile summary request only | Existing `tradingMode` view-model value (`mock` or `server`) | Existing `ApiCredential`/profile summary data; no schema change | Local runtime mode displays as `On this device` | None for this copy cleanup. |

# Cycle US - Chinese Source Copy Mojibake Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Event Detail / Trade Ticket Chinese source copy | Existing Event Detail data from `/api/mobile/events/:slug/live-detail` or local fixture event | GET | Public event browse | selected event slug | Existing `marketSourceSummary`, `referenceSource`, market/outcome/line/source identity | Existing `Event`, `Market`, `Outcome`; no schema change | Local fixtures keep the same source identity and readable Chinese copy | None for copy cleanup. Real provider-backed line rows remain separate P1. |

# Cycle VW - Home Copy Contract Cleanup

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home match-only feed | `/api/events` in server mode; local World Cup fixtures in mock mode | GET | Public event browse | `sportKey=soccer`, `leagueKey=world_cup`, `includeMobileMarkets=1`, `mobileMvpMatches=1`, pagination cursor/limit when server-backed | Event title, status, teams, compact markets, source summary, next cursor | Existing `Event`, `Market`, `Outcome`; no schema change | Local fixture feed still supports Home when server mode is unavailable | None for this cleanup. Search/filter copy and routes are intentionally not part of Home. Real provider-backed line rows remain separate P1. |
# Cycle VZ - Current MVP Route Reproof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home match discovery | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` | GET | Public | Query params only | `events[].slug`, `title`, `marketSourceSummary.regulationWinner.status`, `marketSourceSummary.lineMarkets.status` | `Event`, `Market`, `Outcome` | None for Home event selection. | Real provider-backed line rows remain unavailable. |
| Event Detail line selection | `/api/mobile/events/:slug/live-detail` | GET | Public | Slug path param | `event.marketSourceSummary`, `markets[].id`, `outcomes[].id`, `marketGroupId`, `marketType`, `line`, `period`, `referenceSource`, provider identity fields | `Event`, `Market`, `Outcome` | Line markets are backend-shaped contract fixtures. | Polymarket-backed Spread/Totals/Team Total ids/tokens/prices are still missing. |
| Fake-token buy submit | `/api/orders` | POST | Mobile API credential | `marketId`, `outcomeId`, `side=BUY`, `contractSide=YES`, `price`, `size`, `type=LIMIT`, `selection` | `order.status=FILLED`, `order.selection` with selected line/source/token identity | `User`, `UserBalance`, `ApiCredential`, `Order`, `Trade`, `Position` | Local proof seeds disposable maker liquidity. | Requires internal beta backend env for local MVP testing. |
| Portfolio position proof | `/api/portfolio` | GET | Mobile API credential | Authorization header | `positions[].selection`, `selectionSourceSummary.positions.lineMarkets.status` | `Position`, `Trade`, `Market`, `Outcome` | None. | Provider-backed line summary remains unavailable until real line markets exist. |
| Portfolio History proof | `/api/portfolio/history` | GET | Mobile API credential | Authorization header | `recentTrades[].selection`, `selectionSourceSummary.recentTrades.lineMarkets.status` | `Trade`, `Order`, `Market`, `Outcome` | None. | Same provider-backed line-market gap. |
# Cycle WA - Unavailable Order Server Guard

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Unavailable Trade Ticket submit protection | `/api/orders` | POST | Mobile API credential plus internal trading beta gate | Normal order body with `marketId`, `outcomeId`, `side`, `type`, `price`, `size`, and optional `selection` | `error.code=MARKET_UNAVAILABLE`, `error.message`, status `409` | `Market.status`, `Market.isCanceled`, `Market.isListed`, `Outcome.isActive`, `Outcome.isTradable`, `Outcome.status`, `ApiOrderRequest`; no `Order` row should be created | S23 proof uses deterministic unavailable-ticket fixture for visible disabled UI only. Backend guard uses persisted market/outcome status. | Broader provider unavailable examples can be added when real Polymarket-backed unavailable line rows exist. |

# Cycle WB - Portfolio History Selection Snapshots

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio History recent trade identity | `/api/portfolio/history` | GET | Mobile API credential with `account:read` when called from mobile server mode; session user otherwise | Authorization header only | `recentTrades[].selection.marketId`, `outcomeId`, `marketGroupId`, `marketType`, `line`, `period`, `displayLabel`, provider/source ids, token id, and `selectionSourceSummary.recentTrades` | Existing `Trade`, `Order`, `ApiOrderRequest`, `Market`, `Outcome`; no schema change | Local/mock Portfolio history remains available outside server mode | Direct immutable `Trade.orderId` or trade-level selection snapshot is still a future schema improvement. Current MVP uses time-aware `ApiOrderRequest` lookup. |

# Cycle WC - Trade-Level Selection Snapshot Storage

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trade Ticket submit into durable Portfolio History | `/api/orders`; `/api/portfolio/history` | POST then GET | Mobile API credential with `orders:write` then `account:read` | Order body includes `marketId`, `outcomeId`, `side`, `type`, `price`/`size`, optional `contractSide`, and sanitized `selection` | Order response still echoes `order.selection`; History consumes `recentTrades[].selection`, now sourced from `Trade.selectionSnapshot` when present | `Order`, `ApiOrderRequest`, `Fill`, `Trade.orderId`, `Trade.selectionSnapshot`, `Position`, `Market`, `Outcome` | Mock mode unchanged; older server rows without `selectionSnapshot` still use Cycle WB temporal fallback | Optional future backfill for pre-WC historical trades. |

# Cycle WD - Portfolio Position Selection Snapshots

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio Position identity and cashout/sell entry | `/api/portfolio` | GET | Mobile API credential with `account:read` when called from mobile server mode; session user otherwise | Authorization header only | `positions[].selection.marketId`, `outcomeId`, `marketType`, `line`, `period`, `displayLabel`, `referenceSource`, provider/source ids, token id, `selectionSourceSummary.positions`, and quote fields used for cashout | `Position`, `Trade.selectionSnapshot`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | Mock mode unchanged; server positions without `Trade.selectionSnapshot` still use order-request fallback | Optional future backfill for pre-WD positions/trades without direct snapshots. |

# Batch Provider Runtime Readiness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-backed market readiness gate | No mobile route changed. Runtime proof uses `scripts/check_poly_internal_exchange_readiness.ts` and provider refresh uses Polymarket-backed reference snapshot infrastructure. | Script/readiness check | Local DB access; public Polymarket reference data for refresh | Optional `--eventSlug`, `--summaryPath`, stale/readiness thresholds | `providerMarkets.samples[].snapshotBlockers`, `snapshotQualityStatus`, `snapshotReason`, `snapshotBestBid`, `snapshotBestAsk`, `snapshotAcceptingOrders`, `snapshotMmEligible`, `snapshotBlockerSummary` | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, provider reference metadata | Local MVP mobile line markets remain contract-shaped fixtures when provider line data is unavailable. | Need another match-only provider event/market with accepting-order, non-edge Polymarket books before local-MM-ready provider testing can pass. |

# Batch Provider Match Breadth

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| World Cup match-only provider breadth audit | Polymarket Gamma `/events` through `scripts/scan_polymarket_worldcup_match_events.ts` | GET | Public provider data | `tag_slug`, exact `slug`, `active`, `closed`, `archived`, `limit` | Provider event slug/title/tags, market slug/question, accepting order state, best bid/ask, spread, CLOB token count, rejection reasons | None; read-only scan with no DB writes | Local MVP line markets remain contract-shaped fixtures when provider match books are unavailable. | Current scanned World Cup team-match events are closed/not accepting orders. Need future provider match events with usable books before importing more match breadth. |

# Batch Provider Visible Tradable Flow Guard

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Odds API no-quota replay audit preservation | No route changed. Replay seeds `odds-api-single-soccer-test` from `event-odds.redacted.json`, reads `available-markets.redacted.json`, and links existing ODDSAPIS23 proof evidence. Underlying proof still exercises `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history`. | Local script plus underlying proof route coverage GET/POST | Replay artifact read needs no auth; underlying proof uses public browse plus generated mobile API credential for order, Portfolio, and history routes | `--fromRedactedOdds=docs/mobile/harness/the-odds-api-single-event/event-odds.redacted.json` | Available/selected/imported market keys, sportsbook market/outcome counts, S23 proof path/model/device, backend fake-token flow identity fields | No schema change. Underlying replay writes/reads `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | Replay avoids spending provider quota and uses the already redacted live provider fixture | Real Polymarket-backed World Cup match/line markets with accepting CLOB books remain the provider parity gap. |
| Provider-backed match tradable proof guard | `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` through `scripts/prove_mobile_provider_visible_tradable_flow.ts` | GET/POST when proof reaches submit | Public browse plus mobile API credential for order/Portfolio routes | Default event slug `argentina-vs-egypt`; optional `--marketId`; optional `--allowNonMvpProviderEvent` only for explicit non-MVP futures audit | Provider event/market/outcome ids, `referenceSource=polymarket`, external slug/market id, condition id, reference token id, latest snapshot bid/ask/quality/accepting-orders/MM eligibility, quote availability, order status, Portfolio/history identity if fill proof succeeds | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | None added. Contract-fixture line flow remains the Local MVP fallback for internal testing. | Current provider match snapshot/book is not safe for local-MM seeding, so the proof writes `provider_mvp_match_snapshot_not_mm_safe`. Need safe provider snapshot/local-MM readiness before provider-backed match fill proof can pass. |
| Provider snapshot refresh before readiness | `reference:snapshot-refresh` / `scripts/refresh_reference_snapshots.ts` | Local script, public Polymarket/CLOB provider calls | Local DB access plus public provider data | `--once true`, `--eventSlug argentina-vs-egypt`, `--summaryPath docs/mobile/harness/batch-internal-readiness-latest/provider-snapshot-refresh.json` | Refresh summary and provider report with refreshed/skipped markets, outcome snapshot quality, best bid/ask, accepting-orders, MM eligibility, and reason fields | `ReferenceQuoteSnapshot`, `Market`, `Outcome` | None. Local MVP fixture-line proof remains separate. | Refreshing cannot make a closed/missing/invalid provider book tradable; it only prevents stale snapshots from being mistaken as the primary blocker. |
| Google LAN callback preflight | `/api/auth/google/start` through `scripts/mobile_google_lan_auth_preflight.ps1` and `mobile/scripts/google-auth-runtime-preflight.ps1` | GET no-redirect probe | Public auth start route; server uses Google OAuth env | LAN-derived `BackendAuthBase`, LAN-derived `NEXTAUTH_URL`, mobile return URL | Redacted summary fields: expected callback, observed Google redirect URI, redirect origin/path/match booleans, failed check names | No DB model required for preflight; real callback later touches auth/session/user/API credential flow | None. This is setup proof only. | Real S23 consent still needs backend started with the LAN/hosted `NEXTAUTH_URL` and that exact callback registered in Google Cloud. |
| Google S23 callback readiness precedence | `/api/auth/google/start` through consolidated batch `npm run mobile:internal-readiness-batch` | GET no-redirect probes | Public auth start route; server uses Google OAuth env | Localhost probe plus LAN-derived callback probe | Batch blocker summary treats passing LAN callback proof as authoritative for S23 consent, while preserving localhost probe diagnostics in raw JSON | No DB model required for preflight; real callback later touches auth/session/user/API credential flow | Local MVP fake-token trading remains available without Google consent | The LAN/hosted callback must still be registered in Google Cloud before real consent proof. |
| Local MVP match breadth seed | `npm run mobile:mvp-local-match-breadth`; consumed by `/api/events?...includeMobileMarkets=1&mobileMvpMatches=1` and `/api/mobile/events/:slug/live-detail` | Local script plus route reads | Local developer/runtime only; refuses production | Seed specs for World Cup match fixtures, teams, lines, outcomes, and contract quote snapshots | Summary fields: `pass`, `before.eventCount`, `after.eventCount`, seeded event/market/outcome counts | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` with `source/referenceSource=contract-fixture` | Creates deterministic fake-token route data when provider match books/line markets are unavailable | Must never be presented as Polymarket-backed provider parity. Provider-backed P1 debt remains tracked separately. |
| Home Local MVP match feed | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1` | `GET` | None for read; optional mobile API key not required | `limit`, optional `cursor`, optional `status`; no default `source` filter from Home | `events[]`, `page`, `marketSourceSummary`, compact `markets[]` | `Event`, `Market`, `Outcome`, source may be `polymarket` or `contract-fixture` | If backend unavailable, mobile falls back to bundled local demo events | Home remains match-only through `mobileMvpMatches=1`; source disclosure must distinguish provider-backed rows from contract-fixture rows. |

# Cycle XG - Full Local MVP S23 Flow Reproof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live source-readiness marker | `/api/events?...mobileMvpMatches=1` data already loaded into mobile event feed | GET | None for browse | `sportKey=soccer`, `leagueKey=world_cup`, `includeMobileMarkets=1`, `mobileMvpMatches=1`, optional live/status filtering | `events[].marketSourceSummary.regulationWinner.status`, `events[].marketSourceSummary.lineMarkets.status`, line-market families | `Event`, `Market`, `Outcome` | Local MVP live cards may be `contract-fixture` rows with fake-token source disclosure | Real provider-backed live match books remain unavailable/closed in the current batch. |
| Full Local MVP order journey | `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST/GET/GET | Mobile API credential for order/Portfolio routes | Event slug; order body with selected `marketId`, `outcomeId`, line/side/price/size selection | Event markets/outcomes/source summary; order status; Portfolio position/history selection fields | `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | S23 proof seeds disposable maker liquidity for a filled fake-token contract-fixture spread order | Provider-backed Polymarket line-market order proof remains P1 until attach-ready provider line rows and safe books exist. |

# Cycle XH - Open Order Cancel S23 Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Open order creation and cancellation | `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, `/api/orders/:id`, `/api/portfolio/history` | GET/POST/GET/DELETE or cancel route/GET | Mobile API credential for order, Portfolio, cancel, and history routes | Selected line-market order body; cancel order id from Portfolio open-order row | `openOrders[]`, `orders[].selection`, `cancel-open-order-*`, `portfolio-open-order-count`, `recentTrades[]` canceled activity and selection/source fields | `Event`, `Market`, `Outcome`, `Order`, `ApiOrderRequest`, `Trade`/activity projection, `ApiCredential`, `UserBalance` | Harness cleans disposable local maker liquidity so the buy order rests open, then cancels it | Provider-backed open-order cancel proof remains blocked until provider-backed match/line books are locally tradable. |

# Cycle XI - Position Cashout/Sell S23 Reproof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Position cashout/sell lifecycle | `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST/GET/GET | Mobile API credential for order, Portfolio, and history routes | Selected spread line buy order, followed by Sell ticket order from the Portfolio position using the same market/outcome/line identity | Event line market identity, order status, `positions[].selection`, `portfolio-position-cash-out-*`, sell ticket state, `recentTrades[]` sold activity, `portfolio-line-1.5`, `portfolio-provider-source-contract-fixture` | `Event`, `Market`, `Outcome`, `Order`, `ApiOrderRequest`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | Harness seeds disposable local maker ask for buy fill and maker bid for cashout/sell fill | Provider-backed position sell/cashout proof remains blocked until provider-backed World Cup match/line books are safe for local fake-token trading. |

# Batch Provider FIFA/Soccer Match Filter

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider World Cup match breadth gate | Polymarket Gamma `/events` through `scripts/scan_polymarket_worldcup_match_events.ts` | GET | Public provider data | `tag_slug`, exact `slug`, `active`, `closed`, `archived`, `limit`, `offset` | Provider event slug/title/tags, FIFA/soccer relevance flags, excluded generic World Cup match diagnostics, market slug/question, accepting order state, best bid/ask, spread, CLOB token count, rejection reasons | None; read-only provider scan with no DB writes | Local MVP line markets remain contract-shaped fixtures while provider match books are unavailable. | Need open FIFA/soccer World Cup team-match provider books with accepting orders and non-edge prices before provider-backed match trading can be claimed. |

# Cycle ODDSAPIS23 - Temporary Sportsbook S23 Visible Flow

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Temporary sportsbook event replay seed | `npm run mobile:the-odds-api-single-event -- --fromRedactedOdds=...` | Local script | Local developer/runtime only; refuses production | Redacted Odds API event odds JSON | Event slug, sportsbook markets, outcomes, prices, source metadata | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` with `source=the-odds-api` and `referenceSource=sportsbook-odds` | Replay avoids spending provider quota during S23 proof | Still temporary and not Polymarket-backed. |
| Home match discovery | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public browse | Query params only | `events[].slug`, `title`, `marketSourceSummary`, compact market/source readiness | `Event`, `Market`, `Outcome` | If backend unavailable, mobile has local fallback fixtures | None for this temporary bridge. |
| Event Detail sportsbook line selection | `/api/mobile/events/:slug/live-detail` | GET | Public browse | Slug path param `odds-api-single-soccer-test` | `markets[].marketGroupKey`, `marketType=spread`, `line=0.5`, `outcomes[].side=home`, `referenceSource=sportsbook-odds`, provider ids/tokens | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | None during S23 proof; replayed backend data is server-backed | Provider-backed Polymarket line rows remain a separate P1 gap. |
| Fake-token buy submit | `/api/orders` | POST | Mobile API credential with order scope | Ticket submits selected market/outcome, side, limit price, size, and selection identity | Order status, selection snapshot, fill/Portfolio state | `ApiCredential`, `User`, `UserBalance`, `Order`, `Trade`, `Position`, `ApiOrderRequest` | Harness seeds disposable maker SELL liquidity for a filled BUY | None for local fake-token flow. |
| Portfolio/history confirmation | `/api/portfolio`, `/api/portfolio/history` | GET | Mobile API credential with account scope | Authorization header | `positions[]` or `openOrders[]`, `recentTrades[]`, selection source/line fields | `Position`, `Order`, `Trade`, `ApiOrderRequest`, `Market`, `Outcome` | None during proof | Full provider parity still needs Polymarket-backed line markets with safe local liquidity. |

# Cycle SPORTSBATCHGATE - Sportsbook Proof Readiness Batch Gate

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Readiness batch sportsbook S23 gate | No route changed in this cycle. The batch reads committed S23 proof artifacts generated by `npm run mobile:the-odds-api-s23-visible-flow`. That proof exercises `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/orders`, `/api/portfolio`, and `/api/portfolio/history`. | Harness aggregation; proof route coverage is GET/POST/GET/GET | Proof route coverage uses public browse plus mobile API credential for order, Portfolio, and history routes | Batch input is the proof JSON path; recovery command re-runs the S23 sportsbook proof with redacted replay data | `temporarySportsbookS23BridgeProofReady`, `s23Proofs[].name=temporary-sportsbook-filled-buy-history`, proof freshness, selected event slug, selected spread line, order status, Portfolio/history source identity | Same rows as the underlying proof: `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance` | The batch does not add new mocks. It accepts only the existing proof artifact and points to the recovery command when stale/missing. | Real Polymarket-backed World Cup match/line markets with accepting-order CLOB data remain required before provider parity can be marked complete. |

# Cycle ODDSLIVEREFRESH - The Odds API Live-Key Refresh

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live temporary sportsbook seed | The Odds API `/v4/sports`, `/v4/sports/{sportKey}/events`, `/v4/sports/{sportKey}/events/{eventId}/markets`, `/v4/sports/{sportKey}/events/{eventId}/odds` through `npm run mobile:the-odds-api-single-event` | GET provider calls plus local DB upserts | `THE_ODDS_API_KEY` from process environment only; never from files or CLI args | `sportKey=soccer_fifa_world_cup`, `regions=us`, `markets=h2h,spreads,totals,h2h_3_way,alternate_spreads,alternate_totals`, `oddsFormat=decimal` | Redacted event id/title/start time, available market keys, selected/imported market keys, normalized line values, quote prices, quota metadata | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` with `referenceSource=sportsbook-odds` | Existing redacted replay remains available for quota-free S23 refresh proof | Polymarket-backed match/line market availability is still missing and tracked separately. |
| Refreshed fake-token sportsbook order proof | `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` through `npm run mobile:the-odds-api-single-event-flow` | GET/GET/GET/POST/GET/GET | Public browse plus generated local mobile API credential for order/Portfolio/history proof | Selected `odds-api-single-soccer-test` spread market, `Argentina -0.5`, server limit buy, disposable maker liquidity | Home visibility, detail visibility, quote visibility, order filled status, Portfolio position, History trade, selected line/source/provider identity | `ApiCredential`, `User`, `UserBalance`, `Order`, `Trade`, `Position`, `ApiOrderRequest`, plus the refreshed sportsbook event rows | Disposable local maker quote only; no real-money or production behavior | Same as above: real Polymarket-backed World Cup match/line markets remain required for provider parity. |

# Cycle ODDSINTERNALUSABLE - Sportsbook Internal Usability Cashout Gate

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sportsbook event discovery | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` | GET | Public browse | Query params only | `events[].slug`, `events[].marketSourceSummary`, compact markets and source disclosure | `Event`, `Market`, `Outcome` | Mobile still has local fallback if backend is down | None for the single sportsbook bridge. |
| Sportsbook Event Detail and line adjustment | `/api/mobile/events/:slug/live-detail` | GET | Public browse | `slug=odds-api-single-soccer-test` | `markets[].marketGroupKey=spread`, `marketType=spread`, `line=0.5`, `outcomes[].side=home`, provider ids and token-like ids | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | No UI fixture used during proof; data comes from backend replay seed | Team totals not in current one-event odds payload. |
| Buy ticket submit | `/api/orders` | POST | Generated mobile API credential | `marketId`, `outcomeId`, `side=BUY`, `type=LIMIT`, price/size, and selection identity with `referenceSource=sportsbook-odds` | Filled order, fill size, selection snapshot, Portfolio position | `ApiCredential`, `User`, `UserBalance`, `Order`, `Trade`, `Position`, `ApiOrderRequest` | Harness seeds disposable maker SELL liquidity | Production bot/liquidity policy remains future work. |
| Cashout/Sell submit | `/api/orders` | POST | Same generated mobile API credential | Generic Sell ticket submits `side=SELL` for the owned market/outcome/line; backend rejects oversell and accepts within available shares | Filled sell order, sold activity, reduced Portfolio position, preserved source/line/token identity | Same as buy plus share availability from `Position` | Harness seeds disposable maker BUY liquidity | Dedicated cashout preview/proceeds route remains P2. |
| Portfolio and History reflection | `/api/portfolio`, `/api/portfolio/history` | GET | Generated mobile API credential | Authorization header only | `positions[]`, `recentTrades[]`, selected line/source/outcome/provider fields, buy and sell activity | `Position`, `Trade`, `Order`, `ApiOrderRequest`, `Market`, `Outcome` | None in server-mode proof | None for this internal bridge. |

# Cycle ODDSBATCHFRESH - Sportsbook Backend Proof Freshness Gate

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Temporary sportsbook backend proof freshness | No route changed. The batch reads `docs/mobile/harness/the-odds-api-single-event/single-event-summary.redacted.json` and `docs/mobile/harness/the-odds-api-single-event/mobile-flow-proof.redacted.json`. | Harness aggregation | None for cached artifact read; refresh commands use environment-only `THE_ODDS_API_KEY` and generated local mobile API credentials | Batch artifact paths and max-age threshold | `temporarySportsbookBackendProofReady`, `temporarySportsbookBackendProofs[]`, next-stale name/time, stale/missing P1 blocker | No schema change; evidence covers `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `Order`, `Trade`, `Position`, and `ApiOrderRequest` from the underlying proof | No new mock fallback. If stale, rerun the existing sportsbook seed and mobile flow proof. | Real Polymarket-backed match/line provider parity remains separate P1 debt. |

# Cycle NEXTACTIONSPORTSBOOK - Planner Sportsbook Backend Freshness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Autonomous next-action selection | No route changed. The planner reads committed readiness and proof JSON artifacts. | Local script read/write | None | Input paths for readiness summary, provider evidence plan, DoD sweep, sportsbook seed proof, sportsbook backend flow proof, and S23 proof | `temporarySportsbookBackendProofReady`, `temporarySportsbookBackendProofHoursUntilStale`, `status=refresh-temporary-provider-proof`, recovery commands | No schema change | None. The planner only recommends existing proof commands. | Polymarket-backed match/line provider parity remains the only incomplete provider milestone. |

# Cycle DODSPORTSBOOKFRESH - DoD Sportsbook Backend Freshness

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Definition of Done temporary sportsbook bridge audit | No route changed. The DoD sweep reads `internal-readiness-batch-summary.json`, `single-event-summary.redacted.json`, `mobile-flow-proof.redacted.json`, and the S23 visible proof. | Local script read/write | None | Committed evidence paths only | `temporarySportsbookBackendProofReady`, `temporarySportsbookBackendProofHoursUntilStale`, seed pass, mobile fake-token flow pass, S23 proof assertions | No schema change; evidence covers the same backend models as the underlying sportsbook seed/order proof | None. If stale, the planner and batch provide refresh commands. | Polymarket-backed match/line provider parity remains separate and partial. |

# Cycle S23VISIBLEMATCH - Current Visible-Match S23 Proof Recovery

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S23 Local MVP totals proof refresh | `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` through the S23 proof harness. | GET/GET/GET/POST/GET/GET | Public browse plus generated local mobile API credential for order, Portfolio, and history proof | Event slug `holiwyn-local-australia-vs-egypt`, line market group `totals`, line `2.5`, side `over`, fake-token buy amount from the ticket preset | Home card identity, line-market source markers, ticket selected line/source/outcome, order result, Portfolio position, Portfolio history selected line/source/outcome | `ApiCredential`, `User`, `UserBalance`, `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `Order`, `Trade`, `Position`, `ApiOrderRequest` | Uses existing contract-shaped Local MVP line markets and disposable maker liquidity for fake-token testing | Real Polymarket-backed World Cup match/line markets with accepting-order CLOB data remain missing and tracked as provider P1 debt. |

# Cycle ODDSENV - Repeatable Sportsbook Internal Environment

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Sportsbook replay import | `npm run mobile:odds-api-internal-env-proof` using `event-odds.redacted.json` | Local script | Local developer/runtime only; refuses production | Redacted event odds fixture, no API key, no provider request | Event slug, market keys, line values, normalized outcome identities, seed market/outcome counts | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot` | Redacted replay protects Odds API quota while preserving provider-shaped sportsbook data | Multi-event live import remains opt-in to protect quota. |
| Runtime health and device status | `/api/health`; local Docker/ADB/process checks | GET/local shell | None | Backend URL and expected S23 device id | Backend status/db state, Postgres health, S23 reachability, Expo running state, bot/process state | No database writes beyond health read | None | Continuous bot is not required for internal proof; one-shot maker liquidity is used. |
| Home/Event Detail/quote route proof | `/api/events?...mobileMvpMatches=1`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote` | GET | Public browse | `slug=odds-api-single-soccer-test`; selected sportsbook market id | Home event row, detail market row, quote rows, source/line/provider identity | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `Order` | None during proof; replayed backend data is server-backed | None for one-event internal environment. |
| Fake-token buy/cashout lifecycle | `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | POST/GET/GET | Generated mobile API credential | BUY and SELL limit orders with selected sportsbook `marketId`, `outcomeId`, `line`, `referenceSource`, `externalMarketId`, `conditionId`, and token-like id | Filled order status, Portfolio position, reduced position after sell, buy/sell history rows | `ApiCredential`, `User`, `UserBalance`, `Order`, `Trade`, `Position`, `ApiOrderRequest`, `Market`, `Outcome` | One-shot local maker ask fills Buy; one-shot local maker bid fills cashout/sell | Production local-MM bot policy remains future work. |
| Negative order guards | `/api/orders`; `/api/markets/:marketId/quote` | POST/GET | Generated mobile API credentials for order guards | Sell without position, sell more than owned, temporarily closed market buy, missing market quote | Expected 4xx API errors without crash: insufficient shares, market unavailable, missing market/provider data | Same fake-token/order tables; temporary market status is restored in `finally` | None | No new route needed unless a dedicated cashout-preview endpoint is later added. |

# Cycle SOCCERSEMANTICS - Prediction-Market Soccer Semantics

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Soccer event semantic profile | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1`, `/api/mobile/events/:slug/live-detail` | GET | Public browse | Event list query params or event slug | `event.sportKey=soccer`, `event.resultMode`, `event.primaryMarketProfile`, `event.marketProfile`, `event.gameRules`, `event.supportedMarketTypes` | Existing `Event.metadata.normalizedSoccer`; no schema migration | Mobile adapter accepts legacy `can_draw/no_draw` but prefers `can_draw_90/must_advance` when backend sends them | A provider-backed team-to-advance market is still required before a must-advance event can show top advance buttons. |
| Regulation 90-minute winner | Same event list/detail routes | GET | Public browse | Existing event selectors | `marketType=match_winner_1x2`, `marketGroupKey=regulation-winner`, Draw outcome allowed only for `resultMode=can_draw_90` regulation profile | `Market`, `Outcome` | None | If a knockout event lacks a true advance market, regulation winner stays lower in Game Lines and must not be relabeled as advance. |
| Clean line-market exposure | `/api/mobile/events/:slug/live-detail`; seed/import through `src/server/services/theOddsApiSingleEventProvider.ts` | GET/import | Public browse; provider import uses env-only API key when live | Provider market keys such as `spreads`, `alternate_spreads`, `totals`, `alternate_totals` | `markets[].mobileDisplayPolicy`, `markets[].line`, `markets[].marketType`, `markets[].referenceSource=sportsbook-odds`, `providerMarketType` in metadata | `Market.referenceMetadata`, `Outcome.referenceMetadata`, `ReferenceQuoteSnapshot` | Existing raw rows are filtered by compact selection; new imports only create mobile-visible clean lines | Quarter spreads (`0.25/0.75`) and Asian totals (`1.75/2.0/2.25`) remain hidden from the main mobile UI. |
| Fake-token trade preservation after normalization | `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history` | GET/POST/GET/GET | Public quote plus mobile API credential for order/Portfolio | Existing ticket order body with selected normalized `marketId`, `outcomeId`, `line`, `side`, provider ids/tokens | Quote, order status, Portfolio position/history, line/source/outcome identity | Existing fake-token order tables; no schema change | No new mock data added | End-to-end S23 proof still depends on current local runtime being available. |

# Cycle ONEEVENTSUPERVISOR - Repeated One-Event Local Runtime

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Repeated local runtime, hygiene, maker refresh, lifecycle scheduling, and result dry-run | `npm run mobile:one-event-live-supervisor`; child commands read `/api/health` and `/api/markets/:marketId/quote`; safe scheduler uses `runOneEventLifecycleScheduler`; optional result path runs `npm run mobile:one-event-result-ingest` and `npm run mobile:one-event-result-settlement-run` | Local command plus GET/GET | None for health/quote/scheduler/default result replay; optional provider proof requires `THE_ODDS_API_KEY` only in process env | `BackendPort`, `MaxIterations`, `IntervalSeconds`, optional `RunProviderProof`, `ProviderProofEveryIterations`, `MaxProviderProofRuns`, optional `RunResultIngestion`, optional `RunResultSettlement`, optional `SkipDataHygiene`, optional maker seed, optional `SkipLifecycleScheduler` | Backend health, Postgres health, S23 reachability, repeated runtime pass, data hygiene pass, maker bid/ask visible in quote route, provider proof run count/cadence/cap, lifecycle scheduler action, result ingestion summary, result settlement dry-run summary, selected event/market identity | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `Order`, `User`, `UserBalance`; provider mode may update sportsbook-backed snapshots; scheduler may update `Market.status`/`closeTime` and cancel open orders at event start; result settlement dry-run reads settlement models without mutation | Default cached mode spends no provider quota and uses latest stored provider snapshots plus redacted score fixture for result ingestion. Live provider proof mode is capped by run count and cadence. It does not fabricate new provider odds. Safe scheduler run uses real current time and does not mutate event start time. | Supervisor is foreground local runtime only, not an installed unattended service. Unattended result polling/execution remains P1. |
| Runtime mode/quota/status report | `npm run mobile:one-event-runtime-status`; reads `/api/health` and `/api/markets/:marketId/quote` | Local command plus GET/GET | None | `baseUrl`, `maxLiveProofAgeHours`, selected market inferred from local proof summaries | Cached-vs-live mode truth, last live proof age, last quota used/remaining, maker seed age, quote route bid/ask, scheduler action, supervisor runtime truth | Reads local summary artifacts plus route data from `Market`, `Outcome`, `Order`, `ReferenceQuoteSnapshot`; no DB mutation | No provider quota and no mock data. It reads existing summaries and local backend routes only. | This report does not install an unattended daemon and does not refresh provider data. |
| Runtime settlement-safety status | `npm run mobile:one-event-runtime-status`; reads trusted-result scheduler proof summaries | Local command | None | Existing proof artifacts `one-event-result-settlement-scheduler-execution-summary.redacted.json` and `one-event-result-settlement-scheduler-execution-live-blocked.redacted.json` | `executionRequiresMarketStatus=CLOSED`, live blocked execution reason, active tester event mutation flag, settlement guard checks | No database or schema changes. It reads proof summaries produced by settlement scheduler proof commands. | No provider quota, no mock odds, and no settlement mutation. | This surfaces guard evidence only; unattended official-result polling and active-event execution policy remain P1. |
| Local background supervisor process | `npm run mobile:one-event-live-supervisor:process`; status/stop wrappers | Local command | None; optional provider mode still requires `THE_ODDS_API_KEY` only in process env | `Action=start/status/stop`, `Continuous`, `MaxIterations`, `IntervalSeconds`, provider quota/cadence options | Process state path, pid, running state, stdout/stderr paths, supervisor digest, no-quota/provider mode truth | No direct DB mutation beyond child supervisor behavior; child supervisor may seed maker quotes, run data hygiene, and lifecycle scheduler | Default process manager mode spends no provider quota and starts the child supervisor against cached provider proof. | Local hidden process only; not an installed OS service. Official-result settlement remains P1. |

# Cycle ONEEVENTLIFECYCLESCHEDULER - One-Event Start-Time Lifecycle Scheduler

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| One-event pause/close scheduler | `npm run mobile:one-event-lifecycle-scheduler-run`; proof command `npm run mobile:one-event-lifecycle-scheduler-proof` checks `/api/health` and `POST /api/orders` rejection behavior | Local command plus optional GET/POST proof | None for safe run; generated local mobile API credential for order rejection proof | `eventSlug=odds-api-single-soccer-test`, real current time for safe run; temporary event start times only in proof; suspend-before-start threshold | Scheduler action `none/pause/close`, changed market count, canceled order count, paused/closed order rejection, restore checks | `Event.startTime`, `Market.status`, `Market.closeTime`, `Order`, `User`, `UserBalance`, `ApiCredential`; close path uses existing open-order cancellation cleanup | No provider quota and no fake provider data. Safe run does not alter event time; proof temporarily mutates event/market lifecycle state, then restores and reseeds local maker quotes. | Scheduler is local callable logic and runs inside the foreground supervisor, but it is not an installed always-on service. Official-result settlement remains manual/future. |
| One-event data hygiene guard | `npm run mobile:one-event-data-hygiene-proof` | Local command | None | `eventSlug=odds-api-single-soccer-test`, current event title prefix, `apply=true` | Listed active market count, stale visible market count, valid visible market count | `Event`, `Market.status`, `Market.isListed`, `Market.referenceSource` | No provider quota and no mock data. Stale visible rows are closed/delisted rather than rewritten. | Reusable one-event slug should become per-provider-event slugs before multi-event onboarding. |
| One-event settlement readiness | `npm run mobile:one-event-settlement-readiness`; manual/admin equivalents are `POST /api/admin/markets/:id/settlement-preview`, `POST /api/admin/markets/:id/resolve`, and `POST /api/admin/markets/resolve` | Local command plus admin POST routes for real preview/resolve | Local command needs database access only; admin routes require admin authorization | Selected event slug/market id from existing proof summaries; real admin resolve requires trusted winning `outcomeId` | Selected event/market/outcome identity, preview pass/fail, payout conservation, payout count, loser-position count, post-preview market unresolved status | `Event`, `Market`, `Outcome`, `Position`, `Order`, `UserBalance`, `LedgerEntry` | No provider quota and no mock data. The readiness command is non-mutating and never resolves the market. | Official soccer result provider and automatic result-to-resolve execution are missing. |
| One-event guarded manual settlement | `npm run mobile:one-event-settlement`; execution path uses `resolveOrderbookMarket`; admin equivalents are `POST /api/admin/markets/:id/resolve` and `POST /api/admin/markets/resolve` | Local command plus admin POST routes for real resolve | Local dry run needs database access only; execute mode requires `--execute` and exact `--confirm=SETTLE:<marketId>:<outcomeId>`; admin routes require admin authorization | `eventSlug`, optional `marketId`, `winningOutcomeId` or `winningOutcome`, optional `actorUserId`, optional execute confirmation | Dry-run/execute mode, selected market/outcome, preview payout conservation, confirmation phrase, execution result, post-market status/resolved outcome/collateral | `Event`, `Market`, `Outcome`, `Position`, `Order`, `UserBalance`, `LedgerEntry` | No provider quota and no mock data. Dry run is default and is non-mutating. Execute mode intentionally mutates only after trusted operator confirmation. | Official soccer result provider, automatic outcome mapping, and automatic resolve scheduler are missing. |
| One-event local onboarding | `npm run mobile:one-event-onboarding`; child commands cover replay/live import, `/api/health`, `/api/events`, `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history`, and settlement services | Local command plus child GET/POST/local proof commands | Public browse routes for Home/detail/quote; generated local credential for order/Portfolio proof; local DB access for settlement readiness/dry-run; live refresh requires env-only `THE_ODDS_API_KEY` | Replay fixture path by default, optional `RunProviderRefresh`, selected winning outcome for dry-run settlement, backend port | Onboarding pass/fail, command results, selected event/market, backend health, Docker/Postgres, S23 reachability, runtime status, settlement readiness, manual settlement dry-run | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `Order`, `Trade`, `Position`, `ApiCredential`, `UserBalance`, `LedgerEntry` | Default replay mode spends no provider quota and reuses redacted provider-shaped fixture. Optional live mode is explicit and quota guarded. | Multi-event onboarding, installed always-on provider/maker daemons, and automatic official-result settlement remain missing. |
| Cached one-event restore | `npm run mobile:one-event-cached-restore`; called by onboarding when the replay fixture is stale | Local command | Local developer/runtime only; refuses production | Source summary path `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json` | Restored event title/start/source/external id, relisted cached market ids/titles/lines/status, closed stale replay market count | `Event`, `Market`; no provider call and no new schema | Uses the last passing redacted live-runtime summary as cached provider evidence. It does not invent new odds and does not call The Odds API. | Live provider refresh still requires explicit `THE_ODDS_API_KEY`; reusable one-event slug should become per-provider-event slugging before multi-event runtime. |
| Stale provider trading guard | `npm run mobile:one-event-stale-guard-proof`; order rejection checked through `POST /api/orders` | Local command plus POST proof | Generated local mobile API credential for order rejection proof | Event slug, optional market id, stale threshold, forced-stale seconds | Stale snapshot timestamp, guard action `pause`, market `settlementStatus=paused_provider_stale`, order error `MARKET_UNAVAILABLE`, restore checks | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `MarketOutcomeSnapshot`, `Order`, `User`, `UserBalance`, `ApiCredential` | No provider quota and no mock odds. The proof mutates existing snapshot timestamps and market status inside a `try/finally` restore. | Guard is proven as callable local logic; it is not installed as an unattended daemon/service yet. |
| Supervisor stale-provider monitor/enforcer | `npm run mobile:one-event-stale-guard-run`; optional supervisor wrapper `npm run mobile:one-event-live-supervisor -- -RunStaleGuard [-EnforceStaleGuard]` | Local command | None for monitor/enforce DB operation | `eventSlug`, optional `marketId`, stale threshold, `--dryRun` for monitor mode | Checked market count, stale market count, `wouldPauseCount`, `pausedCount`, per-market stale/action status, supervisor stale guard mode | `Event`, `Market`, `ReferenceQuoteSnapshot`; enforcement updates `Market.status` and `Market.settlementStatus` | No provider quota and no mock odds. Dry-run mode is non-mutating and is safe for cached internal testing. | Installed always-on stale-provider service remains P1; live provider refresh must be running before enforcement is useful for tester trading. |
| One-event live-runtime phase audit | `npm run mobile:one-event-phase-audit`; reads `/api/health` and `/api/markets/:marketId/quote` plus proof summaries | Local command plus GET/GET | None | Selected market id inferred from live-runtime proof summary; optional `baseUrl` | Requirement-by-requirement P0/P1/P2 status, artifact ages, backend health, selected market quote, open P0/P1 list | Reads route data backed by `Market`, `Outcome`, `Order`, `ReferenceQuoteSnapshot`; no DB mutation | No provider quota and no mock data. This is a read-only evidence audit. | Production unattended services and official result auto-settlement remain outside the local internal P0 boundary. |
| Supervisor result-ingestion audit gate | `npm run mobile:one-event-phase-audit`; reads `one-event-continuous-supervisor-proof-summary.redacted.json`, `one-event-result-ingestion-summary.redacted.json`, and `one-event-result-settlement-run-summary.redacted.json` | Local read-only audit | None | Existing proof artifacts only | `runtimeTruth.resultIngestionWhileRunning`, `runtimeTruth.resultSettlementSchedulerWhileRunning`, `runtimeTruth.quotaProtected`, result ingestion pass, result settlement scheduler pass | No DB mutation. Evidence comes from the supervisor proof and result-ingestion/settlement summaries. | No provider quota and no new fixture. It verifies existing replay-mode result ingestion evidence. | Unattended live result polling and settlement execution remain P1. |
| Supervisor live result ingestion controls | `npm run mobile:one-event-live-supervisor -- -RunResultIngestion -RunLiveResultIngestion -RunResultSettlement`; background equivalent through `npm run mobile:one-event-live-supervisor:process -- -Action start ...` | Local command | `THE_ODDS_API_KEY` in process env only when `-RunLiveResultIngestion` is passed | `ResultIngestionEveryIterations`, `MaxLiveResultIngestionRuns`, `MaxCreditsPerResultIngestion`, `MinRemaining`; live ingestion calls The Odds API scores endpoint with the selected event id | Result-ingestion mode, live result ingestion run count, skipped reason, provider quota call summary, trusted result JSON path, trusted-result settlement dry-run summary | No new DB schema. The trusted result JSON feeds existing `Event`, `Market`, `Outcome`, `Position`, `Order`, `UserBalance`, and `LedgerEntry` settlement services only during dry-run/execute. | Default supervisor path remains replay/no-quota. Live mode is explicit and quota-capped. | Installed unattended result polling and unconfirmed active-event settlement execution remain P1. |
| Trusted result settlement intake | `npm run mobile:one-event-result-settlement`; execute path uses `resolveOrderbookMarket`; admin equivalents remain `POST /api/admin/markets/:id/settlement-preview` and `POST /api/admin/markets/:id/resolve` | Local command plus settlement services | Local dry run needs database access only; execute mode requires `--execute` and exact `--confirm=SETTLE_FROM_RESULT:<marketId>:<outcomeId>:<digest>` | Trusted result JSON with event slug/source event id/status/scores/advance team; optional market id | Event/source validation, selected market, mapped winning outcome, settlement preview, result digest confirmation phrase, post-market unresolved/resolved status | `Event`, `Market`, `Outcome`, `Position`, `Order`, `UserBalance`, `LedgerEntry` through existing settlement services | Uses a redacted trusted local result fixture for proof. It does not call a result provider and does not mutate in dry-run mode. | Official soccer result API ingestion and unattended result-to-settlement execution remain P1. |
| Active one-event settlement preflight | `npm run mobile:one-event-settlement-preflight`; child command `npm run mobile:one-event-result-settlement-run`; settlement dry-run uses `previewOrderbookSettlement` | Local command plus settlement services | Local developer/runtime only; refuses production; no provider key | Trusted result JSON path, event slug, scheduler output path, settlement dry-run output path | Final result status, selected market status, payout conservation, confirmation phrase, execution eligibility, blockers, next operator action | Reads `Event`, `Market`, `Outcome`, `Position`, `Order`, `UserBalance`, `LedgerEntry` through the dry-run settlement command; no mutation | No provider quota. It consumes reviewed trusted result JSON and dry-runs settlement only. | Current active event is not execution eligible until the market is `CLOSED`; unattended result polling and automatic execution remain P1. |
| Disposable local settlement execution proof | `npm run mobile:one-event-settlement-execution-proof`; uses `mintCompleteSetForPublicOrderbook`, `placeOrderAndMatch`, and `resolveOrderbookMarket` internally | Local command | Local developer/runtime only; refuses production | Seed, run id, initial balance, output path | Settlement execution pass/fail, payout conservation, collateral zero after settlement, finalized positions, no negative balances, no stuck locks, disposable market slug | `Market`, `Outcome`, `Order`, `Fill`, `Trade`, `Position`, `UserBalance`, `LedgerEntry` created under a fresh disposable local proof market | No provider quota, no Odds API call, and no active tester event mutation. It proves settlement mechanics only. | Active one-event settlement still requires trusted result confirmation; unattended official result polling and unconfirmed execution remain P1. |

# Cycle ONEEVENTRESULTINGEST - Provider-Shaped Result Ingestion

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-shaped result ingestion | The Odds API `/v4/sports/{sportKey}/scores` in explicit live mode; default proof reads `docs/mobile/harness/odds-api-live-runtime/odds-api-score-fixture.redacted.json`; local command `npm run mobile:one-event-result-ingest` | Provider `GET` only with `--live`; local replay otherwise | `THE_ODDS_API_KEY` in local process env only for `--live`; default replay requires no secret and spends no quota | `sportKey`, `eventId`, `daysFrom`, `dateFormat=iso`; fixture includes one completed score event | Trusted result contract fields: `source`, `sourceEventId`, `eventSlug`, `status=final`, `period=full_time`, `homeTeam`, `awayTeam`, `homeScore`, `awayScore`, `advanceTeam`, `recordedAt` | No DB writes. The output feeds the existing trusted result settlement command, which uses `Event`, `Market`, `Outcome`, `Position`, `Order`, `UserBalance`, and `LedgerEntry` only during settlement dry-run/execute. | Default replay fixture is provider-shaped and redacted. It exists only to prove the score-to-trusted-result mapping without burning quota. | Unattended live result polling and automatic unconfirmed settlement execution remain P1. |

# Cycle ONEEVENTINTERNALRUNTIME - Internal Tester Runtime Manager

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local internal tester runtime manager | `npm run mobile:internal-tester-runtime`; checks `/api/health`, backend/Expo listening ports, Docker/Postgres status, S23 `adb devices -l`, and `npm run mobile:one-event-live-supervisor:status` | Local PowerShell command plus backend `GET /api/health` | None; optional supervisor provider/live-result flags still require `THE_ODDS_API_KEY` only in process env through existing child commands | `Action=status/start/stop`, `BackendPort`, `ExpoPort`, optional `StartSupervisor`, optional result/provider flags, optional `WaitForReady` | Backend health `status/db/env`, Expo port owner, Docker/Postgres status, S23 device id/model, supervisor process summary, local control-plane truth, P0/P1/P2 gaps | No schema changes. Reads backend health only; supervisor child commands may touch existing event/market/order rows according to their own documented contracts if intentionally started. | Status mode spends no provider quota and does not fabricate data. Start mode reuses external backend/Expo listeners when present; stop mode stops only manager-owned backend/Expo processes. | Installed OS/service-manager deployment remains P1. This manager is for local internal tester launch and status only. |
| Internal tester Expo server-mode truth | `npm run mobile:internal-tester-runtime`; summary fields `expo.serverModeSource`, `expo.serverModeVerified`, `expo.externalServerModeUnverified`, and `runtimeTruth.externalExpoServerModeUnverified` | Local PowerShell command | None | Same runtime-manager params as above | Manager-owned Expo reports verified server-mode env. Reused external Expo reports `external_listener_unverified` plus a P1 warning to restart with `-Force` or stop stale Expo if S23 behavior is wrong. | No schema changes and no route mutation. | No provider quota and no app fixture. This only distinguishes proven manager-owned Expo config from reused external listener state. | Arbitrary external Expo process environment cannot be introspected; operator must restart Expo through the manager for verified server mode. |
| Verified Expo replacement startup | `npm run mobile:internal-tester-runtime -- -Action start -Force -ReplaceExternalExpo -WaitForReady`; existing mobile routes are unchanged after startup | Local PowerShell command plus backend `GET /api/health` readiness check | Local developer/runtime only; no provider key unless provider loop flags are also passed | `Force=true`, `ReplaceExternalExpo=true`, backend/expo ports, optional supervisor/result-poller flags | Runtime operations include an explicit external Expo/Metro stop result when safe, followed by manager-owned Expo server-mode env and readiness fields | No schema changes. No database writes from the process-control path. | No provider quota and no app fixture. This only replaces a stale local Expo listener with verified server-mode Expo when explicitly requested. | The external stop guard refuses to kill a listener that does not look like Expo/Metro; in that case the operator must stop the port owner manually. |

# Cycle ONEEVENTRESULTSETTLEMENTEXECUTION - Trusted Result Scheduler Execution Proof

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trusted-result settlement scheduler execution | `npm run mobile:one-event-result-settlement-execution-proof`; child command `npm run mobile:one-event-result-settlement-run`; backend services `previewOrderbookSettlement` and `resolveOrderbookMarket` | Local command plus settlement services | Local developer/runtime only; refuses production. Execution requires `--execute`, exact `SETTLE_FROM_RESULT:<marketId>:<outcomeId>:<digest>` confirmation, selected market status `CLOSED`, and `--allowTrustedLocalFixture` when using the disposable fixture result. | Disposable sportsbook-shaped soccer event, trusted final-result JSON, dry-run settlement output path, live-blocked settlement output path, execute settlement output path, scheduler output path | Dry-run confirmation phrase, live-market blocked execution reason, execute action after close, selected market/outcome, scheduler pass, settlement pass, post-settlement market status, collateral zero, open orders zero, active positions zero, active tester event mutation check | Creates disposable `Event`, `Market`, `Outcome`, `Order`, `Fill`, `Trade`, `Position`, `User`, `UserBalance`, `LedgerEntry` rows; closes then resolves only the disposable proof market; does not modify the active `odds-api-single-soccer-test` tester event | Uses a disposable trusted-local fixture result and spends no provider quota. This is proof of the scheduler execute path and closed-market guard, not live official polling. | Installed unattended official-result polling and unconfirmed active-event resolve execution remain P1. Operator UI and multi-event settlement queue remain P2. |

# Cycle ONEEVENTSETTLEMENTAUDIT - Durable Settlement Audit Event

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Trusted-result settlement canonical audit event | `npm run mobile:one-event-settlement-audit-event-proof`; child command `scripts/settle_odds_api_one_event_from_result.ts --writeAuditEvent`; backend service `emitMarketSettlementAuditEvent` | Local command plus canonical event write | Local developer/runtime only; refuses production; no provider key | Trusted result JSON, event slug, selected market/outcome inferred from existing one-event runtime, settlement dry-run output path | Canonical event id/type/topic, selected market/outcome, result digest, dry-run mode, payout conservation, active-market mutation check | `CanonicalEvent` stores `settlement.trusted_result.preflight` on the selected market topic; reads `Event`, `Market`, `Outcome`, `Position`, `Order`, `UserBalance`, `LedgerEntry` through existing dry-run settlement preview | No provider quota and no fake provider result. The proof consumes existing reviewed trusted-result evidence and does not settle the active market. | Installed official result polling, operator settlement UI, and multi-event settlement queue remain P1/P2. |

# Cycle ONEEVENTAPPROVEDAUTOSETTLEMENT - Approved Auto Settlement

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Approved trusted-result auto-settlement | `npm run mobile:one-event-approved-auto-settlement-proof`; child command `scripts/run_odds_api_one_event_result_settlement_scheduler.ts --autoExecuteApproved --approval=<path>`; backend services `previewOrderbookSettlement`, `resolveOrderbookMarket`, and `emitMarketSettlementAuditEvent` | Local command plus settlement services | Local developer/runtime only; refuses production. Approved auto-execution requires exact local approval file match and selected market status `CLOSED`. | Trusted result JSON, local approval JSON, event slug, settlement output paths, disposable market proof data | Approval match, wait action while `LIVE`, execute action after `CLOSED`, resolved market, canonical executed audit event id | Disposable proof creates `Event`, `Market`, `Outcome`, `Order`, `Fill`, `Trade`, `Position`, `User`, `UserBalance`, `LedgerEntry`, and `CanonicalEvent`; active tester event is not mutated | Uses disposable local trusted-result evidence and spends no provider quota. It proves automation policy, not live official result polling. | Installed official result polling and production operator approval UI remain P1/P2. |

# Cycle ONEEVENTLOCALTASK - Local Runtime Scheduled Task Plan

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local runtime scheduled-task manager | `npm run mobile:local-runtime-task`; planned task calls `npm run mobile:internal-tester-runtime` through `scripts/manage_holiwyn_internal_tester_runtime.ps1` | Local PowerShell command; optional Windows Scheduled Tasks registration only with `-Apply` | None in dry-run/default mode. Provider/live-result modes still require `THE_ODDS_API_KEY` only in process env if explicitly selected. | `Action=plan/status/install/uninstall`, `TaskName`, `BackendPort`, `ExpoPort`, optional `StartSupervisor`, optional result/provider flags, optional `-Apply` | Task plan, trigger plan, runtime command, log paths, before/after scheduled task status, provider quota mode, fake-token-only truth | No database or schema changes in plan/status mode. Installed task, if explicitly applied, starts the existing internal tester runtime manager which owns backend/Expo/supervisor behavior through already documented contracts. | Dry-run plan spends no provider quota and does not install anything. | Installed scheduled task remains not applied by default; production service monitoring and official-result active-event execution remain P1. |
| Scheduled-task install/uninstall permission audit | `npm run mobile:local-runtime-task:install-proof`; child commands call `npm run mobile:local-runtime-task -- -Action install -Apply` and `-- -Action uninstall -Apply` with a proof task name | Local PowerShell command plus Windows Scheduled Tasks APIs | No provider key and no backend auth. Current Windows process needs task-registration rights; proof records permission denial when absent. | Proof task name, install summary path, uninstall summary path | Install attempt result, access-denied status, uninstall cleanup result, no-persistent-task-left state, quota usage false | No database or schema changes. No backend routes called. | No provider quota and no persistent task. The proof is an environment permission audit. | Current process cannot install the scheduled task: Windows returns access denied. Apply from an elevated shell or grant task-registration rights before using the scheduled task. |

# Cycle ONEEVENTLOCALSTARTUP - User Startup Runtime Launcher Fallback

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local runtime user Startup launcher manager | `npm run mobile:local-runtime-startup`; installed launcher calls `scripts/manage_holiwyn_internal_tester_runtime.ps1` | Local PowerShell command; optional Windows Startup folder mutation only with `-Apply` | None in dry-run/default mode. Provider/live-result modes still require `THE_ODDS_API_KEY` only in the user environment if explicitly selected. | `Action=plan/status/install/uninstall`, `LauncherName`, `BackendPort`, `ExpoPort`, optional `StartSupervisor`, optional result/provider flags, optional `-Apply` | Launcher plan, Startup folder path, before/after launcher status, provider quota mode, fake-token-only truth | No database or schema changes in plan/status mode. Installed launcher, if explicitly applied, starts the existing internal tester runtime manager which owns backend/Expo/supervisor behavior through already documented contracts. | Dry-run plan spends no provider quota and does not install anything. | This is a current-user Startup fallback, not a production service or scheduled task. |
| User Startup launcher install/uninstall proof | `npm run mobile:local-runtime-startup:install-proof`; child commands call startup manager install/uninstall with a proof launcher name | Local PowerShell command plus current-user Windows Startup folder file write/remove | No provider key and no backend auth. | Proof launcher name, install summary path, uninstall summary path | Install result, launcher exists after install, uninstall cleanup result, no-persistent-launcher-left state, quota usage false | No database or schema changes. No backend routes called. | No provider quota and no persistent launcher. The proof is an OS-file install/remove audit for local internal testing. | Production service monitoring and official-result active-event execution remain P1. |
| Startup launcher approved-settlement supervisor profile | `npm run mobile:local-runtime-startup:install-proof`; generated launcher calls `scripts/manage_holiwyn_internal_tester_runtime.ps1`, which calls `scripts/manage_holiwyn_one_event_live_supervisor.ps1`, which calls `scripts/run_holiwyn_one_event_live_supervisor.ps1` | Local PowerShell command chain; no new HTTP route | No provider key unless provider/live-result flags are explicitly selected. No mobile auth. | `StartSupervisor`, `RunResultIngestion`, `RunResultSettlement`, `RunApprovedResultSettlement`, `ResultSettlementPath`, `ResultSettlementApprovalPath` | Generated launcher preview includes approved settlement flags and redacted result/approval paths; install proof reports `approvedSettlementModeInstallProof=true` and no persistent launcher left installed | No schema changes. Runtime execution would use existing `Event`, `Market`, `Outcome`, settlement, and `CanonicalEvent` models through already documented settlement commands. | The proof writes and removes only a proof `.cmd` launcher. It does not run the launcher or spend provider quota. | Production service supervision and durable official-result/approval storage remain P1/P2. |

# Cycle ONEEVENTSUPERVISORAPPROVEDSETTLEMENT - Supervisor Approved Settlement Wait

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Supervisor approved trusted-result settlement wait | `npm run mobile:one-event-supervisor-approved-settlement-proof`; child commands call `mobile:one-event-result-settlement-run` and `run_holiwyn_one_event_live_supervisor.ps1` | Local PowerShell/Node command; no new HTTP route | No provider key and no mobile auth. Backend health route is read by supervisor runtime check. | Active event slug, trusted result JSON path, exact approval JSON path, result digest, market id, outcome id, confirmation phrase | Approval matched, supervisor approved mode wired, `resultSettlementAction=approved_waiting_for_closed_market`, active tester execution false | `Event`, `Market`, `Outcome`, `Order`, `Trade`, `Position`, `CanonicalEvent` through existing settlement preview/audit paths; no schema change | Uses committed redacted trusted-result evidence and active-event dry-run output; spends no Odds API quota | Installed unattended official-result polling and durable production approval storage remain P1/P2. |

# Cycle ONEEVENTRESULTPOLLER - Local Result Polling Runner

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Repeated local result polling and settlement scheduling | `npm run mobile:one-event-result-poller-proof`; child commands call `mobile:one-event-result-ingest` and `mobile:one-event-result-settlement-run` | Local PowerShell/Node command; live mode calls The Odds API scores endpoint only with explicit flag | No provider key in default proof. `THE_ODDS_API_KEY` is required only for `-RunLiveResultIngestion`. | Event slug, trusted result output path, optional live polling cadence/credit caps, optional approval path | Trusted result contract, result polling mode, settlement scheduler action, settlement preview digest, no active tester execution | Existing `Event`, `Market`, `Outcome`, `Position`, `Order`, `UserBalance`, `LedgerEntry`; no schema change | Default proof uses redacted provider-shaped score evidence and spends no provider quota | Installed unattended official-result service, durable official-result storage, and multi-event result queue remain P1/P2. |
| Background result polling process manager | `npm run mobile:one-event-result-poller:process`, `npm run mobile:one-event-result-poller:status`, `npm run mobile:one-event-result-poller:stop`, and `npm run mobile:one-event-result-poller:continuous-proof` | Local PowerShell command; no HTTP route | No provider key in default proof. `THE_ODDS_API_KEY` is required only if the started poller includes `-RunLiveResultIngestion`. | `Action=start/status/stop`, `EventSlug`, `Continuous`, `MaxIterations`, `IntervalSeconds`, optional live polling quota caps, optional approval path | Process pid/running state, stdout/stderr paths, poller digest, heartbeat progress, provider quota mode, no active tester execution | No schema change. Child poller uses existing `Event`, `Market`, `Outcome`, `Position`, `Order`, `UserBalance`, `LedgerEntry` only through documented result ingestion and settlement dry-run paths. | Default proof uses redacted provider-shaped score evidence and spends no provider quota. | This is a local background process manager, not an installed OS service. Durable official-result storage and multi-event result queue remain P1/P2. |

# Cycle ONEEVENTINTERNALRESULTPOLLERCONTROL - Internal Tester Result Poller Control

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal tester runtime result-poller control | `npm run mobile:internal-tester-runtime -- -Action start -StartResultPoller`; proof command `npm run mobile:internal-tester-result-poller-control`; child commands call `manage_holiwyn_one_event_result_poller.ps1` | Local PowerShell command; no HTTP route beyond existing `/api/health` readiness check | No provider key in default proof. `THE_ODDS_API_KEY` is required only if `-RunLiveResultIngestion` is intentionally passed through to the poller. | `Action=start/status/stop`, `StartResultPoller`, `ResultPollerIntervalSeconds`, backend/expo ports, optional live-result flags | Internal tester runtime summary, result-poller process summary, heartbeat iterations, provider quota truth, active tester execution false | No schema change. Child poller uses existing `Event`, `Market`, `Outcome`, settlement preview models, and fake-token settlement services only through documented dry-run paths. | Default proof uses redacted provider-shaped score evidence and spends no provider quota. | Local control plane only. Installed official-result service, durable result records, and multi-event result queue remain P1/P2. |

# Cycle ONEEVENTRESULTINGESTIONAUDIT - Durable Result Ingestion Audit Evidence

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider-shaped result ingestion audit event | `npm run mobile:one-event-result-ingestion-audit-event-proof`; child command `scripts/ingest_odds_api_one_event_result.ts --writeAuditEvent` | Local Node command; live mode can call The Odds API scores endpoint only with explicit `--live` | No provider key in default proof. `THE_ODDS_API_KEY` required only for live result ingestion. | Event slug, provider event id, sport key, trusted result output path, `--writeAuditEvent` | Trusted result JSON, trusted result digest, canonical event id/type/topic/payload, provider quota false, settlement execution false | `CanonicalEvent` stores `provider.result.ingested` with topic `market:provider-result:<eventSlug>`; no schema migration | Default proof uses redacted provider-shaped score evidence and spends no provider quota. | Dedicated official-result table, durable operator review model, multi-event queue, and production finality policy remain P1/P2. |

# Cycle ONEEVENTSTARTUPRESULTPOLLERPROFILE - Startup Launcher Result Poller Profile

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Startup launcher result-poller profile | `npm run mobile:local-runtime-startup:install-proof`; generated launcher calls `scripts/manage_holiwyn_internal_tester_runtime.ps1`, which can call `scripts/manage_holiwyn_one_event_result_poller.ps1` | Local PowerShell command chain; no new HTTP route | No provider key unless provider/live-result flags are explicitly selected. No mobile auth. | `StartSupervisor`, `StartResultPoller`, `ResultPollerIntervalSeconds`, `RunResultIngestion`, `RunResultSettlement`, `RunApprovedResultSettlement`, redacted trusted-result and approval paths | Generated launcher preview includes `-StartResultPoller -ResultPollerIntervalSeconds 15`; install proof reports `startupLauncherIncludesResultPoller=true`, provider quota false, and no persistent launcher left installed | No schema changes. If the launcher is later installed and executed, child runtime commands use already documented `Event`, `Market`, `Outcome`, settlement preview, and `CanonicalEvent` contracts. | The proof writes and removes only a proof `.cmd` launcher. It does not run the launcher, does not call provider APIs, and does not mutate trading state. | Production service supervision, durable official-result/approval storage, and multi-event result queue remain P1/P2. |

# Cycle ONEEVENTRESULTREVIEWTRAIL - Result Review Trail Report

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| One-event result review trail | `npm run mobile:one-event-result-review-trail`; reads canonical event stream and selected market metadata | Local Node command; no HTTP route and no provider call | Local developer/runtime only; refuses production. No provider key and no mobile auth. | Event slug, optional selected market/outcome override, result-ingestion audit summary path, settlement audit summary path, settlement-approval audit summary path, output path | Provider-result canonical event, settlement-preflight canonical event, settlement-approval canonical event, selected market/outcome, current market status, digest note, operator decision, approval/preflight digest match, no-quota/no-execution truth | Reads `CanonicalEvent`, `Market`, and linked `Event`; no schema changes and no writes | Uses already-written redacted canonical event evidence from local proof commands. It does not fabricate provider data or spend quota. | Dedicated official-result table, durable approval model, operator review UI, multi-event queue, and production service ownership remain P1/P2. |

# Cycle ONEEVENTACTIVESETTLEMENTREADINESS - Active Event Settlement Decision

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Active event settlement readiness report | `npm run mobile:one-event-active-settlement-readiness`; reads active market metadata plus existing proof summaries and canonical approval event | Local Node command; no HTTP route and no provider call | Local developer/runtime only; refuses production. No provider key and no mobile auth. | Event slug, optional selected market/outcome override, output path | Active market status, resolved outcome, approval event id/digest/confirmation, execution eligibility, operator decision, blocker list, no-quota/no-execution truth | Reads `Market`, linked `Event`, and `CanonicalEvent`; no schema changes and no writes | Uses already-written redacted trusted-result/preflight/approval proof evidence. It does not fabricate provider data or spend quota. | Operator review UI, first-class official result table, durable approval table, installed official-result polling, and direct active-event execution service remain P1/P2. |

# Cycle LIVERUNTIMECOMPLETIONAUDIT - Live Runtime Completion Truth

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-runtime completion audit | `npm run mobile:live-runtime-completion-audit`; reads runtime proof summaries and S23 proof summary | Local Node command; no HTTP route and no provider call | Local developer/runtime only; refuses production. No provider key and no mobile auth. | Optional output path | Maker continuity answer, live/replay odds mode, refresh cadence, quota protection, stale handling, lifecycle answer, S23 trade proof answer, active-settlement decision, P0/P1/P2 gaps | No direct DB reads and no schema changes. It consumes existing proof summaries that were produced by documented API/DB proof commands. | Uses existing redacted proof artifacts only. It spends no quota and does not mutate backend/runtime/mobile state. | Production service ownership, official-result auto-settlement service, multi-event runtime dashboard, and operator UI remain P1/P2. |

# Cycle ONEEVENTLIFECYCLEMATRIX - One-Event Lifecycle Matrix

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| One-event lifecycle matrix | `npm run mobile:one-event-lifecycle-matrix`; reads lifecycle proof summaries and current event/market metadata | Local Node command; no HTTP route and no provider call | Local developer/runtime only; refuses production. No provider key and no mobile auth. | Event slug and output path | Open/paused/closed/settled evidence matrix, current event status, active tester settlement truth, disposable settlement proof truth, P0/P1/P2 gaps | Reads `Event` and `Market`; no schema changes and no writes. Consumes existing settlement and lifecycle proof summaries. | Uses existing redacted proof artifacts. It spends no quota and does not mutate lifecycle or settlement state. | Production lifecycle dashboard, official-result service ownership, and active-event settlement execution remain P1/P2. |

# Cycle ONEEVENTRUNTIMESTATUSCAPABILITIES - Runtime Status Capability Truth

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| One-event runtime status capability report | `npm run mobile:one-event-runtime-status`; reads `/api/health`, `/api/markets/:marketId/quote`, continuous supervisor proof, result-poller proof, latest supervisor summary, and selected proof summaries | Local Node command plus backend `GET` routes | No mobile auth and no provider key. Refuses production. | Optional `baseUrl`, `summaryPath`, and `maxLiveProofAgeHours` | Backend health, selected quote route, latest supervisor run profile, proven repeated supervisor capabilities, proven result-poller capabilities, provider quota truth, P0/P1/P2 gaps | Reads no database directly beyond existing API routes; no schema changes and no writes. | Uses existing redacted proof summaries and local health/quote routes. It spends no provider quota and does not mutate market or settlement state. | Installed service ownership, durable official-result records, and multi-event runtime status remain P1/P2. |

# Cycle ONEEVENTPHASECAPABILITYGATE - Runtime Status Capability Audit Gate

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-runtime phase audit capability gate | `npm run mobile:one-event-phase-audit`; reads `/api/health`, `/api/markets/:marketId/quote`, runtime status, continuous supervisor proof, continuous result-poller proof, and existing phase artifacts | Local Node command plus backend `GET` routes | No mobile auth and no provider key. Refuses production. | Optional `baseUrl` and `summaryPath` | New P0 requirement `runtime-status-capability-truth`, proven capability booleans, backend health, selected quote route, P0/P1/P2 phase status | Reads no database directly beyond existing API routes; no schema changes and no writes. | Uses existing redacted proof summaries and spends no provider quota. | Installed service ownership, durable official-result records, and production runtime monitoring remain P1/P2. |
| Phase audit local status API gate | `npm run mobile:one-event-phase-audit`; reads `/api/internal/live-runtime/status` | Local Node command plus backend `GET` route | Local/dev only; no provider key and no mobile auth | Optional `baseUrl` and `summaryPath` | P0 requirement `local-status-api-ready`; local status response `status`, `runtimeTruth`, `freshness`, `providerSnapshots`, and `gaps.p0` are embedded in `localRuntimeStatus` | Indirectly reads `ReferenceQuoteSnapshot` through the local status route; no schema changes and no writes | Uses existing proof summaries and DB snapshots only; no provider calls and no quota spend. | Multi-event production status should verify every active event/market instead of only the selected one-event runtime market. |

# Cycle ONEEVENTLAUNCHPROFILE - Local Runtime Launch Profile

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local runtime launch profile | `npm run mobile:local-runtime-launch-profile`; reads runtime status, internal tester manager proof, supervisor/result-poller proofs, Startup launcher proof, and scheduled-task permission proof | Local Node command; no HTTP route and no provider call | Local developer/runtime only; refuses production. No provider key and no mobile auth. | Optional `summaryPath` | Recommended local launch profile, manual foreground commands, Startup fallback command, scheduled-task blocker, live-provider opt-in command, P0/P1/P2 gaps | No database or schema changes. Reads proof summaries only. | Uses existing redacted proof artifacts. It spends no provider quota and does not mutate processes, Startup files, scheduled tasks, markets, or settlement state. | Production service ownership, durable official-result records, and multi-event runtime launch profiles remain P1/P2. |
| Phase audit launch-profile gate | `npm run mobile:one-event-phase-audit`; reads `local-runtime-launch-profile-summary.redacted.json` | Local Node command plus existing health/quote checks | No provider key; no mobile auth | Optional `baseUrl` and `summaryPath` | New P0 requirement `local-runtime-launch-profile`, current Windows-context launch recommendation, no-quota/no-persistent-mutation truth | No schema changes and no writes. | Uses generated launch-profile artifact and existing proof summaries. | Installed service ownership remains P1. |

# Cycle LIVERUNTIMESCHEDULEDTASKPROFILE - Scheduled Task Result-Poller Approval Profile

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Scheduled-task result-poller approved-settlement profile | `npm run mobile:local-runtime-task:install-proof`; generated task calls `scripts/manage_holiwyn_internal_tester_runtime.ps1`, which can start the supervisor and dedicated result poller | Local PowerShell command chain; no new HTTP route | No provider key unless provider/live-result flags are explicitly selected. No mobile auth. | `StartSupervisor`, `StartResultPoller`, `ResultPollerIntervalSeconds`, `RunResultIngestion`, `RunResultSettlement`, `RunApprovedResultSettlement`, redacted trusted-result and active approval paths | Install/uninstall proof reports `scheduledTaskIncludesResultPoller=true`, `approvedSettlementModeInstallProof=true`, `scheduledTaskUsesActiveApprovalPath=true`, provider quota false, and no persistent task left installed | No schema changes. If later installed and executed, child runtime commands use existing `Event`, `Market`, `Outcome`, settlement preview, and `CanonicalEvent` contracts. | The proof attempts install/remove safely, accepts the current Windows permission denial as P1, spends no provider quota, and leaves no task installed. | Actual scheduled-task registration still needs elevated/task-registration rights in this Windows context. Production service supervision and durable result/approval records remain P1/P2. |
| Phase audit scheduled-task profile gate | `npm run mobile:one-event-phase-audit`; reads `local-runtime-task-install-uninstall-summary.redacted.json` and `local-runtime-task-summary.redacted.json` | Local Node command plus existing health/quote checks | No provider key; no mobile auth | Optional `baseUrl` and `summaryPath` | P0 requirement `scheduled-task-approved-settlement-profile`, result-poller/approval-path booleans, no-quota truth, no persistent task truth | No schema changes and no writes. | Uses generated scheduled-task proof artifacts and existing route proof only. | Installed unattended service ownership remains P1 until Windows task registration is allowed. |

# Cycle LIVERUNTIMERESULTREVIEWAPI - Local Result Review API

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local live-runtime result review | `/api/internal/live-runtime/result-review` | GET | Local/dev only; returns 404 in production or when `HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS=1`; no mobile auth and no provider key | Optional query `eventSlug`, optional query `marketId` | `status`, `providerQuotaUsed`, `selectedMarket`, `reviewTrail.providerResultEvent`, `reviewTrail.settlementPreflightEvent`, `reviewTrail.settlementApprovalEvent`, `reviewTrail.settlementExecutedEvent`, `executionDecision`, `runtimeTruth`, and P0/P1/P2 gaps. Exact settlement confirmation strings are redacted. | Reads `Market` and `CanonicalEvent`; no schema changes and no writes. Canonical event types consumed: `provider.result.ingested`, `settlement.trusted_result.preflight`, `settlement.trusted_result.approved`, `settlement.trusted_result.executed`. | No mock data. The route reads existing phase-audit selected-market evidence and canonical DB events, spends no quota, and does not mutate backend state. | First-class official-result records, durable approval records, operator review UI, installed official-result polling, and production settlement execution service remain P1/P2. |
| Phase audit result-review API gate | `npm run mobile:one-event-phase-audit`; calls `/api/internal/live-runtime/result-review` | Local Node command plus backend GET route | Local/dev only; no provider key and no mobile auth | Optional `baseUrl` and `summaryPath` | P0 requirement `local-result-review-api-ready`, canonical provider/preflight/approval availability, no-quota truth, read-only truth, redacted-confirmation truth, and zero P0 gaps | No schema changes and no writes. | Uses local backend route response and canonical DB events only. | This is not a public mobile route and not an execution endpoint. Production needs authenticated operator controls and durable official-result/approval models. |
| Completion/status result-review gate | `npm run mobile:live-runtime-completion-audit`; `/api/internal/live-runtime/status` | Local Node command plus backend GET route | Local/dev only; no provider key and no mobile auth | None for status route; optional output path for completion audit | Completion audit check `localResultReviewApiKnown`; status response `resultReview.checked/pass/providerQuotaUsed/readOnlyRoute/devOnlyRoute/canonical*Available/exactConfirmationRedacted/p0/nextSafeAction` | No schema changes and no writes. Reads phase-audit embedded route proof. | Uses existing phase-audit proof artifact only; no provider calls and no settlement mutation. | Production should store result-review readiness in durable service/operator state instead of proof JSON. |
| Durable result-review record | `/api/internal/live-runtime/result-review`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Local/dev only; no provider key and no mobile auth | Optional query `eventSlug`, optional query `marketId` | `officialResultReview.reviewKey/resultDigest/trustedResultDigest/approvalStatus/executionDecision/exactConfirmationStored/providerQuotaUsed/activeMarketExecutionAttempted`, `runtimeTruth.durableOfficialResultReviewRecordAvailable`, and status/completion gate checks | Adds `OfficialResultReview`; reads `Market`, linked `Event`, and `CanonicalEvent`; writes one redacted review row keyed by event slug, market id, and result digest. | No mock provider data. The route mirrors existing canonical local evidence and stores no exact settlement confirmation string. | Operator review UI, multi-event settlement queue, installed official-result polling, and production execution service remain P1/P2. |
| Local live-runtime settlement queue | `/api/internal/live-runtime/settlement-queue`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Local/dev only; no provider key and no mobile auth | None | `queue.itemCount/pendingCount/executableNowCount/approvedWaitingForCloseCount/items[]`, each item includes review identity, event/market/outcome ids, approval/execution status, redacted confirmation truth, market/event status, `nextSafeAction`, and redacted `operatorAction` with label/blocker/nextCommand/safety booleans; runtime truth includes read-only/dev-only/no-quota/no-execution booleans and `redactedOperatorExecutionPlanAvailable` | Reads `OfficialResultReview`, `Market`, and linked `Event`; no schema changes and no writes. | No mock provider data. The route uses durable review rows written by the result-review route and current market state. It spends no quota, does not execute settlement, and does not expose exact confirmation strings. | Authenticated operator UI/actions, installed official-result polling, and production execution service remain P1/P2. |
## Cycle ONEEVENTAPPROVALAUDIT - Durable Settlement Approval Audit Evidence

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local runtime settlement approval proof | None added | N/A | Local script only | N/A | N/A | `CanonicalEvent`, `Market`, `Outcome`, linked `Event` through active trusted-result dry-run | Redacted trusted-result JSON and exported local approval JSON are used for local scheduler compatibility; no provider quota spent | First-class approval table, operator UI, multi-event approval queue, and installed official-result polling remain P1/P2 |

Notes:
- `settlement.trusted_result.approved` is now an allowed canonical market event type.
- The proof writes backend-readable approval evidence and exports the approval file consumed by existing local supervisor/scheduler commands.

## Cycle ONEEVENTACTIVESETTLEMENTCLONE - Active Event Settlement Clone Proof

| Mobile feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local runtime settlement proof | None added | N/A | Local script only | N/A | N/A | `Event`, `Market`, `Outcome`, `Order`, `Position`, `User`, `UserBalance`, `LedgerEntry`, `CanonicalEvent` | Disposable clone event and local trusted-result/approval JSON are used only for proof; active event is not mutated | Durable official-result records, durable approval storage, operator UI, multi-event settlement queue, and installed official-result polling remain P1/P2 |

Notes:
- Existing route dependency remains `/api/health` and selected `/api/markets/:marketId/quote` through the phase audit; no new mobile route was added for this proof.
- `npm run mobile:one-event-active-settlement-clone-proof` executes the trusted-result scheduler path against a disposable clone of the active event's selected market semantics.

## Cycle ACTIVESETTLEMENTCLOSEDELIGIBILITY - Active Event Closed Settlement Eligibility

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Active-event closed settlement eligibility proof | `npm run mobile:one-event-active-settlement-closed-eligibility-proof`; internally calls `scripts/settle_odds_api_one_event_from_result.ts --writeAuditEvent` | Local Node command; no mobile route | Local developer/runtime only; refuses production. No provider key and no mobile auth. | Optional `eventSlug`, `marketId`, `result`, `output`, and `dryRunOutput` | `runtimeTruth.provesActiveEventClosedStateEligibility`, `activeEventSettlementExecuted=false`, `activeMarketRestored=true`, `providerQuotaUsed=false`, and `closedStateDecision.operatorDecisionWhenClosed` | Reads and temporarily updates `Market`; reads linked `Event` and `CanonicalEvent`; writes canonical settlement preflight audit evidence through the existing dry-run path | Uses existing redacted trusted-result evidence only. It spends no provider quota and restores `status`, `settlementStatus`, `resolvedOutcomeId`, and `closeTime` after proof. | Production needs authenticated operator controls, durable settlement approval records, multi-event official-result queue, and installed official-result polling before active-event execution can be automated. |

Notes:
- No backend API route or schema is added in this cycle. The proof intentionally exercises the existing guarded settlement command while restoring active tester state.
- Phase and completion audits now require this closed-state eligibility artifact so active-event settlement readiness is not only proven on disposable clones.

## Cycle ONEEVENTINTERNALWATCHDOG - Internal Tester Runtime Watchdog

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local internal tester runtime watchdog | `npm run mobile:internal-tester-watchdog-proof`; child commands use `npm run mobile:internal-tester-runtime`, `npm run mobile:one-event-live-supervisor:continuous-proof`, and `npm run mobile:one-event-result-poller:continuous-proof` | Local PowerShell command plus existing backend `GET /api/health` through child status/proof commands | No mobile auth and no provider key in default proof. `THE_ODDS_API_KEY` is required only if explicit live provider/live result flags are passed. | Backend port, Expo port, supervisor/result-poller requirements, optional provider/live-result flags, cleanup flag | Backend health, Expo port readiness, Docker/Postgres readiness, S23 reachability snapshot, supervisor proof exit code, result-poller proof exit code, cleanup result, no-quota runtime truth | No schema changes. Child proof commands may read/write existing proof summaries and use existing `Event`, `Market`, `Outcome`, `Order`, `Position`, and settlement-preview models according to their documented replay/dry-run contracts. | Default proof uses existing redacted provider-shaped evidence and cached runtime proofs; it spends no provider quota and does not invent mobile data. | This is a local watchdog proof, not an installed OS service or production monitor. Durable service heartbeats and production runtime ownership remain P1. |
| Watchdog phase audit gate | `npm run mobile:one-event-phase-audit`; reads `internal-tester-watchdog-summary.redacted.json` plus existing health/quote routes | Local Node command plus backend `GET /api/health` and selected quote route | No mobile auth and no provider key | Optional `baseUrl` and output path | Requirement `internal-tester-watchdog`, watchdog proof booleans, cleanup pass/fail, provider quota truth, installed-service truth | No schema changes and no writes. Reads proof summaries plus existing API health/quote evidence. | Uses existing redacted proof artifacts and spends no provider quota. | Production service ownership remains P1. |
| Completion audit watchdog gate | `npm run mobile:live-runtime-completion-audit`; reads `internal-tester-watchdog-summary.redacted.json` | Local Node command; no HTTP route | No mobile auth and no provider key | Optional output path | Check `internalTesterWatchdogKnown`, watchdog proof booleans, cleanup pass/fail, no-quota truth, installed-service truth | No schema changes and no writes. Reads proof summaries only. | Uses existing redacted proof artifacts and spends no provider quota. | Production service ownership remains P1. |
| Local live runtime status API | `/api/internal/live-runtime/status` | GET | Local/dev only; route returns 404 in `NODE_ENV=production` or when `HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS=1`; no provider key | None | `status`, `event`, `selectedMarket`, `runtimeTruth`, `answers`, `checks`, `gaps`, redacted artifact pass/generatedAt fields | No schema changes and no DB writes. Reads local redacted proof artifacts: live-runtime completion audit, phase audit, watchdog summary. | Uses existing proof JSON only; does not call provider APIs and spends no quota. | Production monitoring/service state should use durable service health records instead of local proof files. |

## Cycle LIVERUNTIMEFRESHNESS - Local Runtime Freshness Gate

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local live-runtime freshness status | `/api/internal/live-runtime/status`; `npm run mobile:live-runtime-completion-audit` | GET plus local Node command | Local/dev only; route returns 404 in production or when disabled; no provider key and no mobile auth | None for the route; optional output path for the audit command | Route now includes `freshness.completionAuditAgeHours`, `freshness.phaseAuditAgeHours`, `freshness.watchdogAgeHours`, max age fields, and fresh booleans. Completion audit includes `answers.freshness`, `checks.liveProviderProofFresh`, and `checks.internalTesterWatchdogFresh`. | No schema changes and no DB writes. Reads local redacted proof artifacts only. | Uses existing proof JSON only; no provider calls, no fake provider data, and no quota spend. | Production readiness should use durable service heartbeat/provider-poll/result-poll records instead of local proof artifact ages. |
| Live-provider proof wall-clock freshness | `/api/internal/live-runtime/status` | GET | Local/dev only; no provider key and no mobile auth | None | `freshness.liveProofAgeAtCompletionHours`, `freshness.liveProofCurrentAgeHours`, `freshness.maxLiveProofAgeHours`, and `freshness.liveProofFresh`; route returns 503/`needs_attention` if the embedded live-provider proof has aged past the max even when the completion artifact is still within its own freshness window | No schema changes and no DB writes. Reads the completion audit's stored freshness fields and current wall-clock age. | Uses existing proof JSON only and spends no provider quota. | Production runtime should compute this from durable provider poll rows instead of completion-audit embedded age. |
| Selected market DB provider snapshot freshness | `/api/internal/live-runtime/status` | GET | Local/dev only; no provider key and no mobile auth | None | `providerSnapshots.checked`, `fresh`, `marketId`, `snapshotCount`, `latestFetchedAt`, `latestAgeHours`, `maxAgeHours`, `sources`, `acceptingOrderSnapshotCount`, `mmEligibleSnapshotCount`, `latestQualityStatus`, `latestReason`; route returns 503/`needs_attention` if the selected market has no fresh stored provider snapshot | `ReferenceQuoteSnapshot` read-only; no schema changes and no writes | Uses stored provider snapshot rows only; no provider API calls and no quota spend. | Multi-event production status should cover all active events/markets and persist provider polling health as first-class runtime state. |
| Durable provider refresh run status | `npm run mobile:provider-refresh-run-record`; `npm run mobile:one-event-live-runtime:provider`; `/api/internal/live-runtime/status`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | Local Node command, explicit live-provider proof command, GET plus local audit commands | Local/dev only; provider key is required only for future explicit live-provider proof runs, not for status/audits/backfill; no mobile auth | Run-record command reads the redacted one-event live-runtime summary; future live proof writes directly after provider refresh | `providerRefreshRuns.checked/durable/source/latest/latestRunPassed/latestRunQuotaProtected/latestRunWithinBudget/latestRunReadyAfterRefresh/latestRunStaleBeforeRefresh/providerQuotaUsedByStatus`; latest row includes provider/reference source, event/market/outcome identity, refresh iterations, provider call count, quota cost, requests remaining, market/outcome/snapshot counts, and quota-protected metadata | Uses `ProviderRefreshRun`; status route reads latest selected-event row only and never calls The Odds API. Live proof still writes `ReferenceQuoteSnapshot` rows through the existing provider seeding path. | Backfill uses existing redacted proof summary and spends no provider quota. Future explicit live-provider proof spends quota only through the existing quota-capped command. | Production should use a real provider polling scheduler with durable per-job attempts, retry policy, alerting, and multi-event quota accounting. |
| Managed runtime process visibility | `/api/internal/live-runtime/status` | GET | Local/dev only; no provider key and no mobile auth | None | `managedProcesses.supervisor`, `managedProcesses.resultPoller`, `anyLoopRunning`, and `quotaSpendingLoopRunning`; each process entry includes state path, known/running flags, pid, startedAt, continuous flag, interval, max iterations, quota-use flag, and mode flags | Reads local `.runtime/one-event-live-supervisor/supervisor-process-state.json` and `.runtime/one-event-result-poller/result-poller-process-state.json`; checks OS pid existence; no DB writes or schema changes | Uses local process-state files only; does not start loops, stop loops, call provider APIs, or spend quota. | Production should replace pid/proof-file checks with durable service heartbeats, process supervisor state, and provider/result poll records. |
| Worker-owned durable local runtime heartbeats | `npm run mobile:runtime-heartbeat`; supervisor/result-poller loop scripts; `/api/internal/live-runtime/status`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | Local Node command, local PowerShell loops, GET plus local audit commands | Local/dev only; no provider key and no mobile auth | Heartbeat command args include service name/kind/status/pid/running/continuous/quota-use/state path/start time | `runtimeHeartbeats.checked/durable/source/records/allExpectedServicesRecorded/quotaSpendingHeartbeatRunning/installedOsService`; each record includes service key/name/kind, status, pid, running, continuous, quota-use, installed-service truth, state path, startedAt, heartbeatAt, and metadata with preserved `workerOwned` truth | Uses `RuntimeServiceHeartbeat`; local supervisor/result-poller scripts emit worker-owned rows, and the status route preserves that metadata while mirroring current process-state files and OS pid checks. | No provider data and no fake runtime data. Heartbeat writes record observed local worker/process state only and spend no quota. | Still not an installed production service. Production needs service ownership, worker-owned provider/result poll run records, alerting, and multi-event queue state. |
| Worker-owned durable local runtime run records | `npm run mobile:runtime-run-record`; supervisor/result-poller loop scripts; `/api/internal/live-runtime/status`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | Local Node command, local PowerShell loops, GET plus local audit commands | Local/dev only; no provider key and no mobile auth | Run-record command args include service name/kind/status/start/finish/iteration count/quota-use/active-settlement/install truth/summary path | `runtimeRuns.checked/durable/source/records/allExpectedServicesRecorded/allExpectedServicesPassed/quotaSpendingRunRecorded/activeSettlementExecuted/installedOsService/workerOwnedRunCount`; each record includes service key/name/kind, passed/failed status, start/finish, duration, iteration count, event slug, selected market id, result action, summary path, and worker-owned metadata | Uses `RuntimeServiceRun`; local supervisor/result-poller scripts emit worker-owned rows after a run finishes. The status route reads the latest row per service and phase/completion audits require passed no-quota local rows. | No provider data and no fake runtime data. Run records summarize completed local worker runs and spend no quota. | Still not an installed production service. Production needs a service owner, retry/alerting, multi-event job queue, and durable provider/result polling schedule state. |
| Proof vs mobile freshness truth | `/api/internal/live-runtime/status` | GET | Local/dev only; no provider key and no mobile auth | None | `providerSnapshots.freshnessBasis`, `latestAgeSeconds`, `mobileRouteFresh`, `mobileRouteRefreshDue`, `mobileRouteStale`, `mobileLifecycleStatus`, `mobileRefreshDueSeconds`, `mobileStaleAfterSeconds`, `mobileRefreshDueAt`, `mobileStaleAt`, and `nextProviderAction` | `ReferenceQuoteSnapshot` read-only; no schema changes and no writes | Uses stored provider snapshot rows only; does not refresh provider data and spends no provider quota. | Production should persist provider-poll cadence, next refresh due time, and per-market mobile freshness as first-class runtime health records for every active event. |
| Operator next-action guidance | `/api/internal/live-runtime/status` | GET | Local/dev only; no provider key and no mobile auth | None | `operatorNextActions.recommendedFirstAction`, `nextProviderAction`, `actions[]`, and `safety`; actions include command, provider-key requirement, quota-spend flag, priority, label, and reason | No DB writes or schema changes; composes existing proof freshness, provider snapshot freshness, and local process status | Uses local status data only; does not execute commands, start loops, read secrets, or spend quota. | Production/internal dashboard should replace command strings with authenticated service controls and durable job records before broader use. |
| Full internal tester runtime operator action | `/api/internal/live-runtime/status`; `npm run mobile:one-event-phase-audit` | GET plus local audit command | Local/dev only; no provider key and no mobile auth | None | `operatorNextActions.actions[]` includes `id=start_full_internal_tester_runtime`, exact internal tester runtime start command, `requiresProviderKey=false`, and `spendsProviderQuota=false` | No DB writes or schema changes. Reads current supervisor/result-poller process status only to decide whether the action should be offered. | The status route does not run the command; it only exposes the safe no-quota local command that starts/reuses backend/Expo and starts cached runtime loops. | Production should replace command-string guidance with authenticated runtime controls and audit logs. |
| One-command runtime-loop operator action | `/api/internal/live-runtime/status`; `npm run mobile:one-event-phase-audit` | GET plus local audit command | Local/dev only; no provider key and no mobile auth | None | `operatorNextActions.actions[]` includes `id=prove_one_command_runtime_loops`, exact onboarding command, `requiresProviderKey=false`, and `spendsProviderQuota=false` | No DB writes or schema changes. Reads current supervisor/result-poller process status only to decide whether the action should be offered. | The status route does not run the command; it only exposes the safe no-quota local command. | Production should replace command-string guidance with authenticated runtime controls and audit logs. |
| Live-runtime phase completion projection | `/api/internal/live-runtime/status`; `npm run mobile:one-event-phase-audit` | GET plus local audit command | Local/dev only; no provider key and no mobile auth | None | `phaseCompletion.checked/pass/generatedAt`, `phaseCompletion.phaseCompleteForLocalInternalRuntime`, `fullProductionRuntimeComplete`, `installedUnattendedService`, `activeTesterSettlementExecutionAttempted`, `answers`, `checks`, `sourceEvidence`, `p0`, `p1`, `p2`, and no-quota truth | No DB writes or schema changes. Reads the redacted live-runtime completion audit artifact and projects it through the status route. | None added. The route does not refresh providers, start loops, or execute settlement. | Production should replace local artifact projection with durable runtime/completion records and authenticated operator controls. |
| Live-runtime completion requirement matrix | `/api/internal/live-runtime/status`; `npm run mobile:live-runtime-completion-audit`; gated by `npm run mobile:one-event-phase-audit` | GET plus local audit commands | Local/dev only; no provider key and no mobile auth | None | `phaseCompletion.completionRequirements[]` and `phaseCompletion.completionRequirementsPass`; rows cover market-maker continuity, odds refresh mode, quota protection, stale odds handling, event lifecycle, one-event mobile trading, and runtime launch | No schema changes. Reads existing redacted proof artifacts plus durable runtime rows already documented in this map. | None added. This is read-only proof composition and spends no quota. | Production should back these requirement rows with durable service/job/alert records instead of local proof artifacts. |
| Local runtime launch profile projection | `/api/internal/live-runtime/status`; `npm run mobile:one-event-phase-audit` | GET plus local audit command | Local/dev only; no provider key and no mobile auth | None | `launchProfile.checked/pass/generatedAt`, `recommendedInternalTesterProfile`, `manualForegroundProfile`, `scheduledTaskProfile`, `liveProviderProfile`, `runtimeTruth`, `p0`, `p1`, and `p2` | No DB writes or schema changes. Reads the redacted local runtime launch-profile artifact and projects it through the status route. | None added. The route does not start processes, install Startup entries, install scheduled tasks, refresh providers, or execute settlement. | Production should replace local artifact projection with durable runtime launch records and authenticated operator controls. |
| Launch profile verified Expo command | `/api/internal/live-runtime/status`; `npm run mobile:local-runtime-launch-profile`; gated by phase/completion audits | GET plus local audit command | Local/dev only; no provider key and no mobile auth | None | `launchProfile.manualForegroundProfile.commands[]` includes `npm run mobile:internal-tester-runtime -- -Action start -Force -ReplaceExternalExpo -WaitForReady`; `launchProfile.runtimeTruth.verifiedExpoReplacementCommandDocumented=true`; `serviceOwnership.localLaunch.manualForegroundCommands[]` mirrors the same command | No DB writes or schema changes. Reads launch-profile artifact only. | No provider quota and no app fixture. This is a read-only operator command projection. | Production should use authenticated operator controls and durable runtime launch records instead of local artifact projection. |
| Active settlement decision status | `/api/internal/live-runtime/status` | GET | Local/dev only; no provider key and no mobile auth | None | `settlementDecision.checked`, `pass`, `providerQuotaUsed`, `activeMarketStatus`, `activeEventStatus`, `executionEligibleNow`, `operatorDecision`, `blockers`, `marketMustBeClosed`, `exactConfirmationRequiredKnown`, `activeMarketExecutionAttempted`, `closedStateEligibility`, `closedStateEligibilityProven`, `disposableCloneSettlementProven`, `supervisorApprovedSettlementWaitProven`, and `nextSafeAction` | Reads local active-event settlement readiness and closed-state eligibility proof artifacts; no DB writes or schema changes in this route | Uses existing redacted settlement readiness and closed-state eligibility evidence only; does not execute settlement and does not expose confirmation phrase. | Production should use durable result/approval/settlement records and authenticated operator controls instead of local proof JSON. |
| Settlement queue status projection | `/api/internal/live-runtime/status`; gated by `npm run mobile:one-event-phase-audit` | GET plus local audit command | Local/dev only; no provider key and no mobile auth | None | `settlementQueue.checked`, `pass`, `providerQuotaUsed`, read-only/dev-only/no-execution truth, queue counts, `firstItem.reviewKey/eventSlug/marketId/approvalStatus/nextSafeAction/marketStatus`, redacted `firstItem.operatorAction`, and `p0` | No schema changes. Projects the phase audit's `/api/internal/live-runtime/settlement-queue` evidence, which is backed by durable `OfficialResultReview` rows and current `Market` status. | Uses existing redacted settlement queue evidence only; does not execute settlement, call providers, read secrets, or expose exact confirmation strings. | Production should replace local proof projection with authenticated operator controls, durable queue ownership, and audited execution records. |
| Durable settlement approval evidence | `/api/internal/live-runtime/settlement-queue`; `/api/internal/live-runtime/status`; gated by `npm run mobile:one-event-phase-audit` and `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Local/dev only; no provider key and no mobile auth | None | `queue.items[].approvalEvidence` and `settlementQueue.firstItem.approvalEvidence`, including approval status, durable review row truth, canonical approval event truth/id, result digest availability, exact-confirmation redaction truth, and provider quota truth | Reads `OfficialResultReview.settlementApprovalCanonicalId`, `approvalStatus`, `resultDigest`, `exactConfirmationStored`, and `providerQuotaUsed`; no schema changes | None added. This is read-only evidence projection and spends no quota. | Production still needs authenticated operator approval controls and durable execution audit ownership. |
| Runtime capability split | `/api/internal/live-runtime/status` | GET | Local/dev only; no provider key and no mobile auth | None | `runtimeCapabilities.latestRunProfileOnly`, `latestSupervisorProfile`, `provenCapabilities`, `currentProcessState`, and explanatory note | Reads local runtime-status proof artifact plus current supervisor/result-poller process state; no DB writes or schema changes | Uses existing proof JSON and local process checks only; does not start loops, call provider APIs, read secrets, or spend quota. | Production should store service capabilities, heartbeat state, and job-run records durably rather than relying on proof artifacts. |
| Quota-safe default action | `/api/internal/live-runtime/status` | GET | Local/dev only; no provider key and no mobile auth | None | `operatorNextActions.defaultNoQuotaAction`, `liveOddsAction`, and `recommendedFirstAction`; when local proof is ready but mobile-display odds are stale, cached testing remains the default and live refresh remains explicit | No DB writes or schema changes; composes selected-market snapshot freshness and existing operator action metadata | Uses existing status data only; does not execute commands, refresh provider data, read secrets, or spend quota. | Production should back refresh actions with authenticated jobs and durable quota accounting. |
| Current warm runtime state | `/api/internal/live-runtime/status`; gated by `npm run mobile:one-event-phase-audit` and `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Local/dev only; no provider key and no mobile auth | None | `currentRuntimeState.checked/mode/localCapabilityReady/warmNoQuotaRuntime/allLoopsRunning/anyLoopRunning/supervisorRunning/resultPollerRunning/quotaSpendingLoopRunning/testerReadyRightNow/p0/p1/nextAction` | No DB writes or schema changes; composes completion/phase/watchdog proof freshness, selected-market provider snapshot freshness, and current supervisor/result-poller process state | Uses existing status data only; does not start loops, refresh provider data, read secrets, spend quota, or execute settlement. | Production should replace this local process/proof composition with durable service manager state, provider poll records, alerting, and authenticated operator controls. |
| Runtime service ownership summary | `/api/internal/live-runtime/status`; gated by `npm run mobile:one-event-phase-audit` and `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Local/dev only; no provider key and no mobile auth | None | `serviceOwnership.checked/serviceModel/productionServiceInstalled/installedOsService/foregroundSupervisorProven/foregroundResultPollerProven/foregroundLoopsProven/marketMakerContinuity/providerRefreshContinuity/resultPollingContinuity/current/liveProviderMode/localLaunch/durableEvidence/p0/p1/nextAction` | No schema changes. Reads runtime proof artifacts, launch profile, current supervisor/result-poller process state, `RuntimeServiceHeartbeat`, `RuntimeServiceRun`, `ProviderRefreshRun`, and `MarketMakerQuoteRun`. | Uses existing status data only; does not start loops, install services, refresh provider data, read secrets, spend quota, place orders, or execute settlement. | Production should replace foreground-process ownership with installed service/job ownership, authenticated controls, retry, alerting, and durable provider/maker lifecycle supervision. |
| Provider refresh loop status | `/api/internal/live-runtime/status`; gated by `npm run mobile:one-event-phase-audit` and `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Local/dev only; no provider key and no mobile auth | None | `providerRefreshLoop.checked/providerSource/mode/enabledNow/configuredInLastSupervisorState/statusRouteSpendsProviderQuota/requiresExplicitRunProviderProofFlag/requiresTheOddsApiKey/cadence/quotaCaps/latestRun/mobileFreshness/p0/p1` | No schema changes. Reads supervisor process-state fields, `ProviderRefreshRun`, and selected-market `ReferenceQuoteSnapshot` freshness through existing status helpers. | Uses existing status data only; does not start the supervisor, call The Odds API, read secrets, spend quota, refresh provider data, place orders, or execute settlement. | Production should replace this local status contract with durable provider polling jobs, authenticated controls, alerting, and quota accounting. |
| Phase-audit status bootstrap | `/api/internal/live-runtime/status?phaseAuditInProgress=1`; called by `npm run mobile:one-event-phase-audit` only | GET plus local audit command | Local/dev only; no provider key and no mobile auth | Query param `phaseAuditInProgress=1` | Same status fields as normal status, but readiness does not depend on the previous phase audit already passing while the phase audit is being regenerated | No schema changes and no DB writes. Uses the same status inputs as the normal route. | This avoids a circular self-poisoning audit failure after a failed phase artifact. Normal `/api/internal/live-runtime/status` remains strict for tester/runtime readiness. | Production route remains unavailable; production service status should use durable service records and authenticated controls. |
| Warm local internal tester runtime manager | `npm run mobile:internal-tester-runtime`; status reads `/api/health` and `/api/internal/live-runtime/status` separately | Local PowerShell command plus local backend GET routes | Local developer/runtime only; no provider key required for the no-quota profile | Start flags: `-StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -RunApprovedResultSettlement -WaitForReady`; approval file default: `trusted-result-audit-approved.redacted.json` | Backend health, Expo port readiness, Docker/Postgres health, S23 reachability snapshot, supervisor process state, result-poller process state, no-quota loop truth | Reads local `.runtime` process-state files and proof artifacts; no schema changes and no DB writes from the manager itself | Uses existing redacted trusted-result and active approval proof artifacts; spends no provider quota and does not execute active-event settlement while the market is `LIVE` | Production service supervisor, durable approval table, durable process heartbeats, and authenticated operator controls remain P1/P2. |
| Warm current-runtime proof harness | `npm run mobile:current-runtime-state-proof`; reads `/api/internal/live-runtime/status` while manager-owned loops are running | Local Node command plus local backend GET route | Local developer/runtime only; no mobile auth and no provider key | Starts manager with `StartSupervisor`, `StartResultPoller`, `RunResultIngestion`, `RunResultSettlement`, and `RunApprovedResultSettlement`, then polls status until warm or timeout | `currentRuntimeState.mode`, `warmNoQuotaRuntime`, `allLoopsRunning`, `quotaSpendingLoopRunning`, `managedProcesses.supervisor.running`, `managedProcesses.resultPoller.running`, and cleanup truth in the proof artifact | No schema changes. Reads existing local process-state/status contracts and writes only `current-runtime-state-proof-summary.redacted.json`. | Uses existing redacted trusted-result/approval evidence. It spends no provider quota and stops manager-owned loops after proof. | This proves local warm runtime state, not installed production service ownership or fresh mobile-route provider snapshots. |
| One-command onboarding runtime-loop proof | `npm run mobile:one-event-onboarding -- -AllowDisconnectedS23 -StartRuntimeLoops -StopRuntimeLoopsAfterProof`; child commands use `/api/health`, `/api/internal/live-runtime/status`, readiness/settlement commands, and `npm run mobile:internal-tester-runtime` | Local PowerShell command plus local backend GET routes | Local developer/runtime only; no mobile auth and no provider key in cached mode | Explicit flags for backend-only proof, supervisor/result-poller startup, and cleanup | `checks.runtimeLoopStartPass`, `checks.runtimeLoopStatusPass`, `checks.runtimeLoopsRunningDuringProof`, `checks.runtimeLoopStopPass`, `checks.runtimeLoopsStoppedAfterProof`, and `runtimeTruth.runtimeLoopMode` | No schema changes. Reads existing runtime proof artifacts and local `.runtime` process-state files through the internal tester manager. | Uses existing stored provider evidence, trusted result fixture, and local fake-token runtime. It spends no Odds API quota in default mode and stops loops after proof. | This is local process proof, not an installed unattended daemon. Production needs durable service ownership, queueing, retry, and alerting. |

## Cycle XC - Position Close Cashout Contract

| Mobile feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio/Event Detail cashout close | `/api/orders/limit` through `PolyApi.placeLimitOrder`; Portfolio state through `/api/portfolio` and `/api/portfolio/history` after refresh | POST for close order; GET for portfolio refresh | Mobile dev API key in server mode | `marketId`, `outcomeId`, `side=SELL`, `price`, `size`, `selection` | Order id/status/size/remaining/fills from order response; position fields `shares`, `bestBid`, `currentPrice`, `probability`, `marketId`, `outcomeId` from Portfolio snapshot | Existing `Order`, `Fill`, `Position`, `UserBalance`, and Portfolio route models | Mock mode updates local position shares and activities, but server-mode proof should use backend state | Dedicated close-position quote route remains P1; current ticket uses position bid/current price fields for estimated proceeds. |

## Cycle LIVERUNTIMELIFECYCLEAPI - Local Lifecycle Status API

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local live-runtime lifecycle API | `/api/internal/live-runtime/lifecycle`; `npm run mobile:one-event-phase-audit` | GET plus local audit command | Local/dev only; route returns 404 in production or when disabled; no provider key and no mobile auth | Optional `eventSlug` query param | `status`, `event`, `lifecycle.open/suspended/closed/settledResolved`, `runtimeTruth`, `checks`, `gaps`, and redacted artifact metadata. The route reports active-event settlement no-execution truth and `executionRequiresMarketStatus=CLOSED`. | Reads `Event` and listed sportsbook `Market` rows plus redacted proof artifacts. No schema changes and no DB writes. | Uses existing lifecycle/settlement proof artifacts only; does not call provider APIs, start loops, mutate lifecycle state, or spend quota. | Production lifecycle status should use durable worker-owned lifecycle/result/settlement records instead of local proof artifacts and should be exposed through authenticated operator controls. |

## Cycle XE - Live Provider Proof Non-Crossing Runtime Gate

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bounded one-event live provider proof | `npm run mobile:one-event-live-runtime:provider`; child routes `GET /api/health`, `GET /api/events`, `GET /api/mobile/events/:slug/live-detail`, `GET /api/markets/:marketId/quote`, `POST /api/orders`, `GET /api/portfolio`, `GET /api/portfolio/history` | Local PowerShell/Node command plus existing GET/POST routes | Local/dev only. `THE_ODDS_API_KEY` is required only in the local process for this explicit provider proof. Mobile/order routes use local API credential auth. | Provider proof args: one-event selected sport/event, max credits, min remaining, refresh iterations, quote offset ticks. Order body: market/outcome, side, type, price, size, selection identity. | Provider call quota headers, selected event/market/outcome, stale-before-refresh, ready-after-refresh, maker planned bid/ask and adjustments, buy/sell order status, no-position sell rejection, closed-market rejection, portfolio position, and history trade count. | `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ProviderRefreshRun`, `MarketMakerQuoteRun`, `Order`, `Fill`, `Position`, `UserBalance`, `RuntimeServiceHeartbeat`, `RuntimeServiceRun`. No schema changes. | None added. The proof uses real Odds API response for the selected event and local fake-token exchange state. It does not invent frontend-only market data. | Installed continuous provider/maker service, multi-event polling, production quota dashboard, and official-result auto-settlement remain P1/P2. |
| Local runtime status no-quota operator actions | `/api/internal/live-runtime/status?phaseAuditInProgress=1`; `npm run mobile:one-event-phase-audit` | GET plus local audit command | Local/dev only; no provider key and no mobile auth | Optional `phaseAuditInProgress=1` | `operatorNextActions.actions[]` always includes `start_full_internal_tester_runtime` and `prove_one_command_runtime_loops` with `requiresProviderKey=false` and `spendsProviderQuota=false`, even when loops are already running. | No DB writes. Reads local process state and existing durable runtime/provider/maker rows. | None. The route reports commands only and does not execute them. | Production should replace command-string guidance with authenticated operator controls and durable job IDs. |

## Cycle XF - Structured Settlement Operator Plan

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Structured local settlement operator plan | `/api/internal/live-runtime/settlement-queue`; gated by `npm run mobile:one-event-phase-audit` and `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Local/dev only; route returns 404 in production or when `HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS=1`; no provider key and no mobile auth | None | `queue.items[].operatorExecutionPlan` with `version`, `mode`, `executableNow`, `dryRunFirst`, `providerQuotaRequired=false`, `exactConfirmationExposed=false`, `exactConfirmationStored=false`, `activeMarketExecutionAttempted=false`, `prerequisites`, `blockerKeys`, and redacted command metadata. `runtimeTruth.structuredOperatorExecutionPlanAvailable` must be true. | Reads `OfficialResultReview`, current `Market`, linked `Event`, and existing canonical approval/preflight/execution id fields. No schema changes and no writes. | None. The route uses durable review rows and current market state; it does not invent settlement state, call providers, spend quota, or expose confirmation strings. | Authenticated operator action endpoints, production official-result polling, durable execution attempts, and operator UI remain P1/P2. |
| Structured settlement plan projection | `/api/internal/live-runtime/status`; gated by `npm run mobile:one-event-phase-audit` | GET plus local audit command | Local/dev only; no provider key and no mobile auth | Optional `phaseAuditInProgress=1` for audit bootstrap | `settlementQueue.structuredOperatorExecutionPlanAvailable` and `settlementQueue.firstItem.operatorExecutionPlan`, including structured blockers and redacted command metadata. Status returns `needs_attention` if the structured plan is missing or unsafe. | No schema changes. Projects phase-audit settlement queue evidence only. | Uses existing redacted settlement queue evidence; does not execute settlement, call providers, read secrets, or expose exact confirmation strings. | Production should replace local proof projection with authenticated queue/action records and audited execution controls. |

## Cycle MARKETMAKERQUOTERUNS - Durable Market-Maker Quote Run Records

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Durable local maker quote proof | `npm run mobile:market-maker-quote-run-record`; `npm run mobile:one-event-live-runtime -- -SeedMaker`; `/api/internal/live-runtime/status`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | Local Node command, shifted maker seed command, GET plus local audit commands | Local/dev only; no provider key and no mobile auth | Record command reads `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`; maker seed writes the same row after placing shifted bid/ask liquidity | `marketMakerQuoteRuns.checked/durable/source/latest/latestRunPassed/latestRunLocalOnly/latestRunShiftedWorseThanProvider/latestRunQuoteRouteReady/latestRunSnapshotFresh/installedOsService`; latest row includes event/market/outcome identity, maker user/order ids, provider bid/ask, planned maker bid/ask, quote-route status, and local-only metadata | Uses `MarketMakerQuoteRun`; maker seed still uses existing `Event`, `Market`, `Outcome`, `Order`, `User`, `UserBalance`, and `ReferenceQuoteSnapshot` models | Backfill uses existing redacted shifted-maker proof and spends no provider quota. Future maker seed runs persist the row while using the existing local fake-token maker liquidity path. | This proves selected-market local quote placement and quote-route visibility. It is not an installed continuous market-maker daemon, multi-event quote scheduler, risk dashboard, or production liquidity service. |
| Repeated maker quote run status | `/api/internal/live-runtime/status`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Local/dev only; no provider key and no mobile auth | None for status route; proof uses two `npm run mobile:one-event-live-maker-seed` runs | `marketMakerQuoteRuns.recent`, `recentRunCount`, `repeatedLocalRunCount`, `repeatedLocalRunsProven`; phase/completion audits require at least two recent passed local seed-script rows | Reads `MarketMakerQuoteRun`; maker seed writes rows through the existing local fake-token maker liquidity path | No provider quota and no fake odds. The proof uses stored provider snapshots and existing local maker seed behavior. | This proves repeated local quote refresh evidence for the selected market only. It is not an installed always-on maker service or multi-event inventory/risk engine. |

## Cycle CONTINUOUSSUPERVISORPROOFHARNESS - Process-Safe Continuous Supervisor Proof

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Continuous supervisor proof backend preflight | `npm run mobile:one-event-live-supervisor:continuous-proof`; `GET /api/health`; child proof calls `/api/internal/live-runtime/status` | Local PowerShell command plus local backend GET routes | Local/dev only; no provider key and no mobile auth | Backend port and continuous-supervisor proof settings: interval seconds, required iterations, provider/live-result flags when explicitly selected | `backendStartedByProof`, `backendStartedProcessStopped`, backend start status, health status, completed supervisor iterations, heartbeat iterations, runtime status pass, no-quota truth, P0/P1/P2 gaps | No schema changes. Child proof commands use existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `MarketMakerQuoteRun`, `RuntimeServiceHeartbeat`, and `RuntimeServiceRun` contracts already documented for local runtime proof. | Uses existing redacted provider-shaped evidence and stored provider snapshots. Default proof spends no provider quota and does not invent market data. | This is proof-owned local process startup/cleanup, not production service ownership. Installed backend/provider/maker/lifecycle supervision remains P1. |

## Cycle PROVIDERMAKERHANDOFF - Provider Refresh To Maker Quote Handoff

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Provider refresh to maker quote handoff | `npm run mobile:provider-maker-handoff`; gated by `npm run mobile:one-event-phase-audit` and `npm run mobile:live-runtime-completion-audit` | Local Node command; no HTTP route | Local/dev only; no provider key and no mobile auth | Optional `eventSlug`, optional `summaryPath` | `providerRun`, `latestMakerAfterProviderRefresh`, `runtimeTruth.providerRefreshToMakerQuoteHandoffProven`, same event/market/outcome truth, no-quota truth, P0/P1/P2 gaps | Reads `ProviderRefreshRun` and `MarketMakerQuoteRun`; no schema changes and no DB writes | Uses durable rows from existing provider refresh and maker quote proofs. It spends no provider quota and does not create mock odds or quotes. | This proves the selected one-event handoff only. Installed continuous maker service, multi-event provider-to-maker scheduling, and production risk controls remain P1/P2. |

## Cycle SETTLEMENTEXECUTIONEVIDENCE - Durable Settlement Execution Evidence

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local settlement queue execution evidence | `/api/internal/live-runtime/settlement-queue` | GET | Local/dev only; route returns 404 in production or when `HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS=1`; no provider key and no mobile auth | None | `queue.items[].executionEvidence.status`, `canonicalExecutionEventAvailable`, `canonicalExecutionEventId`, `resultDigestAvailable`, `exactConfirmationStored=false`, `exactConfirmationRedacted=true`, `providerQuotaUsed`, `activeMarketExecutionAttempted`; `runtimeTruth.durableExecutionEvidenceAvailable`; `checks.canonicalExecutionEvidenceForExecutedReviews` | Reads `OfficialResultReview`, current `Market`, linked `Event`, and canonical execution event ids already stored on the review row. No schema change. | Uses existing durable review rows only. It does not invent settlement state, call the provider, or expose exact confirmation strings. | Authenticated operator UI, installed official-result polling, and production active-event execution controls remain P1/P2. |
| Local runtime status execution evidence projection | `/api/internal/live-runtime/status`; `npm run mobile:one-event-phase-audit` | GET plus local Node audit | Local/dev only; no provider key and no mobile auth | None for route; optional audit output path | `settlementQueue.durableExecutionEvidenceAvailable` and `settlementQueue.firstItem.executionEvidence` are projected into the status route. Phase audit requires the evidence block to be present, redacted, and P0-clean. | Reads phase-audit settlement queue response plus existing runtime artifacts. No DB writes from status/audit. | Uses existing redacted proof artifacts and backend queue route only; no provider quota spend. | This is local internal proof/status, not a production settlement execution dashboard. |

## Cycle XG - Runtime Launch Command Audit Gate

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Launch-command audit gate | `/api/internal/live-runtime/status?phaseAuditInProgress=1`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Local/dev only; no provider key and no mobile auth | Optional `phaseAuditInProgress=1` | `serviceOwnership.localLaunch.recommendedProfileCommand`, `recommendedProfileInstallCommand`, `recommendedProfileUninstallCommand`, `recommendedProfileQuotaMode`, `recommendedProfileProductionBoundary`, `scheduledTaskPlanCommand`, `scheduledTaskInstallCommand`, `liveProviderCommand`, `liveProviderInternalTesterCommand`, `liveProviderDefaultForInternalTesting=false`, and `liveProviderQuotaMode` | No DB writes and no schema changes. Reads existing local runtime status projection and redacted launch-profile evidence. | None. The audits only verify command fields and no-quota/live-provider safety metadata; they do not execute commands. | Installed unattended service ownership, authenticated production operator controls, and durable job execution records remain P1/P2. |

## Cycle XH - Runtime Ownership Proof Projection

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Runtime ownership proof projection | `/api/internal/live-runtime/status?phaseAuditInProgress=1`; `npm run mobile:local-runtime-launch-profile`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | GET plus local report/audit commands | Local/dev only; no provider key and no mobile auth | Optional `phaseAuditInProgress=1` | `serviceOwnership.localLaunch.ownershipProof.startup.installProofPass/launcherInstalledNow/proofLeavesNoLauncher`, `scheduledTask.installAuditPass/installBlockedByWindowsPermission/installedNow/proofLeavesNoTask`, and `foregroundProcesses.noProviderQuotaByDefault/activeTesterSettlementNotExecuted` | No DB writes and no schema changes. Reads existing local runtime launch, Startup proof, scheduled-task proof, supervisor proof, and result-poller proof artifacts. | None. The route reports current proof/install truth only and does not install or start anything. | Installed unattended production service ownership, authenticated production operator controls, and durable job execution records remain P1/P2. |

## Cycle XI - Settlement Automation Status Contract

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Official-result settlement automation status | `/api/internal/live-runtime/status?phaseAuditInProgress=1`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Local/dev only; no provider key and no mobile auth | Optional `phaseAuditInProgress=1` | `settlementAutomation.checked/mode/resultPolling/approvedScheduler/activeEvent/safety/p0/p1`, including no-quota default, explicit live-result provider-key requirement, approved scheduler proof, active event market status, approved review truth, closed-state eligibility proof, exact confirmation redaction, and no active execution truth | No DB writes and no schema changes. Reads existing local phase audit result-review and settlement-queue route evidence, active settlement readiness artifacts, runtime status artifacts, supervisor/result-poller process state, and canonical audit event evidence already projected through those reports. | None. The route summarizes existing settlement proof only and does not execute settlement. | Installed official-result polling, authenticated operator UI, and production execution controls remain P1/P2. |

## Cycle XK - Production Readiness Boundary Status

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Production readiness boundary | `/api/internal/live-runtime/status?phaseAuditInProgress=1`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Local/dev only; no provider key and no mobile auth | Optional `phaseAuditInProgress=1` | `productionReadinessBoundary.checked/localInternalRuntimeReady/localTesterReadyRightNow/productionReady/fullProductionRuntimeComplete/fakeTokenOnly/noRealMoneyDeployment/defaultModeSpendsProviderQuota/providerRefreshStatusRouteSpendsQuota/currentServiceModel/installedUnattendedService/liveProviderRefreshLoopRunning/officialResultAutomation/productionBlockers/requiredBeforeProduction/p0/p1` | No DB writes and no schema changes. Composes existing `serviceOwnership`, `providerRefreshLoop`, `settlementAutomation`, and `currentRuntimeState` status blocks. | None. The route reports readiness boundaries only and does not execute commands, install services, call providers, or settle markets. | Production needs installed/hosted service ownership, authenticated operator controls, installed official-result polling, durable job monitoring, retry, alerting, and explicit production settlement execution governance. |

## Cycle XL - Operator Auth Requirements Boundary

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Production operator auth requirements boundary | `/api/internal/live-runtime/status?phaseAuditInProgress=1`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Local/dev only today; no provider key and no mobile auth. Future production routes must require authenticated internal operator identity and roles. | Optional `phaseAuditInProgress=1` | `operatorControlBoundary.productionAuthRequirements.version/status/p1Gap/mustRemainServerOwned/publicMobileRouteAllowed/providerQuotaRequired/requiredRoutes/requiredSchema/requiredGuards`; audits require a settlement execution route contract, `OperatorAuditEvent`-equivalent schema requirement, no public mobile route, and exact-confirmation/closed-market guards. | No DB writes and no schema changes in this cycle. Future production support requires operator identity fields on `OfficialResultReview` and an `OperatorAuditEvent` or equivalent audit table with operator id, review id, action, role snapshot, request id, and timestamp. | None. The route reports production requirements only and does not create sessions, approve reviews, execute settlement, call providers, or expose exact confirmation strings. | Actual authenticated operator session route, approval route, execution route, durable role checks, two-person/admin approval, and production operator UI remain P1. |

## Cycle XM - Operator Session Route Foundation

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal operator session discovery | `/api/internal/operator/session`; `/api/internal/live-runtime/status?phaseAuditInProgress=1`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Existing admin session auth via `requireAdmin()`. In non-production, the existing dev admin header path remains available through `requireAdmin()`. No provider key and no mobile auth. | None | `operator.id/email/username/roles/roleSource/durableIdentityAvailable`, `capabilities.canReviewSettlementQueue`, `canApproveSettlement=true`, `canExecuteSettlement=false`, `canViewExactConfirmation=false`, and status projection `operatorControlBoundary.productionAuthRequirements.requiredRoutes[].implementationStatus`. | Reads `User` through existing admin auth. No schema changes. Future production support still needs dedicated operator roles and audit records. | None. The route uses the authenticated admin user only and does not create mock operator identities. | Execution route, two-person/admin approval workflow, dedicated operator role model, durable operator audit events, and operator UI remain P1. |

## Cycle XN - Operator Settlement Approval Route

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal operator settlement approval | `/api/internal/live-runtime/settlement-queue/:reviewId/approve`; `/api/internal/live-runtime/status?phaseAuditInProgress=1`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | POST plus local audit commands | Existing admin session auth via `requireAdmin()`. Route returns 404 in production or when `HOLIWYN_DISABLE_INTERNAL_OPERATOR_CONTROLS=1`. No provider key and no mobile auth. | Path param `reviewId`. No body required. | `status=ready`, `review.approvalStatus=approved`, `review.executionEligibleNow=false`, `approvalEvidence.canonicalApprovalEventAvailable=true`, `operator.durableIdentityRecorded=true`, `providerQuotaUsed=false`, `exactConfirmationExposed=false`, `exactConfirmationStored=false`, and `activeMarketExecutionAttempted=false`. Runtime status reports `settlement_approval` as `implemented_guarded_no_execution`. | Reads `OfficialResultReview`, `Market`, and admin `User`; writes `CanonicalEvent` with operator `userId`; updates `OfficialResultReview.approvalStatus`, `settlementApprovalCanonicalId`, and redacted `reviewSnapshot`. No schema migration. | None. The route uses an existing review row and authenticated operator. It does not fabricate result/preflight evidence or approval files. | Execution endpoint, exact-confirmation execution handoff, dedicated operator roles, two-person/admin approval workflow, and operator UI remain P1. |

## Cycle XO - Guarded Settlement Execution Dry-Run Route

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal operator settlement execution | `/api/internal/live-runtime/settlement-queue/:reviewId/execute`; `/api/internal/live-runtime/status?phaseAuditInProgress=1`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | POST plus local audit commands | Existing admin session auth via `requireAdmin()`. Route returns 404 in production or when `HOLIWYN_DISABLE_INTERNAL_OPERATOR_CONTROLS=1`. No provider key and no mobile auth. | Path param `reviewId`. Empty body or `{ "dryRun": true }` requests dry-run audit. `{ "execute": true, "exactConfirmation": "<operator-held exact phrase>" }` attempts local execution only after all guards pass. | Dry-run success: `status=dry_run_ready`, `executionRequestEvidence.canonicalExecutionRequestEventId`, `operator.durableIdentityRecorded=true`, `providerQuotaUsed=false`, `mutatesSettlement=false`, `exactConfirmationExposed=false`, `exactConfirmationStored=false`, `activeMarketExecutionAttempted=false`. Execution success: `status=executed`, `executionEvidence.canonicalExecutionEventId`, `providerQuotaUsed=false`, `mutatesSettlement=true`, `exactConfirmationExposed=false`, `exactConfirmationStored=false`, `activeMarketExecutionAttempted=true`. Blocked: `status=execution_blocked`, `blockerKeys`, and no settlement mutation. Runtime status reports `settlement_execution` as `implemented_guarded_exact_confirmation_local_execution`. | Reads `OfficialResultReview`, linked approval `CanonicalEvent`, current `Market`, and admin `User`; dry-run writes `CanonicalEvent(eventType=settlement.trusted_result.execution.dry_run_requested)` and redacted `reviewSnapshot.operatorExecutionDryRun`; exact-confirmed execution calls `resolveOrderbookMarket`, writes `CanonicalEvent(eventType=settlement.trusted_result.executed)`, `OperatorAuditEvent(action=settlement_execution_completed)`, and redacted `reviewSnapshot.operatorExecution`. No schema migration. | None. The route uses existing review/preflight/approval evidence and authenticated operator identity. It does not fabricate exact confirmation or provider result state. | Production still needs dedicated production settlement-operator role model, installed official-result polling, and operator UI. Exact confirmation remains operator-held and is never returned or stored by the route. |

## Cycle XP - Operator Auth Gate For Result Review And Settlement Queue

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Authenticated local result review | `/api/internal/live-runtime/result-review`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Existing admin session auth via `requireAdmin()`. Route returns 401 without auth, 404 in production/disabled mode. Phase audit sends `x-dev-admin-user-id` resolved from local admin user. | Optional `eventSlug`, `marketId`. | Same redacted result-review fields as before, plus route-level proof that unauthenticated access is blocked. Runtime status reports `localControls.resultReviewRoute.authRequired=true`. | Reads `User` through admin auth, then existing `OfficialResultReview`, `CanonicalEvent`, `Market`, and event evidence. No schema migration. | None. | Dedicated settlement-operator role model and production operator UI remain P1. |
| Authenticated local settlement queue | `/api/internal/live-runtime/settlement-queue`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Existing admin session auth via `requireAdmin()`. Route returns 401 without auth, 404 in production/disabled mode. Phase audit sends `x-dev-admin-user-id` resolved from local admin user. | None. | Same redacted queue/operator plan fields as before, plus route-level proof that unauthenticated access is blocked. Runtime status reports `localControls.settlementQueueRoute.authRequired=true`. | Reads `User` through admin auth, then existing `OfficialResultReview`, `Market`, and event evidence. No schema migration. | None. | Dedicated production settlement-operator role model and production operator UI remain P1; Cycle XR adds the dry-run two-person/admin policy check and Cycle XS adds guarded local exact-confirmed execution. |

## Cycle XQ - Durable Operator Audit Event Table

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Durable settlement approval operator audit | `/api/internal/live-runtime/settlement-queue/:reviewId/approve`; `/api/internal/live-runtime/status?phaseAuditInProgress=1`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | POST plus local audit commands | Existing admin session auth via `requireAdmin()`. Route remains internal/dev and disabled in production/disabled mode. | Path param `reviewId`. No body required. | First approval response includes `approvalEvidence.operatorAuditEventId`; runtime status reports `OperatorAuditEvent.status=implemented_dedicated_operator_audit_table` and `localControls.settlementApprovalRoute.operatorAuditEventRecorded=true`. | Adds `OperatorAuditEvent` with operator id, review id, action, role snapshot, request id, canonical event id, metadata, and created timestamp. The row links to `User` and `OfficialResultReview`. | None. | Dedicated production settlement-operator role model, production operator UI, and installed official-result polling remain P1; Cycle XR adds the dry-run two-person/admin policy check and Cycle XS adds guarded local exact-confirmed execution. |
| Durable settlement execution dry-run operator audit | `/api/internal/live-runtime/settlement-queue/:reviewId/execute`; `/api/internal/live-runtime/status?phaseAuditInProgress=1`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | POST plus local audit commands | Existing admin session auth via `requireAdmin()`. Route remains internal/dev and disabled in production/disabled mode. | Path param `reviewId`; dry-run requests remain audit-only, while Cycle XS adds guarded local exact-confirmed execution for reviewed CLOSED markets. | Guard-passing dry-run response includes `executionRequestEvidence.operatorAuditEventId`; runtime status reports `localControls.settlementExecutionRoute.operatorAuditEventRecorded=true`. | Writes `OperatorAuditEvent(action=settlement_execution_dry_run_requested)` only after CLOSED/approval/preflight/safety guards and the dry-run two-person/admin policy pass. Blocked active `LIVE` market requests remain non-mutating. | None. | Dedicated production settlement-operator role model, production operator UI, and installed official-result polling remain P1. |

## Cycle XR - Two-Person Or Admin Execution Dry-Run Policy

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Guarded settlement execution policy | `/api/internal/live-runtime/settlement-queue/:reviewId/execute`; `/api/internal/live-runtime/status?phaseAuditInProgress=1`; phase/completion audits | POST plus local audit commands | Existing admin session auth via `requireAdmin()`. Route remains internal/dev and disabled in production/disabled mode. | Path param `reviewId`; dry-run requests write audit evidence only, while `{ "execute": true, "exactConfirmation": "<operator-held exact phrase>" }` can execute only after all guards pass. | Guard-passing dry-run response includes `executionRequestEvidence.twoPersonOrAdminPolicy`; exact-confirmed execution response includes `executionEvidence.twoPersonOrAdminPolicy`; status reports `localControls.settlementExecutionRoute.twoPersonOrAdminPolicyChecked=true`. Blocked same-operator/non-admin cases return `blockerKeys=["two_person_or_admin_policy_not_satisfied"]`. | Reads `OfficialResultReview`, linked approval `CanonicalEvent`, current `Market`, and authenticated operator identity. Writes no evidence when the policy blocks. | None. | Dedicated production settlement-operator role model, production operator UI, and installed official-result polling remain P1. |

## Cycle XS - Exact-Confirmed Local Settlement Execution Route

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local exact-confirmed settlement execution | `/api/internal/live-runtime/settlement-queue/:reviewId/execute`; `/api/internal/live-runtime/status?phaseAuditInProgress=1`; phase/completion audits | POST plus local audit commands | Existing admin session auth via `requireAdmin()`. Route remains internal/dev and disabled in production/disabled mode. | Path param `reviewId`. `{ "execute": true, "exactConfirmation": "<operator-held exact phrase>" }` executes only when the review is approved, preflight evidence exists, approval canonical event carries matching confirmation evidence, current market is `CLOSED`, execution eligibility is true, exact confirmation matches, and two-person/admin policy passes. | Success reports `status=executed`, `executionEvidence.canonicalExecutionEventId`, `executionEvidence.operatorAuditEventId`, `providerQuotaUsed=false`, `mutatesSettlement=true`, `exactConfirmationExposed=false`, `exactConfirmationStored=false`, and `activeMarketExecutionAttempted=true`. Blocked responses report `blockerKeys` and no mutation. Status reports `exactConfirmationExecutionSupported=true`, `executeRequiresClosedMarket=true`, `executeRequiresApproval=true`, and `executeRequiresExactConfirmation=true`. | Reads `OfficialResultReview`, approval `CanonicalEvent`, `Market`, `Outcome`, `Position`, `Order`, `UserBalance`, and authenticated `User`; calls existing `resolveOrderbookMarket`; writes `CanonicalEvent(eventType=settlement.trusted_result.executed)`, `OperatorAuditEvent(action=settlement_execution_completed)`, and `OfficialResultReview.settlementExecutedCanonicalId` on success. | None. Focused tests mock Prisma and settlement service; runtime path uses real DB/settlement service. | Installed official-result polling, production settlement-operator role model, and production operator UI remain P1. |

## Cycle CASHOUTS23B - Spain vs France Close-Position Cashout

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portfolio cashout close-position ticket | `/api/markets/:marketId/quote`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | GET then POST then GET | Existing mobile API key/session auth for quote/order/portfolio routes | Quote: `outcomeId` query param. Order: `marketId`, `outcomeId`, `side=SELL`, `contractSide=YES/NO`, `price` from latest bid, `size` from owned shares, and preserved `selection` identity. | Quote: `bestBid`, `bestAsk`, sizes, outcome identity. Order: status/filled/remaining. Portfolio/history: updated position and sold activity. | Existing `Market`, `Outcome`, `Order`, `Fill`, `Trade`, `Position`, `UserBalance`, and portfolio/history read models. No schema change. | Mock mode remains local-only and still blocks no-share/oversell through shared guards. | Dedicated cashout preview/proceeds endpoint remains optional P1; existing quote/order routes are enough for local internal testing. |

## Cycle XY - Clean Worktree Runtime Audit Env Loading

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live-runtime phase audit admin discovery | `/api/internal/live-runtime/result-review`; `/api/internal/live-runtime/settlement-queue`; `/api/internal/live-runtime/status`; `npm run mobile:one-event-phase-audit` | GET plus local audit command | Existing local admin proof via `x-dev-admin-user-id`; the audit resolves the admin id from local Prisma using `DATABASE_URL` loaded from local env candidates | No request body. Optional `DOTENV_CONFIG_PATH` can point at a local env file. | Result-review and settlement-queue readiness, redaction, no-quota, and no-execution fields consumed by the phase audit. | Reads `User` for local admin discovery. No DB writes and no schema changes. | None. The helper only loads required env values into the local process if missing; it does not create mock admin users. | If no local `DATABASE_URL` is available, the audit cannot authenticate internal operator route checks and fails with a setup message. |

## Cycle XZ - Durable Runtime Proof Writer Env Loading

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Durable provider/maker/runtime proof rows | `/api/internal/live-runtime/status?phaseAuditInProgress=1`; `npm run mobile:provider-refresh-run-record`; `npm run mobile:market-maker-quote-run-record`; `npm run mobile:runtime-run-record`; `npm run mobile:one-event-runtime-status`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | GET plus local proof writer commands | Local/dev only; no mobile auth and no provider key | Commands read existing redacted proof summaries and local `.env`/`DATABASE_URL`; status uses optional `phaseAuditInProgress=1` during phase regeneration | Status/audits consume `providerRefreshLoop.latestRun`, `serviceOwnership.durableEvidence`, `runtimeRuns.records`, `currentRuntimeState`, and zero-P0 phase/completion results | Writes/reads `ProviderRefreshRun`, `MarketMakerQuoteRun`, `RuntimeServiceRun`, `RuntimeServiceHeartbeat`, and `CanonicalEvent` audit evidence. No schema change. | None. Writers use existing proof summaries and local DB, not ad hoc fixtures. | Fresh mobile-visible live odds still require explicit quota-capped provider refresh. Installed unattended services and production official-result auto-settlement remain P1. |
| Durable result/settlement audit evidence | `/api/internal/live-runtime/result-review`; `/api/internal/live-runtime/settlement-queue`; `npm run mobile:one-event-result-ingestion-audit-event-proof`; `npm run mobile:one-event-settlement-audit-event-proof`; `npm run mobile:one-event-settlement-approval-audit-event-proof` | GET plus local proof writer commands | Existing local admin proof for GET routes; writer commands are local/dev only and no provider key | Writer commands read trusted/redacted result summaries, reviewed settlement preflight evidence, and local `.env`/`DATABASE_URL` | Result-review and queue routes consume canonical provider-result, settlement preflight, and approval evidence without exposing exact confirmation strings | Writes/reads `CanonicalEvent` and `OfficialResultReview` evidence used by local result-review and settlement-queue status. No schema change. | None. The proof uses stored provider-shaped result evidence and does not call live provider APIs. | Production operator UI, dedicated operator roles, and installed official-result polling remain P1. |

## Cycle S23READINESS - Spain vs France Internal Tester Flow Refresh

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S23 Spain vs France Home and Event Detail proof | `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1`; `/api/mobile/events/:slug/live-detail` | GET | Public browse route plus existing mobile server-mode config | Event slug `odds-api-single-soccer-test`; no provider key used in S23 proof | Home title/source identity; event teams; grouped markets; selected totals line `2.5`; selected outcome `Over 2.5`; source `sportsbook-odds` | Reads existing `Event`, `Market`, `Outcome`, and `ReferenceQuoteSnapshot` rows imported from the Odds API replay/live proof | No mobile ad hoc fallback. Current-state readiness accepts approved sources `polymarket` or `sportsbook-odds` and line status `provider-backed`, `partial-provider-backed`, or `contract-fixture` for the Local MVP path. | Full Polymarket provider parity and attach-ready World Cup match/line candidates remain P1. |
| S23 buy, cashout, and history proof | `/api/markets/:marketId/quote`; `/api/orders`; `/api/portfolio`; `/api/portfolio/history` | GET, POST, GET, GET | Existing mobile API key/session auth | Quote includes selected `outcomeId`. Buy order uses selected market/outcome with buy size. Cashout order uses `side=SELL`, owned `marketId`, owned `outcomeId`, `size` from owned shares, and current bid/sell price. | Quote `bestBid`/`bestAsk`; order fill status; Portfolio position identity; close-position ticket mode; owned share quantity; sell history row | Reads/writes existing `Order`, `Trade`, `Position`, `UserBalance`, `Market`, and `Outcome`. Counterparty proof scripts seed deterministic local maker orders for the selected outcome. No schema change. | One-shot local maker liquidity is used only to fill the proof buy and cashout. It is not a continuous bot. | Dedicated cashout preview route and continuous market-maker runtime remain P1/P2; neither blocks the current internal tester path. |
| Readiness harness local database discovery | Local scripts `mobile_backend_readiness.ps1`, `mobile_internal_readiness_batch.ps1`, and `start_poly_mobile_rehearsal.ps1` | Local process only | Local developer machine; secrets loaded into process env only | Reads `DATABASE_URL` from existing process env, `DOTENV_CONFIG_PATH`, local env files, or nearby `Poly/.env` | Backend readiness, startup contract, current-state inspection, root typecheck, Jest CI, mobile typecheck, S23 proof freshness, and P0/P1 blocker summary | No DB writes from the env loader itself. Downstream readiness scripts read current local DB state. | None. If no local database URL exists, readiness fails instead of fabricating state. | Clean machine setup still needs local env provisioning. |

## Cycle ZM - Internal Tester Operator Snapshot

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal tester operator snapshot | `/api/health`; `/api/internal/live-runtime/status`; local command `npm run mobile:internal-tester-operator-snapshot` | GET plus local command | Local/internal status route; no mobile auth and no provider key. The snapshot command is refused in production. | Optional `--baseUrl` and `--summaryPath`; no request body. | Health status, event, selected market, `runtimeTruth.localInternalRuntimeReady`, `currentRuntimeState`, `managedProcesses`, `providerSnapshots`, `operatorNextActions.recommendedFirstAction`, selected command, settlement decision, and P0/P1/P2 gaps. | No new schema. Status route may mirror current process status into existing runtime heartbeat rows as it already did before this cycle. | None. If health/status is not ready or no recommended command exists, the snapshot fails instead of fabricating readiness. | This is not an installed daemon and does not perform live provider refresh. Installed service ownership and production official-result auto-settlement remain P1. |

## Cycle ZN - Operator Snapshot Audit Gate

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Operator snapshot phase/completion gate | `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit`; reads `docs/mobile/harness/odds-api-live-runtime/internal-tester-operator-snapshot.redacted.json` | Local commands | No provider key and no mobile auth. | No request body. Snapshot must already be generated by `npm run mobile:internal-tester-operator-snapshot`. | `pass=true`, `providerQuotaUsedByThisReport=false`, `runtime.localInternalRuntimeReady=true`, `operatorNextActions.recommendedCommand`, `operatorNextActions.selectedAction.spendsProviderQuota`, `settlement.activeTesterSettlementExecutionAttempted=false`, and empty `gaps.p0`. | No new schema. | None. Missing/stale/failing snapshot causes audit failure instead of a mock operator handoff. | Installed service ownership and production official-result auto-settlement remain P1. |

## Cycle ZO - Unattended Runtime Readiness Classification

| Mobile/runtime feature | API endpoint used | Method | Auth requirement | Request body / params | Response fields consumed by mobile/proof | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Runtime ownership decision | `/api/internal/live-runtime/status?phaseAuditInProgress=1`; `npm run mobile:one-event-phase-audit`; `npm run mobile:live-runtime-completion-audit` | GET plus local audit commands | Local/internal status route; no mobile auth and no provider key. | Optional `phaseAuditInProgress=1` for audit-safe status generation. | `serviceOwnership.unattendedReadiness.checked`, `classification`, `localInternalTesterReady`, `installedProductionServiceReady`, `productionDaemonInstalled`, `foregroundLoopsProven`, `startupFallbackProven`, `scheduledTaskPlanProven`, `scheduledTaskInstallBlockedByWindowsPermission`, `noProviderQuotaByDefault`, `recommendedInternalMode`, `nextOperatorAction`, `p0`, and `p1`. | No schema change. The route reads existing runtime proof artifacts plus `RuntimeServiceHeartbeat`, `RuntimeServiceRun`, `ProviderRefreshRun`, and `MarketMakerQuoteRun` evidence already used by status. | None. If launch ownership proof is missing, the classification reports incomplete readiness instead of fabricating an installed service. | Installed production daemon/service ownership remains P1; current Windows context still blocks scheduled-task registration, so internal testing uses foreground/runtime manager or user Startup fallback. |
## Cycle ZP - Operator Snapshot Tester Checklist

| Mobile/internal feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/tooling | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal tester launch checklist | `/api/health`; `/api/internal/live-runtime/status`; local command `npm run mobile:internal-tester-operator-snapshot` | GET plus local command | Local/internal status route; no mobile auth and no provider key. The snapshot command refuses production. | Optional `--baseUrl` and `--summaryPath`; no request body. | `event.title`, `event.localSlug`, `selectedMarket.title`, `selectedMarket.outcomeName`, `operatorNextActions.recommendedCommand`, `currentRuntimeState.warmNoQuotaRuntime`, `currentRuntimeState.providerSnapshotFresh`, `serviceOwnership.unattendedReadiness.localInternalTesterReady`, `settlementDecision`, and P0/P1/P2 gaps. | No new schema. The status route may mirror current process status into existing runtime heartbeat rows as before. | None. If health/status is unavailable or the recommended command is missing, the snapshot fails. | Installed service ownership and production official-result auto-settlement remain P1. |
## Cycle ZR - Live Provider Secret Preflight Wrapper

| Mobile/internal feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/tooling | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Live provider secret preflight | Local command `npm run mobile:one-event-live-runtime:provider-secret-preflight`; optional delegated command `npm run mobile:one-event-live-runtime:provider-secret` | Local PowerShell command; delegated provider refresh uses existing local backend/provider proof routes | Local-only. Secret source is process `THE_ODDS_API_KEY` or ignored `.runtime/secrets/the-odds-api-key.txt`; the key is not printed or passed on the command line. | Preflight args: optional secret path, summary path, refresh iteration/quota caps. Refresh mode passes existing one-event live-proof args. | Redacted fields: `secret.source`, `envPresent`, `filePresent`, `fileHasValue`, `providerQuotaUsedByPreflight=false`, `providerProofRan`, quota caps, and next action. | No schema changes. Refresh mode still uses existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `ProviderRefreshRun`, and maker/order models through existing proof scripts. | None. Missing key is reported as `live_provider_secret_missing`; it does not fabricate provider data. | Production needs secret management and authenticated job controls. This local wrapper only protects the current internal tester live-refresh path. |

## Cycle ZW2 - Internal Tester Readiness Recovery

| Mobile/internal feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/tooling | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ordered internal tester readiness gate | `/api/health`; `/api/markets/:marketId/quote`; `/api/internal/live-runtime/status?phaseAuditInProgress=1`; local commands `mobile:internal-tester-operator-snapshot` and `mobile:internal-tester-readiness-gate` | GET plus local commands | Local/internal route and local proof commands; no provider key and no mobile auth. | Optional `--baseUrl`/summary path for scripts; quote uses selected `outcomeId`. | Backend health, selected outcome bid/ask, warm no-quota runtime state, supervisor/result-poller running state, operator next action, P0/P1/P2 gaps, and tester checklist. | Reads existing `Market`, `Outcome`, `Order`, `RuntimeServiceHeartbeat`, `RuntimeServiceRun`, `ProviderRefreshRun`, `MarketMakerQuoteRun`, `CanonicalEvent`, and `OfficialResultReview` evidence. Local maker seed may write fake-token maker orders and quote-run evidence. | None. Missing quote visibility, stopped runtime loops, or stale result/settlement evidence fails the gate instead of creating UI-only mock data. | Installed unattended provider/maker/lifecycle service ownership and production official-result auto-settlement remain P1. |

## Cycle ZW3 - Readiness Contract Split

| Mobile/internal feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/tooling | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Local tester readiness status | `/api/internal/live-runtime/status`; `/api/internal/live-runtime/status?phaseAuditInProgress=1`; local commands `mobile:internal-tester-operator-snapshot` and `mobile:internal-tester-readiness-gate` | GET plus local commands | Local/internal route and local proof commands; no provider key and no mobile auth. | Optional `phaseAuditInProgress=1` during audit regeneration. | `runtimeTruth.localTesterReadyRightNow`, `runtimeTruth.cachedTesterReadyRightNow`, `runtimeTruth.liveOddsReadyRightNow`, `currentRuntimeState.cachedTesterReadyRightNow`, `currentRuntimeState.liveOddsReadyRightNow`, provider snapshot freshness, and operator next actions. | No schema change. Reads existing runtime proof artifacts and local process state. | None. Stale live odds are reported as `liveOddsReadyRightNow=false` with a key-gated refresh action, while cached tester readiness remains separate. | Installed unattended provider/maker/lifecycle service ownership and production official-result auto-settlement remain P1. |

## Cycle ZW4 - Live Odds Refresh Proof

| Mobile/internal feature | API endpoint used | Method | Auth requirement | Request body | Response fields consumed by mobile/tooling | Database tables/models implied | Mock fallback behavior | Missing backend support |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| One-event live provider odds refresh | The Odds API `/v4/sports`, `/v4/sports/:sport/events`, `/v4/sports/:sport/events/:eventId/markets`, `/v4/sports/:sport/events/:eventId/odds`; local routes `/api/mobile/events/:slug/live-detail`, `/api/markets/:marketId/quote`, `/api/orders`, `/api/portfolio`, `/api/portfolio/history`, `/api/internal/live-runtime/status` | Provider GETs plus local GET/POST proof routes | Provider key from ignored local runtime secret file only; local fake-token API key/session for order/portfolio proof | Provider odds query uses one event, `regions=us`, markets `h2h`, `spreads`, `totals`, `h2h_3_way`, `alternate_spreads`, `alternate_totals`, decimal odds, ISO dates. Orders use selected market/outcome, side, price, size, and preserved selection identity. | Fresh provider quote snapshot timestamps/status, normalized event/market/outcome identity, shifted maker bid/ask, order fill status, portfolio position/history state, no-position sell rejection, closed-market rejection, runtime readiness fields. | Existing `Event`, `Market`, `Outcome`, `ReferenceQuoteSnapshot`, `Order`, `Trade`, `Position`, `UserBalance`, `ProviderRefreshRun`, and `MarketMakerQuoteRun` evidence. No schema change. | None. If provider key is missing, preflight passes only as setup status and does not fabricate odds. | Installed continuous provider/maker/lifecycle service ownership remains P1; production official-result settlement remains P1; multi-event provider polling remains P2. |
