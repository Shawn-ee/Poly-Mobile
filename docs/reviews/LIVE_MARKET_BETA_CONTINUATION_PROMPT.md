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

Phase F completed and merged:

- PR: #237, `https://github.com/Shawn-ee/POLY/pull/237`
- Merge commit: `836961b Merge pull request #237 from Shawn-ee/agent/internal-beta-order-placement`
- Runtime boundary: real order placement remains disabled by default and requires server-side internal trading beta enablement, kill switch off, allowlisted/admin user, and the Phase E client submit flag.
- Still not implemented: settlement, market resolution, public trading, anonymous trading, live bot matching.

Phase G started:

- Branch: `agent/internal-beta-portfolio-positions`
- PR: #238, `https://github.com/Shawn-ee/POLY/pull/238`
- Output: `docs/reviews/PORTFOLIO_OPEN_ORDERS_POSITIONS_EVIDENCE.md`
- Runtime boundary: display/read-only portfolio evidence only; no ledger, order, funding, withdrawal, settlement, resolution, or bot mutation behavior added.

Phase G completed and merged:

- PR: #238, `https://github.com/Shawn-ee/POLY/pull/238`
- Merge commit: `f33bb9f Merge pull request #238 from Shawn-ee/agent/internal-beta-portfolio-positions`

Phase H started:

- Branch: `agent/admin-event-market-management`
- PR: #239, `https://github.com/Shawn-ee/POLY/pull/239`
- Output: `docs/reviews/ADMIN_EVENT_MARKET_MANAGEMENT_EVIDENCE.md`
- Runtime boundary: admin-only market/event management mutation support; no settlement, market resolution payout, order placement, ledger math, funding, withdrawal, wallet, or bot behavior added.
- Review rule: leave open because this changes admin mutation behavior.

## Current Dev Commit

Current `dev` before Phase H branch:

```text
f33bb9f Merge pull request #238 from Shawn-ee/agent/internal-beta-portfolio-positions
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

Phase F GitHub validation:

- GitHub CI Validate on PR #237 after specialist review fix: passed.

Phase G local validation:

- `git diff --check`: passed.
- `npx prisma validate --schema=prisma/schema.prisma`: passed.
- `npx prisma generate --schema=prisma/schema.prisma`: passed.
- `npx jest --runInBand src/__tests__/portfolio.open-orders.route.test.ts`: passed.
- `npx tsc --noEmit --pretty false --incremental false`: passed.
- `npm run test:ci`: passed.
- `npm run build`: passed.

Phase G GitHub validation:

- GitHub CI Validate on PR #238: passed.

Phase H local validation:

- `git diff --check`: passed.
- `npx prisma validate --schema=prisma/schema.prisma`: passed.
- `npx prisma generate --schema=prisma/schema.prisma`: passed.
- `npx jest --runInBand src/__tests__/admin.event-market-management.test.ts`: passed.
- `npx tsc --noEmit --pretty false --incremental false`: passed.
- `npm run test:ci`: passed.
- `npm run build`: passed.

Phase H GitHub validation:

- GitHub CI Validate on PR #239: passed.

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

- grouped market/prop schema is merged.
- event detail grouped market UI is merged.
- disabled/default market detail trade ticket gating is merged.
- internal trading beta gates in front of existing real order placement are merged.
- legacy orderbook placement routes are disabled so internal beta order placement uses only the canonical idempotent `POST /api/orders` path.
- portfolio open-order display evidence is merged.
- Phase H adds admin event market management, pending validation and PR review.
- no end-to-end deployed evidence from event -> order -> position -> resolution -> settlement.
- no provider-approved live sports data feed.
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

Next recommended phase after Phase H is reviewed and merged: Phase I, market resolution and settlement.

Important: Phase H changes admin mutation behavior and should remain open for review. Do not start Phase I until Phase H is reviewed and merged.

Phase H includes:

- admin-only market creation under events.
- grouped market and prop metadata.
- structured outcome metadata.
- pause/close through existing admin status routes.
- no settlement behavior.
- no market resolution payout behavior.
- no order placement behavior.

Use `docs/reviews/ADMIN_EVENT_MARKET_MANAGEMENT_EVIDENCE.md` as context for Phase I only after Phase H merges.

## Exact Next Prompt

```text
You are Codex acting as LeadAgent for POLY.

Start from latest dev in:
C:\Users\hecto\Desktop\projects\PolyProj\poly

Before GitHub CLI:
$env:PATH = 'C:\Program Files\GitHub CLI;' + $env:PATH

Continue the live sports prediction-market roadmap with Phase I only, but only after the Phase H PR has been reviewed, merged, and pulled into `dev`.

Branch:
agent/admin-market-resolution-settlement

PR title:
settlement(beta): add guarded market resolution workflow

Use:
docs/reviews/LIVE_SPORTS_MARKET_MODEL_DESIGN.md
docs/reviews/LIVE_SPORTS_MARKET_SCHEMA_IMPLEMENTATION.md
docs/reviews/LIVE_EVENT_MARKET_GROUPS_UI_EVIDENCE.md
docs/reviews/LIVE_MARKET_TRADE_TICKET_V1_EVIDENCE.md
docs/reviews/INTERNAL_BETA_ORDER_PLACEMENT_EVIDENCE.md
docs/reviews/PORTFOLIO_OPEN_ORDERS_POSITIONS_EVIDENCE.md
docs/reviews/ADMIN_EVENT_MARKET_MANAGEMENT_EVIDENCE.md

Inspect resolution and settlement readiness. Prefer the safest model: metadata-only or settlement preview if full ledger-safe settlement is not ready.

Rules:
- do not touch main.
- do not deploy.
- do not change public trading behavior.
- do not change ledger behavior.
- do not add ledger settlement unless explicitly reviewed and safe.
- do not change funding behavior.
- do not change withdrawal behavior.
- do not enable live bots.
- do not modify GitHub workflows.
- do not print secrets.
- do not enable public trading.
- do not enable anonymous trading.
- do not bypass allowlists.
- do not add public market resolution.
- do not start from a branch that does not include reviewed Phase H admin management.

Validation:
- git diff --check
- git diff --cached --check
- npx tsc --noEmit --pretty false --incremental false
- npm run test:ci
- targeted resolution/settlement tests
- npm run build if Next.js route/UI changes require it

Before stopping, update docs/reviews/LIVE_MARKET_BETA_CONTINUATION_PROMPT.md with Phase I status.
```
