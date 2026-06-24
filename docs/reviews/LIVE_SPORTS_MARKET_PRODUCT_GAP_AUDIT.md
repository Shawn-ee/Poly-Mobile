# Live Sports Market Product Gap Audit

Date: 2026-06-24

Branch: `agent/live-sports-product-gap-audit`

Audited base: `dev` at `d173126 Merge pull request #230 from Shawn-ee/agent/final-pre-deployment-product-capability-audit`

## Executive Summary

POLY already has more runtime product substance than a shell: public sports/event/market browsing, sports event pages, event detail pages, grouped winner-style event markets, market detail pages, real orderbook order submission, matching, order persistence, fills, balances, positions, settlement, portfolio display, admin market operations, controlled funding guards, deposit address generation, deposit auto-credit code, withdrawal holds, and manual admin withdrawal review.

The gap is not "no trading engine." The gap is that the current sports product model is still too generic and reference-market driven for the owner's desired live sports prediction-market experience. It lacks first-class sports entities, first-class market groups, structured prop dimensions, period/line/unit fields, robust event live-state display, operator-grade event/market management workflows, a clearly gated internal trading mode for users, and deployed end-to-end evidence from event discovery through order, position, resolution, settlement, funding, and withdrawal request.

Current capability classification:

- Stage 0 controlled internal beta setup: ready with warnings.
- Sports discovery and event browsing: real runtime behavior, internal-beta ready for smoke.
- Rich live sports event trading product: not ready.
- Public beta: not ready.
- Live bots: not approved.
- Public or anonymous funding: not approved.

## Subagent Findings

### ProductAgent

Current product shape:

- `/sports`, `/sports/soccer`, and `/sports/soccer/world-cup` show sports event discovery.
- `/events` shows event cards.
- `/events/[slug]` supports two modes:
  - grouped reference event view for mutually exclusive winner-style markets.
  - sports event view with market tabs based on `marketType`.
- `/markets` defaults toward live sports/NBA discovery and exposes status/category/league filters.
- `/markets/[id]` opens an orderbook or pool market view.

Product gaps:

- No first-class, reusable market group entity for Main, Spread, Total, Player Props, Team Props, Period Props, Specials, Live.
- Market grouping is currently inferred from string `marketType` or reference metadata, not a product-level taxonomy.
- Props are not first-class. Player props, team totals, period props, and custom prop dimensions would need to live in `rules`/`metadata`.
- Event live state is shallow. Event has `status`, `startTime`, home/away names, and metadata, but no normalized period, clock, score, venue, possession, or source freshness fields.
- Event detail page is useful but not yet the final "one game, many markets, quick trade" experience.
- Current grouped event trade ticket can submit real orders directly to `/api/orders`, which is powerful but needs clearer beta gating and product copy before broad internal testing.

### DataModelAgent

Current schema support:

- `Event` supports `sportKey`, `leagueKey`, `eventType`, `homeTeamName`, `awayTeamName`, `startTime`, `status`, `source`, external IDs/slugs, image/icon, and `metadata`.
- `Market` supports `eventId`, `marketType`, `status`, `visibility`, `mechanism`, `rules`, `closeTime`, `resolveTime`, `resolutionTime`, `resolvedOutcomeId`, reference metadata, and collateral.
- `Outcome` supports labels/codes, display order, tradability, status, metadata, and reference token metadata.
- Order, fill, trade, position, balance, ledger, deposit, and withdrawal tables already exist.

Model gaps:

- No `Sport`, `League`, `Team`, or `Player` tables.
- No first-class `MarketGroup` or event-market section model.
- No normalized market line fields such as `line`, `unit`, `period`, `side`, `participantId`, `participantType`, `propCategory`, or display order by group.
- No first-class event score/clock/live state model.
- Market statuses are generic exchange statuses (`UPCOMING`, `LIVE`, `CLOSED`, `RESOLVED`) rather than a richer draft/open/live/suspended/closed/resolving/resolved/voided product lifecycle.
- Outcome resolved result is only implied by `Market.resolvedOutcomeId`; there is no per-outcome `WIN/LOSE/VOID/PUSH` status.
- Rules and source metadata are JSON-backed, which is flexible but insufficient for consistent UI, filtering, admin editing, and settlement evidence.

