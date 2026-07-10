# Cycle TD - Real World Cup Line Discovery

## Scope

Read-only Polymarket Gamma discovery for real World Cup soccer line markets.

This cycle does not change mobile UI, order logic, schemas, bot logic, order book UI, chat, live stats, social features, deposits, or watchlists.

## Reference Audit

Provider source:

- Polymarket Gamma `/markets` search
- Polymarket Gamma `/events` tag scans
- Search terms include World Cup spread, handicap, totals, team totals, corners, correct score, first half, and `fifwc` variants.
- Tag scans include `fifa-world-cup`, `2026-fifa-world-cup`, and `soccer`.

## Acceptance Criteria

### P0

- Scan must not attach irrelevant markets as line markets.
- Scan must report total candidates, World Cup-relevant candidates, provider line candidates, and attach-ready line candidates.
- Scan must include diagnostics for line-oriented query misses, not just a zero count.
- If no attach-ready line candidates exist, the cycle must keep contract fixtures as the honest Local MVP path.

### P1

- If real attach-ready line candidates appear later, the next cycle should review and map them before replacing fixture rows.

## Proof

Proof file:

- `docs/mobile/harness/cycle-TD-real-worldcup-line-discovery/cycle-TD-provider-line-breadth-scan.json`

Result:

- `rawCandidateCount=3773`
- `worldCupRelevantCandidateCount=2674`
- `providerLineCandidateCount=0`
- `attachReadyProviderLineCandidateCount=0`
- `lineQueryFamilySummary.match_winner=7`
- `lineQueryFamilySummary.spread=0`
- `lineQueryFamilySummary.total_goals=0`
- `lineQueryFamilySummary.team_total_goals=0`
- `lineQueryOtherCandidateSampleCount=0`

Interpretation:

- No real attach-ready Polymarket World Cup line markets were found in this scan.
- Continue Local MVP with explicit contract-fixture line rows and unavailable provider-family disclosure.

## Remaining Gaps

- P1: Real provider-backed spread/totals/team-total current-match lines remain unavailable from Polymarket Gamma.
- P1: If Polymarket later exposes line markets, import/normalize them and replace fixture-only rows.
- P1: If real-money product needs live line pricing before Polymarket exposes it, define an approved secondary provider contract instead of relying on ad hoc local fixtures.
