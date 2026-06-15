# poly-bot Sports Compatibility Notes

This Poly branch adds sports event and market metadata while preserving the current orderbook API shape.

## Expected Compatibility

- `POST /api/orders` remains `marketId` + `outcomeId` based.
- Sports markets are normal public orderbook markets.
- Bot clients should not assume markets are binary. Check `outcomes.length`, `marketType`, and individual outcome ids.
- `marketType` identifies sports templates such as `match_winner_1x2`, `total_goals`, `both_teams_to_score`, `team_to_qualify`, and `correct_score`.
- `event` on market read models now includes `sportKey`, `leagueKey`, `eventType`, team names, start time, and status.

## Future poly-bot Work

- Add discovery support for `/api/events?category=sports` and `/api/events/[slug]/markets`.
- Add risk limits for multi-outcome markets.
- Ensure strategies do not apply binary YES/NO assumptions to 1X2 or correct-score markets.
- Keep automated settlement disabled; sports resolution remains manual admin action.
