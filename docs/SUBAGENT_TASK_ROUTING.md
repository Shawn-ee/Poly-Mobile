# Subagent Task Routing

Use this document to route POLY issues to the right Codex subagent. When multiple routes apply, choose the highest-risk route and add required review.

## FrontendAgent

Route to FrontendAgent for:

- `src/app` pages.
- `src/components`.
- UI copy.
- Admin display-only screens.
- Sports UI.
- Wallet UI only if display-only and no API behavior changes.

Do not route to FrontendAgent alone if the task changes API behavior, balance display calculations, wallet actions, admin permissions, or order placement behavior.

## BackendAgent

Route to BackendAgent for:

- Non-financial API routes.
- Route helpers.
- Read-only admin endpoints.
- Non-money business services.

Do not route to BackendAgent alone for balance mutations, ledger writes, matching, settlement, deposits, withdrawals, wallet private keys, admin auth, or bot live trading.

## TestingAgent

Route to TestingAgent for:

- Jest tests.
- Playwright tests.
- CI smoke tests.
- Test documentation.

TestingAgent may add focused fixtures and mocks, but must not rewrite product behavior to make tests pass unless separately assigned.

## DocsAgent

Route to DocsAgent for:

- `docs/**`.
- `README*`.
- Task board updates.
- Runbooks.
- PR and issue template documentation.

DocsAgent must stop if documentation instructs production operations, private-key handling, or money movement without human approval.

## SecurityAgent

Route to SecurityAgent for:

- Auth review.
- Admin permission review.
- Secret artifact audit.
- Environment and config risk review.
- Production access risk review.

SecurityAgent review is required for high-risk routing.

## LedgerWalletReviewerAgent

Route to LedgerWalletReviewerAgent for:

- Prisma schema involving `UserBalance`, `LedgerEntry`, or `LedgerTransaction`.
- Matching.
- Settlement.
- Deposits.
- Withdrawals.
- Wallet private keys.
- Balance reconciliation.
- Financial invariants.

LedgerWalletReviewerAgent reviews and designs controls by default. Implementation of production money movement requires explicit human approval.

## BotAgent

Route to BotAgent for:

- `poly-bot` package.
- Market maker.
- Reference sync.
- Reference arbitrage.
- Bot supervisor.
- Risk controls.

BotAgent must stop for live trading, liquidity, credential, or market-making risk-limit changes unless a human explicitly approves the task.

## DeploymentAgent

Route to DeploymentAgent for:

- Nginx documentation.
- Systemd documentation.
- Deployment docs.
- Production checklist.
- Deployment validation scripts.

DeploymentAgent may write deployment docs, but must not deploy production or start services without explicit human approval.

## High-Risk Routing

Any task touching the following must be routed to SecurityAgent and human review:

- Wallet.
- Deposit.
- Withdrawal.
- Ledger.
- Matching.
- Settlement.
- `UserBalance`.
- Prisma migrations.
- Admin auth.
- Production config.
- Bot live trading.

Tasks that also touch balance, ledger, matching, settlement, deposit, withdrawal, or wallet private-key behavior require LedgerWalletReviewerAgent review.
