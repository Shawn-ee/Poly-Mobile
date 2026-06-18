# Architecture Review

## Application Structure

POLY is a Next.js App Router application with:

- Public pages under `src/app`.
- API routes under `src/app/api`.
- Reusable UI under `src/components`.
- Shared browser/server helpers under `src/lib`.
- Domain services under `src/server/services`.
- Prisma schema and migrations under `prisma`.
- Jest, Vitest, Playwright, bot e2e, script, and CI assets.
- Agent workflow docs and orchestrator assets under `docs` and `agent-orchestrator`.

## Frontend Architecture

Strengths:

- `PageContainer`, `Card`, `Button`, `Badge`, `OutcomeButton`, and state components provide a foundation for a clean design system.
- Sports pages reuse `SportsEventsPage`.
- Market detail delegates to `MarketView`, then `OrderbookMarketView` or `PoolMarketView`.
- Event detail supports normal event markets, sports event markets, and grouped outcome tables.

Weaknesses:

- Page styling is inconsistent between newer UI primitives and raw Tailwind page layouts.
- `events/[slug]`, `wallet`, and admin pages are large, mode-heavy components.
- Homepage, markets, events, and sports overlap.
- User-facing pages show internal/bot/reference details in places.
- Some strings show encoding artifacts.

Recommended isolation:

- Split event detail into grouped-event, sports-event, and generic-event components.
- Split wallet into beta balance, linked wallets, deposit, withdrawal, and activity panels.
- Hide internal liquidity/reference diagnostics behind admin-only surfaces.

## Backend/API Architecture

Strengths:

- API routes are route-local and mostly delegate to services.
- `requireAdmin`, `assertAdmin`, canonical actor auth, and internal admin auth are reusable.
- Sensitive rate limiting exists for important admin actions.
- Canonical API key support has scopes, hashed secrets, rate-limit buckets, and policy fields.

Weaknesses:

- API surface is very large for MVP.
- There are overlapping order routes: `/api/orders`, `/api/orderbook/place`, and nested orderbook routes.
- Deposit APIs include legacy Base verification and newer Polygon deposit-address flows.
- Admin mutation route coverage needs a complete test inventory.

Recommended isolation:

- Define canonical public trading API routes and mark legacy routes.
- Put wallet/deposit/withdrawal endpoints behind explicit exposure gates.
- Add route ownership docs for user, admin, trading, wallet, bot, and agent APIs.

## Prisma Architecture

Important models:

- Identity: `User`, `Account`, `Wallet`, `WalletNonce`, `ApiCredential`.
- Market structure: `Event`, `Market`, `Outcome`, `Category`, `Tag`, `MarketTag`.
- Trading: `Order`, `Fill`, `Trade`, `Position`, `MarketOutcomeSnapshot`.
- Balances and ledger: `UserBalance`, `LedgerEntry`, `LedgerTransaction`.
- Deposits: `UserDepositAddress`, `Deposit`, `DepositIntent`, `ChainDepositEvent`.
- Withdrawals: `WithdrawalRequest`.
- Pools/private markets: `PoolBet`, `PoolStakePreset`, `MarketMember`.
- Events/streams: `CanonicalEvent`.

Strengths:

- Decimal precision is used for financial amounts.
- Unique keys exist for important external references such as deposits and ledger idempotency.
- Balance rows track available and locked USDC.
- Deposit addresses are unique per user/chain/token.

Weaknesses:

- Legacy and current deposit models coexist.
- `LedgerTransaction` and `LedgerEntry` overlap conceptually and need clearer ownership.
- Pool markets and orderbook markets share `Market`, which adds MVP complexity.
- Financial models require strict human-reviewed migrations.

## Trading Architecture

Strengths:

- Matching uses transactions and row locking.
- Available and locked balances are modeled.
- Orders, fills, positions, fees, and public trade tape are represented.
- Binary bid/ask invariants and collateral checks exist.
- Cancel and matching flows create ledger entries.

Weaknesses:

- Matching, balance movement, position updates, and invariant checks are tightly coupled and high-risk.
- Multiple trade/order endpoint variants increase route confusion.
- UI defaults expose advanced order concepts early.
- Settlement and reconciliation need stronger launch-blocking tests.

Recommended isolation:

- Treat matching as a protected financial kernel.
- Add a read-only trading facade for UI.
- Require invariant tests for every matching/settlement change.

## Deposit And Withdrawal Architecture

Strengths:

- Polygon per-user deposit addresses exist.
- Deposit private keys are encrypted using AES-GCM with an environment key.
- Deposit monitor scans USDC Transfer logs and credits via ledger.
- Manual withdrawals lock funds first and admin completion requires tx hash.
- Withdrawal reject unlocks funds.

Weaknesses:

- Wallet page says deposits and withdrawals are disabled but still exposes pieces of those flows.
- Legacy Base deposit verification exists beside Polygon deposits.
- Custody of generated deposit private keys needs an operational runbook.
- Admin withdrawal process is manual and needs stronger review controls.

Recommended isolation:

- Canonical deposit decision: Polygon per-user address or legacy Base verification, not both.
- Funding APIs need explicit beta/public exposure gates.
- Deposit monitor, crediting, withdrawal completion, and reconciliation must remain human-reviewed.

## Admin Architecture

Strengths:

- Admin auth gates exist.
- Admin pages cover markets, deposits, withdrawals, reference markets, bots, agents, system state, and invariants.
- Sensitive admin actions have rate limits in several routes.

Weaknesses:

- Large admin API surface needs route-by-route tests.
- High-risk actions are not visually separated enough.
- Agent and bot dashboards are operationally useful but need explicit safe-mode indicators.

## Bot And Background Services

Visible services/scripts include reference market import, quote snapshots, reference liquidity seeding, bot readiness, bot initialization, bot monitor, deposit monitor, simulations, and reconciliation.

Strengths:

- Bot/reference systems appear designed with dry-run and readiness concepts.
- Admin bot monitor exists.
- Scripts support simulation and reporting.

Weaknesses:

- `poly-bot` was referenced in task-board docs but is not present in the current checkout.
- Live/dry-run/live-orders distinction must be enforced and tested.
- Bot credentials, notional caps, allowlists, and kill-switch behavior need CI coverage before live trading.

## Testing And CI Architecture

Strengths:

- CI runs on PR/push to `dev` and `main`.
- CI has PostgreSQL, Prisma generate/validate, typecheck, and focused Jest smoke tests.
- Many additional tests exist outside CI.

Weaknesses:

- `docs/TESTING.md` still describes CI as main-only, while workflow now targets dev and main.
- Broad Jest/Vitest suites are not CI-safe yet.
- Playwright is intentionally outside CI.
- Financial invariant and admin auth coverage need expansion before public beta.

## Deployment Architecture

Strengths:

- Deployment docs list required env vars and smoke checks.
- Production config validation is stricter for staging/production.
- System monitor and reconciliation scripts exist.

Weaknesses:

- Deployment readiness depends on manual discipline.
- Runtime service assumptions need Windows-local vs Linux-production separation.
- No production deployment was performed in this review.

## MVP Complexity To Reduce

- Hide private pools.
- Hide real deposit/withdraw flows until gates are approved.
- Collapse discovery hierarchy.
- Keep bot/reference/admin systems internal.
- Mark legacy APIs and scripts.
