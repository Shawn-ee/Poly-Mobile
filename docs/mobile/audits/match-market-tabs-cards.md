# Match Market Tabs And Cards Audit

Status: Cycle X P0 pass for focused match market tabs/cards scope.

Cycle: X

Lead Agent target: match-specific market tabs and first cards on a Polymarket-style soccer game page.

Reference Audit Agent: same-cycle Samsung S23 mobile web reference.

Implementation Agent: Holiwyn EventDetail market tab/card implementation.

Audit Gate Agent: same-cycle tablet proof against written P0 criteria.

## Scope

This cycle covers the visible market tab row and first match-specific market cards discovered on a reachable Polymarket World Cup soccer match page. It does not claim full game-page parity, full live stats parity, full ticket parity, or complete backend market-data parity.

Reference route:

- `https://polymarket.com/event/fifwc-usa-bel-2026-07-06-first-to-score`

Reference device/app:

- Samsung S23 / Polymarket mobile web.

Holiwyn proof device/app:

- Samsung tablet / Holiwyn Expo Go.

## Cycle X Reference Audit

Actions performed on Polymarket:

- Opened a reachable World Cup match event page.
- Swiped through the top match page like a mobile user.
- Tapped/observed visible market tab options.
- Opened and inspected visible card-level details.
- Captured screenshots and UI hierarchy.

Reference evidence:

- `docs/mobile/reference/screenshots/cycle-X-polymarket-bel-usa-entry.png`
- `docs/mobile/reference/screenshots/cycle-X-polymarket-bel-usa-entry.xml`
- `docs/mobile/reference/screenshots/cycle-X-polymarket-bel-usa-lines-1.png`
- `docs/mobile/reference/screenshots/cycle-X-polymarket-bel-usa-lines-1.xml`
- `docs/mobile/reference/screenshots/cycle-X-polymarket-bel-usa-lines-2.png`
- `docs/mobile/reference/screenshots/cycle-X-polymarket-bel-usa-lines-2.xml`
- `docs/mobile/reference/screenshots/cycle-X-polymarket-bel-usa-lines-3.png`
- `docs/mobile/reference/screenshots/cycle-X-polymarket-bel-usa-lines-3.xml`
- `docs/mobile/reference/screenshots/cycle-X-polymarket-bel-usa-exact-score-tab.png`
- `docs/mobile/reference/screenshots/cycle-X-polymarket-bel-usa-exact-score-tab.xml`

Observed Polymarket behavior:

- Match page shows a top match header with teams, date/time, `Market` and `Live stats` tabs, a probability chart, and time range controls.
- Market tab row exposes `Game Lines`, `Exact Score`, and `Halves` in the captured page.
- `Game Lines` includes match-specific cards rather than only flat generic rows.
- `Team to Advance` appears as a card with event volume and two outcome buttons, for example `USA 52c` and `BEL 49c`.
- `Moneyline REG TIME` appears as a separate card with event volume and three outcome buttons, for example `USA`, `DRAW`, and `BEL`.
- Card-level details expose `Order Book`, `Graph`, and `About` controls with small action icons.
- `Order Book` detail shows tabular depth with headers equivalent to price, shares, and total.
- `Exact Score` is a separate market tab and should not be hidden inside generic game lines.
- `Halves` is a separate market tab and should lead to half-specific markets.

## Acceptance Criteria

