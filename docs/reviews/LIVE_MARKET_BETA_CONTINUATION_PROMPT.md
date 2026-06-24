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

Phase H completed and merged:

- PR: #239, `https://github.com/Shawn-ee/POLY/pull/239`
- Merge commit: `655edfd Merge pull request #239 from Shawn-ee/agent/admin-event-market-management`
- Specialist review result: admin-only, narrow, validated, no funding/private-key/ledger/order/settlement mutation expansion, no public mutation access.

Phase I started:

- Branch: `agent/admin-market-resolution-settlement`
- Output: `docs/reviews/MARKET_RESOLUTION_SETTLEMENT_EVIDENCE.md`
- Chosen option: Option B, admin settlement preview only.
- Runtime boundary: preview-only; no ledger, balance, order, position, market resolution, funding, withdrawal, wallet, or bot mutation behavior added.

Phase I completed and merged:

- PR: #240, `https://github.com/Shawn-ee/POLY/pull/240`
- Merge commit: `be8a08e Merge pull request #240 from Shawn-ee/agent/admin-market-resolution-settlement`
- Chosen option: Option B, admin settlement preview only.

Phase J started:

- Branch: `agent/live-sports-provider-readiness`
- Output: `docs/reviews/LIVE_SPORTS_PROVIDER_READINESS.md`
- Runtime boundary: docs-only provider readiness plan; no external API integration, scraping, runtime behavior, package change, bot behavior, funding behavior, settlement behavior, or deployment behavior added.

Phase J completed and merged:

- PR: #241, `https://github.com/Shawn-ee/POLY/pull/241`
- Merge commit: `e13b25d Merge pull request #241 from Shawn-ee/agent/live-sports-provider-readiness`

Phase K started:

- Branch: `agent/live-sports-ux-polish`
- Output: `docs/reviews/LIVE_SPORTS_UX_POLISH_EVIDENCE.md`
- Runtime boundary: display-only sports event UI polish; no order, ledger, funding, withdrawal, settlement, market resolution, provider, bot, package, or deployment behavior added.

Phase K completed and merged:

- PR: #242, `https://github.com/Shawn-ee/POLY/pull/242`
- Merge commit: `2ce6126 Merge pull request #242 from Shawn-ee/agent/live-sports-ux-polish`

Phase L started:

- Branch: `agent/internal-live-market-e2e-evidence`
- Outputs:
  - `docs/reviews/INTERNAL_LIVE_MARKET_E2E_EVIDENCE.md`
  - `docs/reviews/INTERNAL_LIVE_MARKET_GO_NO_GO.md`
- Runtime boundary: docs-only evidence and go/no-go classification; no order, ledger, funding, withdrawal, settlement, market resolution, provider, bot, package, or deployment behavior added.

## Current Dev Commit

Current `dev` before Phase L branch:

