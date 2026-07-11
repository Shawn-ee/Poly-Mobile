# Cycle VX - Unavailable Ticket S23 Proof

Date: 2026-07-10

## Scope

Close the pending Android visual Audit Gate for the Trade Ticket unavailable/read-only state from Cycles UE and UF.

Included:
- Deterministic S23 launch of `forceResetState=1&forceUnavailableTradeTicket=1`.
- Screenshot/XML proof of the read-only unavailable Trade Ticket.
- Proof harness and contract guard.

Excluded:
- Backend order logic.
- Backend schema/routes.
- Order book, chat, live stats, social features.
- New market/provider behavior.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| VX-TT-P0-01 | P0 | Samsung S23 opens directly into the unavailable Trade Ticket fixture. | Pass |
| VX-TT-P0-02 | P0 | Ticket displays a visible unavailable status. | Pass |
| VX-TT-P0-03 | P0 | Side selector, presets/Max, numeric keypad, and swipe submit are disabled. | Pass |
| VX-TT-P0-04 | P0 | Selected market/outcome/line/source identity is preserved in XML markers. | Pass |
| VX-TT-P0-05 | P0 | Proof script cleans up its Expo/Node workers after the run. | Pass |

## Implementation

- Added `mobile/scripts/s23-unavailable-ticket-proof.ps1`.
- Added `npm run proof:s23:unavailable-ticket`.
- Added `mobile/src/__tests__/s23UnavailableTicketProofContract.test.ts`.
- No backend route, schema, or order behavior changed.

## Device Proof

- Device: Samsung S23 `SM_S911U1`, `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Screenshot: `docs/mobile/screenshots/cycle-VX-unavailable-ticket-s23-proof/cycle-VX-unavailable-ticket.png`.
- XML: `docs/mobile/harness/cycle-VX-unavailable-ticket-s23-proof/cycle-VX-unavailable-ticket.xml`.

The XML includes `ticket-market-status-visible`, `ticket-readonly-market-state`, `ticket-amount-entry-disabled`, `ticket-availability-unavailable`, `ticket-market-status-PROOF_UNAVAILABLE`, `ticket-side-disabled-readonly`, `ticket-preset-disabled-readonly`, `ticket-keypad-readonly-disabled`, `ticket-keypad-disabled-readonly`, `swipe-submit-state-disabled`, and selected Spread `1.5` identity markers.

## Audit Gate

Status: Pass.

Unresolved P0: 0.

Remaining P1: real provider-backed Spread/Totals/Team Total line markets remain a separate provider-data gap.
