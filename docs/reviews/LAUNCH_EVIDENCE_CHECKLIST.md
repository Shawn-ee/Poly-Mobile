# Launch Evidence Checklist

Task id: DOC-006
Assigned subagents: DocsAgent, PlannerAgent, SecurityAgent
Risk level: Low
Status: Docs-only launch evidence checklist

## Purpose

This checklist defines the evidence packet POLY should assemble before a human launch review. It complements `docs/reviews/PUBLIC_BETA_READINESS_CHECKLIST.md` and `docs/reviews/BETA_READINESS_EVIDENCE_TRACKER.md`.

This document does not approve public beta, deploy production, change configuration, enable deposits or withdrawals, enable live bots, change code, or modify financial behavior.

## Launch Review Rule

Launch review should be evidence-based. A launch decision should not rely on memory, chat messages, or uncommitted local state.

Before any public-beta approval, the evidence packet should include:

- Current commit under review.
- Current deployment target and environment name.
- Validation command results.
- Product and UX evidence.
- Security evidence.
- Wallet, ledger, deposit, and withdrawal evidence.
- Trading and settlement evidence.
- Admin operations evidence.
- Bot and liquidity evidence.
- Deployment and rollback evidence.
- Named human approvers for high-risk areas.

## Required Evidence Packet

| Evidence item | Required proof | Owner | Required before public beta |
|---|---|---|---|
| Commit identity | Git SHA and branch under review. | LeadAgent | Yes |
| CI result | Passing required CI for the exact commit. | TestingAgent | Yes |
| Local validation | `git diff --check`, Prisma generate/validate, TypeScript, and `npm run test:ci` results. | TestingAgent | Yes |
| Public API no-leak coverage | Current no-leak test list and targeted results. | TestingAgent, SecurityAgent | Yes |
| Public route smoke | Public route/page smoke result with screenshots or logs. | TestingAgent | Yes |
| Product scope | Final internal-beta vs public-beta scope statement. | PlannerAgent | Yes |
| Known limitations | User-visible limitations and delayed features. | PlannerAgent | Yes |
| Risk disclosures | User-facing trading/funding risk copy. | SecurityAgent, PlannerAgent | Yes |
| Admin auth evidence | Admin route auth matrix and tests. | SecurityAgent | Yes |
| Secret audit evidence | Secret artifact audit and remediation status. | SecurityAgent | Yes |
| Wallet/funding gates | Human-approved evidence that funding state is safe. | LedgerWalletReviewerAgent | Yes |
| Ledger invariants | Human-reviewed balance and ledger invariant evidence. | LedgerWalletReviewerAgent | Yes |
| Deposit architecture | Human-approved canonical deposit decision. | LedgerWalletReviewerAgent, SecurityAgent | Yes |
| Withdrawal process | Human-approved request/reject/complete evidence. | LedgerWalletReviewerAgent, SecurityAgent | Yes |
| Settlement/resolution evidence | Human-reviewed market resolution and payout-state evidence. | LedgerWalletReviewerAgent | Yes |
| Bot dry-run/live separation | Evidence that live mode cannot start accidentally. | BotAgent, SecurityAgent | Yes if bots are present |
| Bot caps and kill switch | Evidence for caps, allowlists, and kill switch. | BotAgent | Yes before live bots |
| Deployment checklist | Human-approved deployment and rollback steps. | DeploymentAgent | Yes |
| Incident runbooks | Admin, trading, funding, bot, and deployment incident handling. | SecurityAgent, DeploymentAgent | Yes |

## Evidence That Must Not Be Included

The evidence packet must not include:

- `.env` contents.
- Private keys.
- Mnemonics.
- API tokens.
- Production credentials.
- Raw wallet signer material.
- Sensitive customer data.
- Production database dumps.

Evidence may state that a secret handling check passed, but it must not print the secret values.

## Safe Evidence Sources

Safe evidence sources include:

- Markdown review documents in `docs/reviews/`.
- GitHub PR bodies and validation summaries.
- GitHub Actions check results.
- Local command output summaries that do not print secrets.
- Test result summaries.
- Screenshot paths for UI smoke evidence, when screenshots do not expose secrets or private data.
- Human approval comments in PRs or issues.

## Human Approval Required

Human approval is required for:

- Any public-beta launch decision.
- Any production deployment.
- Any funding enablement.
- Any live bot enablement.
- Any wallet/private-key handling decision.
- Any ledger, matching, settlement, deposit, or withdrawal readiness decision.
- Any admin auth readiness decision.

Autonomous agents may prepare evidence, but they must not approve these decisions.

## Suggested Launch Review Agenda

1. Confirm the exact commit and target environment.
2. Review required CI and local validation.
3. Review product scope and known limitations.
4. Review public API and UI no-leak evidence.
5. Review admin auth evidence.
6. Review wallet, ledger, deposit, withdrawal, matching, and settlement evidence.
7. Review bot/live trading controls.
8. Review deployment and rollback plan.
9. Review incident response owners.
10. Record explicit approve, reject, or defer decision.

## Non-Goals

This checklist does not:

- Implement launch readiness checks.
- Add tests.
- Change CI.
- Change product code.
- Change UI.
- Change wallet, deposit, withdrawal, ledger, matching, settlement, admin auth, bot, deployment, Prisma, migration, or production behavior.
- Authorize any launch.

## Validation For This Checklist

This checklist is docs-only. Validation for this PR should be:

```bash
git diff --check
```
