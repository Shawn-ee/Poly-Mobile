# Game Page Polymarket Audit

Status: Cycle AM focused pass for logged-in game-page hierarchy, core controls, scrolled compact match header, sticky market tabs, Player Props unavailable state, grouped markets, ticket opening, chart interaction, and lower-page proof.

## Scope

Audit the soccer game page from top to bottom:

- Header, back, save/book, share, tabs, chat entry.
- Match teams, time, flags/identifiers, selected outcome state.
- Probability chart and chart press behavior.
- User position card.
- Primary outcome buttons.
- Market tabs and grouped markets.
- Expanded/collapsed rows.
- Game Lines.
- Player Props placeholder/empty state if no props are implemented.
- Market rules, related markets, and lower-page content.
- Ticket opening and selected market/outcome/line carry-through.

## Reference Audit

Reference device:

- Samsung S23.

Polymarket app/browser:

- Logged-in Polymarket Android app.

Route or URL if available:

- Native app Live tab, World Cup category, Australia vs Egypt match page.

Screenshots/UI hierarchy:

- `docs/mobile/reference/screenshots/cycle-AJ-polymarket-live-tab.png`
- `docs/mobile/reference/screenshots/cycle-AJ-polymarket-live-tab.xml`
- `docs/mobile/reference/screenshots/cycle-AJ-polymarket-game-top.png`
- `docs/mobile/reference/screenshots/cycle-AJ-polymarket-game-top.xml`
- `docs/mobile/reference/screenshots/cycle-AJ-polymarket-game-chart-tap.png`
- `docs/mobile/reference/screenshots/cycle-AJ-polymarket-game-chart-tap.xml`
- `docs/mobile/reference/screenshots/cycle-AJ-polymarket-game-group-toggle.png`
- `docs/mobile/reference/screenshots/cycle-AJ-polymarket-game-group-toggle.xml`
- `docs/mobile/reference/screenshots/cycle-AJ-polymarket-game-lines-mid.png`
- `docs/mobile/reference/screenshots/cycle-AJ-polymarket-game-lines-mid.xml`

Actions performed:

| Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- |
| Open Live tab and World Cup category | Shows logged-in Live surface with sports tabs, `World Cup` selected, `Later Today`, match rows, flags, team names, odds, probability buttons, and bottom nav. | Selection moves from Home/World Cup Futures to Live/World Cup match list. | `docs/mobile/reference/screenshots/cycle-AJ-polymarket-live-tab.png` |
| Open Australia vs Egypt match page | Shows Game/Chat segmented control with count, book/share actions, flags, date/time, split two-line probability chart, chat card, primary team buttons, `Game Lines` and `Player Props` tabs, and first market group. | Match context becomes active. | `docs/mobile/reference/screenshots/cycle-AJ-polymarket-game-top.png` |
| Tap chart area | Chart remains in place with selected outcome context; no disruptive navigation. | No order/ticket state changes. | `docs/mobile/reference/screenshots/cycle-AJ-polymarket-game-chart-tap.png` |
| Tap first market group chevron | `Regulation Time Winner` group collapses/changes row visibility while match context remains on page. | Group expansion state changes. | `docs/mobile/reference/screenshots/cycle-AJ-polymarket-game-group-toggle.png` |
| Scroll into Game Lines | Header compresses into sticky compact match context with team codes/probabilities/date, while `Game Lines` and `Player Props` tabs remain near the top and expanded Spread/Totals cards show line dropdowns, period pills, yes/no rows, odds, and probabilities. | Scroll state changes; selected market tab stays Game Lines. | `docs/mobile/reference/screenshots/cycle-AJ-polymarket-game-lines-mid.png` |
| Cycle AL: open logged-in Australia vs Egypt game page and scroll below the chart into markets | The top Game/Chat segmented control remains; compact match context stays visible; `Game Lines` / `Player Props` tab strip is pinned under the compact header while Regulation Time Winner, Spread, and Totals scroll beneath it. | Scroll state changes; active market tab remains Game Lines and remains tappable while market rows move. | `docs/mobile/reference/screenshots/cycle-AL-polymarket-game-sticky-tabs.png` |
| Cycle AM: tap logged-in scrolled Player Props label twice | The visible `Player Props` label remains grey/inactive and the page stays on Game Lines in this reference state. | No observed tab/content change. This aligns with Holiwyn product direction to leave Player Props blank for now rather than fabricate unsupported props. | `docs/mobile/reference/screenshots/cycle-AM-polymarket-player-props.png`; `docs/mobile/reference/screenshots/cycle-AM-polymarket-player-props-second.png` |

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| GP-P0-01 | P0 | Game page has same major information hierarchy as Polymarket for match header, chart, position area, primary outcomes, market tabs, grouped markets, and lower content. | Screenshot comparison | Pass |
| GP-P0-02 | P0 | Every visible button/control has working behavior or clear disabled state. | Device smoke/UI hierarchy | Pass |
| GP-P0-03 | P0 | Market group expansion/collapse and row ticket opening match Polymarket's interaction model. | Device smoke | Pass |
| GP-P0-04 | P0 | Ticket preserves selected market, line, and outcome from the tapped row. | Device smoke/state proof | Pass |
| GP-P0-05 | P0 | Chart is not a static placeholder when Polymarket shows interactive probability movement. | Chart audit/device smoke | Pass |
| GP-AJ-P0-06 | P0 | When scrolled into markets, Holiwyn keeps compact match context visible like Polymarket's scrolled game page. | Samsung tablet screenshot/XML | Pass |
| GP-AL-P1-01 | P1 | When scrolled deeper into Game Lines, Holiwyn keeps a sticky `Game Lines` / `Player Props` tab rail under the compact match header, and the sticky tabs remain usable to switch into Player Props. | Samsung tablet screenshot/XML | Pass |
| GP-AM-P1-01 | P1 | Until backend-supported Player Props are in scope, Holiwyn must not show fabricated player-prop rows; the Player Props tab should resolve to a clear unavailable/empty state. | Samsung tablet screenshot/XML | Pass |
| GP-P1-01 | P1 | Visual density, spacing, and hierarchy are close enough for near parity on phone. | Screenshot comparison | Partial |
| GP-P2-01 | P2 | Micro-interactions and transitions feel close to Polymarket. | Manual audit | Deferred |

## Audit Gate

Result: Pass for focused Cycle AM Player Props unavailable-state scope, Cycle AL sticky market-tab scope, and previous Cycle AJ game-page P0 scope.

Unresolved P0 gaps: 0 for focused scope.

Remaining P1/P2 gaps:

- Native phone density and animation polish remain below Polymarket, although the sticky market tabs now pass the focused AL criterion.
- Backend-supported Player Props remain deferred; Holiwyn now shows an unavailable state instead of local fake prop rows.
- Backend market groups/history/live-stats remain local or deterministic in this focused cycle.

Recommended next cycle:

- Continue game-page visual-density and market-group backend contract cycles, or run a Player Props-specific reference/product-scope pass.
