# Cycle UF - Unavailable Ticket Proof Fixture

Status: source/contract pass, Android visual proof pending because no ADB device was attached or discoverable during the cycle.

## Scope

Add a deterministic launch path for the unavailable Trade Ticket state implemented in Cycle UE.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| UF-TT-P0-01 | P0 | App launch URL must support `forceUnavailableTradeTicket=1`. | Pass by source/test |
| UF-TT-P0-02 | P0 | Forced ticket must use the existing `market.availability` contract, not a separate frontend-only flag. | Pass by source/test |
| UF-TT-P0-03 | P0 | Forced ticket must preserve selected market/outcome/line identity for the Trade Ticket. | Pass by source/test |
| UF-TT-P0-04 | P0 | Reset-state handling must not immediately erase the forced unavailable ticket. | Pass by source/test |
| UF-TT-P0-05 | P0 | Samsung S23 proof must capture the launched read-only unavailable ticket. | Pending |

## Proof

- Focused deep-link contract test passed.
- Mobile typecheck passed.
- Android proof remains pending because ADB showed no attached devices and no mDNS wireless debugging services.

## Remaining Gap

When S23 is available, launch the app with `forceResetState=1&forceUnavailableTradeTicket=1`, capture screenshot/XML, and verify `ticket-market-status-visible`, `ticket-keypad-readonly-disabled`, and disabled submit markers.
