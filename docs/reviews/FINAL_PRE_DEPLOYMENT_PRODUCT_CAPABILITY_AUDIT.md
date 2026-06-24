# Final Pre-Deployment Product Capability Audit

Date: 2026-06-24

Branch audited: `dev`

Audited commit: `9d37d43 docs(beta): add final server deployment commands (#229)`

## 1. Executive Summary

POLY is a real Next.js prediction-market application with sports/event/market discovery, event detail pages, market detail pages, orderbook trading APIs, orderbook matching, ledger-backed balances, positions, settlement, portfolio display, guarded internal funding APIs, Polygon USDC deposit wallet generation, deposit monitor/auto-credit code, withdrawal request holds, admin manual withdrawal review, admin market controls, reference-market tools, and separate bot/runtime services.

The safe deployment claim is narrower than the feature list. Current `dev` is suitable for an owner-controlled server deployment in Stage 0 Controlled Internal Beta mode only. Funding must boot disabled and kill-switched. Auto-credit must remain disabled until server smoke and a deliberate tiny real-chain drill. Live bots must remain disabled. Public beta is not ready.

## 2. Overall Readiness Classification

- Ready to Deploy Stage 0 Controlled Internal Beta.
- Ready to Enable Stage 1 Funding UI only after Stage 0 server smoke passes.
- Not yet ready to enable Stage 2 Auto-Credit until a real-chain Polygon USDC drill passes on the owner-controlled server.
- Not ready for Full Internal Funding Beta until deposit and withdrawal operator drills are recorded.
- Public Beta Not Ready.

## 3. Deploy Now? Yes/No

Yes, deploy current `dev` to the owner-controlled Windows/Linux server for Stage 0 controlled internal beta setup.

No, do not deploy it as public beta, unrestricted real-money funding, anonymous funding, live bots, automatic withdrawal broadcast, or production public launch.

## 4. Deploy Mode

First deployment mode must be:

```text
INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
```

Live bots disabled:

```text
POLY_BOTS_ENABLED=false
POLY_BOTS_LIVE_TRADING=false
POLY_BOTS_GLOBAL_KILL_SWITCH=true
POLY_BOTS_MODE=dryRun
LIVE_SYSTEM_LIQUIDITY_ENABLED=false
SYSTEM_LIQUIDITY_DRY_RUN=true
```

## 5. Public Beta Readiness

Public beta is not ready. Blocking reasons:

- funding is allowlisted internal-only.
- no server-side real-chain deposit drill has been recorded in this audit.
- no server-side withdrawal request, manual payout, reject, and completion drill has been recorded in this audit.
- admin, bot, funding, and resolution operations are high-impact and need controlled operator evidence.
- live bots are not approved.
- automatic withdrawal broadcast is not implemented or approved.
- route smoke evidence is partly checklist/local evidence and still needs real browser smoke on the deployed server.

## 6. Feature Capability Matrix

| Capability | Status | Classification | Evidence |
| --- | --- | --- | --- |
| Homepage | Exists | Implemented, display tested by prior route smoke evidence | `src/app/page.tsx`, `INTERNAL_BETA_ROUTE_SMOKE_EVIDENCE.md` |
| Sports discovery | Exists | Implemented and tested | `/sports`, `/api/sports`, sports no-leak tests, `sports.event-market-model.test.ts` |
| Events list/detail | Exists | Implemented and tested | `/events`, `/events/[slug]`, event API no-leak tests |
| Markets list/detail | Exists | Implemented and tested, public contract still has documented gaps | `/markets`, `/markets/[id]`, public market tests |
| Sports/event grouped market browsing | Exists | Implemented, needs deployed browser smoke | `GroupedTradeTicket`, grouped event APIs |
| YES/NO display and price/odds display | Exists | Implemented | market cards, event detail panels, orderbook quote/book APIs |
| User order placement | Exists | Implemented and tested for internal/canonical paths | `POST /api/orders`, matching tests, canonical order tests |
| Matching engine | Exists | Implemented and tested | `src/server/services/matching.ts`, Phase 7/Phase 5 tests |
| Ledger-backed balances | Exists | Implemented and tested | `UserBalance`, `LedgerEntry`, ledger tests |
| Positions | Exists | Implemented and tested | `Position`, portfolio/account APIs |
| Market resolution | Exists | Implemented and tested | admin resolve routes, `settlement.ts`, Phase 7 tests |
| Portfolio | Exists | Implemented | `/portfolio`, `/api/portfolio`, canonical account APIs |
| Deposit address | Exists | Implemented and tested under guards | `/api/deposits/address`, wallet generation tests |
| Deposit UI | Exists | Guarded UI entry point | `/wallet`, `TransferCryptoModal` |
| Deposit monitor/auto-credit | Exists | Implemented with mocked/unit evidence; not server-real-chain proven | `polygonDeposits.ts`, deposit monitor tests |
| Withdrawal request hold | Exists | Implemented and tested, UI currently presents withdrawals unavailable | withdrawal routes/services/tests |
| Admin withdrawal review | Exists | Implemented and tested | `/admin/withdrawals`, admin withdrawal tests |
| Automatic withdrawal broadcast | Not present | Not implemented; must remain disabled | no signing/broadcast route in reviewed withdrawal flow |
| Admin market/user/funding controls | Exists | Implemented but high-risk | admin routes/pages |
| Bots/reference sync/arbitrage | Exists in app and `poly-bot` | Dry-run/reference tooling ready; live bots high-risk/disabled | bot docs and runtime guards |

