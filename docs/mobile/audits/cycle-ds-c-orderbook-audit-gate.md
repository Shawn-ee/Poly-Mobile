# Cycle DS-C Orderbook Audit Gate - PM-GAP-075

Status: pending Audit Gate for Holiwyn Super Round DS. This document converts the fresh DQ-C Samsung S23 Polymarket evidence into pass/fail criteria for PM-GAP-075. Holiwyn is fail-until-proof for this gate because Agent C found reference evidence and older Book proof, but no integrated DS-C Holiwyn proof that exercises the full DQ-C orderbook selector/settings surface.

## Scope

Feature: PM-GAP-075 live football Book/orderbook family and depth selector parity.

Reference source: Cycle DQ-C S23 Polymarket Android app evidence for Canada vs Morocco World Cup game page.

Holiwyn target: integrated Agent B Android proof on the Holiwyn DS implementation branch/build.

Owned evidence paths for this gate:

- Reference audit: `docs/mobile/audits/live-football-world-cup-dq-c.md`
- Reference screenshots: `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-12-top-book-action.png`, `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-13-orderbook-market-selector.png`, `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-14-orderbook-settings.png`, `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-15-orderbook-depth-scroll.png`
- Reference XML: `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-12-top-book-action.xml`, `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-13-orderbook-market-selector.xml`, `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-14-orderbook-settings.xml`, `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-15-orderbook-depth-scroll.xml`

## DQ-C Reference Findings

- The top Book action opens a dedicated `Order Book` page, not just an inline quote card.
- The orderbook header preserves event identity: `Canada vs Morocco`.
- The top control row exposes `Yes` and `No` tabs plus a selected market selector labeled `CAN to advance`.
- The ladder header is exactly `Price`, `Shares`, `Value`.
- The visible ladder has multiple ask-side and bid-side rows separated by `Spread 0.5c`.
- The market selector is grouped by family: `Moneyline` with `CAN to advance` and `MAR to advance`, then `Spreads` with `CAN -2.5` and `CAN -2.5 1H`.
- The settings action exposes `Decimalize book`.
- DQ-C visual evidence shows red ask bars above the spread and green bid bars below the spread; XML proves the row text, while screenshots prove color/side styling.

## Pass/Fail Criteria

