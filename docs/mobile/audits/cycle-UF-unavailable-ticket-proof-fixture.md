# Cycle UF - Unavailable Ticket Proof Fixture

Status: pass after Cycle VX S23 proof.

## Scope

Add a deterministic launch path for the unavailable Trade Ticket state implemented in Cycle UE.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| UF-TT-P0-01 | P0 | App launch URL must support `forceUnavailableTradeTicket=1`. | Pass by source/test |
| UF-TT-P0-02 | P0 | Forced ticket must use the existing `market.availability` contract, not a separate frontend-only flag. | Pass by source/test |
| UF-TT-P0-03 | P0 | Forced ticket must preserve selected market/outcome/line identity for the Trade Ticket. | Pass by source/test |
| UF-TT-P0-04 | P0 | Reset-state handling must not immediately erase the forced unavailable ticket. | Pass by source/test |
| UF-TT-P0-05 | P0 | Samsung S23 proof must capture the launched read-only unavailable ticket. | Pass in Cycle VX |

## Proof

- Focused deep-link contract test passed.
- Mobile typecheck passed.
- Android proof remains pending because ADB showed no attached devices and no mDNS wireless debugging services.

## Cycle VX Device Proof

- Samsung S23 `SM_S911U1`, device `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Proof command: `npm run proof:s23:unavailable-ticket`.
- Launch URL: `forceResetState=1&forceUnavailableTradeTicket=1`.
- Screenshot: `docs/mobile/screenshots/cycle-VX-unavailable-ticket-s23-proof/cycle-VX-unavailable-ticket.png`.
- XML: `docs/mobile/harness/cycle-VX-unavailable-ticket-s23-proof/cycle-VX-unavailable-ticket.xml`.
- Result: pass. XML includes `ticket-market-status-visible`, `ticket-keypad-readonly-disabled`, disabled side/preset/keypad markers, `ticket-availability-unavailable`, and disabled swipe submit state.
