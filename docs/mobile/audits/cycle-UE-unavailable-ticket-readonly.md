# Cycle UE - Unavailable Trade Ticket Readonly State

Status: source/contract pass, Android visual proof pending because no ADB device was attached or discoverable during the cycle.

## Scope

Improve the Local MVP unavailable/suspended market state for the Trade Ticket without touching backend order logic.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| UE-TT-P0-01 | P0 | Blocked market availability must show a visible ticket status instead of only hidden audit text. | Pass by source/test |
| UE-TT-P0-02 | P0 | Side switching must be disabled when the selected market is unavailable/suspended. | Pass by source/test |
| UE-TT-P0-03 | P0 | Amount presets and Max must be disabled when the selected market is unavailable/suspended. | Pass by source/test |
| UE-TT-P0-04 | P0 | Numeric keypad entry must be disabled when the selected market is unavailable/suspended. | Pass by source/test |
| UE-TT-P0-05 | P0 | Swipe submit must remain disabled/unavailable and must not call order routes. | Pass by source/test |
| UE-TT-P0-06 | P0 | Samsung S23 proof must capture the unavailable ticket state. | Pending |

## Implementation Notes

- `TradeTicket` now derives `ticketReadOnly` from the existing `marketTradable` state.
- Blocked availability renders a visible `ticket-market-status-visible` pill.
- Side buttons, presets, Max, and keypad controls are disabled and expose readonly audit markers.
- Existing swipe submit unavailable behavior is preserved.

## Proof

- Focused unavailable-readonly ticket contract test passed.
- Existing Trade Ticket contract tests passed.
- Mobile typecheck passed.

## Remaining Gap

Run S23 proof once an Android device is attached/discoverable. The visual unavailable-state gap should remain open until that proof exists.
