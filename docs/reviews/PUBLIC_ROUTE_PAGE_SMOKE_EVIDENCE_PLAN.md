# Public Route Page Smoke Evidence Plan

Task id: DOC-042

Phase: Phase B/D/G - Public API safety, UI readiness, and beta evidence

Assigned subagents: TestingAgent, FrontendAgent, SecurityAgent

Risk level: Low for docs-only planning

## Purpose

This plan defines safe route/page smoke evidence that should exist before broader UI implementation or beta review.

It does not add Playwright tests, run browsers, change UI, change routes, change package scripts, change CI, deploy, or alter product/runtime behavior.

## Smoke Evidence Goals

Future smoke evidence should answer:

- Can anonymous users load public discovery pages?
- Can public pages render without admin, bot, funding, or secret leakage?
- Do sports-first discovery routes show useful empty/loading/error states?
- Do route pages stay mobile-safe and avoid horizontal overflow?
- Are wallet/account pages clearly beta-safe when viewed by logged-in users?
- Are admin/internal pages excluded from normal public smoke lanes?

## Initial Public Route Set

Recommended first smoke set:

| Route | User state | Purpose | Risk | Notes |
|---|---|---|---:|---|
| `/` | anonymous | Entry point and sports-first CTA. | Low | Should not show admin/funding/live-bot controls. |
| `/markets` | anonymous | Secondary all-market browser. | Low | Should show public markets or safe empty state. |
| `/markets/[id]` | anonymous | Market detail display path. | Medium | Use seeded/local public fixture only; avoid trading actions in smoke. |
| `/events` | anonymous | General event browser. | Low | May become secondary to sports. |
| `/events/[slug]` | anonymous | Event detail and grouped markets. | Low/Medium | Use seeded/local public fixture only. |
| `/sports` | anonymous | Primary sports discovery path. | Low | Core MVP route. |
| `/sports/soccer` | anonymous | Soccer discovery path. | Low | Core MVP route. |
| `/sports/soccer/world-cup` | anonymous | World Cup showcase path. | Low | Core MVP route. |
| `/login` | anonymous | Sign-in entry. | Low | Should not expose internals. |
| `/portfolio` | logged-in test user | Account/positions entry. | Medium | Must use local test account only. |
| `/wallet` | logged-in test user | Beta-safe account/funding state. | High by topic | Evidence only; no funding actions. |

Do not include admin, bot, wallet funding mutation, withdrawal, ledger, matching, settlement, or live trading operations in public smoke lanes.

## Required Evidence Per Route

Each future smoke result should record:

- route path
- test user state: anonymous or local test user
- environment: local dev/test only
- command used
- result: pass/fail
- screenshot path if captured
- visible empty/loading/error state summary
- no secret/admin/bot/internal leakage summary
- whether route depends on unstable public API contract

Screenshots must not include secrets, private keys, production data, or real customer data.

## Safe Future Implementation Scope

A future TestingAgent PR may add smoke tests only if it:

- uses local dev/test data
- avoids production data and credentials
- avoids real chain RPC and external services
- avoids wallet/deposit/withdrawal mutation flows
- avoids order placement, order cancellation, fills, trades, matching, settlement, and position mutation flows
- avoids admin auth behavior changes
- avoids bot live/dry-run runtime behavior
- avoids deployment config changes
- leaves `package.json`, workflows, and scripts unchanged unless the PR is explicitly human-reviewed

## Non-Auto-Merge Boundaries

Do not auto-merge a future smoke-test PR if it:

- changes `package.json`
- changes GitHub workflows
- changes executable scripts
- changes runtime UI or API behavior
- requires login credentials outside local test fixtures
- touches admin auth tests
- touches wallet/funding/trading/bot/deployment implementation
- requires real external services

Docs-only updates to this plan may be auto-merged when validation passes.

## Suggested Future Test Strategy

1. Start with docs-only route evidence template.
2. Add local-only smoke tests for anonymous public routes.
3. Add logged-in portfolio/wallet smoke only after local auth setup is stable and safe.
4. Keep screenshots in ignored test artifacts unless explicitly approved.
5. Promote any smoke lane to CI only through a separate human-reviewed package/workflow PR.

## Acceptance Criteria For Future Smoke PR

Future smoke evidence is acceptable when:

- public routes can be loaded without production credentials
- no admin/bot/secret/internal data appears in public route screenshots
- public routes have visible safe empty/error states
- wallet/funding pages remain beta-safe and do not execute funding actions
- validation passes
- PR body records route list, user state, environment, and evidence paths

## Non-Goals

This plan does not:

- add tests
- change UI
- change API behavior
- change package scripts
- change workflows
- deploy
- approve beta launch
- alter wallet, deposit, withdrawal, ledger, matching, settlement, trading, admin auth, bot, Prisma, migrations, or production behavior