| ID | Priority | Criterion | Pass evidence required | Current DS-C status |
| --- | --- | --- | --- | --- |
| OB-DS-C-P0-01 | P0 | Book action from the live football game detail must open a dedicated Book/orderbook surface while preserving event identity. | Android screenshot/XML after tapping Book from the DS Holiwyn game detail showing a dedicated orderbook surface and the same event teams/title. | Fail until proof |
| OB-DS-C-P0-02 | P0 | Yes/No tabs must be visible and interactive; switching tabs must change the selected outcome/side without losing event or selected market identity. | Before/after Android XML or proof JSON showing `Yes` then `No` tab state and selected outcome/side markers for the same market. | Fail until proof |
| OB-DS-C-P0-03 | P0 | The market selector must be grouped by family and expose at least Moneyline plus Spread choices from the DQ-C-style event. | Android screenshot/XML of the opened selector showing grouped family labels and choices equivalent to Moneyline outcomes plus Spread line/period choices. | Fail until proof |
| OB-DS-C-P0-04 | P0 | Selecting a market family/period/line in the Book selector must carry selected market identity into the ladder and any subsequent ticket action. | Selector before/after proof plus orderbook/ticket XML or proof JSON showing family, period, line, side/outcome, provider/source identity where available, and selected market id. | Fail until proof |
| OB-DS-C-P0-05 | P0 | Ladder columns must include Price, Shares, and Value or an explicitly equivalent total-value column; a single top-of-book quote is not sufficient. | Android XML showing all three column labels and at least two visible rows on each side when depth exists. | Fail until proof |
| OB-DS-C-P0-06 | P0 | Bid and ask sides must be visually distinguishable, with ask rows above the spread and bid rows below the spread. | Android screenshots proving red/ask and green/bid row styling plus XML/proof JSON identifying side for rows. | Fail until proof |
| OB-DS-C-P0-07 | P0 | A spread separator must be visible between asks and bids and must reflect the active ladder state. | Android XML/screenshot showing a spread separator value on the selected market after depth loads. | Fail until proof |
| OB-DS-C-P0-08 | P0 | Loading, empty, unavailable, stale, and error states must be meaningful and must not masquerade as a ready Polymarket-backed ladder. | Route/proof JSON plus Android XML for at least ready and one non-ready state, showing explicit source/status/availability labels or disabled explanatory state. | Fail until proof |
| OB-DS-C-P0-09 | P0 | Android proof must be integrated and DS-C-owned, not only historical route-backed Book evidence. | Committed `cycle-DS-C-*` screenshots/XML/proof JSON and a passing smoke/test summary from the integrated branch/build. | Fail until proof |
| OB-DS-C-P1-01 | P1 | Settings must expose `Decimalize book` or a documented Holiwyn-equivalent display toggle, and toggling it must not reset selected market/side. | Android screenshot/XML of settings plus before/after state proof. | Open |
| OB-DS-C-P1-02 | P1 | Selector coverage should extend beyond the minimum visible Moneyline/Spread pair when more families/periods are exposed in the event. | Additional selector proof for visible Totals/halves/team totals when available in the Holiwyn event. | Open |
| OB-DS-C-P1-03 | P1 | Tapping a ladder row should carry price, side, shares/value context, and selected market identity into the ticket/order path. | Android XML/proof JSON after row tap showing the ticket target and selected order parameters. | Open |
| OB-DS-C-P2-01 | P2 | Density, native motion, row bar lengths, and red/green visual polish should be close to the DQ-C reference after P0 structural parity. | Side-by-side visual QA on phone-size Android screenshots. | Open |

## Exact Proof Agent B Must Provide

Agent B must provide integrated Android evidence under `cycle-DS-C-*` paths, preferably:

- `docs/mobile/screenshots/cycle-DS-C-holiwyn-orderbook-book-action.png`
- `docs/mobile/harness/cycle-DS-C-holiwyn-orderbook-book-action.xml`
- `docs/mobile/screenshots/cycle-DS-C-holiwyn-orderbook-selector.png`
- `docs/mobile/harness/cycle-DS-C-holiwyn-orderbook-selector.xml`
- `docs/mobile/screenshots/cycle-DS-C-holiwyn-orderbook-yes-no-switch.png`
- `docs/mobile/harness/cycle-DS-C-holiwyn-orderbook-yes-no-switch.xml`
- `docs/mobile/screenshots/cycle-DS-C-holiwyn-orderbook-settings.png`
- `docs/mobile/harness/cycle-DS-C-holiwyn-orderbook-settings.xml`
- `docs/mobile/harness/cycle-DS-C-holiwyn-orderbook-proof.json`

The proof JSON or smoke summary must include:

- Event identity used for proof.
- Opened Book action source.
- Selected market family, period, line, side/outcome, and market id before and after selector changes.
- Yes/No tab before/after state.
- Ladder source/status/availability.
- Visible bid and ask row counts.
- Price/share/value fields for representative rows.
- Spread value.
- Ready state plus at least one loading/empty/error/stale/unavailable state or a documented reason the state could not be triggered in that run.
- Settings action result for `Decimalize book` or the Holiwyn equivalent.
- Confirmation that the proof ran on the integrated DS implementation branch/build and not only an isolated worker branch.

## Gate Decision

Current result: Fail until proof.

Unresolved P0 gaps: 9 for this focused gate.

This gate can pass only after Agent B provides integrated `cycle-DS-C-*` Android screenshots/XML/proof JSON satisfying every P0 above. Earlier route-backed Book proof remains useful background, but it does not prove PM-GAP-075 because it does not cover the DQ-C grouped selector, Yes/No switching, market family/period/line identity, settings, and explicit non-ready state requirements in one integrated DS evidence set.
