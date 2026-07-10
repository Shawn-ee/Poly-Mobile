# Cycle UP - Portfolio Demo Copy Cleanup

## Scope

Local MVP Portfolio/latest-order copy in the required retail flow:
Home/Live -> Event Detail -> line market -> Trade Ticket -> fake-token/server-backed order -> Portfolio/history.

## Product Direction

The app can use fake-token trading internally, but the tester-facing Portfolio UI should not look like a debug/proof surface. Polymarket-style activity surfaces show the trade/action and lifecycle status without an extra `Demo trade` badge.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| UP-P0-01 | P0 | Latest order status card no longer shows visible `Demo trade` copy. | Pass |
| UP-P0-02 | P0 | Latest order still shows lifecycle status such as `Filled`. | Pass |
| UP-P0-03 | P0 | Fake-token proof identity remains available through hidden accessibility markers such as `fake-token-test`. | Pass |
| UP-P0-04 | P0 | No backend routes, order logic, order book, chat, live stats, or social features are changed. | Pass |
| UP-P1-01 | P1 | S23 Portfolio/latest-order visible proof confirms the cleaner status card. | Pending; no ADB device attached. |

## Implementation Notes

- Replaced visible `Demo trade` status text with neutral lifecycle/retail copy.
- Hid latest-order snapshot proof copy while preserving the accessibility marker.
- Updated the demo-trading copy contract.

## Validation

Pending final Cycle UP validation.

