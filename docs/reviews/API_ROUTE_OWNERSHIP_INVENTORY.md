# API Route Ownership Inventory

This API-001 inventory groups the current `src/app/api` surface by ownership, risk, and future review routing. It is read-only and does not change API behavior.

## Summary

POLY has a broad API surface for public discovery, auth, account state, trading, pools, wallet/funding, admin operations, bots, agents, and streams. The MVP should keep public discovery and account reads understandable while treating trading, wallet/funding, admin mutations, and bot operations as high-review areas.

## Ownership Groups

| Group | Primary owner | Review owner | Notes |
|---|---|---|---|
| Public discovery | BackendAgent | FrontendAgent for UX consumers | Low to medium risk when read-only. |
| Auth/session | BackendAgent | SecurityAgent | Medium to high risk depending on auth behavior. |
| Account/portfolio reads | BackendAgent | LedgerWalletReviewerAgent if balances/positions are interpreted. |
| Trading/orderbook | BackendAgent | LedgerWalletReviewerAgent required for mutations. |
| Pools/private markets | BackendAgent | LedgerWalletReviewerAgent if balances/stakes change. |
| Wallet/deposit/withdrawal | LedgerWalletReviewerAgent | SecurityAgent required. |
| Admin operations | SecurityAgent | LedgerWalletReviewerAgent/BotAgent/DeploymentAgent by area. |
| Bot/reference | BotAgent | SecurityAgent required for live/risk behavior. |
| Agent monitor | DocsAgent/DeploymentAgent | SecurityAgent for autonomy claims. |
| Streams | BackendAgent | LedgerWalletReviewerAgent if order/balance semantics change. |

## Public Discovery Routes

| Routes | Risk | Canonical status | Notes |
|---|---|---|---|
| `/api/health` | Low | Canonical | Health check. |
| `/api/categories`, `/api/tags` | Low | Canonical | Public taxonomy reads. |
| `/api/markets`, `/api/markets/[id]` | Low/Medium | Canonical public market reads | Must not leak admin-only internals. |
| `/api/markets/[id]/chart`, `/api/markets/[id]/quote`, `/api/markets/[id]/trades` | Medium | Canonical read candidates | Price/liquidity display can affect user expectations. |
| `/api/markets/[id]/reference` | Medium | Internal/public-boundary review needed | Reference liquidity should not expose bot internals to normal users. |
| `/api/events`, `/api/events/[slug]`, `/api/events/[slug]/markets`, `/api/events/[slug]/grouped-markets` | Low/Medium | Canonical event reads | Sports/event-first MVP depends on these. |
| `/api/sports`, `/api/sports/soccer/events`, `/api/sports/soccer/world-cup/events` | Low | Canonical sports reads | Primary MVP discovery APIs. |

## Auth And Profile Routes

| Routes | Risk | Owner | Notes |
|---|---|---|---|
| `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/me` | Medium | BackendAgent + SecurityAgent | Auth/session behavior requires review. |
| `/api/auth/google/start`, `/api/auth/google/callback`, `/api/auth/link/google/start` | Medium | SecurityAgent | OAuth flow; no secret values should be printed. |
| `/api/auth/wallet/nonce`, `/api/auth/wallet/verify`, `/api/auth/link/wallet/start`, `/api/auth/link/wallet/verify` | Medium/High | SecurityAgent | Wallet auth/linking must stay distinct from funding wallet behavior. |
| `/api/profile/avatar` | Low | BackendAgent | Non-financial profile route. |
| `/api/dev/login-as-admin` | High | SecurityAgent | Dev-only path; must stay disabled outside safe dev settings. |

## Account And Portfolio Routes

| Routes | Risk | Owner | Notes |
|---|---|---|---|
| `/api/account/balance`, `/api/account/positions`, `/api/account/ledger` | High | LedgerWalletReviewerAgent | Read-only but financial interpretation must be accurate. |
| `/api/account/api-keys`, `/api/account/api-keys/[id]` | Medium/High | SecurityAgent | API key policy can enable automation and trading access. |
| `/api/portfolio`, `/api/portfolio/history` | Medium/High | BackendAgent + LedgerWalletReviewerAgent | Portfolio display can misstate balances, positions, PnL, or locked funds. |

## Trading And Orderbook Routes

| Routes | Risk | Canonical status | Notes |
|---|---|---|---|
| `/api/orderbook/[marketId]/book`, `/api/orderbook/[marketId]/trades` | Medium | Canonical read candidates | Read-only orderbook/trade tape. |
| `/api/orderbook/[marketId]/orders`, `/api/orderbook/[marketId]/orders/place`, `/api/orderbook/[marketId]/orders/cancel` | High | Canonical nested mutation candidates | Placement/cancel can affect locked funds and positions. |
| `/api/orderbook/place`, `/api/orderbook/cancel` | High | Legacy/canonical decision needed | Overlaps nested orderbook mutation routes. |
| `/api/orders`, `/api/orders/[id]`, `/api/fills` | High | Legacy/canonical decision needed | Overlaps orderbook routes and trade/fill state. |
| `/api/orderbook/[marketId]/mint` | High | Review required | Market/trading semantics unclear from route name alone. |
| `/api/markets/[id]/positions`, `/api/markets/[id]/resolve` | High | Review required | Position/resolution state is financial and settlement-adjacent. |

Any trading mutation route requires LedgerWalletReviewerAgent review and human review before implementation changes.

