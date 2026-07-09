# Cycle RD - Trade Ticket Swipe Motion

## Scope

Local MVP Trade Ticket swipe-to-buy/sell interaction polish.

This cycle improves the visible swipe handle placement and travel so it better matches the Polymarket reference interaction: a centered upward handle in the bottom swipe area rather than a small right-edge icon.

This cycle does not change backend routes, order submission logic, schemas, order book UI, chat, live stats, social, deposit, or withdrawal behavior.

## Acceptance Criteria

| ID | Priority | Criteria | Evidence |
| --- | --- | --- | --- |
| RD-P0-01 | P0 | Ticket keeps the dark amount/keypad panel separated from the red/pink swipe area. | S23 screenshot/XML. |
| RD-P0-02 | P0 | Swipe handle is centered in the swipe area instead of right-aligned. | Source contract and S23 screenshot/XML marker `swipe-submit-handle-centered`. |
| RD-P0-03 | P0 | Swipe handle travel is visibly tied to swipe progress and has a larger vertical range. | Source contract and S23 dragging screenshot. |
| RD-P0-04 | P0 | Existing threshold/submission logic remains unchanged. | Source diff; no order/backend code changed. |
| RD-P0-05 | P0 | S23 proof exists for initial/ready/dragging ticket states. | Proof paths below. |

## Implementation

- Increased `SwipeSubmitControl` handle travel from `-28 * swipeProgress` to `-118 * swipeProgress`.
- Centered the swipe handle with `left: "50%"` and `marginLeft: -19`.
- Added the proof marker `swipe-submit-handle-centered`.
- Added a focused source contract test for the centered/visible-travel behavior.

## Backend/API Contract

- No backend route changed.
- Existing `placeOrder()` / fake-token or server-backed order behavior is preserved.
- Existing ticket route dependencies remain unchanged.

## Audit Gate

Pass for the focused Trade Ticket swipe-handle motion scope.

- Typecheck passed.
- Focused mobile contract test passed.
- S23 proof device: Samsung S23 `SM-S911U1`, `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Initial XML confirms `swipe-submit-handle-centered`.
- Ready XML confirms enabled `Swipe to buy` state.
- Dragging screenshot shows the centered handle in the pink swipe area.

Evidence:

- Initial screenshot/XML: `docs/mobile/screenshots/cycle-RD-ticket-swipe-motion/cycle-RD-ticket-swipe-initial.png`, `docs/mobile/harness/cycle-RD-ticket-swipe-motion/cycle-RD-ticket-swipe-initial.xml`
- Ready screenshot/XML: `docs/mobile/screenshots/cycle-RD-ticket-swipe-motion/cycle-RD-ticket-swipe-ready.png`, `docs/mobile/harness/cycle-RD-ticket-swipe-motion/cycle-RD-ticket-swipe-ready.xml`
- Dragging screenshot: `docs/mobile/screenshots/cycle-RD-ticket-swipe-motion/cycle-RD-ticket-swipe-dragging.png`
- After-drag XML: `docs/mobile/harness/cycle-RD-ticket-swipe-motion/cycle-RD-ticket-after-drag.xml`

## Remaining Gaps

- The ticket header source pill can still clip at the far right on S23; this is a P1 visual-density gap for a later ticket header cleanup.
- Full continuous gesture video proof is still better than screenshot proof; current S23 evidence includes screenshot/XML plus source contract.
