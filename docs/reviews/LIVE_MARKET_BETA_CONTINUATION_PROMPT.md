# Live Market Beta Continuation Prompt

Date: 2026-06-24

## Completed Phases

Phase A completed and merged:

- Branch: `agent/live-sports-product-gap-audit`
- PR: #231
- Title: `docs(product): audit live sports market capability gaps`
- Merge commit: `287edbc Merge pull request #231 from Shawn-ee/agent/live-sports-product-gap-audit`
- Output: `docs/reviews/LIVE_SPORTS_MARKET_PRODUCT_GAP_AUDIT.md`

Phase B completed and merged:

- Branch: `agent/live-sports-market-model-design`
- PR: #232
- Title: `docs(product): design live sports event market model`
- Merge commit: `fb98782 Merge pull request #232 from Shawn-ee/agent/live-sports-market-model-design`
- Outputs:
  - `docs/reviews/LIVE_SPORTS_MARKET_MODEL_DESIGN.md`
  - `docs/reviews/LIVE_SPORTS_MARKET_SCHEMA_PROPOSAL.md`

## Current Dev Commit

Current `dev` after Phase B:

```text
fb98782 Merge pull request #232 from Shawn-ee/agent/live-sports-market-model-design
```

## Open PRs Observed

Open/stale PRs observed after Phase B:

- #210 draft checkpoint after PR #209.
- #207 draft checkpoint after PR #204.
- #206 draft checkpoint after PR #204.
- #205 draft checkpoint after PR #204.
- #198 draft checkpoint after PR #196.
- #192 draft checkpoint after PR #191.
- #177 open UI post-merge state hygiene.
- #25 draft/conflicting admin wallet and pool UI polish.

None of these blocks the next Phase C schema branch from `dev`, but #25 and any stale checkpoint PRs should remain human-maintainer decisions.

## Merged PRs In This Run

- #231 merged after CI passed.
- #232 merged after CI passed.

## Validation Completed

Phase A validation:

- `git diff --check`: passed.
- `git diff --cached --check`: passed.
- secret-pattern scan on changed doc: only safety terminology, no values.
- GitHub CI Validate: passed.

Phase B validation:

- `git diff --check`: passed.
- `git diff --cached --check`: passed.
- secret-pattern scan on changed docs: only safety wording, no values.
- GitHub CI Validate: passed.

No runtime code, schema, migration, funding, trading, settlement, admin auth, workflow, or bot behavior changed in Phases A or B.

## Current Capability Classification

- Stage 0 controlled internal beta setup: ready with warnings.
- Sports/event/market browsing: real runtime behavior, ready for internal smoke.
- Rich live sports event market product: not ready.
- Internal live market beta: not ready.
- Public beta: not ready.
- Live bots: not approved.
- Public/anonymous funding: not approved.

## Blockers Before Live Market Beta

Critical blockers:

- no first-class grouped market/prop schema yet.
- no migrated structured fields for line, period, unit, group, participant, resolution evidence, or outcome result.
- no display-only event detail UI using the proposed stable grouped market contract.
- no explicit user-facing internal trading beta gate.
- no end-to-end deployed evidence from event -> order -> position -> resolution -> settlement.
- no provider-approved live sports data feed.
- no operator-grade admin prop management workflow.
- no void/push/refund settlement path for sports props.

Safety blockers:

- do not enable public funding.
- do not enable anonymous funding.
- do not remove funding allowlist.
- do not disable kill switch outside staged funding drills.
- do not enable auto-withdrawal.
- do not enable live bots without explicit approval.
- do not claim public beta readiness.

## Next Phase

Next recommended phase: Phase C, schema support for event props and grouped markets.

Important: Phase C includes a Prisma migration and must be left open for review. Do not auto-merge if the PR contains schema or migration changes.

Phase C should be narrow and additive only:

- no column drops.
- no destructive migration.
- no trading behavior changes.
- no ledger behavior changes.
- no settlement behavior changes.
- no funding behavior changes.
- no withdrawal behavior changes.
- no live bot changes.
- no workflow changes.

Use `docs/reviews/LIVE_SPORTS_MARKET_SCHEMA_PROPOSAL.md` as the implementation guide.

Recommended Phase C fields:

- `Event.liveStatus`
- `Event.period`
- `Event.clock`
- `Event.homeScore`
- `Event.awayScore`
- `Event.venue`
- `Event.sourceUpdatedAt`
- `Market.marketGroupKey`
- `Market.marketGroupTitle`
- `Market.displayOrder`
- `Market.line`
- `Market.unit`
- `Market.period`
- `Market.participantName`
- `Market.participantType`
- `Market.propCategory`
- `Market.rulesText`
- `Market.resolutionEvidenceText`
- `Market.resolutionEvidenceUrl`
- `Market.settlementStatus`
- `Market.sourceUpdatedAt`
- `Outcome.side`
- `Outcome.resolvedResult`

## Exact Next Prompt

```text
You are Codex acting as LeadAgent for POLY.

Start from latest dev in:
C:\Users\hecto\Desktop\projects\PolyProj\poly

Before GitHub CLI:
$env:PATH = 'C:\Program Files\GitHub CLI;' + $env:PATH

Continue the live sports prediction-market roadmap with Phase C only.

Branch:
agent/live-sports-market-schema

PR title:
product(markets): add schema support for grouped event markets

Use:
docs/reviews/LIVE_SPORTS_MARKET_MODEL_DESIGN.md
docs/reviews/LIVE_SPORTS_MARKET_SCHEMA_PROPOSAL.md

Implement a narrow additive Prisma migration for grouped event markets and sports prop display fields.

Rules:
- do not touch main.
- do not deploy.
- do not change trading behavior.
- do not change ledger behavior.
- do not change settlement behavior.
- do not change funding behavior.
- do not change withdrawal behavior.
- do not enable live bots.
- do not modify GitHub workflows.
- do not print secrets.
- leave PR open for review because it contains a migration.

Validation:
- git diff --check
- git diff --cached --check
- npx prisma generate --schema=prisma/schema.prisma
- npx prisma validate --schema=prisma/schema.prisma
- npx tsc --noEmit --pretty false --incremental false
- npm run test:ci
- targeted model/read-model tests if added

Before stopping, update docs/reviews/LIVE_MARKET_BETA_CONTINUATION_PROMPT.md with Phase C status.
```
