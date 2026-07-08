# Cycle OD - Current Provider Line Inspection

## Scope
- Inspect the current Local MVP service state before continuing UI work.
- Focus on the visible MVP event `argentina-vs-egypt`.
- No mobile UI, orderbook, chat, live stats, social feature, schema, or order route changes.

## Findings
- `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10` returns the current MVP event `Argentina vs. Egypt`.
- `/api/mobile/events/argentina-vs-egypt/live-detail` returns 7 markets:
  - 3 `polymarket` Regulation Winner / match-winner markets.
  - 4 `contract-fixture` line markets: spread, totals, and team total.
- `marketSourceSummary.lineMarkets.status` is `contract-fixture`.
- `marketSourceSummary.lineMarkets.providerAvailability.status` is `unavailable`.
- Provider lifecycle/chart data is stale for the current local event; this should not block the fake-token MVP flow, but it should stay visible/honest.

## Provider Discovery Proof
- Proof: `docs/mobile/harness/cycle-OD-current-provider-line-inspection/cycle-OD-provider-discovery-guard.json`
- Provider: Polymarket Gamma.
- Event slug hints:
  - `fifwc-arg-egy-2026-07-07`
  - `665652`
- Result:
  - Match winner attach-ready count: 3.
  - Line target count: 4.
  - Attach-ready line target count: 0.
  - Line wrong-family rejection count: 4.

## Interpretation
- The service is not blocked because Optic Odds is missing.
- The current P1 gap is Polymarket-backed line market availability/mapping.
- The discovery guard is behaving safely: it does not attach draw/match-winner markets to spread/totals/team-total rows.
- For the Local MVP, line markets can keep using backend-shaped contract fixtures, but the app and docs must not claim those rows are Polymarket-backed.

## Adjusted Path
- Continue Local MVP visible flow using:
  - Polymarket-backed Regulation Winner where available.
  - Contract-shaped fixture line markets for spreads/totals/team totals until real Polymarket-backed line markets exist.
- Next meaningful product cycles should prioritize:
  - Real provider-backed line discovery only if Gamma exposes attach-ready line markets for the selected event.
  - Otherwise, improve visible MVP flow around the honest mixed-source state: clear line selection, trade ticket, order, Portfolio/history.
- Do not spend cycles trying to force line attachment from wrong-family match-winner candidates.

## Audit Gate
- Result: pass for inspection.
- No Android proof required because this was a service/provider inspection cycle with no visible mobile change.
- Branch was clean before this inspection cycle started.
