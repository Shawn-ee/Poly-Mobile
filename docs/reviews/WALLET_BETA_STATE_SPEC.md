# Wallet Beta-State UX Spec

Task id: ACC-002
Assigned subagents: SecurityAgent, FrontendAgent, LedgerWalletReviewerAgent
Risk level: High
Status: Docs-only UX and safety spec

## Purpose

The wallet/account experience must be honest about beta funding status. This spec defines the target user-visible beta states for wallet, deposit, withdrawal, balances, and account activity without changing UI code, API behavior, ledger logic, private-key handling, or production settings.

## Product Principle

During internal beta, wallet UI should reduce confusion and avoid implying public real-money launch readiness. Users should see clear account state, but funding actions should be hidden, disabled, or marked beta/internal until canonical funding gates are approved.

## Required Wallet States

### Signed Out

Purpose:

- Explain that wallet/account state requires login.

Primary action:

- Sign in.

Secondary action:

- Browse markets.

Forbidden copy:

- Do not prompt deposits before login.
- Do not imply public funding is enabled.

### Logged In, Funding Disabled

Purpose:

- Show account balances and beta status without offering active money movement.

Recommended sections:

- Available balance.
- Locked balance.
- Positions/open orders link.
- Funding status: "Internal beta funding is not enabled for this account."

Forbidden behavior:

- No active deposit CTA.
- No active withdrawal CTA.
- No QR code or address display unless explicitly approved.
- No production funding claims.

### Logged In, Internal Beta Funding

Purpose:

- Show restricted funding information for approved beta users only.

Recommended sections:

- Funding status badge.
- Approved chain/token if configured.
- Clear deposit/withdrawal limitations.
- Support/admin contact path if manual review is required.

Rules:

- Must identify the flow as beta/internal.
- Must not claim instant credit unless monitor/reconciliation is approved.
- Must not show legacy flows as production-ready.

### Funding Error Or Unavailable

Purpose:

- Avoid misleading balances or action availability.

Copy:

- "Funding status is unavailable."
- "Do not send funds until this page shows an approved deposit method."

Rules:

- Hide or disable all funding actions.
- Keep balances clearly marked if stale or unavailable.

## Deposit UI Rules

Future deposit UI may show an address only when:

- Canonical deposit architecture is approved.
- Funding gate allows the current environment/account.
- Chain and token are explicit.
- Address belongs to the logged-in user.
- Copy warns against wrong-chain/wrong-token deposits.
- QR/address state is tested.
- No private keys or custody internals are exposed.

Until then:

- Deposit UI should be hidden or disabled.
- Legacy deposit routes should not be linked from normal user flows.
- Mock/manual flows should be marked internal or hidden.

## Withdrawal UI Rules

Future withdrawal UI may show an active request flow only when:

- Withdrawal architecture is approved.
- Funds are locked before manual/off-platform payment.
- Request, review, rejection, and completion states are defined.
- Admin completion requires tx hash.
- Rejection unlock behavior is tested.
- User copy explains review timing and non-instant behavior.

Until then:

- Withdrawal UI should be hidden or disabled.
- Do not imply automated withdrawals are available.
- Do not show unsupported chain/token options.

## Balance Display Rules

Wallet/account UI should clearly separate:

- Available balance.
- Locked balance.
- Pending withdrawals if represented.
- Open-order locked funds.
- Deposit pending state if represented.

Rules:

- Do not show unavailable values as zero.
- Label test credits, beta credits, and real token balances distinctly.
- Do not mix external wallet USDC balance with POLY account balance without clear labels.

## Activity Display Rules

Wallet activity may show:

- Trade/order account events.
- Deposit pending/credited events only after canonical flow approval.
- Withdrawal requested/rejected/completed events only after withdrawal flow approval.

Activity must not expose:

- Private keys.
- Raw custody internals.
- Admin-only notes unless user-safe.
- Internal repair/reconciliation ids.

## Legacy Flow Treatment

Legacy Base deposit verification and any mock/manual flows should be:

- Hidden from normal users, or
- Marked legacy/internal, and
- Excluded from production-readiness copy.

Do not delete legacy routes automatically. Removal or migration requires a separate implementation plan.

## Future Implementation Acceptance Criteria

A future wallet beta-state UI PR should:

- Be display-only unless explicitly approved otherwise.
- Show signed-out, funding-disabled, internal-beta, and unavailable states.
- Avoid public funding readiness claims.
- Link to canonical deposit decision.
- Not expose secrets or private-key details.
- Not change API, wallet, deposit, withdrawal, ledger, matching, settlement, Prisma, migration, admin auth, bot, deployment, or production behavior.
- Include screenshots or browser verification for desktop and mobile.

## Required Future Tests

Future implementation tests should cover:

- Signed-out wallet state.
- Logged-in funding-disabled state.
- Funding unavailable state.
- Disabled deposit/withdraw controls.
- No legacy deposit CTA in normal user flow.
- No secret/private-key text in rendered UI.

## Non-Goals

This spec does not:

- Enable deposits or withdrawals.
- Change wallet UI code.
- Change wallet/deposit/withdrawal APIs.
- Change ledger, balances, orders, matching, settlement, Prisma, migrations, admin auth, bot behavior, deployment, or production settings.
- Approve public real-money launch.

## Validation For This Spec

This spec is docs-only. Validation for this PR should be:

```bash
git diff --check
```