## Pool And Private Market Routes

| Routes | Risk | MVP status | Notes |
|---|---|---|---|
| `/api/pool-markets`, `/api/pool-markets/mine`, `/api/pool-markets/[id]` | Medium | Delayed/post-MVP | Private pools distract from sports orderbook MVP. |
| `/api/pool-markets/[id]/bet`, `/join`, `/cancel`, `/resolve` | High | Delayed/post-MVP | Can affect balances, stakes, and resolution. |
| `/api/private-pools/[poolId]/cancel`, `/api/private-pools/[poolId]/resolve` | High | Legacy/consolidation candidate | Overlaps pool-market operations. |

Pool implementation changes should be serialized behind an explicit human-approved issue.

## Wallet, Deposit, And Withdrawal Routes

| Routes | Risk | Status | Notes |
|---|---|---|---|
| `/api/wallet/balance`, `/api/wallet/transactions`, `/api/wallet/faucet` | High | Beta/account state | Balance and faucet behavior affect user financial expectations. |
| `/api/wallet/list`, `/api/wallet/link`, `/api/wallet/link-manual`, `/api/wallet/challenge` | Medium/High | Wallet linking | Must stay distinct from production custody/funding behavior. |
| `/api/wallet/usdc-balance` | High | External chain read | Requires config and chain review; can confuse beta users. |
| `/api/wallet/deposit-intent`, `/deposit-confirm`, `/deposit-status`, `/deposit-verify` | Critical | Funding architecture review required | Legacy/current deposit routes need canonical decision. |
| `/api/deposits`, `/api/deposits/address` | Critical | Polygon deposit flow | Per-user address/custody area. |
| `/api/wallet/withdraw`, `/api/wallet/withdraw/complete`, `/api/withdrawals`, `/api/withdrawals/request` | Critical | Withdrawal flow | Must remain gated/human-reviewed before real funds. |

No wallet/deposit/withdrawal implementation task should be automatic. Planning-only issues must route to SecurityAgent and LedgerWalletReviewerAgent.

## Admin Routes

| Area | Routes | Risk | Review owner |
|---|---|---|---|
| Admin market content | `/api/admin/markets`, `/create`, `/[id]`, `/[id]/outcomes`, `/pause`, `/[id]/pause`, `/[id]/close`, `/[id]/cancel` | High | SecurityAgent |
| Admin resolution | `/api/admin/markets/resolve`, `/api/admin/markets/[id]/resolve`, `/api/admin/markets/[id]/invariants` | Critical | SecurityAgent + LedgerWalletReviewerAgent |
| Admin events | `/api/admin/events`, `/api/admin/events/[id]`, `/markets/from-template`, `/markets/from-templates` | Medium/High | SecurityAgent |
| Admin deposits | `/api/admin/deposits`, `/api/admin/deposits/rescan` | Critical | SecurityAgent + LedgerWalletReviewerAgent |
| Admin withdrawals | `/api/admin/withdrawals`, `/api/admin/withdrawals/[id]/complete`, `/reject` | Critical | SecurityAgent + LedgerWalletReviewerAgent |
| Admin reference markets | `/api/admin/reference-markets`, `/[id]`, `/refresh-snapshot`, `/seed-bot`, `/polymarket/import`, `/api/admin/reference-quote-snapshots` | High | SecurityAgent + BotAgent |
| Admin bots | `/api/admin/bots`, `/api/admin/bots/[id]` | High | BotAgent + SecurityAgent |
| Admin agents | `/api/admin/agents/status`, `/activity`, `/runs`, `/runs/[runId]`, `/tasks`, `/logs`, `/files`, `/memory-review` | Medium/High | SecurityAgent + DeploymentAgent |
| Admin system | `/api/admin/system`, `/api/admin/market-ops-stats` | High | SecurityAgent + DeploymentAgent |

Admin route implementation changes require human review. Admin auth test inventory should be a separate high-risk planning task.

## Streams

| Routes | Risk | Owner | Notes |
|---|---|---|---|
| `/api/stream/market/[marketId]` | Medium | BackendAgent | Public market stream; stale/recovery behavior matters. |
| `/api/stream/me/orders` | High | BackendAgent + LedgerWalletReviewerAgent | User order stream can affect perceived order/balance state. |

## Canonical Decisions Needed

1. Trading mutations: choose canonical order placement/cancel routes between nested `/api/orderbook/[marketId]/orders/*`, flat `/api/orderbook/*`, and `/api/orders`.
2. Deposits: choose canonical funding architecture and mark legacy Base verification or Polygon per-user address flow accordingly.
3. Pools: decide whether pool/private-pool routes are hidden, legacy, or post-MVP.
4. Reference markets: decide what reference/bot liquidity data can be user-visible vs admin-only.
5. Admin routes: create a route-level auth/test matrix before public beta.

## Automation Rules

- Read-only public discovery docs/tests may be automated.
- Non-financial API cleanup plans may be automated if docs-only.
- Any implementation touching trading, wallet, deposits, withdrawals, balances, ledger, admin auth, settlement, bot live trading, production config, Prisma, or migrations requires human review.
- Legacy route removals must not be automatic.

## Non-Goals

This inventory does not:

- Change API code.
- Change route behavior.
- Mark routes deprecated in code.
- Change wallet, ledger, matching, settlement, admin auth, bot, Prisma, or deployment behavior.
- Run production or live external API calls.