### TradingAgent

Current runtime trading support:

- Canonical bot/user order API exists at `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`, and `DELETE /api/orders/:id`.
- `submitCanonicalOrder` normalizes order payloads, enforces idempotency, checks governance policy, and calls `placeOrderAndMatch`.
- Matching service persists orders, matches fills, updates balances/positions, handles collateral invariants, and emits updates.
- UI order ticket exists on market detail and grouped event view.
- Market/order SSE streams exist.

Trading gaps:

- There is no explicit product-level `TRADING_BETA_ENABLED` or user-facing trading allowlist separate from canonical API key governance and auth.
- Trading is real enough to mutate balances and positions, so product UI needs clearer guardrails before broader internal users.
- Grouped event ticket submits a real limit buy order directly and does not expose a global trading kill-switch in the UI layer.
- Market orders are partially constrained by liquidity and canonical docs; the UX should not imply guaranteed instant fills.
- Fee display is mostly placeholder/implicit. The final ticket needs explicit fee/risk/max payout language.
- Order review, cancel, and open-order visibility should be easier to reach from event detail.

### LedgerAgent

Current ledger/balance support:

- `UserBalance`, `LedgerEntry`, `Position`, orders, fills, trades, deposits, and withdrawals are implemented.
- Order placement and cancellation update reserved funds/shares.
- Settlement credits winners and clears positions.
- Deposit auto-credit and withdrawal holds write ledger entries.

Ledger gaps:

- Product docs need a final event-trading ledger map from order hold through fill, cancellation, settlement, deposit, withdrawal hold, withdrawal release, and withdrawal complete.
- UI should distinguish available, held for orders, held for withdrawals, and position value more clearly.
- End-to-end deployed evidence is missing for sports-event order to settlement to portfolio.

### ResolutionAgent

Current resolution support:

- Admin public orderbook market resolution exists.
- Settlement cancels open orders, releases locks, verifies collateral invariants, credits winning positions, writes ledger entries, zeros positions, and sets market resolved.
- Private pool resolution exists.
- Tests cover public orderbook payout, open order cleanup, partial order cleanup, private pool behavior, and reconciliation.

Resolution gaps:

- No first-class `resolving` workflow with evidence note/URL fields.
- No per-outcome `WIN/LOSE/VOID/PUSH` result fields.
- Void/push/refund behavior is not a first-class product path for sports lines.
- Admin resolution UX is not yet tailored to game props, spread/total outcomes, or multi-outcome sports contracts.
- No operator-grade deployed resolution drill evidence for live sports event markets.

### FrontendAgent

Current frontend support:

- Event cards, market cards, sports event cards, grouped event table, outcome buttons, market detail order ticket, portfolio, wallet, and admin pages exist.
- Loading, empty, and error states exist across major public surfaces.
- The design uses POLY's own neutral/teal/green/red system and does not copy proprietary branding or assets.

Frontend gaps:

- Event detail needs a richer game header: home/away, score, period, clock, event status, venue/source freshness.
- Market sections should be scannable by group with search/filter and status counts.
- The trade ticket should behave as a sticky side panel on desktop and a bottom sheet on mobile.
- Suspended/closed/resolved markets need clearer disabled/settled states.
- Grouped event trading copy contains encoding artifacts such as `Ãƒâ€šÃ‚Â¢`/`Ãƒâ€šÃ‚Â·` in `GroupedTradeTicket`; this should be cleaned in a display-only UI phase.
- The user path from event -> market group -> outcome -> ticket -> order -> portfolio needs dedicated browser tests.

### AdminAgent

Current admin support:

- Admin event create/update routes exist.
- Admin sports template routes can create match winner, total goals 2.5, both-teams-to-score, team-to-qualify, and correct-score markets under an event.
- Admin market create/edit/pause/close/cancel/resolve/outcomes/invariants routes exist.
- Admin reference-market import/review/bot controls exist.