## 7. Public App Readiness

Public pages present:

- `/`
- `/login`
- `/sports`
- `/sports/soccer`
- `/sports/soccer/world-cup`
- `/events`
- `/events/[slug]`
- `/markets`
- `/markets/[id]`
- `/portfolio`
- `/wallet`
- `/my-pools`
- `/pool/[id]`
- `/create`

Routes with code and test/docs evidence include sports, events, markets, market detail, portfolio, wallet, login, and admin smoke. Routes that still need real deployed browser smoke are the full public flow on the server, especially mobile layouts, grouped event trading, market detail trading submission, wallet modal gating, and admin withdrawal review pages.

The app is sports-first enough for internal beta: `/markets` defaults toward sports/NBA filters, `/sports` is event-first, event detail pages group sports markets, and market cards show Yes/No-style pricing. It does not appear to copy Polymarket or Robinhood trade dress; it uses POLY branding, its own layout system, neutral cards, teal/green/red accents, and internal beta copy. It does reference Polymarket as an import/reference source in admin/runtime contexts.

## 8. Sports/Event/Market Browsing Readiness

Users can browse sports, events, and markets. Users can open event detail and market detail pages. Users can see status, outcomes, prices/probabilities, bid/ask values where available, and live/resolved/all market views. This is implemented runtime behavior, not docs-only.

Readiness: Ready for Stage 0 internal browsing smoke. Needs real deployed browser smoke before wider internal testers.

## 9. Betting/Trading/Order Readiness

Market betting/order readiness: Implemented and tested for internal controlled testing; not public-beta ready.

Users can select outcomes and submit orders through the orderbook UI and canonical `/api/orders` path. The backend persists orders, matches compatible orders, updates balances/positions, emits events, and writes ledger entries. Market orders are still constrained by liquidity and canonical docs warn that unsupported market-order paths return guarded errors. The e2e evidence proves the trading UI opens; it may not always submit if no live liquidity exists.

This does not use external real money by itself. It uses app balances/test credits unless real funding has credited the account. Trading should be treated as internal beta only and should not be opened to public users.

## 10. Market Resolution Readiness

Market resolution readiness: Implemented and tested for admin/manual internal use; high-risk and not public-operator ready.

The app supports resolving public orderbook markets through admin routes and `resolveOrderbookMarket`. Resolution:

- requires admin auth.
- rate-limits sensitive admin action.
- cancels open orderbook orders.
- releases remaining BUY locked USDC and SELL reserved shares.
- verifies collateral invariants.
- credits winning positions at 1 USDC/share.
- writes winner ledger entries.
- zeros positions and market collateral.
- sets market status to `RESOLVED` and records winning outcome.

Private pool resolution also exists for pool owners and pays winners proportionally. Tests cover public resolution payout, open order cancellation/release, partial order release, private pool resolution, and settlement reconciliation.

Missing before public use: deployed operator smoke, admin workflow review, mistake-recovery playbook, and broader business/legal resolution policy.

## 11. Portfolio/Account Readiness

Portfolio and account display are implemented. `/portfolio` shows available/locked/total balance, open positions, resolved history, cost basis, current price, and PnL. Canonical account APIs expose balance, positions, and ledger for authenticated/API-key actors. This is runtime-backed by `UserBalance`, `Position`, `LedgerEntry`, orders, fills, and portfolio APIs.

Readiness: safe for Stage 0 internal display smoke. Not a public financial statement.

## 12. Funding/Deposit Readiness

Funding/deposit readiness: Deposit address generation and guarded UI are implemented; funding must remain disabled for Stage 0 first boot.

Each allowlisted internal user can receive a unique self-managed Polygon USDC EVM deposit address when funding beta is enabled, kill switch is off, and deposit env is valid. Private keys are generated server-side and stored encrypted. Tests verify private key and encrypted private key fields do not leak through deposit address/history routes.

Anonymous and non-allowlisted users are blocked. The kill switch blocks funding access. Deposit UI is a guarded modal on `/wallet`; it fetches `/api/deposits/address` and `/api/deposits`.

Required env names include:

