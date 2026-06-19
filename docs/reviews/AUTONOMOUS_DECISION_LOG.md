# Autonomous Decision Log

Last updated: 2026-06-18

## Decision Policy

Autonomous LeadAgent may merge docs-only PRs and low-risk mocked public/read-only test PRs when validation passes and internal ReviewerAgent/SecurityAgent review passes.

Autonomous LeadAgent must not auto-merge backend implementation, UI product-code, package/workflow/script, Prisma/migration, wallet, ledger, trading, admin-auth, bot-runtime, deployment, or secret changes.

## Recent Auto-Merge Decisions

| PR | Decision | Reason |
| --- | --- | --- |
| #100 | Auto-merged | Docs-only public API test queue. |
| #101 | Auto-merged | Low-risk mocked taxonomy response-shape test. |
| #102 | Auto-merged | Low-risk mocked event response-shape test. |
| #103 | Auto-merged | Low-risk mocked sports response-shape test. |
| #104 | Auto-merged | Low-risk mocked event-market response-shape test. |
| #105 | Auto-merged | Low-risk mocked market chart empty-state test. |
| #106 | Auto-merged | Low-risk mocked market list response-shape test. |
| #107 | Auto-merged | Docs-only PR #25 UI review checklist. |
| #108 | Auto-merged | Docs-only public route status rollup. |
| #109 | Auto-merged | Docs-only autonomous state foundation. |
| #110 | Auto-merged | Docs-only public no-leak CI promotion readiness. |
| #111 | Auto-merged | Docs-only market detail target-contract checklist. |
| #112 | Auto-merged | Docs-only PR #25 split/merge decision. |
| #113 | Auto-merged | Docs-only beta readiness evidence update. |
| #114 | Auto-merged | Docs-only autonomous checkpoint update. |
| #115 | Auto-merged | Low-risk mocked public event error response tests. |
| #116 | Auto-merged | Low-risk mocked public market error/empty tests. |
| #117 | Auto-merged | Docs-only public API stabilization criteria. |
| #118 | Auto-merged | Low-risk mocked taxonomy/sports empty-state tests. |
| #119 | Auto-merged | Docs-only autonomous public API checkpoint. |
| #120 | Auto-merged | Docs-only public API test lane implementation scope; package-script implementation remains human-reviewed. |
| #121 | Auto-merged | Docs-only PR #25 admin/funding UI review packet; PR #25 itself remains blocked. |
| #122 | Auto-merged | Docs-only public API coverage map and route status update. |
| #123 | Auto-merged | Docs-only beta and launch evidence update for public tests. |

## Open PR Decisions

| PR | Decision | Reason |
| --- | --- | --- |
| #25 | Do not auto-merge | Draft UI/product-code PR touching wallet/admin/private-pool surfaces. Requires human review or split PRs. |

## Task Selection Decisions

- Public API tests were selected because they are local, mocked, public/read-only, and improve no-leak confidence without changing product behavior.
- PR #25 was reviewed through a separate docs-only checklist because direct merge is too broad and touches sensitive UI surfaces.
- Public route status rollup was selected to keep state current before test lane/package/workflow decisions.
- Autonomous state files were selected to make longer-running LeadAgent work resumable and auditable.
- Public no-leak CI readiness was selected before any package/workflow changes so future CI work remains human-reviewed.
- Market detail target-contract checklist was selected because market detail implementation is not safe to auto-merge without explicit contract gates.
- PR #25 split decision was selected because the broad draft UI PR is not safe to merge directly.
- Beta readiness evidence was updated after public API and autonomous-state docs changed.
- Public event/market/taxonomy/sports error and empty-state tests were selected because they stayed mocked, local, public/read-only, and did not alter route behavior.
- Public API stabilization criteria were selected to define a clear stopping gate for public contract work before UI or package/workflow changes.
- Public API test lane implementation scope was selected to make any future `package.json` test-lane PR reviewable and non-auto-mergeable.
- PR #25 admin/funding review packet was selected because the draft PR remains broad, stale, and UI/product-code-touching.
- Public API coverage-map and beta evidence updates were selected to prevent stale route/test status from driving duplicate work.

## Skipped Or Downgraded Tasks

- Public no-leak CI promotion was downgraded to a future docs-only readiness note because package/workflow changes are not auto-mergeable.
- Public API lane implementation is limited to docs-only scope until a human-reviewed package-script PR is opened.
- Market detail cleanup is limited to docs/checklists until a target contract and human-reviewed implementation path exist.
- Market detail tests remain non-auto-merge by default if they document current contract gaps.
- Reference/liquidity public/admin split remains docs-only because implementation is high-risk by topic.
- PR #25 direct merge remains blocked; replacement PRs should be smaller and reviewed independently.

## Self-Review Notes

- ReviewerAgent passes docs-only changes when they are clear, bounded, and consistent with the agent operating docs.
- SecurityAgent passes public mocked tests when they do not use real DB, secrets, credentials, production data, chain RPC, external services, auth credentials, or money movement.
- Specialist reviewers are required for wallet/ledger/trading, bot, deployment, or UI implementation topics.