Admin gaps:

- Admin market creation is still generic and template-limited.
- No dedicated admin event market management UI for creating/editing grouped props with line, period, participant, unit, and rules.
- No bulk prop management workflow.
- No operator review flow for suspended/live state transitions.
- No structured admin resolution evidence fields.

### TestingAgent

Current test coverage:

- Sports event market model tests.
- Public sports/events/markets no-leak tests.
- Grouped event market no-leak tests.
- Order ticket logic tests.
- Canonical order idempotency/governance tests.
- Orderbook/matching/settlement tests.
- Admin market simulation tests.
- SSE tests.
- Funding/deposit/withdrawal/admin withdrawal tests.
- Local e2e tests for admin and sports authenticated order UI.

Testing gaps:

- No comprehensive Playwright flow for event detail grouped markets -> select outcome -> review ticket -> submit under a deliberate internal trading mode.
- No deployed server smoke for the full live sports market flow.
- No tests for rich prop grouping, period states, suspended/live/closed display across many market groups.
- No schema tests for first-class sport/league/team/player/market-group data because those models do not exist yet.

### SecurityAgent

Current safety support:

- Admin routes generally use `requireAdmin` or `assertAdmin`.
- Funding routes are allowlist and kill-switch guarded.
- Auto-credit is explicitly gated.
- Deposit private-key no-leak tests exist.
- Public no-leak API tests exist for sports/events/markets.
- Dev admin login is disabled in production.

Security gaps:

- User trading needs explicit product-level internal trading gates before broader internal beta.
- Admin event/market management expansion must maintain route-level unauthorized/forbidden tests.
- Live data sync must not print provider keys or scraped data source secrets.
- Funding and trading should remain separate gates.

### BotAgent

Current bot/reference support:

- `poly` has reference-market import, snapshot, admin readiness, and bot monitor surfaces.
- `poly-bot` has market makers, reference liquidity runtime, reference arbitrage observer/rebalancer, risk controls, dry-run/live flags, and safety docs.

Bot/data-feed gaps:

- No approved live external sportsbook/event feed is configured.
- Reference sync appears Polymarket-oriented, not a licensed sports data provider integration.
- Live bots remain unapproved and must stay disabled.
- For the next product phase, use internal/demo provider metadata first, not unauthorized scraping or real paid APIs.

## Current Capabilities

Real runtime behavior:

- Browse sports and sports events.
- Browse event and market lists.
- Open event detail pages.
- View markets grouped under an event by current `marketType` buckets.
- View grouped reference winner-style markets when event/reference metadata supports it.
- View market detail pages with orderbook data.
- Select outcomes and open trade tickets.
- Submit real canonical orderbook orders when authenticated and route/auth conditions pass.
- Persist orders/fills/trades.
- Update balances and positions.
- Stream market and user orderbook updates.
- Resolve public orderbook markets through admin routes.
- Settle winners through ledger-backed credits.
- Display portfolio balances, positions, and resolved history.
- Generate guarded internal Polygon USDC deposit addresses.
- Run guarded deposit auto-credit code.
- Request withdrawals through guarded APIs and hold funds.
- Admin review/reject/complete withdrawals manually.
- Admin create/update/pause/close/cancel/resolve markets.
- Admin create sports template markets under events.
- Reference import/snapshot/bot readiness tooling.

UI-only or limited UX:

- Some live sports group labels are inferred from `marketType`, not real market group records.
- Event live status/score/clock are display gaps unless present in metadata.
- Wallet withdrawal UI currently presents withdrawals as unavailable while guarded APIs exist.
- Some browser route smoke is checklist/local evidence rather than deployed browser evidence.

Mocked or local-only evidence:

- Deposit auto-credit tests use mocked/unit evidence, not a recorded target-server real-chain drill.
- Several route tests mock Prisma/auth paths.
- Local e2e verifies trading UI opens but not a complete deployed order lifecycle.

Docs-only:

