# Holiwyn Launch Readiness Report

Last audited: 2026-07-17, Cycle ZCM

## Executive Verdict

Holiwyn is a working local internal alpha for one backend-owned soccer event. It is not yet a public launch candidate and it is not yet a full Polymarket-equivalent product.

The strongest proven journey is real: a Samsung S23 can open a provider-backed event, select a normalized soccer line, receive a server quote, place a fake-token buy, see the position in Portfolio, cash out using owned shares, and see the sell in History. Backend health, Postgres, tests, mobile typecheck, lifecycle guards, stale-market rejection, and local runtime proof are green.

The largest remaining gap is breadth and operational repeatability. The runtime still centers on one selected event and local processes. A public tester should not depend on a developer manually replacing one event, starting several commands, or interpreting proof files.

## Distance To Each Finish Line

These are planning estimates, not test results.

| Finish line | Estimated readiness | Meaning |
| --- | ---: | --- |
| Local developer demo | 90% | One event and the complete fake-token trade/cashout journey work on S23. |
| Internal Android alpha | 70% | Core flow works, but event breadth, restart simplicity, installed build/account proof, and operator handling need consolidation. |
| Public fake-token Android beta | 45% | Requires hosted runtime operations, multi-event reliability, release build distribution, account recovery, monitoring, and broader device/user testing. |
| Polymarket-like World Cup product | 30% | The main retail interaction exists, but full market breadth, production lifecycle automation, deeper portfolio/account behavior, and whole-app parity remain incomplete. |

Real-money funding, deposits, withdrawals, and payment integration are intentionally outside the current implementation and this readiness estimate.

## Proven Today

### Mobile Product

- Home, Live, Event Detail, Trade Ticket, Portfolio, Search, and Account screens exist.
- Home can load backend-owned soccer events and paginates the match feed.
- Event Detail exposes normalized prediction-market semantics instead of raw Asian quarter lines.
- Knockout events support a two-outcome `Team to advance` primary market and retain regulation-time markets below it.
- Spread and total line selectors use clean half-goal values and horizontal selection behavior.
- The simple ticket supports Buy, Sell, amount entry, quote display, and threshold-based vertical swipe submission.
- Position cashout uses owned shares, hides redundant Yes/No controls, prevents UI oversell, and sends a SELL for the owned market/outcome.
- Portfolio positions, open orders, cancellation, activity, cashout, and history are backend-wired.
- Order book, chat, live stats, deposit, and withdrawal are not part of the Local MVP user path.

### Backend And Trading

- The Odds API can provide a real soccer event and sportsbook reference odds through an explicit quota-capped refresh.
- Cached redacted replay supports no-quota development and repeatable testing.
- Soccer winner, spread, and total contracts are normalized before mobile display.
- Backend quote, order, matching, portfolio, history, and cashout routes are proven with fake tokens.
- Stale, paused, and closed markets reject trading.
- Local shifted market-maker liquidity and provider-to-maker handoff are proven.
- Durable provider refresh, maker quote, runtime heartbeat, runtime run, result review, and settlement queue records exist.
- Settlement execution is guarded by market closure, review/approval, and exact confirmation.

### Runtime And Quality

- Backend health passes on port 3002 with Postgres connected.
- Docker Postgres is healthy.
- Local supervisor and result poller are continuous only while their commands run.
- Cached runtime mode spends no provider quota.
- The latest full S23 proof passed on model `SM-S911U1` for Chapecoense vs. Bahia.
- Root TypeScript, Jest CI, mobile TypeScript, and GitHub Actions were green at the ZCK baseline commit `3d77f971`.
- Secrets remain server-side or in ignored local runtime files; committed proof records are redacted.

## Current P0 Launch Gaps

P0 here means required for the proposed Internal Android Alpha release candidate.

