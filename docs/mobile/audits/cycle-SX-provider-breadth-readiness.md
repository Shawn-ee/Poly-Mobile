# Cycle SX - Provider Breadth Readiness

## Scope

Cycle SX focuses on backend/provider readiness for the Local MVP betting flow. It does not change the visible app UI. The cycle answers two questions:

- Do Holiwyn backend routes expose multiple Polymarket-backed World Cup events?
- Are real attach-ready Polymarket line markets available for the current match, or should Local MVP line rows stay contract-shaped fixtures?

## Evidence

- Runtime route proof: `docs/mobile/harness/cycle-SX-provider-breadth-readiness/cycle-SX-provider-breadth-runtime.json`
- Broad Gamma scan: `docs/mobile/harness/cycle-SX-provider-breadth-readiness/cycle-SX-provider-line-breadth-scan.json`
- Exact current-match probe: `docs/mobile/harness/cycle-SX-provider-breadth-readiness/cycle-SX-provider-line-source-probe.json`

## Result

P0 pass for provider-breadth readiness:

- Broad `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1` returns multiple Polymarket-backed World Cup events.
- Local MVP match-only route remains match-only.
- `argentina-vs-egypt` keeps provider-backed regulation-winner markets.
- Missing `OPTIC_ODDS_API_KEY` is not a blocker.

P1 still open:

- Current-match spread, totals, and team-total rows are not backed by real attach-ready Polymarket line markets.
- Exact event Gamma data has three match-winner markets and zero line markets.
- Manual slug guesses for line markets returned zero candidates.
- Broad line searches returned candidates, but none are attach-ready for the current match and target line families.

## Audit Decision

Do not replace Local MVP line fixtures with broad Gamma search results. They are not relevant enough and do not preserve the required event/market/line/outcome identity.

Keep contract-shaped line fixtures for the Local MVP retail flow until:

- Polymarket exposes real attach-ready line markets for the selected match, or
- another approved provider is configured for line-market enrichment, with a backend-shaped contract matching Holiwyn market/outcome IDs.
