# Beta Copy And Terminology Map

This UX-004 document defines recommended product language for POLY internal beta. It is planning-only and does not change UI copy or product behavior.

## Goals

- Keep beta users clear about test credits and disabled real-money funding.
- Standardize market, trade, portfolio, and wallet terms before UI cleanup.
- Avoid copy that implies public launch, live custody, or production funding readiness.
- Prefer ASCII-safe visible text until encoding and typography handling are consistent.

## Core Product Terms

| Concept | Preferred term | Avoid | Notes |
|---|---|---|---|
| Product stage | Internal beta | Public launch, live money launch | Use wherever funding/trading risk could be misunderstood. |
| Beta funds | Test credits | Real USDC, cash, funds | Use for user-facing beta balances unless a human-approved funding flow is enabled. |
| Balance unit | credits | U, USDC, dollars | `U` can remain a technical/internal shorthand until a copy cleanup PR replaces or standardizes it. |
| Market price | probability or price | cents if inconsistent | Use one display model per surface. Do not mix percent, cents, decimals, and dollars on the same page. |
| User action | Buy Yes / Buy No | place orderbook order | Retail default should not require orderbook vocabulary. |
| Advanced trading | Advanced order controls | pro mode, bot pricing | Keep advanced concepts collapsed or secondary. |
| Funding state | Deposits disabled during internal beta | deposits coming soon without context | Always pair disabled funding copy with test-credit explanation. |
| Withdrawal state | Withdrawals disabled during internal beta | withdraw real money | Do not imply real withdrawals are available before review. |
| Wallet link | Linked wallet | payout wallet unless enabled | Avoid implying custody or withdrawals are active. |
| Admin tools | Internal admin tools | user tools | Admin surfaces must remain visibly internal. |

## Recommended Global Beta Copy

Use a short, consistent banner or support line:

```text
Internal beta: test credits only. Deposits and withdrawals are disabled.
```

Avoid emoji, em dashes, arrows, cent symbols, and middle-dot separators in high-priority user-facing copy until encoding cleanup is complete.

## Page-Level Guidance

### Homepage

- Lead with sports-first discovery.
- Say "test credits" instead of `U` or `USDC`.
- Do not show deposit, withdrawal, Base, Polygon, bot, reference-market, or admin concepts in normal homepage copy.
- Primary CTA should be "Browse sports".

### Markets And Events

- Use Yes/No language consistently.
- Show probabilities or prices consistently, but do not mix formats in one row.
- Avoid exposing reference-market or bot terminology to normal users.
- Use event-first language for sports: tournament, match/event, related markets.

### Trade Ticket

- Default copy should be retail-first:
  - "Buy Yes"
  - "Buy No"
  - "Review trade"
  - "Estimated shares"
  - "Max payout"
- Keep "limit", "bid", "ask", "spread", and "orderbook" in advanced sections or explanatory secondary text.
- If symbols are used, prefer UI icons/components over raw Unicode text until the encoding cleanup is done.

### Portfolio

- Make `Portfolio` the account home.
- Use "Positions", "Open orders", "Activity", and "Resolved markets".
- Explain empty states in plain language:

```text
No positions yet. Browse sports markets to get started.
```

Do not use ledger/accounting terms in primary empty states.

### Wallet

- Present wallet as beta-safe account state.
- Preferred balance labels:
  - `Available test credits`
  - `Locked test credits`
  - `Total test credits`
- Preferred funding copy:

```text
Deposits are disabled during internal beta. Use the faucet for test credits.
```

```text
Withdrawals are disabled during internal beta.
```

- Do not display production-chain instructions, QR deposits, or withdrawal request language to normal users unless a human-approved funding gate enables them.
- Any wallet copy that changes perceived deposit or withdrawal availability requires SecurityAgent and LedgerWalletReviewerAgent review.

### Login

- Explain why login is needed:

```text
Sign in to trade with beta test credits and track your portfolio.
```

- Keep wallet sign-in distinct from linked wallet/funding concepts.

### Admin

- Admin pages should use direct operational labels.
- Finance, bot, system, and invariant screens should include internal-only framing.
- Copy for high-risk actions should not be changed without SecurityAgent review.

## Symbol And Formatting Rules

- Prefer ASCII separators like `-` or `/` in plain text.
- Avoid raw emoji in critical beta or wallet warnings.
- Avoid raw cent symbols until price/probability display is standardized.
- Avoid raw arrows in trade labels; use words or icon components in future UI work.
- Avoid middle-dot separators in high-priority user-facing copy.
- Keep all production funding terminology gated behind human-reviewed funding architecture.

## Future Copy Cleanup Order

1. Homepage beta and CTA copy.
2. Wallet beta-state copy.
3. Trade ticket Yes/No and review copy.
4. Portfolio empty and activity states.
5. Sports/event page market status copy.
6. Admin/internal-only labels.

## Required Review Routing

| Copy area | Required owner | Human review |
|---|---|---|
| Homepage, markets, sports, portfolio display copy | FrontendAgent or DocsAgent | No, unless claims change product behavior. |
| Trade ticket copy | FrontendAgent + TestingAgent | Yes if copy changes order behavior or expectations. |
| Wallet, deposit, withdrawal copy | SecurityAgent + LedgerWalletReviewerAgent | Yes if availability, funds, custody, or chain behavior is implied. |
| Admin action copy | SecurityAgent | Yes for high-risk actions. |
| Bot/live trading copy | BotAgent + SecurityAgent | Yes. |
| Deployment or production readiness copy | DeploymentAgent + SecurityAgent | Yes. |

## Acceptance Criteria For Future Copy PRs

- Copy changes are scoped by route or component group.
- No API, wallet, ledger, matching, settlement, admin auth, bot, Prisma, or deployment behavior changes are included.
- Screenshots or route smoke evidence are attached for visible UI copy changes.
- `git diff --check` passes.
- TypeScript and `npm run test:ci` run if product files are edited.
- Human review is requested for wallet, trading, admin, bot, or deployment claims.

## Non-Goals

This document does not:

- Change UI code.
- Change product copy in source files.
- Enable deposits or withdrawals.
- Change wallet, ledger, matching, settlement, order, fill, trade, position, admin auth, bot, or deployment behavior.