| Criterion ID | Priority | Expected behavior | Verification |
| --- | --- | --- | --- |
| MMTC-P0-01 | P0 | Holiwyn event page shows a market tab row with `Game Lines`, `Exact Score`, `Halves`, and the existing `Player Props` placeholder tab. | Tablet screenshot and XML include all tab labels. |
| MMTC-P0-02 | P0 | `Game Lines` begins with a Polymarket-style `Team to Advance` card with volume copy and two outcome price buttons. | Tablet screenshot/XML include `Team to Advance`, `$60.9K Vol.`, two team-code price buttons, and the card test id. |
| MMTC-P0-03 | P0 | The `Team to Advance` card exposes inline `Order Book`, `Graph`, and `About` controls. | Tablet XML includes the three controls and the harness can tap `Graph`. |
| MMTC-P0-04 | P0 | The inline `Order Book` state shows depth headers and rows for price, shares, and total. | Tablet XML includes `PRICE`, `SHARES`, `TOTAL`, `55c`, and `54c`. |
| MMTC-P0-05 | P0 | Tapping `Graph` changes the inline card detail state without leaving the event page. | Tablet XML includes `Line movement for Team to Advance` after tapping `Graph`. |
| MMTC-P0-06 | P0 | Tapping `Exact Score` switches to a separate exact-score market section. | Tablet screenshot/XML include `Exact Score`, `Correct score at full time`, and sample scores such as `0-0`, `1-0`, and `0-1`. |
| MMTC-P0-07 | P0 | Tapping `Halves` switches to a separate halves section with first-half and second-half markets. | Tablet screenshot/XML include `1st Half Winner` and `2nd Half Winner`. |
| MMTC-P1-01 | P1 | `Live stats` should be a real tab matching Polymarket's match page. | Deferred; not implemented in this focused cycle. |
| MMTC-P1-02 | P1 | Exact Score and Halves should be backend-provided market groups with real odds/depth. | Deferred; current data is local/fallback shaped. |
| MMTC-P1-03 | P1 | Card-level `Graph` should render real market history for the selected market. | Deferred; current graph is a local inline state. |
| MMTC-P2-01 | P2 | Card spacing, action icons, and micro-animation should be side-by-side polished against Polymarket. | Deferred visual polish. |

## Holiwyn Implementation

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

User interactions implemented:

- View market tab row on match page.
- View a `Team to Advance` card before the existing moneyline/game-line rows.
- Tap inline `Graph` inside the card and remain on the same event page.
- Tap `Exact Score` and view exact-score rows.
- Tap `Halves` and view half-specific markets.

State transitions:

- `activeTab: "game-lines" -> "exact-score" -> "halves"`.
- `activeLineDetailTab: "order-book" -> "graph"`.

## Holiwyn Proof

Verification:

- `npm run typecheck`
- `powershell -ExecutionPolicy Bypass -File ./scripts/smoke-tablet.ps1 -EventDetailMarketTabs -Port 8195`

Holiwyn evidence:

- `docs/mobile/screenshots/cycle-current-holiwyn-market-tabs-game-lines.png`
- `docs/mobile/harness/cycle-current-holiwyn-market-tabs-game-lines.xml`
- `docs/mobile/harness/cycle-current-holiwyn-market-tabs-graph.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-market-tabs-exact-score.png`
- `docs/mobile/harness/cycle-current-holiwyn-market-tabs-exact-score.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-market-tabs-halves.png`
- `docs/mobile/harness/cycle-current-holiwyn-market-tabs-halves.xml`

## Audit Gate Result

| Criterion ID | Priority | Result | Evidence | Fix if failed |
| --- | --- | --- | --- | --- |
| MMTC-P0-01 | P0 | Pass | `cycle-current-holiwyn-market-tabs-game-lines.xml` | None |
| MMTC-P0-02 | P0 | Pass | `cycle-current-holiwyn-market-tabs-game-lines.xml` | None |
| MMTC-P0-03 | P0 | Pass | `cycle-current-holiwyn-market-tabs-game-lines.xml`; `cycle-current-holiwyn-market-tabs-graph.xml` | None |
| MMTC-P0-04 | P0 | Pass | `cycle-current-holiwyn-market-tabs-game-lines.xml` | None |
| MMTC-P0-05 | P0 | Pass | `cycle-current-holiwyn-market-tabs-graph.xml` | None |
| MMTC-P0-06 | P0 | Pass | `cycle-current-holiwyn-market-tabs-exact-score.xml` | None |
| MMTC-P0-07 | P0 | Pass | `cycle-current-holiwyn-market-tabs-halves.xml` | None |

Decision:

- Pass/fail: Pass for focused match market tabs/cards scope.
- Unresolved P0 gaps: 0 for this focused scope.
- Remaining P1/P2 gaps: real Live Stats tab, backend-driven Exact Score/Halves market groups, backend-driven card graph/depth, visual density polish.
- Next cycle required: yes. Continue toward complete game-page parity; do not claim the full game page is complete from this focused pass.
