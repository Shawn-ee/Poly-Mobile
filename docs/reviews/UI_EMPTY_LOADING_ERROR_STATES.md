# UI Empty, Loading, And Error States

Task id: UI-016

Assigned subagents: LeadAgent, FrontendAgent, TestingAgent, SecurityAgent

Risk level: Low for docs-only state guidance

Status: Active state guide

## Purpose

This guide standardizes empty, loading, error, signed-out, and beta-unavailable states across POLY. It does not implement UI changes, tests, API behavior, wallet behavior, trading behavior, auth behavior, or production settings.

## State Principles

- Every page should explain what is happening.
- Public pages should remain browsable when possible.
- Empty states should not expose admin/internal instructions to normal users.
- Loading states should be stable and not shift layout excessively.
- Error states should state what failed and whether retrying is possible.
- Funding, trading, bot, and admin states must be honest about beta/internal limits.

## Public Discovery Pages

Routes:

- `/`
- `/sports`
- `/sports/soccer`
- `/sports/soccer/world-cup`
- `/events`
- `/markets`

Recommended states:

- Loading: `Loading events` or `Loading markets`.
- Empty: `No markets are ready yet` with a safe browse/check-back message.
- Error: `Could not load markets` with retry guidance if available.

Avoid:

- `Create one in the admin panel`
- Admin-only setup instructions.
- Funding/trading CTAs in empty states.

## Event And Market Detail Pages

Routes:

- `/events/[slug]`
- `/markets/[id]`

Recommended states:

- Missing event/market: plain not-found state with route back to sports or markets.
- No related markets: explain that markets are being prepared.
- Resolved/canceled: show state clearly before any trade area.
- No liquidity: explain that prices may be unavailable or limited.

Forbidden for autonomous display PRs:

- Changing trade ticket behavior.
- Changing orderbook behavior.
- Changing market visibility or API response.

## Account And Portfolio Pages

Routes:

- `/portfolio`
- `/wallet`

Recommended states:

- Signed out: explain sign-in is needed for account-specific data.
- Empty portfolio: point to sports/markets, not funding.
- Funding unavailable: explain beta limitations without enabling actions.
- Balance unavailable: show unavailable, not misleading zero.

Forbidden:

- Changing balance calculations.
- Changing wallet funding/deposit/withdrawal behavior.
- Changing ledger or positions logic.

## Admin Pages

Recommended states:

- No pending items.
- Data unavailable.
- System degraded.
- Review required.

Admin empty states should distinguish healthy zero-work queues from unconfigured or failed data.

Forbidden:

- Changing admin auth.
- Changing mutation behavior.
- Changing financial or bot operations.

## Testing And Evidence

Future test work should prefer:

- Mocked local route states.
- Public/read-only state checks.
- No secrets, no production data, no real credentials.

Future screenshots should avoid:

- Production data.
- Private customer information.
- Private keys or custody identifiers.
- Admin secrets.

## Big UI Overhaul State Updates

The `agent/big-ui-overhaul` milestone applies shared empty/loading/error vocabulary through existing state primitives and page framing:

- Public discovery pages use `EmptyState`, `LoadingState`, and beta-safe explanatory copy where already supported.
- Homepage, events, markets, sports, login, portfolio, wallet, private-pool, and admin shells use consistent page framing.
- Wallet and withdrawal unavailable states are displayed as beta-disabled information without enabling money movement.
- Event detail and market detail changes remain limited to read-only framing; trade/order states remain untouched.

Remaining evidence needed:

- Browser or screenshot verification for major public routes.
- Mobile review for table-heavy portfolio and wallet history sections.
- Human review before adding or changing states around funding, withdrawals, order placement, settlement, admin actions, bot controls, or deployment.

## Validation

This guide is docs-only. Validation:

```bash
git diff --check
```
