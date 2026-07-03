# Holiwyn Line Adjustment Criteria

Date: 2026-07-03

Source reference: `docs/mobile/POLYMARKET_LINE_ADJUSTMENT_REFERENCE_AUDIT.md`

## P0 Criteria

| ID | Requirement | Required evidence |
| --- | --- | --- |
| LA-P0-01 | Spread group exposes a selected line value and period controls for `Reg. Time`, `1st Half`, and `2nd Half`. | Tablet screenshot/XML. |
| LA-P0-02 | Changing Spread period updates odds/probabilities and selected state. | Tablet smoke taps each period and captures before/after values. |
| LA-P0-03 | Changing Spread line value updates sentence, odds/probabilities, and selected state. | Tablet smoke opens selector/rail, chooses another line, and captures before/after values. |
| LA-P0-04 | Totals group exposes selected line value, period controls, Over/Under or Yes/No rows, odds, and probability buttons. | Tablet screenshot/XML. |
| LA-P0-05 | Changing Totals line/period updates visible odds/probabilities. | Tablet smoke captures before/after. |
| LA-P0-06 | Ticket title/body carries selected line and period, for example `MEX -1.5 1H` or `Over 2.5 Reg. Time`. | Tablet ticket screenshot/XML. |
| LA-P0-07 | Order payload includes market type, selected line, selected period, side, outcome, odds, amount, and event id. | Unit/API test or smoke harness summary. |
| LA-P0-08 | Portfolio, open orders, and activity preserve selected line and period after order creation. | Tablet portfolio proof plus backend/mobile route test. |

## P1 Criteria

| ID | Requirement | Required evidence |
| --- | --- | --- |
| LA-P1-01 | Team totals use the same line selector and period model. | Tablet screenshot/XML and smoke. |
| LA-P1-02 | Corners or other discovered soccer line markets use the same model when available. | Fixture/evidence from discovered markets. |
| LA-P1-03 | Line selector visual treatment closely matches Polymarket rail/dropdown behavior. | Side-by-side reference and Holiwyn screenshots. |

## Implementation Order

1. Build a reusable line-market state model.
2. Wire Spread period and line changes.
3. Wire Totals period and line changes.
4. Carry selected market identity into ticket and order payload.
5. Preserve the identity in portfolio/open orders/activity.
6. Expand to team totals and other line markets.

The next cycle should not claim line parity until LA-P0-01 through LA-P0-08 are all verified.
