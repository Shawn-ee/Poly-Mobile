# Cycle RE - Trade Ticket Header Density

Date: 2026-07-09

## Scope

Fix the S23 Trade Ticket header clipping seen after the swipe-motion cycle. The target was only the amount-entry ticket header: selected event/outcome copy, market source badge, source note, amount/keypad, and fixed swipe zone.

Out of scope: backend order logic, order book UI, chat, live stats, Home, Event Detail market breadth, Portfolio behavior, deposit/withdraw, and auth/session work.

## Reference/Acceptance

- Polymarket reference ticket keeps the event title and selected outcome readable at the top.
- Source/market metadata must not crowd or clip the selected outcome line.
- Dark amount/keypad area and bottom swipe area must remain visually separated on Samsung S23.
- Swipe submission behavior from Cycle RD must remain intact.

## Implementation

- Moved the ticket market source badge from the selected outcome line into its own compact metadata row.
- Kept the source note inline with the badge, capped the badge width, and allowed the note to shrink.
- Added a source contract test so future edits do not put the badge back into a clipping-prone row.

## Audit Gate

Result: Pass for RE scope.

Evidence:

- `docs/mobile/screenshots/cycle-RE-ticket-header-density/cycle-RE-ticket-header.png`
- `docs/mobile/harness/cycle-RE-ticket-header-density/cycle-RE-ticket-header.xml`
- `docs/mobile/harness/cycle-RE-ticket-header-density/cycle-RE-home.xml`
- `docs/mobile/harness/cycle-RE-ticket-header-density/cycle-RE-ticket-header-density-proof.json`

S23 proof markers confirmed:

- `ticket-market-source-badge-inline-safe`
- `ticket-header-source-pill-no-clip`
- `ticket-source-note-inline`
- `ticket-selection-line`

## Validation

- Mobile typecheck passed.
- Focused Trade Ticket header density contract test passed.
- Focused Trade Ticket swipe motion contract test passed.
- Samsung S23 proof captured the Trade Ticket amount-entry screen.

## Limitations

- The broad smoke script still has an older post-capture assertion looking for `ticket-settings`; that failure happened after the RE ticket screenshot/XML were captured and does not contradict this scoped header proof.
- Native Google OAuth callback/session/logout remains a separate auth milestone.
- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.