- `DEPOSIT_WALLET_ENCRYPTION_KEY`
- `POLYGON_RPC_URL`
- `POLYGON_USDC_ADDRESS`
- `DEPOSIT_CONFIRMATIONS`
- `DEPOSIT_MIN_USD`
- `DEPOSIT_MONITOR_POLL_INTERVAL_MS`
- `INTERNAL_FUNDING_BETA_ENABLED`
- `FUNDING_KILL_SWITCH`
- `INTERNAL_FUNDING_ALLOWLIST_EMAILS`
- `ALLOW_AUTO_DEPOSIT_CREDIT`

## 13. Auto-Credit Readiness

Auto-credit readiness: Implemented with mocked/unit tests; not ready to enable at first deploy.

The Polygon monitor scans configured USDC `Transfer` logs to known deposit addresses, creates/upserts `Deposit` rows, waits for configured confirmations, applies ledger credit through `applyDepositTx`, and uses a deterministic tx/log-index idempotency key to prevent duplicate credit.

Stage 0: must remain disabled.

Stage 1: still disabled while allowlisted users only view deposit addresses.

Stage 2: can be enabled only for a tiny controlled drill after Stage 0 and Stage 1 smoke pass. The drill must prove exactly-once credit, no private key leakage, correct confirmations, and rollback readiness.

## 14. Withdrawal Readiness

Withdrawal readiness: Request/hold/reject/complete is implemented and tested; user-facing withdrawal UI is intentionally disabled/unavailable for public use; no automatic broadcast exists.

Users can request withdrawals through the guarded API when internal funding beta is enabled, kill switch is off, and they are allowlisted. The service validates amount/address, enforces limits, moves available USDC to locked USDC, creates a `WithdrawalRequest`, and writes ledger entries. Admins can list pending/recent requests, reject and release holds, or complete by recording a manually supplied payout tx hash. Completion consumes locked funds.

No route reviewed broadcasts an on-chain withdrawal. Auto-withdrawal must remain disabled/not implemented.

Readiness: internal operator drill only after funding gates and server smoke pass. Not public ready.

## 15. Admin Readiness

Admin pages/routes exist for:

- admin dashboard.
- system monitor.
- deposits.
- withdrawals.
- markets, market create/pause/cancel/close/resolve/outcomes/invariants.
- events and template market creation.
- reference markets/import/snapshot/seed-bot.
- bots.
- agents.

Admin APIs use `requireAdmin` or `assertAdmin`; normal users are expected to receive 401/403. Dev admin login is gated by `ALLOW_DEV_LOGIN=true` and `NODE_ENV !== production`.

Admin actions are real for market operations, funding review, withdrawals, reference imports, and bot/reference controls. They remain high-risk and require owner/operator-only use.

## 16. Bot/Runtime Readiness

Bots and runtime services exist in both repos:

- `poly` app reference/import/admin bot routes.
- `poly-bot` deterministic market makers.
- reference liquidity runtime.
- reference sync/cache.
- reference arbitrage observer/rebalancer.
- agent supervisor tooling.
- app-side Polygon deposit monitor.

During Stage 0 only the web app should run. Deposit monitor is separate from live trading bots and should not run until Stage 2. Live market-making/arbitrage bots are not approved. Risk controls are documented and tested in the bot repo, but live runtime remains a separate high-risk approval lane.

## 17. Auth/Allowlist Readiness

