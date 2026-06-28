# Full Platform Review

## Executive Summary

POLY is already a broad internal-beta prediction-market platform. It has public market discovery, event grouping, sports-first pages, orderbook trading, private pool markets, wallet/account pages, portfolio reporting, admin market operations, deposit/withdrawal infrastructure, bot/reference-market tooling, reconciliation services, a focused CI baseline, and an agentic development workflow.

The product direction is promising but the current surface is too complex for a simple retail MVP. It mixes test-credit UX, real-chain deposit architecture, legacy Base deposit verification, Polygon per-user deposit addresses, manual withdrawals, pool markets, reference-market imports, bot controls, admin operations, and agent dashboards in one app. For a Robinhood-like product, the user-facing experience should be much quieter: browse, open event, choose Yes/No, review trade, place order, track position, deposit/withdraw when enabled. Everything else should be hidden, admin-only, or delayed.

The most important near-term work is not adding features. It is simplification, safety boundaries, and test coverage. The sports-first direction should become the MVP information architecture. Public beta should remain blocked until ledger reconciliation, deposit/withdrawal controls, admin auth coverage, and bot live-trading limits are significantly harder.

## Target Product

POLY should become:

- A simple, clean, user-friendly prediction market app.
- Robinhood-like in onboarding, account balance, portfolio, deposit/withdraw, and trade review simplicity.
- Polymarket-like in market discovery, event pages, Yes/No clarity, prices/probabilities, orderbook visibility, positions, resolution, categories, tags, and sports grouping.
- Sports-first for MVP, with World Cup and soccer as the clearest narrative if that remains the seeded direction.
- Internal beta before real-money public launch.

## What The Product Already Does Well

- Has a real Next.js app router structure with public, account, admin, and API routes.
- Has reusable UI primitives and market cards.
- Supports grouped events and sports-specific event pages.
- Has orderbook markets with Yes/No trading, open orders, position display, and SSE routes.
- Uses Prisma models for users, balances, ledger entries, orders, fills, positions, deposits, withdrawals, events, outcomes, categories, tags, and API keys.
- Has wallet linking, faucet/test credits, deposit address infrastructure, deposit monitoring, and manual withdrawal requests.
- Has admin market creation, market pause/resolve/cancel, deposits, withdrawals, reference markets, bots, agents, and system monitor pages.
- Has a focused CI baseline and a subagent operating model.

## Main Product Problems

- Too many concepts are visible at once: markets, events, sports, private pools, bots, reference markets, deposits, withdrawals, faucet, U credits, USDC, Base, Polygon, admin tools, and agent tools.
- User-facing copy sometimes says deposits and withdrawals are disabled while the wallet page still contains real deposit and withdrawal architecture.
- Some UI text has encoding artifacts such as mojibake around warning and cent symbols.
- The homepage and markets page duplicate discovery responsibilities.
- `/markets`, `/events`, `/sports`, `/sports/soccer`, and `/sports/soccer/world-cup` overlap without one obvious primary discovery path.
- Private pool markets are a separate product track and distract from the sports-first prediction-market MVP.
- Admin pages are powerful but dense; dangerous operations need clearer confirmations, audit state, and test coverage before public money.
- Bot/reference liquidity surfaces are visible in places where normal users should see simpler market liquidity and status.

## Top 10 Product/UX Findings

1. The MVP should make `/sports` or `/markets?category=sports` the primary discovery experience, not split attention across three discovery hierarchies.
2. Market detail should feel like one clear trading screen: question, probability, liquidity, Yes/No buttons, position, open orders, resolution state.
3. The wallet page needs a single internal-beta state: test credits only, deposits disabled, withdrawals disabled or request-only. Mixed real-chain affordances should be hidden until enabled.
4. Portfolio should become the account home for positions, orders, PnL, and activity.
5. Homepage should become a simple logged-out/logged-in launch surface, not a second full market board.
6. Sports event pages are the strongest product direction and should get the most design attention first.
7. Pool markets should be hidden or delayed unless they are explicitly part of MVP.
8. Admin navigation needs grouping by risk: content, finance, bots, system.
9. Empty, loading, error, and disabled states exist in places but are inconsistent.
10. Mobile-first trade flow needs explicit review; tables and dense admin panels are likely hard to use on small screens.

## Top 10 Architecture Findings

1. The App Router route structure is broad and mostly clear, but route ownership boundaries are not yet obvious.
2. Trading logic is concentrated in services such as matching, orderbook collateral, ledger, and settlement, which is good, but these are high-risk and need stronger invariants.
3. Deposit architecture has both legacy Base tx verification and newer Polygon per-user address monitoring, which needs a canonical decision.
4. Wallet page UI contains several beta-disabled flows while backend APIs remain present, creating exposure and product confusion.
5. Admin auth exists through `requireAdmin` and `assertAdmin`, but the route inventory is large and should have route-level coverage.
6. Bot/reference-market systems are sophisticated but should be isolated from user trading until risk limits and CI are stronger.
7. Prisma schema models are comprehensive but mix legacy and current financial concepts.
8. There are many scripts for reconciliation, simulation, seed, repair, and bot operations; they need safe/unsafe classification.
9. CI runs a focused smoke suite only; broader tests exist but are not stable enough for required CI.
10. Deployment docs exist, but production readiness depends on reconciliation, secrets hygiene, admin auth, and operational runbooks.

## Top 10 Safety Findings

1. Public launch should be blocked until wallet/deposit/withdrawal gates are explicit and tested.
2. Any change to `UserBalance`, `LedgerEntry`, `LedgerTransaction`, matching, settlement, deposits, withdrawals, or private keys must remain human-reviewed.
3. Per-user Polygon deposit addresses store encrypted private keys; key generation, storage, rotation, and operational access require a formal custody runbook.
4. Legacy Base deposit verification and Polygon deposit monitoring should not both be presented as active canonical flows.
5. Manual withdrawal completion requires tx hash, which is good, but operational approval and reconciliation reporting must be stronger before real funds.
6. Admin pages can perform high-impact actions; unauthorized/forbidden coverage must be broad.
7. Bot live trading and market-making need kill switch, allowlist, notional caps, inventory caps, and live/dry-run separation verified in CI.
8. Repair scripts and reconciliation scripts must be classified so agents do not run destructive or production-impacting commands.
9. Console logging appears careful in many areas, but secret and private-key logging must remain explicitly forbidden.
10. CI should eventually block on balance reconciliation smoke and admin auth coverage before public beta.

## Recommended Simplification

- Make sports/event discovery the main MVP path.
- Hide or delay pool-market creation for public users.
- Hide real deposit/withdraw UI until gates are enabled and reviewed.
- Collapse homepage, markets, events, and sports into a coherent hierarchy.
- Keep admin/reference/bot/agent tooling internal.
- Make "test credits only" the dominant internal-beta message.

## Recommended Next Step

Run a set of low-risk subagent tasks that create a UI information architecture plan and Playwright smoke baseline before changing screens. Do not start wallet, ledger, deposit, withdrawal, matching, settlement, or bot live-trading work until human-reviewed issue scopes exist.
