# Home Discovery No Watchlist Audit

## Cycle GJ

Scope: Local MVP Home discovery only.

Reference direction:
- The current Holiwyn MVP should prioritize retail betting flow over account/social utility features.
- Watchlist/saved behavior is not part of the active MVP path.
- The Home discovery screen should lead users toward a game card, line market, simple ticket, order, and Portfolio/history.

Acceptance criteria:

| Criteria | Priority | Result |
| --- | --- | --- |
| Home discovery does not show a Saved filter chip in the default MVP path. | P0 | Passed |
| Home game cards do not expose save/watchlist controls in the default MVP path. | P0 | Passed |
| Route-backed discovery still opens a simple ticket from the retail outcome rail. | P0 | Passed |
| Route-backed discovery still opens Event Detail and the spread ticket with provider identity. | P0 | Passed |
| No backend/API contract changes are required. | P0 | Passed by implementation review |

Audit notes:
- This is not a full saved/watchlist deletion. Existing saved/search/account code may remain for future non-MVP work.
- The default Local MVP discovery proof should fail if `home-filter-saved`, `save-event-`, or `home-saved-empty` reappears in the route-backed discovery hierarchy.

Implementation:
- `HomeScreen` keeps only All, Live, and Today filters.
- `HomeScreen` no longer passes `toggleSavedEvent` or `savedEventIds` into `MarketList`, so Home cards do not render save buttons.
- `LocalMvpHomeRouteTicketFlow` adds watchlist absence checks to the MVP hidden-control gate.

Audit Gate:
- Device: Samsung tablet.
- Status: Passed.
- Proof: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GJ-home-discovery-no-watchlist\cycle-GJ-local-mvp-home-route-ticket-flow-proof.json`.
