# Live Event Detail Audit

Status: Cycle AN structural live event detail pass, with backend-shaped fixture data and tablet proof. This is not a backend parity pass because the real routes/schema do not yet provide the contract.

## Scope

- Feature: World Cup live football game detail.
- Reference device: Samsung S23 running Polymarket Android experience.
- Holiwyn proof device: Samsung tablet running Holiwyn through Expo Go.
- Cycle branch name: `mobile/cycle-AN-saved-watchlist-parity`, re-scoped honestly to live event detail after product steering changed.
- Out of scope: deposit, location verification, notifications, non-football live markets, World Cup informational ad/detail pages.

## Reference Audit

Observed Polymarket behavior:

- Live tab shows a World Cup rail/list of football games with time, league, team flags, team names, odds multipliers, and large probability buttons.
- Opening/tapping around the Australia vs Egypt row reached or exposed a game-detail-style surface when location gating appeared earlier: top Game/Chat control, book/share controls, teams, probabilities, a large probability chart, chat preview, primary outcome buttons, and Game Lines/Player Props tabs.
- Location verification may appear as a production gate. Per product direction, Holiwyn must not implement or match this gate in fake-token development mode.
- The useful product behavior is the live prediction surface: live context, live odds/probabilities, chart movement, market groups, ticket carry-through, and grouped line markets.

Reference evidence:

- `docs/mobile/reference/screenshots/cycle-AN-polymarket-live-list.png`
- `docs/mobile/reference/screenshots/cycle-AN-polymarket-live-detail-top.png`
- `docs/mobile/reference/screenshots/cycle-AN-polymarket-live-detail-markets.png`
- `docs/mobile/reference/screenshots/cycle-AN-polymarket-live-detail-open-attempt.png`

## Holiwyn Acceptance Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-P0-01 | P0 | Live detail opens directly from a live football event route and shows live match context, not a generic stats dashboard. | Tablet screenshot/XML | Pass |
| LED-P0-02 | P0 | Top live game page keeps Game/Chat controls, book/share controls, team codes/probabilities, score/clock, chart, chat card, primary outcome buttons, and Game Lines/Player Props tabs. | Tablet screenshot/XML | Pass |
| LED-P0-03 | P0 | Live market groups include more than one bare winner market and expose live winner, spreads, totals, halves, and team-total structure. | Tablet scrolled screenshot/XML | Pass |
| LED-P0-04 | P0 | Tapping a live outcome opens a ticket that preserves event, market, and outcome identity. | Tablet ticket screenshot/XML | Pass |
| LED-P0-05 | P0 | Fixture data used for frontend parity is backend-shaped with stable ids and contract fields, not display-only random data. | Code review | Pass |
| LED-P1-01 | P1 | Backend routes should provide live market groups, line options, chart history, orderbook depth, live stats, and selected identity. | Route/schema audit | Open |
| LED-P1-02 | P1 | Portfolio/open-order/activity should preserve live selected market/line/outcome identity after live orders. | Future device proof | Open |
| LED-P2-01 | P2 | Visual density and animation should be tightened against a cleaner unblocked Polymarket game-detail reference. | Future side-by-side audit | Open |

## Holiwyn Evidence

- `docs/mobile/screenshots/cycle-current-holiwyn-live-detail-top.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-live-detail-markets.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-live-detail-ticket.png`
- `docs/mobile/harness/cycle-current-holiwyn-live-detail-top.xml`
- `docs/mobile/harness/cycle-current-holiwyn-live-detail-markets.xml`
- `docs/mobile/harness/cycle-current-holiwyn-live-detail-ticket.xml`
- Proof command: `cmd /c npm.cmd run smoke:tablet:live-detail`

## Audit Gate

Result: Pass for Cycle AN focused structural live-event-detail UI and contract-shaped fixture scope.

Unresolved P0 gaps: 0 for this focused scope.

Remaining P1/P2 gaps:

- Real backend/schema support is missing for live market groups, chart history, live stats, and orderbook depth.
- Portfolio/order/activity preservation for live line identity still needs a dedicated backend-shaped proof.
- Full visual parity still needs a cleaner unblocked Polymarket detail reference, but location verification is not a Holiwyn product requirement.

## Next Structural Work

The next cycle should address one of the open backend/data-contract P1 items before opening a new feature area.
