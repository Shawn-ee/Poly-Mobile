# Cycle TQ - Remove Dormant Cashout Sheet

Status: passed focused tests, typechecks, and Samsung S23 full cashout proof.

## Scope

Local MVP Portfolio/Event Detail close-position behavior.

The visible product direction is now one generic Polymarket-style Buy/Sell ticket. Portfolio and Event Detail `Cash out` actions already route to the generic Sell `TradeTicket`; this cycle removes the dormant dedicated `CashoutTicket` sheet from mobile source and updates the remaining provider-winner proof path so it can no longer pass against the old cashout sheet markers.

No backend order route, schema, order book UI, chat, live stats, social feature, deposit, or withdraw work was touched.

## Acceptance Criteria

| Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P0 | Default mobile source no longer contains the dormant dedicated `CashoutTicket` component. | Pass | `mobile/src/__tests__/cashoutGenericSellOnlyContract.test.ts` |
| P0 | Portfolio and Event Detail cashout actions continue to route through the generic Sell Trade Ticket. | Pass | `mobile/src/__tests__/portfolioPositionTradeContract.test.ts`; `mobile/src/__tests__/eventDetailPositionTradeContract.test.ts` |
| P0 | Provider-winner cashout proof expects `trade-ticket`, `ticket-side-sell`, and `Swipe to sell`, and rejects `cashout-ticket` / `swipe-to-cashout`. | Pass | `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`; `mobile/src/__tests__/cashoutGenericSellOnlyContract.test.ts` |
| P0 | Full S23 Local MVP buy -> cashout/sell -> History proof passes. | Pass | `docs/mobile/harness/cycle-TQ-remove-dormant-cashout-sheet/cycle-TQ-current-mvp-s23-visible-flow.json` |

## Files Changed

- Removed `mobile/src/components/CashoutTicket.tsx`
- Removed stale `mobile/src/__tests__/cashoutTicketContract.test.ts`
- Added `mobile/src/__tests__/cashoutGenericSellOnlyContract.test.ts`
- Updated `scripts/prove_mobile_provider_winner_s23_visible_flow.ps1`

## Remaining Gaps

- P1: real provider-backed spread/totals/team-total current-match lines remain unavailable from Polymarket Gamma.

## Android Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Proof summary: `docs/mobile/harness/cycle-TQ-remove-dormant-cashout-sheet/cycle-TQ-current-mvp-s23-visible-flow.json`
- Key screenshots:
  - `docs/mobile/screenshots/cycle-TQ-remove-dormant-cashout-sheet/cycle-TQ-current-mvp-line-cashout-ticket.png`
  - `docs/mobile/screenshots/cycle-TQ-remove-dormant-cashout-sheet/cycle-TQ-current-mvp-line-cashout-history.png`
- Key XML:
  - `docs/mobile/harness/cycle-TQ-remove-dormant-cashout-sheet/cycle-TQ-current-mvp-line-cashout-ticket.xml`
  - `docs/mobile/harness/cycle-TQ-remove-dormant-cashout-sheet/cycle-TQ-current-mvp-line-cashout-ticket-ready.xml`
  - `docs/mobile/harness/cycle-TQ-remove-dormant-cashout-sheet/cycle-TQ-current-mvp-line-cashout-history.xml`