```text
2ce6126 Merge pull request #242 from Shawn-ee/agent/live-sports-ux-polish
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

Phase I local validation:

- `git diff --check`: passed.
- `npx prisma validate --schema=prisma/schema.prisma`: passed.
- `npx prisma generate --schema=prisma/schema.prisma`: passed.
- `npx jest --runInBand src/__tests__/admin.market-settlement-preview.test.ts`: passed.
- `npx tsc --noEmit --pretty false --incremental false`: passed.
- `npm run test:ci`: passed.
- `npm run build`: passed.

Phase I GitHub validation:

- GitHub CI Validate on PR #240: passed.

Phase J local validation:

- `git diff --check`: passed.
- `git diff --cached --check`: passed.
- secret-pattern scan on changed docs: only env-var names and safety wording, no values.

Phase J GitHub validation:

- GitHub CI Validate on PR #241: passed.

Phase K local validation:

- `git diff --check`: passed.
- `npx prisma validate --schema=prisma/schema.prisma`: passed.
- `npx prisma generate --schema=prisma/schema.prisma`: passed.
- `npx jest --runInBand src/__tests__/live-sports-ux-polish.test.ts src/__tests__/live-sports-market-groups-ui.test.ts`: passed.
- `npx tsc --noEmit --pretty false --incremental false`: passed.
- `npm run test:ci`: passed.
- `npm run build`: passed.
- `git diff --cached --check`: passed.

Phase K GitHub validation:

- GitHub CI Validate on PR #242: passed.

Phase L local validation:

- `git diff --check`: passed.
- secret-pattern scan on changed docs: only safety wording, no values.
- `git diff --cached --check`: passed.

## Current Capability Classification

- Stage 0 controlled internal beta setup: ready with warnings.
- Sports/event/market browsing: real runtime behavior, ready for internal smoke.
- Rich live sports event market product: partially implemented for manual/admin-created events.
- Internal live market beta: limited internal market beta only; not ready for full internal live market beta.
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
- admin event market management is merged.
- admin settlement preview is merged.
- live sports provider readiness is merged.
- live sports UX polish is merged.
- Phase L internal live market evidence is pending docs-only validation and PR.
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

Next recommended phase after Phase L is merged: Phase M, server deployment update for live market beta.

Important: Phase L is docs-only evidence and does not approve full internal live market beta, public beta, automatic settlement, public trading, public funding, provider sync, or live bots.

Phase L includes:

- current event -> market -> ticket -> order -> portfolio -> admin -> preview capability classification.
- what was actually validated vs what remains unrun.
- controlled internal drill requirements.
- go/no-go decision.

Use `docs/reviews/INTERNAL_LIVE_MARKET_E2E_EVIDENCE.md` and `docs/reviews/INTERNAL_LIVE_MARKET_GO_NO_GO.md` as context for Phase M after Phase L merges.

## Exact Next Prompt

```text
You are Codex acting as LeadAgent for POLY.

Start from latest dev in:
C:\Users\hecto\Desktop\projects\PolyProj\poly

Before GitHub CLI:
$env:PATH = 'C:\Program Files\GitHub CLI;' + $env:PATH

Continue the live sports prediction-market roadmap with Phase M only, but only after the Phase L PR has been reviewed, merged, and pulled into `dev`.

Branch:
agent/live-market-server-deployment-update

PR title:
docs(beta): update server deployment for live market beta

Use:
docs/reviews/LIVE_SPORTS_MARKET_MODEL_DESIGN.md
docs/reviews/LIVE_SPORTS_MARKET_SCHEMA_IMPLEMENTATION.md
docs/reviews/LIVE_EVENT_MARKET_GROUPS_UI_EVIDENCE.md
docs/reviews/LIVE_MARKET_TRADE_TICKET_V1_EVIDENCE.md
docs/reviews/INTERNAL_BETA_ORDER_PLACEMENT_EVIDENCE.md
docs/reviews/PORTFOLIO_OPEN_ORDERS_POSITIONS_EVIDENCE.md
docs/reviews/ADMIN_EVENT_MARKET_MANAGEMENT_EVIDENCE.md
docs/reviews/MARKET_RESOLUTION_SETTLEMENT_EVIDENCE.md
docs/reviews/LIVE_SPORTS_PROVIDER_READINESS.md
docs/reviews/LIVE_SPORTS_UX_POLISH_EVIDENCE.md
docs/reviews/INTERNAL_LIVE_MARKET_E2E_EVIDENCE.md
docs/reviews/INTERNAL_LIVE_MARKET_GO_NO_GO.md

Update server deployment docs with live-market beta migration, trading flags, allowlist, kill switch, emergency disable, rollback, and post-deploy controlled drill instructions.

Rules:
- do not touch main.
- do not deploy.
- do not change public trading behavior.
- do not change ledger behavior.
- do not add ledger settlement.
- do not change funding behavior.
- do not change withdrawal behavior.
- do not enable live bots.
- do not modify GitHub workflows.
- do not print secrets.
- do not enable public trading.
- do not enable anonymous trading.
- do not bypass allowlists.
- do not add public market resolution.
- do not add external provider integration.
- do not scrape.
- do not start from a branch that does not include merged Phase L evidence docs.

Validation:
- git diff --check
- git diff --cached --check
- npx tsc --noEmit --pretty false --incremental false
- npm run test:ci
- targeted evidence/doc checks
- no production deployment

Before stopping, update docs/reviews/LIVE_MARKET_BETA_CONTINUATION_PROMPT.md with Phase M status.
```
