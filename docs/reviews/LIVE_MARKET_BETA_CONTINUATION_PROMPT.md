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

Phase C completed locally and opened for review:

- Branch: `agent/live-sports-market-schema`
- PR: #234, `https://github.com/Shawn-ee/POLY/pull/234`
- Title: `product(markets): add schema support for grouped live sports markets`
- Output: `docs/reviews/LIVE_SPORTS_MARKET_SCHEMA_IMPLEMENTATION.md`
- Migration: `prisma/migrations/20260624112446_live_sports_market_schema/migration.sql`
- Review rule: leave open because this includes Prisma schema and migration work.

Phase C completed and merged:

- PR: #234, `https://github.com/Shawn-ee/POLY/pull/234`
- Merge commit: `442ab37 Merge pull request #234 from Shawn-ee/agent/live-sports-market-schema`

Phase D completed locally and ready for PR:

- Branch: `agent/live-event-market-groups-ui`
- PR: #235, `https://github.com/Shawn-ee/POLY/pull/235`
- Title: `product(events): add grouped live market event detail UI`
- Output: `docs/reviews/LIVE_EVENT_MARKET_GROUPS_UI_EVIDENCE.md`
- Runtime boundary: display-only/read-only event page; no order, ledger, funding, settlement, resolution, provider, or bot behavior added.

Phase D completed and merged:

- PR: #235, `https://github.com/Shawn-ee/POLY/pull/235`
- Merge commit: `e7fcfdd Merge pull request #235 from Shawn-ee/agent/live-event-market-groups-ui`

Phase E started:

- Branch: `agent/live-market-trade-ticket-v1`
- PR: #236, `https://github.com/Shawn-ee/POLY/pull/236`
- Title: `product(trading): add market trade ticket v1`
- Output: `docs/reviews/LIVE_MARKET_TRADE_TICKET_V1_EVIDENCE.md`
- Review rule: leave open because this touches the market detail order submission boundary.

Phase E completed and merged:

- PR: #236, `https://github.com/Shawn-ee/POLY/pull/236`
- Merge commit: `18bb64f Merge pull request #236 from Shawn-ee/agent/live-market-trade-ticket-v1`

Phase F started:

- Branch: `agent/internal-beta-order-placement`
- PR: #237, `https://github.com/Shawn-ee/POLY/pull/237`
- Title: `trading(beta): add guarded internal beta order placement`
- Output: `docs/reviews/INTERNAL_BETA_ORDER_PLACEMENT_EVIDENCE.md`
- Chosen model: Option B, existing matched order path with internal beta gates.
- Review rule: specialist review required because this touches real order/trading/ledger behavior.
- Specialist review fix: legacy orderbook placement routes are now guarded and then disabled with `LEGACY_ORDER_PLACEMENT_DISABLED`; canonical `POST /api/orders` is the only internal beta order placement path.

## Current Dev Commit

Current `dev` before Phase F branch:

