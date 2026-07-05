# Cycle GO - Ticket Team Flag Identity

## Reference audit

The user-provided Polymarket place-order screenshots show the order page header using the selected team's flag/icon next to the event title and selected outcome. The order ticket should not show a generic color square when the selected team can be inferred.

## Holiwyn criteria

- P0: A ticket opened from the selected `MEX -2.5 1H` line must show a Mexico-specific header flag/icon.
- P0: The Android hierarchy must expose `ticket-outcome-flag-MEX` for the initial ticket plus Portfolio Buy more/Cash out tickets.
- P0: The flag change must preserve selected market/line/outcome identity, amount entry, swipe-submit, Portfolio, Orders, and History behavior.
- P1: Team mapping should expand as provider-backed World Cup fixtures expand.

## Audit gate

Status: Passed.

Evidence:

- Samsung tablet proof passed with `cycle-GO-local-mvp-trade-flow-proof.json`.
- Initial ticket screenshot/XML: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-GO-ticket-team-flag-identity\cycle-GO-holiwyn-local-mvp-ticket.png`; `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GO-ticket-team-flag-identity\cycle-GO-holiwyn-local-mvp-ticket.xml`.
- Portfolio action ticket screenshots/XML also passed the same `ticket-outcome-flag-MEX` expectation.
