# Cycle NR - Service State Inspection

## Scope

Inspect current Holiwyn backend/service readiness before continuing the Local MVP mobile loop.

Focus:

- Home route inventory.
- Event Detail market source summary.
- Polymarket Gamma provider event markets.
- Provider candidate attach-readiness.
- Active sports market scan.

## Findings

- Home currently returns one World Cup match: `argentina-vs-egypt`.
- Event Detail has 7 markets:
  - 3 provider-backed Regulation Winner markets.
  - 4 backend `contract-fixture` line markets.
- Line families present in Holiwyn are spread, total, and team-total.
- Polymarket Gamma for `fifwc-arg-egy-2026-07-07` exposes 3 match-winner markets and 0 line markets.
- Provider discovery has 3 attach-ready winner candidates and 0 attach-ready line candidates.
- Active sports scan returns World Cup outright winner futures, not match-level line markets.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| NR-P0-01 | P0 | Current Home route is reachable and returns the MVP match. | Pass |
| NR-P0-02 | P0 | Event Detail route reports provider-backed Regulation Winner. | Pass |
| NR-P0-03 | P0 | Event Detail route reports line families as explicit contract fixtures. | Pass |
| NR-P0-04 | P0 | Polymarket Gamma event availability is inspected before claiming missing lines. | Pass |
| NR-P0-05 | P0 | Provider discovery does not attach wrong-family winner markets to line targets. | Pass |
| NR-P1-01 | P1 | A real provider-backed line source is available for spreads/totals/team totals. | Partial |

## Evidence

- `docs/mobile/harness/cycle-NR-service-state-inspection/cycle-NR-current-state.json`
- `docs/mobile/harness/cycle-NR-service-state-inspection/cycle-NR-provider-match-line-availability-argentina-egypt.json`
- `docs/mobile/harness/cycle-NR-service-state-inspection/cycle-NR-provider-discovery-guard.json`
- `docs/mobile/harness/cycle-NR-service-state-inspection/cycle-NR-polymarket-active-sports-scan.json`

## Path Adjustment

Continue the Local MVP retail betting flow with explicit source disclosure:

Home -> Event Detail -> contract-fixture line market -> simple ticket -> fake-token/server order -> Portfolio/history.

Do not mark Spread/Totals/Team Total as provider-backed Polymarket parity until Holiwyn can attach real provider line markets.

The next useful implementation work is visible MVP flow quality and route honesty, not another visual micro-pass pretending the provider line gap is solved.
