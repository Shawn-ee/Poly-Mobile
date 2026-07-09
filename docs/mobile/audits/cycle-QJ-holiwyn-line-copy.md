# Cycle QJ - Holiwyn Line Copy

Status: Pass for focused Local MVP source-copy clarity and S23 full-flow regression.

## Scope

- Home/Live/Event Detail/Search/Trade Ticket/Portfolio source wording for contract-fixture line markets.
- S23 proof of Home -> Event Detail -> Spread line -> simple ticket -> swipe buy -> Portfolio History.
- Provider-line availability reinspection before implementation.

Out of scope: order book UI, chat, live stats, social/watchlist, wallet deposit/withdraw, backend schema migration, and real Google OAuth callback proof.

## Reference / Current State Audit

- Current match: `argentina-vs-egypt`.
- Real Polymarket/provider state still exposes provider-backed Regulation Winner markets but no attach-ready Spread/Totals/Team Total line markets for the current event.
- Broad World Cup provider-line scan still found 0 attach-ready line candidates.
- Holiwyn must therefore keep Spread/Totals/Team Total as backend-shaped contract fixtures for the Local MVP, but the visible tester copy should not read like a raw debug label.

Evidence:

- `docs/mobile/harness/cycle-QJ-provider-line-reinspection/argentina-egypt-live-detail.json`
- `docs/mobile/harness/cycle-QJ-provider-line-reinspection/provider-match-line-availability.json`
- `docs/mobile/harness/cycle-QJ-provider-line-reinspection/provider-line-breadth-scan.json`

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Visible app copy replaces tester-facing `Local line(s)` labels with Holiwyn-branded source wording where the line is a contract fixture. | Pass |
| P0 | Internal proof markers still preserve `contract-fixture`, market type, line, period, market id, outcome id, and fake-token/local-test audit markers. | Pass |
| P0 | Event Detail line selection, ticket identity, swipe submit, and Portfolio History still preserve the selected Spread `1.5` contract-fixture identity. | Pass |
| P0 | Order book UI, chat, live stats, social, deposit, and withdraw remain untouched/hidden. | Pass |
| P0 | S23 proof passes on the assigned physical Samsung S23. | Pass |
| P1 | Replace contract-fixture Spread/Totals/Team Total with real provider-backed line markets when Polymarket or an approved provider exposes attach-ready line markets. | Open |
| P1 | Full Google OAuth callback/session/logout proof. | Open |

## Implementation

- Visible source badges/notes now use `Holiwyn`, `Holiwyn line`, `Holiwyn lines`, or `Holiwyn pricing`.
- Internal accessibility/test markers remain unchanged where needed, including `provider-source-contract-fixture`, `line-source-contract-fixture`, `ticket-local-test-pricing`, and `portfolio-local-test-pricing`.
- Proof harness now supports the real filled-history result for the default fake-token order path instead of requiring an empty History state after a successful fill.
- Proof harness credential creation now accepts an explicit dotenv path so the local backend API key script can run from this worktree while reading the main backend `.env`.

## Android Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- App: Holiwyn Expo Go, server mode
- Result: Pass

Evidence:

- Summary: `docs/mobile/harness/cycle-QJ-holiwyn-line-copy/cycle-QJ-current-mvp-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-QJ-holiwyn-line-copy/`
- XML: `docs/mobile/harness/cycle-QJ-holiwyn-line-copy/`

## Audit Gate

- P0 unresolved: 0 for this focused copy/flow scope.
- P1 unresolved: provider-backed line markets remain unavailable; real Google OAuth callback/session/logout remains future auth work.
- This is not a claim that Holiwyn has full Polymarket line-market parity. It is a verified Local MVP clarity step while keeping the backend/data-contract gap explicit.
