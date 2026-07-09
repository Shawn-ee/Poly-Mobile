# Cycle PR - Current MVP Service Readiness Inspection

Status: P0 Audit Gate passed for the current Local MVP route state.

## Scope

Current Local MVP retail betting path:

Home -> Event Detail -> Spread line market -> simple Buy ticket -> fake-token/server-backed order -> Portfolio/history.

This cycle does not claim provider-backed spread/totals parity. It inspects the real current service state, proves the working route, and documents the provider gap honestly.

## Current State

- Home match feed returns one current World Cup match: `argentina-vs-egypt`.
- Regulation Winner is provider-backed from Polymarket: 3 Polymarket markets.
- Spread, Totals, and Team Totals are Local MVP contract fixtures: 4 line markets.
- No route-visible provider-backed Polymarket spread/totals/team-total markets are currently attached for the selected match.
- Order book, chat, live stats, deposit, and social features remain out of the Local MVP path.

## Acceptance Criteria

| ID | Priority | Criterion | Evidence |
| --- | --- | --- | --- |
| PR-P0-01 | P0 | Home route is match-only and does not expose futures/outrights in the Local MVP feed. | `cycle-PR-service-readiness-inspection.json` shows `futuresCount: 0`. |
| PR-P0-02 | P0 | Event Detail exposes provider-backed Regulation Winner and clearly labels contract-fixture line markets. | Inspection JSON and S23 XML show provider winner plus contract fixture line disclosures. |
| PR-P0-03 | P0 | Selected Spread line can be submitted through server order flow and filled with fake-token liquidity. | `cycle-PR-match-line-order-lifecycle.json` shows filled order. |
| PR-P0-04 | P0 | Portfolio and history preserve selected market/outcome/line/source identity. | Backend lifecycle JSON plus S23 proof summary. |
| PR-P0-05 | P0 | S23 visible flow proves Home -> Event Detail -> line -> ticket -> submit -> Portfolio/history. | `cycle-PR-current-mvp-s23-visible-flow.json`. |
| PR-P0-06 | P0 | Missing provider-backed line markets are documented as a gap, not hidden as Polymarket parity. | This audit and data contract gaps. |

## Proof

- Backend health: passed at `http://127.0.0.1:3002/api/health`.
- Current state inspection: `docs/mobile/harness/cycle-PR-service-readiness-inspection/cycle-PR-service-readiness-inspection.json`.
- Backend order lifecycle: `docs/mobile/harness/cycle-PR-service-readiness-inspection/cycle-PR-match-line-order-lifecycle.json`.
- Samsung S23 visible proof: `docs/mobile/harness/cycle-PR-service-readiness-inspection/cycle-PR-current-mvp-s23-visible-flow.json`.
- S23 screenshots: `docs/mobile/screenshots/cycle-PR-service-readiness-inspection/`.

## Result

Unresolved P0 gaps for the current Local MVP route proof: 0.

Remaining P1/P2 gaps:

- P1: Real provider-backed spread/totals/team-total markets are still unavailable for the selected match.
- P1: Current worktree does not contain a local `.env`; proof commands loaded the local DB URL from the original non-committed repo env.
- P2: Expo Go launch remains noisy; dev build/APK should replace Expo Go for stable automation.
