# Homepage Simplification Spec

This UX-002 spec defines the target `/` homepage behavior for the sports-first MVP. It is planning-only and does not change UI code.

## Goal

Make `/` a simple entry point into POLY, not a second full market board. The homepage should quickly answer:

- What is POLY?
- What can I browse first?
- Am I in internal beta/test-credit mode?
- What is the next action?

The homepage should guide users toward sports/event discovery, then market detail, then login/trading when eligible.

## Current Issues

The current homepage does useful work, but it mixes too many responsibilities:

- Shows featured events and a market grid.
- Includes tag filters that duplicate `/markets`.
- Shows wallet balance on the page surface.
- Shows an admin tools link for admins.
- Uses "Live Markets" and "test U credits" terminology before the product copy model is settled.
- Defaults sports filtering toward seeded tags, which can conflict with the sports-first World Cup/soccer direction.

## Target Homepage Responsibilities

The MVP homepage should include:

1. A short product headline and beta-safe supporting line.
2. One primary CTA: browse sports.
3. One secondary CTA: browse all markets.
4. A compact sports/event preview.
5. A minimal account state hint for logged-in users.
6. A clear empty state when no events or markets are available.

The homepage should not be the primary place for advanced filters, private pools, wallet funding actions, bot/reference details, or admin operations.

## Recommended Layout

### Top Section

- Headline: sports-first prediction markets.
- Supporting copy: internal beta, test credits only.
- Primary CTA: `Browse sports` -> `/sports`.
- Secondary CTA: `View all markets` -> `/markets`.

Avoid hero marketing copy that claims public real-money readiness.

### Sports Preview

- Show a small set of featured sports events or tournament cards.
- Prefer soccer/World Cup cards when available.
- Each card should link to an event route or sport route.
- Empty state should point users to `/sports` and explain that markets are still being prepared.

### Market Preview

- Optional and compact.
- Show only a few active markets with clear Yes/No prices.
- Do not expose full filter controls here.
- Link to `/markets` for full browsing.

### Logged-In Account Hint

- Show a small account summary only if it can be displayed without clutter.
- Prefer linking to `/portfolio` over showing detailed wallet state on the homepage.
- Do not show deposit/withdraw controls on the homepage.

### Admin Visibility

- Do not show admin tools in the main homepage content.
- Admin access should remain in admin-only navigation or account menu.

## Anonymous User State

Anonymous users should see:

- Product/beta framing.
- Sports/event preview.
- Browse CTAs.
- A sign-in CTA only when they attempt a trading action or choose account-specific pages.

The homepage should not block read-only browsing behind login.

## Logged-In User State

Logged-in users should see:

- The same sports-first browsing path.
- A concise account/portfolio link.
- No real-money funding CTA unless funding is explicitly enabled in a future human-reviewed task.

The homepage should make it easy to resume browsing or check portfolio, not manage funds.

## Empty, Loading, And Error States

Future implementation should define:

- Loading skeleton for sports/event preview.
- Empty state when no featured events exist.
- Empty state when no active markets exist.
- Error state when event or market API calls fail.
- Fallback CTA to `/sports` or `/markets`.

Do not use admin-only copy such as "Create one in the admin panel" for normal users.

## Mobile Requirements

- Single-column flow.
- CTAs remain visible without horizontal scrolling.
- Event and market previews should use stable card dimensions.
- Avoid dense chip/filter rows on the homepage.
- Account hint should not crowd the primary CTA.

## Content Rules

- Use consistent beta terminology: internal beta, test credits only.
- Avoid mixing `U`, `USDC`, dollars, and cent symbols on the homepage until the copy glossary is approved.
- Do not mention Base, Polygon, deposits, withdrawals, bots, reference markets, or admin operations on the normal homepage.
- Keep each visible section tied to one action.

## Future FrontendAgent Scope

Allowed future implementation scope:

- `src/app/page.tsx`
- Display-only homepage components if extracted.
- Public route smoke tests or screenshots if assigned.

Forbidden future implementation scope unless separately approved:

- Wallet, deposit, or withdrawal APIs.
- Ledger, matching, settlement, order placement, or position logic.
- Admin auth or admin mutation behavior.
- Bot/reference market live behavior.
- Prisma schema or migrations.
- Deployment config.

## Acceptance Criteria For A Future Homepage PR

- `/` has one primary CTA to sports discovery.
- `/markets` remains the full market browser.
- Admin links are not part of normal homepage content.
- Deposit and withdrawal actions are not shown on the homepage.
- Anonymous users can browse public discovery content.
- Empty/loading/error states are visible and user-safe.
- Mobile layout does not rely on dense filter chips.
- Validation includes TypeScript, Jest smoke, and screenshot or Playwright evidence if UI is changed.

## Non-Goals

This spec does not:

- Implement UI changes.
- Change API behavior.
- Change wallet, deposit, withdrawal, ledger, matching, settlement, order, fill, trade, or position logic.
- Change admin auth.
- Change bot behavior.
- Change deployment behavior.
