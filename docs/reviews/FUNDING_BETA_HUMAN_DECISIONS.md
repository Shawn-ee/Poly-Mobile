# Funding Beta Human Decisions

Date: 2026-06-19

This file records owner-approved product and safety decisions for the controlled internal funding beta. It is not a public beta approval and does not deploy, enable public funding, enable automatic withdrawals, or enable live bots.

## Approved For Controlled Internal Funding Beta

- Internal beta allows deposits.
- Internal beta allows automatic deposit credit after confirmation.
- Internal beta uses self-managed EVM deposit addresses.
- Each allowlisted internal user gets a unique EVM deposit address.
- Admin manual credit is not required for normal confirmed deposits.
- Withdrawal request is allowed.
- Withdrawal request places funds on hold.
- Admin manually reviews withdrawals.
- Admin manually sends payout from treasury/hot wallet.
- Admin records payout tx hash.

## Explicitly Not Approved

- Automated withdrawal broadcast is not approved.
- Public funding is not approved.
- Anonymous funding is not approved.
- Production deployment is not approved.
- Public beta is not approved.
- Live bots are not approved.
- Unrestricted real-money behavior is not approved.

## Required Human Review Before Behavior Changes

Human review is required before merging any PR that:

- changes Prisma schema or migrations for funding.
- changes wallet private-key storage or encryption behavior.
- changes deposit wallet generation behavior.
- changes deposit monitor auto-credit behavior.
- changes ledger mutation behavior.
- changes withdrawal hold/release/complete behavior.
- changes admin funding behavior.
- changes admin auth behavior.
- changes package, workflow, deployment, or production config.
- adds or changes bot runtime behavior.
- uses treasury private key or implements signing/broadcast.

## Required Human Decisions Still Open

- Whether to add a dedicated `UserFundingProfile` model.
- Whether to add a dedicated `AuditLog` model.
- Whether to keep `DEPOSIT_WALLET_ENCRYPTION_KEY` as the canonical env name or introduce `WALLET_ENCRYPTION_KEY`.
- Whether to add direct ledger-entry reference IDs on deposits and withdrawal requests.
- Whether withdrawal statuses need to expand from `PENDING` / `COMPLETED` / `REJECTED` / `FAILED` to `requested` / `pending_review` / `approved` / `sent` / `completed` / `failed`.
- Which internal users are allowlisted for funding.
- Which chain/token pair is approved for the first internal deposit test.
- Which treasury/hot wallet operational process admins must follow outside the app.
- Who is allowed to operate the admin manual payout review flow.
- What per-user and global deposit/withdrawal limits apply to the first test.

## Standing Safety Rules

- Do not print secrets.
- Do not commit `.env` files.
- Do not commit private keys.
- Do not expose raw or encrypted private keys to API responses or frontend.
- Do not auto-merge high-risk funding behavior PRs.
- Do not use production data for screenshots or evidence.
- Do not call public beta ready from this controlled internal funding beta work.
