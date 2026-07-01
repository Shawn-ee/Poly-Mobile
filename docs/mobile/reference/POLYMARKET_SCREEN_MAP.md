# Polymarket Reference Screen Map

Purpose: Record observed Polymarket World Cup/sports app screens for Holiwyn product research.

Boundary:

- Use this file to document interaction patterns and UX structure only.
- Do not copy Polymarket branding, logo, image assets, protected text, or private data.

## Observed Screens

### Home

Status: Observed in Cycle 001.

Observed visible areas:

- Top Holiwyn-relevant sports category row pattern.
- Home, World Cup, MLB, Wimbledon, Tennis style category navigation.
- World Cup winner card pattern.
- Trending market cards.
- Bottom navigation pattern.
- Top-right promotion and notification controls.
- Home category card carousel behavior.

Notes:

- Screenshot: `docs/mobile/reference/screenshots/cycle-001-polymarket-home.png`
- More detailed component mapping should continue in Cycle 002 and Cycle 003.

### World Cup

Status: Observed in Cycle 001.

Observed visible areas:

- World Cup category tab.
- Games and Futures tabs.
- Mexico vs Ecuador game market.
- England vs Congo DR game market.
- Outcome probability buttons.
- Date grouping: Today, Tomorrow, later date sections.
- Two-column team rows with flags, odds multipliers, and probability buttons.

Notes:

- Screenshot: `docs/mobile/reference/screenshots/cycle-001-polymarket-world-cup-games.png`
- Cycle 002 used these observed patterns to build original Holiwyn equivalents for Games, Futures, Event Detail, and Trade Ticket. Next reference observation should open one real World Cup event detail and one ticket on Samsung S23 without submitting a trade.

## Holiwyn Mapping Notes

### Cycle 002

Implemented original Holiwyn equivalents:

- Dark app shell with Holiwyn wordmark, language toggle, promotion button, notification button, category row, and bottom navigation.
- World Cup Games and Futures tabs.
- Game rows with event time, competition label, team rows, odds multipliers, and probability buttons.
- Event detail with grouped markets and props.
- Trade ticket with Buy/Sell side, amount, estimated cost, estimated payout, and fake-token order action.
- Portfolio with fake balance and a newly placed mock position.

## Screenshot Index

Save future reference screenshots under:

- `docs/mobile/reference/screenshots/`

Use names like:

- `cycle-001-polymarket-home.png`
- `cycle-001-polymarket-world-cup-games.png`
- `cycle-002-polymarket-event-detail.png`