| Gap | Current state | Required pass condition |
| --- | --- | --- |
| Stable multi-event catalog | ZCM proves three unique provider identities: one current event and two safely archived events. Provider and Holiwyn fixture counts are separate. Current/upcoming breadth is still one. | Importing event B must not replace event A; rerunning event A must update the same event and preserve market/outcome identity. Three current/upcoming events must coexist for RC1. |
| Multi-event runtime ownership | ZCL adds a no-quota allowlist/readiness contract and explicit event selection through the cached launcher and supervisor. One active owner and one fail-closed archive are proven; orchestration is still one event per process. | One command manages a small allowlist of current events, isolates each event's evidence, reports each event independently, and remains quota capped. |
| Restartable tester environment | The local environment is proven, but still assembled from developer-oriented processes. | A clean machine restart can start DB, backend, mobile runtime, and no-quota workers with one documented command and a green readiness result. |
| Installable Android release | Expo development proof is strong; EAS APK profiles exist. | A signed internal APK/dev build installs cleanly, points at the intended backend, and passes the S23 journey without Expo Go. |
| Physical account flow | Backend-owned Google OAuth exists, but physical callback readiness has not been made a final release gate. | Sign in, relaunch persistence, logout, and failure recovery pass on the installed S23 build without exposing credentials. |
| Current-event lifecycle completion | Close/settlement mechanics and guards are proven, but unattended official-result settlement is not production-owned. | A disposable or real completed event moves through suspend, close, reviewed result, approved settlement, and portfolio payout with an auditable operator path. |
| Unified release gate | Many focused proof commands exist. | One batch command verifies services, catalog, trading, lifecycle safety, installed-device journey, secrets, clean git, and CI. |

## P1 Product Gaps

- Whole-app Polymarket reference parity is incomplete outside the Local MVP trade journey.
- Provider market breadth is narrower than Polymarket/Kalshi-style soccer pages.
- Chart history and probability presentation are simplified; the earlier complex Polymarket chart was intentionally removed.
- Account/profile behavior needs broader physical-device testing.
- Error, reconnect, offline, session expiry, and provider outage behavior needs one full adversarial device pass.
- Multi-user concurrent trading and long-duration soak behavior need proof.
- Hosted backend operations, alerting, backups, and recovery are not part of the local proof.
- iOS remains future work.

## P2 Gaps

- Nonessential social features, chat, watchlists, notifications, and richer live match presentation.
- Advanced trading/depth UI. Existing order-book infrastructure remains internal/debug-only.
- Additional animation and visual micro-polish after structural gates pass.
- Production operator dashboard.

## Recommended Active Goal

### Holiwyn Internal Android Alpha RC1

Build a repeatable, installable, fake-token Android release candidate that serves multiple backend-owned soccer events and preserves the complete trade lifecycle.

RC1 is done only when:

1. At least three provider-shaped soccer events coexist with stable event/market/outcome identities.
2. At least one event uses a fresh approved provider refresh; the others may use redacted replay during development.
3. Home and Event Detail show only clean mobile-facing prediction markets.
4. Buy, partial/full cashout, oversell rejection, open-order cancellation, Portfolio, and History pass.
5. Stale, unavailable, paused, and closed states fail safely.
6. A small event allowlist can be refreshed and locally quoted without manually changing a fixed slug.
7. An internal APK/dev build passes on S23 without relying on Expo Go.
8. Google/account login, persistence, and logout pass on that build.
9. One lifecycle reaches reviewed and approved settlement with payout proof.
10. One unified readiness command, clean worktree, pushed commit, and green GitHub CI close the release.

This goal is narrow enough to finish, but broad enough to remove the main architectural shortcuts. After RC1, the next goal should be Whole-App World Cup Parity, using Polymarket reference audits page by page without reopening already-proven runtime work.

## Ordered Work Plan

1. ZCK complete: provider-stable event identity, collision guard, isolated catalog evidence, and historical replay safety.
2. ZCM partial: three provider identities coexist safely, the allowlist is explicit, and historical evidence cannot enter Home; add two more current/upcoming provider-shaped events under quota caps.
3. Extend the supervisor from one explicitly selected event per process to bounded allowlist fan-out with isolated evidence and quota policy.
4. Prove three-event Home/Event Detail behavior and one full S23 trade journey after a clean restart.
5. Build and install the internal Android APK/dev client; prove account and backend connectivity.
6. Prove current-event lifecycle closure and reviewed settlement.
7. Consolidate all release checks into one RC1 audit gate.
8. Run a final Polymarket/Kalshi-style mobile parity sweep and classify remaining gaps for the next milestone.

## Launch Decision Rule

Do not call Holiwyn launched because the app opens or one event trades. Call RC1 ready only when every P0 row above passes with current backend, database, Android, and CI evidence. Public beta remains a separate decision after RC1 soak testing and hosted operations are proven.