```text
18bb64f Merge pull request #236 from Shawn-ee/agent/live-market-trade-ticket-v1
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

Phase C validation:

- `npx prisma validate --schema=prisma/schema.prisma`: passed.
- `npx prisma generate --schema=prisma/schema.prisma`: passed.
- `docker compose up -d db`: passed; `poly_postgres` became healthy.
- `npx prisma migrate dev --name live_sports_market_schema --schema=prisma/schema.prisma`: applied the migration locally, then exited nonzero because `migrate dev` is interactive in this non-interactive shell.
- `npx prisma migrate status --schema=prisma/schema.prisma`: passed; database schema is up to date.
- `npx prisma migrate deploy --schema=prisma/schema.prisma`: passed; no pending migrations.
- `npx jest --runInBand src/__tests__/live-sports-market-schema.test.ts`: passed.
- `npx tsc --noEmit --pretty false --incremental false`: passed.
- `npm run test:ci`: passed.

No funding, wallet, withdrawal, ledger, trading, settlement, admin auth, workflow, deployment, or bot behavior changed in Phase C.

Phase D local validation:

- `git diff --check`: passed.
- `npx prisma generate --schema=prisma/schema.prisma`: passed.
- `npx prisma validate --schema=prisma/schema.prisma`: passed.
- `npx jest --runInBand src/__tests__/live-sports-market-groups-ui.test.ts src/__tests__/sports.event-market-model.test.ts`: passed.
- `npx tsc --noEmit --pretty false --incremental false`: passed.
- `npm run test:ci`: passed.
- `npm run build`: passed.
- `git diff --cached --check`: passed.

Phase F local validation:

- `git diff --check`: passed.
- `npx prisma generate --schema=prisma/schema.prisma`: passed.
- `npx prisma validate --schema=prisma/schema.prisma`: passed.
- `npx jest --runInBand src/__tests__/internal-trading-beta.test.ts src/__tests__/orders.internal-trading-gate.route.test.ts src/__tests__/orderbook.place-cancel.events.test.ts src/__tests__/market-trade-ticket-v1.test.ts`: passed.
- `npx tsc --noEmit --pretty false --incremental false`: passed after rerun once `next build` finished regenerating `.next/types`.
- `npm run test:ci`: passed.
- `npm run build`: passed.
- `git diff --cached --check`: passed.
- Specialist review rerun after disabling legacy orderbook placement routes:
  - targeted Jest: passed.
  - `npx tsc --noEmit --pretty false --incremental false`: passed.
  - `npm run test:ci`: passed.
  - `npm run build`: passed.

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

- grouped market/prop schema exists in the Phase C PR but is not merged until review.
- structured fields for line, period, unit, group, participant, resolution evidence, and outcome result exist in the Phase C PR but are not deployed until review/merge/migration.
- Phase D adds display-only event detail UI using the grouped market contract, pending PR review/merge.
- Phase E adds disabled/default market detail trade ticket gating, pending PR review/merge.
- Phase F adds internal trading beta gates in front of existing real order placement, pending merge.
- legacy orderbook placement routes are disabled so internal beta order placement uses only the canonical idempotent `POST /api/orders` path.
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

Next recommended phase after Phase F is merged: Phase G, portfolio positions and open orders.

Important: Phase F remains high risk until PR #237 is merged from the reviewed branch. Do not start Phase G from a branch that lacks the reviewed Phase F gate.

Phase G should include:

- available and locked balance display.
- open orders display.
- positions display.
- market status display.
- safe empty states.
- no private/internal field leakage.
- no settlement behavior.
- no market resolution behavior.
- no new order placement behavior.

Use `docs/reviews/INTERNAL_BETA_ORDER_PLACEMENT_EVIDENCE.md` and the reviewed Phase F gate as context for Phase G.

## Exact Next Prompt

```text
You are Codex acting as LeadAgent for POLY.

Start from latest dev in:
C:\Users\hecto\Desktop\projects\PolyProj\poly

Before GitHub CLI:
$env:PATH = 'C:\Program Files\GitHub CLI;' + $env:PATH

Continue the live sports prediction-market roadmap with Phase G only, but only after the Phase F PR has been reviewed, merged, and pulled into `dev`.

Branch:
agent/internal-beta-portfolio-positions

PR title:
portfolio(beta): add internal positions and open orders evidence

Use:
docs/reviews/LIVE_SPORTS_MARKET_MODEL_DESIGN.md
docs/reviews/LIVE_SPORTS_MARKET_SCHEMA_IMPLEMENTATION.md
docs/reviews/LIVE_EVENT_MARKET_GROUPS_UI_EVIDENCE.md
docs/reviews/LIVE_MARKET_TRADE_TICKET_V1_EVIDENCE.md
docs/reviews/INTERNAL_BETA_ORDER_PLACEMENT_EVIDENCE.md

Build portfolio/open order display for internal beta evidence.

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
- do not enable public trading.
- do not enable anonymous trading.
- do not bypass allowlists.
- do not add settlement.
- do not add market resolution.
- do not start from a branch that does not include the reviewed Phase F trading gate.

Validation:
- git diff --check
- git diff --cached --check
- npx tsc --noEmit --pretty false --incremental false
- npm run test:ci
- targeted portfolio/open-order display tests
- npm run build if Next.js route/UI changes require it

Before stopping, update docs/reviews/LIVE_MARKET_BETA_CONTINUATION_PROMPT.md with Phase G status.
```