- Final deployment readiness, funding go/no-go, and product capability audit are docs evidence.
- Many bot/live-risk boundaries are documented but live services remain disabled.

## Missing Capabilities Against Target Product

Highest-impact missing capabilities:

1. First-class sports domain model: sports, leagues, teams, players.
2. First-class market group model for event pages.
3. Structured prop market fields: line, unit, period, participant, prop category, display order.
4. Rich event live state: score, period, clock, venue, source freshness.
5. Sports-specific admin market management workflow.
6. Trading beta gate and kill switch for user-facing order placement.
7. Event-level order/position/open-order UX.
8. Resolution workflow with evidence, resolving state, void/push/refund semantics.
9. End-to-end internal trading evidence on deployed server.
10. Approved live sports data provider or internal demo feed.

## Route/API Gaps

Needed API additions or extensions:

- public event detail API that returns grouped market sections in a stable product contract.
- admin event market group CRUD.
- admin prop market creation/update API with structured line/period/unit/participant fields.
- trading beta access-status API for UI gating.
- event live-state update API or provider sync route.
- resolution evidence API fields and settlement status route.
- portfolio/open-orders route optimized for event detail.

## UX Gaps

Needed UX additions:

- event detail page with structured tabs or sections: Main, Spread, Total, Team Props, Player Props, Period Props, Specials, Live.
- market rows/cards with line, status, bid/ask, last trade, volume/liquidity, and disabled state.
- sticky/bottom-sheet trade ticket.
- order review state before submit.
- open orders and position summary on market/event page.
- clearer internal beta trading mode copy.
- cleaner grouped ticket encoding/copy.

## Trading Gaps

Trading engine exists, but product readiness gaps remain:

- explicit internal trading gate.
- clearer public/anonymous block path.
- stronger UI disabled states.
- event-level order testing.
- order cancellation UX.
- fee/risk display.
- server evidence from order to portfolio.

## Resolution And Settlement Gaps

Settlement exists, but sports product gaps remain:

- structured resolution evidence.
- resolving lifecycle.
- void/push/refund states.
- per-outcome result fields.
- prop-specific resolution rules.
- admin workflow for many markets under one event.

## Data Feed Gaps

Current repo should not use unauthorized scraping or unconfigured sportsbook APIs. The safe next step is an internal/demo provider abstraction that can update event status and reference prices without secrets. A real sports data provider can be added only when the owner supplies keys and permission.

## What Is Safe For Internal Beta Now

Safe after Stage 0 smoke:

- public browsing.
- sports/event/market display smoke.
- admin-only event/market inspection.
- test-credit trading drills with a small internal account and explicit operator supervision.
- admin resolution drills on seeded/internal markets.
- portfolio display checks.
- funding UI checks only under existing staged funding gates.

Must remain disabled:

- public funding.
- anonymous funding.
- non-allowlisted funding.
- auto-credit until Stage 2 drill.
- automatic withdrawal broadcast.
- live bots.
- public beta.
- unreviewed schema/migration changes.

## Recommended Implementation Sequence

1. Phase B: write the live sports event market model design and schema proposal.
2. Phase C: add minimal schema support for grouped event markets and prop metadata if the design shows existing JSON fields are insufficient.
3. Phase D: build display-only grouped event detail UI on the new/stabilized contract.
4. Phase E: improve market detail/trade ticket v1 display and disabled/gated states.
5. Phase F: add explicit guarded internal beta order placement gate only if current canonical order flow is product-approved.
6. Phase G: strengthen portfolio/open-orders/positions display for event trading.
7. Phase H: add admin event market management for props and grouped markets.
8. Phase I: extend resolution workflow with evidence/void/refund semantics.
9. Phase J: add internal/demo live-state/reference sync before any real provider integration.
10. Phase K: polish live sports UX after the model and routes are stable.
11. Phase L: record end-to-end internal trading evidence.
12. Phase M: final live market beta readiness report.

## Phase A Recommendation

Proceed to Phase B as docs-only design. Do not jump to schema, trading, settlement, or live data sync until the model design is reviewed in docs.
