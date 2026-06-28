# User Journey Review

## Anonymous Visitor Browsing Markets

- Current path: `/`, `/markets`, `/events`, `/sports`, `/sports/soccer`, `/sports/soccer/world-cup`.
- Target ideal path: land on sports-first discovery, open an event, inspect market prices, understand sign-in requirement.
- Friction: too many equivalent entry points, default NBA filter conflicts with soccer/World Cup goal, homepage duplicates markets.
- Missing states: unauthenticated trade preview should be explicit and consistent.
- Safety risks: none direct if read-only, but misleading live/test-credit copy can damage trust.
- Improvements: choose one primary discovery route, add clear "internal beta, test credits only" banner, simplify categories.

## User Login

- Current path: `/login`, `AuthModal`, Google or wallet login routes.
- Target ideal path: one simple sign-in prompt with clear account benefits.
- Friction: wallet login and wallet linking can be conceptually mixed.
- Missing states: better copy for failed provider/linking cases.
- Safety risks: admin bootstrap and dev-login bypass must remain test-only.
- Improvements: distinguish "sign in with wallet" from "link payout wallet".

## Wallet/Account Page

- Current path: `/wallet` shows available/locked/total, faucet, linked wallets, disabled deposit messaging, withdrawal request/history.
- Target ideal path: account balance, test-credit faucet in beta, clear deposit/withdraw disabled state until approved.
- Friction: mixed U credits, USDC, Base, Polygon, disabled deposits, and withdrawal request controls.
- Missing states: canonical deposit unavailable state; withdrawal disabled state; linked-wallet purpose.
- Safety risks: real money movement surfaces can confuse beta users.
- Improvements: split beta wallet from production funding, hide money movement actions behind explicit gates.

## Deposit Intent / QR Deposit Flow

- Current path: wallet includes `TransferCryptoModal` and backend has `/api/deposits`, `/api/deposits/address`, `/api/wallet/deposit-intent`, `/api/wallet/deposit-status`, `/api/wallet/deposit-verify`, and Polygon monitor services.
- Target ideal path: user gets one chain/token/address, QR code, minimum, confirmations, pending/credited status, and support instructions.
- Friction: legacy Base deposit verification and Polygon per-user deposit addresses both exist.
- Missing states: canonical chain decision, stuck/pending/reorg/failure messaging, reconciliation view for users.
- Safety risks: duplicate crediting, wrong-chain deposits, private-key custody, and unclear external references.
- Improvements: decide canonical deposit architecture, hide legacy flow or mark it explicitly legacy, add reconciliation smoke tests.

## Withdrawal Request Flow

- Current path: `/wallet` posts to `/api/withdrawals/request`; admin completes/rejects through `/admin/withdrawals`.
- Target ideal path: user requests withdrawal, funds lock, admin reviews, tx hash completes, rejection unlocks.
- Friction: wallet page says withdrawals disabled while request code exists.
- Missing states: user-facing approval/rejection explanation, expected timing, irreversible tx warning.
- Safety risks: manual process, admin authority, tx hash reuse, locked balance reconciliation.
- Improvements: gate withdrawal API/UI, add stronger admin confirmation, require human ops checklist.

## Placing A Yes/No Trade

- Current path: market detail or grouped event trade ticket posts orders to order APIs.
- Target ideal path: choose Yes/No, enter dollars, review shares/max payout/price, submit, see position/order update.
- Friction: orderbook terms, limit/market selection, U vs dollars, reference-only/bot plan display.
- Missing states: clearer insufficient balance, market closed, stale price, partial fill, and order queued states.
- Safety risks: user misunderstanding of shares, locked funds, market vs limit behavior.
- Improvements: default retail flow should be "Buy Yes" or "Buy No" with advanced limit controls collapsed.

## Canceling Orders

- Current path: market detail "My Open Orders" cancel button.
- Target ideal path: clear cancel action, immediate pending state, balance unlock confirmation.
- Friction: compact text, no explicit confirmation for cancel.
- Missing states: cancel pending/error, partial fill before cancel.
- Safety risks: locked balance and reserved shares must reconcile.
- Improvements: add focused UI and API tests for cancel and unlock display.

## Viewing Positions

- Current path: market detail "My Position" and `/portfolio`.
- Target ideal path: account-level portfolio plus market-level position summary.
- Friction: position value/PnL terminology may be advanced.
- Missing states: first-time user education, resolved positions, claim/settlement status.
- Safety risks: incorrect PnL or reserved shares misleads users.
- Improvements: simplify summary and add invariant tests for position display data.

## Market Discovery

- Current path: homepage, `/markets`, `/events`, sports pages.
- Target ideal path: sports-first categories, events, trending/live markets, search.
- Friction: duplicated navigation and filters.
- Missing states: search, sorting, liquidity/volume filter, category empty explanations.
- Safety risks: low.
- Improvements: define one information architecture.

## Sports Event Discovery

- Current path: shared sports event pages and event detail tabs.
- Target ideal path: league/tournament pages leading to match pages with grouped markets.
- Friction: "demo" copy and overlapping sports routes.
- Missing states: no schedule, no competition/tournament hierarchy.
- Safety risks: low unless trading links misstate status.
- Improvements: make World Cup/soccer MVP crisp.

## Admin Market Creation

- Current path: `/admin` create form and `/api/admin/markets/create`.
- Target ideal path: admin creates markets from safe templates with preview and validation.
- Friction: dense form with many options.
- Missing states: draft/preview, validation summary, template provenance.
- Safety risks: incorrect outcomes/resolution rules.
- Improvements: template-first market creation and review step.

## Admin Market Resolution

- Current path: admin market resolve actions and invariant page.
- Target ideal path: resolution preview, affected positions, payout totals, confirmation, audit event.
- Friction: high-impact action close to routine admin list.
- Missing states: settlement preview and reconciliation after settlement.
- Safety risks: critical financial risk.
- Improvements: require human review, add settlement preview and tests before public launch.

## Admin Deposits Review

- Current path: `/admin/deposits` and rescan route.
- Target ideal path: monitor status, pending/credited/ignored deposits, confirmations, reconciliation, rescan controls.
- Friction: canonical flow ambiguity.
- Missing states: stuck deposits, scan errors, last scanned block by address.
- Safety risks: critical crediting risk.
- Improvements: canonical deposit decision and reconciliation hardening.

## Admin Withdrawals Review

- Current path: `/admin/withdrawals`, complete/reject routes.
- Target ideal path: pending queue, locked funds, destination, risk checks, tx hash completion, audit trail.
- Friction: manual high-risk workflow.
- Missing states: two-person review, treasury tx preparation, failure/retry.
- Safety risks: critical custody risk.
- Improvements: harden before real withdrawals.

## Bot/Admin Agent Monitoring

- Current path: `/admin/bots`, `/admin/agents`, reference markets.
- Target ideal path: internal operations dashboards with dry-run/live separation and kill-switch state.
- Friction: dense operational metrics.
- Missing states: risk-limit breach, stale heartbeat, live trading disabled/enabled summary.
- Safety risks: high if bots can trade live.
- Improvements: keep internal and require BotAgent/SecurityAgent review.
