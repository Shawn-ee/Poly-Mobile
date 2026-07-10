# Cycle TI - Event Detail Sticky Match Context

Status: P0 pass.

## Scope

Local MVP retail flow: Event Detail market browsing. The latest S23 proof showed the lower Game Lines view could display market rows with only the sticky "Game" pill visible, while the match teams/probabilities/date were off screen. That makes the trading context weaker than the Polymarket reference, where the game identity remains clear around the market section.

This cycle tightens the existing compact sticky match header behavior so it appears earlier when the user scrolls into markets.

## Acceptance Criteria

| Priority | Criterion | Proof |
| --- | --- | --- |
| P0 | Event Detail still opens the same Game Lines market rows and ticket path. | S23 full Local MVP proof. |
| P0 | The compact sticky header includes team identity/probability/date context while the user is in market rows. | S23 lower Game Lines screenshot/XML. |
| P0 | No order book/chat/live stats/social UI is exposed. | S23 proof hidden assertions and XML. |
| P0 | Backend order, quote, Portfolio, and history behavior is unchanged. | Full Local MVP proof route path. |
| P1 | Sticky header appears before the page has scrolled deeply past the first market group. | Source contract test and S23 line view. |

## Implementation Notes

- Changed the compact sticky header threshold from `contentOffset.y > 360` to `contentOffset.y > 180`.
- Added a focused source contract test so the compact header does not regress to a too-late threshold.
- Updated the route-filled mobile smoke gate so S23 Game Lines proof must include `event-detail-compact-game-header` and `event-detail-header-team-identity-fit`.
- No backend route, schema, provider, order, or Portfolio logic changed.

## Remaining Gaps

- Real Polymarket-backed spread/totals/team-total line markets remain P1 because current Gamma/CLOB discovery has not found attach-ready line markets for the selected match.
- The compact sticky header is still Holiwyn-styled rather than an exact protected Polymarket asset copy.

## Proof

- Focused tests: passed.
- Mobile typecheck: passed.
- Root typecheck: passed.
- Samsung S23 `SM-S911U1`: passed.
- Proof summary: `docs/mobile/harness/cycle-TI-event-detail-sticky-context/cycle-TI-current-mvp-s23-visible-flow.json`.
- Lower Game Lines screenshot: `docs/mobile/screenshots/cycle-TI-event-detail-sticky-context/cycle-TI-current-mvp-lines.png`.
