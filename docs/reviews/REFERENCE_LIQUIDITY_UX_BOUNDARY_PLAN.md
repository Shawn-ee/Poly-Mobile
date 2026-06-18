# Reference Liquidity UX Boundary Plan

Task id: BOT-003
Assigned subagents: BotAgent, FrontendAgent, SecurityAgent
Risk level: Medium
Status: Planning only

## Purpose

POLY has reference market, quote snapshot, bot readiness, and liquidity seeding surfaces that are useful for operations but potentially confusing or risky if exposed directly to normal users. This plan defines what should be public, what should remain admin-only, and what must be hidden until explicitly approved.

This plan does not change UI code, bot code, trading behavior, reference sync, liquidity behavior, order placement, wallet behavior, ledger behavior, Prisma schema, migrations, deployment, or production settings.

## Product Principle

Users should see simple, truthful liquidity and price context. They should not need to understand internal bots, external reference imports, readiness flags, or operational controls to place a simple Yes/No trade.

Admin operators may need detailed reference and bot status, but those details should be separated from the normal product experience and protected behind admin review.

## Public User Boundary

Future public market pages may show display-safe summaries such as:

- Current Yes/No displayed price or implied probability.
- Market status: open, paused, resolved, canceled, beta-only, or unavailable.
- Liquidity summary in plain language.
- Recent trade activity if the source is POLY market activity.
- A clear stale/unavailable state if price or liquidity data is not fresh.
- A note that prices are market signals, not guarantees.

Future public pages should avoid exposing:

- Bot account names or internal ids.
- Bot readiness flags.
- Reference market import ids.
- Raw external market ids unless deliberately user-facing.
- Snapshot job status.
- Seed bot controls.
- Admin action names.
- Internal risk limit values.
- Credential, private key, signer, or service account details.
- Claims that bot liquidity guarantees execution.

## Admin-Only Boundary

The following concepts should remain admin-only:

- Reference market candidate review.
- Reference market import and refresh operations.
- Snapshot refresh state and failures.
- Bot run state.
- Bot readiness checks.
- Liquidity seeding controls.
- Seed-bot actions.
- Market maker dry-run/live state.
- Risk cap, exposure, stale-data, and kill-switch checks.
- Operational logs and run history.

Admin-only pages should use operational copy, not retail product copy. Mutating controls should require explicit confirmation in a future implementation PR.

## Route And Page Guidance

### Public Market Detail

Routes likely affected in future implementation:

- `/markets/[id]`
- `/events/[slug]`
- `/sports/soccer/world-cup`

Guidance:

- Show price and liquidity context only in user-safe language.
- If reference data is unavailable, show a neutral unavailable state.
- Do not show bot internals or reference import details.
- Do not imply guaranteed fills.

### Public Read APIs

Routes requiring careful future contract design:

- `/api/markets/[id]/quote`
- `/api/markets/[id]/reference`
- `/api/orderbook/[marketId]/book`
- `/api/markets/[id]/trades`
- `/api/orderbook/[marketId]/trades`

Guidance:

- Public response shapes should expose display-safe fields only.
- Internal source metadata should be excluded unless explicitly reviewed.
- Stale-data status should be represented without exposing operations internals.

### Admin Reference Markets

Routes/pages likely admin-only:

- `/admin/reference-markets`
- `/api/admin/reference-markets`
- `/api/admin/reference-markets/[id]`
- `/api/admin/reference-markets/[id]/refresh-snapshot`
- `/api/admin/reference-markets/[id]/seed-bot`
- `/api/admin/reference-markets/polymarket/import`
- `/api/admin/reference-quote-snapshots`

Guidance:

- Keep as admin-only.
- Add future confirmation requirements for mutating actions.
- Separate review/import actions from seed/liquidity actions.
- Show dry-run/live status clearly before any implementation changes.

### Admin Bot Monitor

Routes/pages likely admin-only:

- `/admin/bots`
- `/api/admin/bots`
- `/api/admin/bots/[id]`

Guidance:

- Keep as admin-only.
- Use status categories such as healthy, stale, paused, failed, blocked, and dry-run.
- Do not surface bot internals to normal users.

## Copy Rules

Use public copy such as:

- "Liquidity may be limited."
- "Price reflects current market activity."
- "Data may be delayed."
- "This market is not currently available for trading."

Avoid public copy such as:

- "Bot-backed guaranteed liquidity."
- "Reference market guarantees this price."
- "Seed bot is live."
- "External market imported successfully."
- "Risk cap exceeded" without admin context.

## Safety Rules For Future Implementation

Future implementation PRs must not be auto-merged if they touch:

- Bot live trading.
- Market-making risk limits.
- Liquidity seeding behavior.
- Reference import behavior.
- Snapshot refresh jobs.
- Order placement or cancellation.
- Matching, fills, settlement, ledger, balances, deposits, withdrawals, or positions.
- Admin auth behavior.
- Production deployment settings.
- Secrets or credentials.

Implementation PRs in those areas require SecurityAgent, BotAgent, and human review.

## Testing Expectations For Future Implementation

Future display-only UI changes should include:

- Public route smoke coverage for visible liquidity copy.
- Empty/stale/unavailable states.
- Admin-only route checks if admin pages are changed.
- No live bot command execution in CI.

Future API contract changes should include:

- Tests proving internal bot/reference fields are not leaked to public responses.
- Tests for stale/unavailable response states.
- Full standard validation if code changes.

## Recommended Follow-Up Tasks

1. `BOT-004 - Bot Admin Confirmation Requirements`
   - Define confirmation and audit requirements for admin bot/reference mutations.
   - Docs-only first.
   - Risk: High.

2. `API-004 - Public Read API Contract Draft`
   - Define exact display-safe fields for quote/reference/orderbook read APIs.
   - Docs-only first.
   - Risk: Medium.

3. `TST-007 - Bot Reference Public Leak Test Plan`
   - Plan tests that ensure public APIs do not expose bot internals.
   - Docs-only first.
   - Risk: Medium.

## Non-Goals

This plan does not:

- Change UI code.
- Change API code.
- Change bot, reference sync, liquidity, market-making, or trading behavior.
- Change wallet, ledger, matching, settlement, deposit, withdrawal, balance, position, or order behavior.
- Change admin auth.
- Change deployment or production settings.
- Run bot commands.

## Validation For This Plan

This plan is docs-only. Validation for this PR should be:

```bash
git diff --check
```
