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
- sports: /v4/sports | status 200 | used 21 | remaining 479 | last 0
- events:soccer_fifa_world_cup: /v4/sports/soccer_fifa_world_cup/events?dateFormat=iso&commenceTimeFrom=2026-07-12T00%3A00%3A00Z&commenceTimeTo=2026-07-13T00%3A00%3A00Z | status 200 | used 21 | remaining 479 | last 0
- event-markets: /v4/sports/soccer_fifa_world_cup/events/200d9cd5eda092c7eb778cc104cd2fd2/markets?regions=us&dateFormat=iso | status 200 | used 22 | remaining 478 | last 1
- event-odds: /v4/sports/soccer_fifa_world_cup/events/200d9cd5eda092c7eb778cc104cd2fd2/odds?regions=us&markets=h2h%2Cspreads%2Ctotals%2Ch2h_3_way%2Calternate_spreads%2Calternate_totals&oddsFormat=decimal&dateFormat=iso | status 200 | used 28 | remaining 472 | last 6

## Markets
- Available market keys: alternate_spreads, alternate_spreads_cards, alternate_spreads_corners, alternate_spreads_h1, alternate_team_totals, alternate_team_totals_corners, alternate_team_totals_h1, alternate_team_totals_h2, alternate_totals, alternate_totals_cards, alternate_totals_cards_h1, alternate_totals_corners, alternate_totals_corners_h1, alternate_totals_h1, alternate_totals_h2, btts, btts_h1, btts_h2, corners_1x2, correct_score, correct_score_h1, double_chance, double_chance_h1, double_chance_h2, draw_no_bet, draw_no_bet_h1, h2h, h2h_3_way, h2h_3_way_h1, h2h_3_way_h2, h2h_h1, h2h_h2, h2h_ot, halftime_fulltime, odd_even, odd_even_h1, player_assists, player_assists_alternate, player_first_goal_scorer, player_fouls, player_goal_scorer_anytime, player_goalie_saves_alternate, player_goals, player_goals_alternate, player_goals_and_assists_alternate, player_last_goal_scorer, player_shots, player_shots_alternate, player_shots_on_target, player_shots_on_target_alternate, player_tackles_alternate, player_to_receive_card, player_to_receive_red_card, player_to_score_or_assist, spreads, spreads_h1, team_totals, team_totals_h1, to_qualify, totals, totals_h1, totals_h2
- Imported market keys: h2h, spreads, totals, alternate_spreads, alternate_totals, h2h_3_way
- Normalized markets: 10
- Normalized outcomes: 22

## Mobile/Backend Proof
- Seed slug: odds-api-single-soccer-test
- Home visible: true
- Detail visible: true
- Sportsbook market count: 10
- Tradable outcome count: 22
- Backend fake-token order: filled BUY on the sportsbook-derived spread line.
- Backend cashout/sell: filled SELL against local fake-token bid liquidity; Portfolio position reduced to zero in the latest backend proof.
- S23 visible proof: Home -> Event Detail -> spread line -> Buy ticket -> Portfolio -> Cash out/Sell ticket -> Portfolio History.

## Result
- Pass: true
- No-quota replay: pass. The run used the redacted odds fixture and made no provider API calls.
- Live-key refresh evidence remains captured in the redacted API call headers from the original single-event fetch.
- Backend fake-token flow: pass. Home, Event Detail, quote, buy order, cashout sell, Portfolio, and History preserve `sportsbook-odds` line identity.
- S23 visible proof: pass.
- S23 proof summary: `docs/mobile/harness/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23-odds-api-s23-visible-flow.json`
- S23 proof screenshots: `docs/mobile/screenshots/cycle-ODDSAPIS23-odds-api-s23-visible-flow/`
- Remaining blocker: none for the temporary sportsbook Local MVP bridge. This still does not claim Polymarket-backed provider parity.