Google login exists through Google OAuth routes and account linking. Session auth uses signed cookies. Required auth env includes `NEXTAUTH_URL`, `APP_URL`, `NEXTAUTH_SECRET` or `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `ADMIN_EMAILS`.

Internal funding allowlist is email-based through `INTERNAL_FUNDING_ALLOWLIST_EMAILS`. Funding users are separate from admins, although admins are allowed through funding guards while beta is enabled. Anonymous users are blocked. Non-allowlisted users are blocked. Dev admin fallback is disabled in production by code.

## 18. Deployment/Server Readiness

Deployment readiness: Ready for Stage 0 owner-controlled server deployment with funding disabled/kill-switched.

Server must configure private env values, install dependencies, run Prisma generate/validate, apply existing migrations only after backup/risk acceptance, build the app, start on the intended port, and run health and route smoke. Required docs exist:

- `CONTROLLED_INTERNAL_BETA_SERVER_DEPLOYMENT_COMMANDS.md`
- `CONTROLLED_INTERNAL_BETA_ENV_REQUIRED.md`
- `CONTROLLED_INTERNAL_BETA_POST_DEPLOY_SMOKE.md`
- `CONTROLLED_INTERNAL_BETA_ROLLBACK_PLAN.md`
- `CONTROLLED_INTERNAL_BETA_SERVICE_RUNBOOK.md`

Checks that must pass:

- `git status --short --branch`
- `npm ci`
- `npx prisma generate --schema=prisma/schema.prisma`
- `npx prisma validate --schema=prisma/schema.prisma`
- `npx tsc --noEmit --pretty false --incremental false`
- `npm run test:ci`
- `npm run build`
- `/api/health`
- public route smoke
- anonymous funding/admin route block checks
- normal-user admin block checks
- allowlist/kill-switch checks before enabling funding UI

Rollback is documented: re-enable funding kill switch, disable auto-credit, disable bots, restart service, and if needed checkout last known good commit and rebuild. Do not delete ledger/deposit/withdrawal/balance rows as rollback.

## 19. Open PR/Stale PR Review

Open PRs observed:

- #210 draft, checkpoint after PR #209.
- #207 draft, checkpoint after PR #204.
- #206 draft, checkpoint after PR #204.
- #205 draft, checkpoint after PR #204.
- #198 draft, checkpoint after PR #196.
- #192 draft, checkpoint after PR #191.
- #177 open, UI post-merge state hygiene.
- #25 draft, `feat: polish admin wallet and pool UI`, conflicting.

These appear stale/checkpoint or human-only UI follow-up branches. None blocks Stage 0 deployment from current `dev`. PR #25 does not block deployment; it is draft, conflicting, and should not be merged without human review. The stale checkpoint PRs should likely be closed by the owner/human maintainer after confirming no unique work is needed.

## 20. Critical Blockers

Critical blockers for public beta:

- no deployed server smoke evidence yet.
- no real-chain auto-credit drill on the target server.
- no withdrawal operator drill on the target server.
- live bots not approved.
- funding must remain allowlisted and kill-switch guarded.
- public/non-allowlisted funding must remain blocked.
- automatic withdrawal broadcast is not implemented or approved.

No critical blocker was found for Stage 0 owner-controlled server deployment with funding disabled and live bots disabled.

## 21. Warnings

- Full route/browser/mobile smoke still needs to run after deployment.
- Trading is real but should be exercised only with controlled internal/test balances.
- Market resolution is real and high-impact; operator mistakes can mutate settlement state.
- Deposit private keys are self-managed and encrypted; custody operations need strict owner discipline.
- Wallet copy can mention deposit capability, but the guarded API blocks it under Stage 0.
- Withdrawal backend exists while user UI states withdrawals are unavailable; keep funding disabled until intentional drills.
- Bot repo contains live internal env/script surfaces; do not inspect or run secret-bearing files.

## 22. What Must Remain Disabled

- public funding.
- anonymous funding.
- non-allowlisted funding.
- auto-credit during Stage 0 and Stage 1.
- automatic withdrawal broadcast.
- live bots.
- live market-making.
- reference arbitrage live placement.
- removing allowlist.
- disabling kill switch before controlled Stage 1.
- public beta.

## 23. What Can Be Tested After Stage 0

After initial deployment with funding disabled/kill-switched:

- public pages load.
- `/api/health`.
- login and session flow.
- anonymous funding routes blocked.
- normal-user admin routes blocked.
- admin routes accessible only to owner admin.
- sports/events/markets browsing.
- market detail pages.
- portfolio and wallet display for authenticated users.
- kill-switch behavior.

## 24. What Can Be Enabled In Stage 1

Only after Stage 0 smoke passes:

```text
INTERNAL_FUNDING_BETA_ENABLED=true
FUNDING_KILL_SWITCH=false
ALLOW_AUTO_DEPOSIT_CREDIT=false
```

Stage 1 can test allowlisted deposit address generation and deposit history UI/API. Auto-credit remains off. Live bots remain off. Withdrawal request drill should wait until the owner is ready for manual operations.

## 25. What Can Be Enabled In Stage 2

Only after Stage 1 passes and the owner intentionally starts a tiny controlled deposit drill:

```text
INTERNAL_FUNDING_BETA_ENABLED=true
FUNDING_KILL_SWITCH=false
ALLOW_AUTO_DEPOSIT_CREDIT=true
```

Then run the deposit monitor for a limited drill and verify exactly-once credit after confirmations. Disable auto-credit immediately if any anomaly appears.

## 26. What Cannot Be Enabled Yet

- public beta.
- public/anonymous/non-allowlisted funding.
- automatic withdrawal broadcast.
- live bots or live arbitrage.
- unrestricted market resolution by non-admins.
- broad internal funding cohort without schema-backed/operator-reviewed funding profiles.

## 27. Final Recommendation

Deploy current `dev` to the owner-controlled Windows/Linux server now in Stage 0 mode only:

```text
INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
```

Run the deployment validation and post-deploy smoke checklist. Do not enable Stage 1 funding UI until Stage 0 smoke passes. Do not enable Stage 2 auto-credit until a tiny controlled real-chain drill is intentionally scheduled. Do not launch public beta.
