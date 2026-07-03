# Event Page Top Shell Polymarket Audit

Status: Cycle U P0 pass for the focused top-shell action controls only. This does not mark the full Market/Event page complete.

## Scope

- Event page top header/action row.
- Game/Market and Chat segmented control.
- Top book/order-book action.
- Share action.
- Safe return from overlays to the same event page.

Out of scope for this focused cycle:

- Full World Cup market group parity.
- Adjustable line selectors.
- Chart tooltip/press behavior.
- Full trade ticket lifecycle.
- Native OS share sheet parity.

## Cycle U Reference Audit

Reference device:

- Samsung S23 running the real Polymarket Android app.

Polymarket app/browser:

- Polymarket Android app.

Route or URL if available:

- App route not visible. The valid captured event was a generic Polymarket market page opened from the Home feed. A World Cup-specific event retry was blocked by Polymarket location verification, so the World Cup retry evidence is not used as pass evidence.

Screenshots/UI hierarchy:

- `docs/mobile/reference/screenshots/cycle-U-polymarket-event-entry-home.png`
- `docs/mobile/reference/screenshots/cycle-U-polymarket-event-entry-home.xml`
- `docs/mobile/reference/screenshots/cycle-U-polymarket-event-top.png`
- `docs/mobile/reference/screenshots/cycle-U-polymarket-event-top.xml`
- `docs/mobile/reference/screenshots/cycle-U-polymarket-event-chat-tab.png`
- `docs/mobile/reference/screenshots/cycle-U-polymarket-event-chat-tab.xml`
- `docs/mobile/reference/screenshots/cycle-U-polymarket-event-game-tab-return.png`
- `docs/mobile/reference/screenshots/cycle-U-polymarket-event-game-tab-return.xml`
- `docs/mobile/reference/screenshots/cycle-U-polymarket-event-book.png`
- `docs/mobile/reference/screenshots/cycle-U-polymarket-event-book.xml`
- `docs/mobile/reference/screenshots/cycle-U-polymarket-event-share.png`
- `docs/mobile/reference/screenshots/cycle-U-polymarket-event-share.xml`

Blocked/deferred World Cup-specific retry evidence:

- `docs/mobile/reference/screenshots/cycle-U-polymarket-worldcup-event-top.png`
- `docs/mobile/reference/screenshots/cycle-U-polymarket-worldcup-event-top-2.png`
- `docs/mobile/reference/screenshots/cycle-U-polymarket-worldcup-retry-home.png`
- `docs/mobile/reference/screenshots/cycle-U-polymarket-recovered-home.png`

These retry files are retained only to document the blocker. They should not be cited as valid World Cup event-page parity evidence.

## Reference Behavior

| Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- |
| Open event page from Home feed | Event page opens with top back button, segmented Market/Game and Chat control, book icon, share icon, event title/context, chart area, and trading content below. | Route changes from Home to event detail; selected event context is preserved. | `cycle-U-polymarket-event-top.png` |
| Tap Chat tab | Page switches to a chat feed view with messages and market context controls; user can return to the market/game tab. | Active segmented tab changes; market context remains the same. | `cycle-U-polymarket-event-chat-tab.png` |
| Return to Game/Market tab | Market/game content returns under the same event header. | Active segmented tab changes back; event context is preserved. | `cycle-U-polymarket-event-game-tab-return.png` |
| Tap top book icon | Polymarket opens an Order Book screen/panel for the current market. | Current market context is carried into the book view. | `cycle-U-polymarket-event-book.png` |
| Tap top share icon | Share behavior is available from the top action row. Coordinate capture was ambiguous after the book state, so deeper native-share parity remains P1. | Expected behavior is a share action for the current market/event. | `cycle-U-polymarket-event-share.png` |

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| EPTS-P0-01 | P0 | Holiwyn event page exposes the same top-shell control cluster: back, Game/Chat segmented control, top book/order-book action, and share action. | Tablet screenshot/UI hierarchy. | Pass |
| EPTS-P0-02 | P0 | Tapping the top book action opens an Order Book view for the currently selected event/market, not a placeholder watchlist notice. | Tablet smoke proof. | Pass |
| EPTS-P0-03 | P0 | The Order Book view shows current market context, bid/ask/depth-like rows, and a close control. | Tablet screenshot/UI hierarchy. | Pass |
| EPTS-P0-04 | P0 | Closing the Order Book returns to the same event page with Game Lines still visible and the share action still available. | Tablet smoke proof. | Pass |
| EPTS-P0-05 | P0 | Tapping share opens a Holiwyn share panel for the current market and can be dismissed without losing event context. | Tablet smoke proof. | Pass |
| EPTS-P0-06 | P0 | The Chat/Game segmented behavior remains available after this cycle. | Existing event detail and chat smokes. | Pass |
| EPTS-P1-01 | P1 | Native OS share sheet parity is proven against Polymarket's exact native share behavior. | Future reference/device proof. | Deferred |
| EPTS-P1-02 | P1 | World Cup-specific Polymarket event top-shell reference is recaptured once the reference app location verification blocker is clear. | Future Samsung reference audit. | Deferred |
| EPTS-P2-01 | P2 | Pixel-level density, transition animation, and top-row spacing are side-by-side audited. | Future visual audit. | Deferred |

## Holiwyn Implementation

Frontend components touched:

- `mobile/src/components/EventDetail.tsx`
- `mobile/scripts/smoke.ps1`

Important functions/services touched:

- `EventDetail()` top action row.
- `setOrderBookVisible(true)` from the new `event-detail-top-order-book` action.
- Existing order-book overlay state and close action.
- Existing share sheet state and dismiss action.
- `EventDetailActions` tablet smoke path.

State transitions:

- `orderBookVisible: false -> true` when tapping `event-detail-top-order-book`.
- `orderBookVisible: true -> false` when tapping `event-detail-order-book-close`.
- `shareSheetVisible: false -> true` when tapping `event-detail-share`.
- `shareSheetVisible: true -> false` when tapping `event-detail-share-dismiss`.

Backend/API involvement:

- No new API route is called by this cycle.
- Order Book data is derived from the event/market/outcome data already loaded by the event detail flow.
- Future backend work should provide a live order-book/depth route or deeper included depth fields for each market/outcome.

## Holiwyn Proof

Holiwyn device:

- Samsung tablet running Holiwyn through Expo Go.

Proof command:

- `npm run typecheck`
- `npm run smoke:tablet:event-detail-actions`

Holiwyn evidence:

- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-top-order-book.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-top-order-book.xml`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-top-order-book-dismissed.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-share-sheet.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-share-sheet.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail-share-dismissed.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail-share-dismissed.xml`
- `docs/mobile/harness/cycle-U-manual-top-order-book.xml`

## Audit Gate

Result:

- Pass for the Cycle U focused top-shell action-control scope.

Unresolved P0 gaps:

- 0 for this focused scope.

Remaining P1/P2 gaps:

- Native OS share parity needs a deeper safe-device pass.
- World Cup-specific Polymarket reference needs recapture after Polymarket location verification is available.
- Pixel-level spacing/animation parity remains future polish.

Recommended next cycle:

- Continue Priority 2 Market/Event page with grouped market rows and adjustable line behavior under the same audit-gated workflow.
