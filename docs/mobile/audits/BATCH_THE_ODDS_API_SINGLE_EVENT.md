# Batch The Odds API Single Event

## Scope
- Temporary sportsbook odds provider for one soccer event only.
- Uses `THE_ODDS_API_KEY` from the local environment only.
- Does not claim Polymarket-backed parity.
- Does not enable real-money behavior.

## Selected Event
- Sport key: soccer_fifa_world_cup
- Event id: 200d9cd5eda092c7eb778cc104cd2fd2
- Event title: Switzerland vs. Argentina
- Start time: 2026-07-12T01:00:00Z

## API Calls
- sports: /v4/sports | status 200 | used 0 | remaining 500 | last 0
- events:soccer_fifa_world_cup: /v4/sports/soccer_fifa_world_cup/events?dateFormat=iso&commenceTimeFrom=2026-07-12T00%3A00%3A00Z&commenceTimeTo=2026-07-13T00%3A00%3A00Z | status 200 | used 0 | remaining 500 | last 0
- event-markets: /v4/sports/soccer_fifa_world_cup/events/200d9cd5eda092c7eb778cc104cd2fd2/markets?regions=us&dateFormat=iso | status 200 | used 1 | remaining 499 | last 1
- event-odds: /v4/sports/soccer_fifa_world_cup/events/200d9cd5eda092c7eb778cc104cd2fd2/odds?regions=us&markets=h2h%2Cspreads%2Ctotals%2Ch2h_3_way%2Calternate_spreads%2Calternate_totals&oddsFormat=decimal&dateFormat=iso | status 200 | used 7 | remaining 493 | last 6

## Markets
- Available market keys: h2h, h2h_3_way, spreads, alternate_spreads, totals, alternate_totals, team_totals, alternate_team_totals, btts, draw_no_bet, h2h_3_way_h1, totals_h1, correct_score, plus other soccer/player/corners/cards markets recorded in `available-markets.redacted.json`
- Imported market keys: h2h, spreads, totals, alternate_spreads, alternate_totals, h2h_3_way
- Normalized markets: 10
- Normalized outcomes: 22

## Mobile/Backend Proof
- Seed slug: odds-api-single-soccer-test
- Home visible: true
- Detail visible: true
- Sportsbook market count: 10
- Tradable outcome count: 22
- Fake-token order/Portfolio proof: passed in `docs/mobile/harness/the-odds-api-single-event/mobile-flow-proof.redacted.json`
- S23 reachability proof: passed in `docs/mobile/harness/the-odds-api-single-event/s23-device-reachability.redacted.json`

## Result
- Pass: true
- Remaining blocker: full visible S23 walkthrough of the seeded event is still recommended before treating this as human-tested UI proof.
