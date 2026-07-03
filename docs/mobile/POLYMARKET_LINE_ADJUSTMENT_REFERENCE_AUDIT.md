# Polymarket Line Adjustment Reference Audit

Date: 2026-07-03

Reference device: Samsung Galaxy S23, `SM-S911U1`, `1080x2340`, density `480`.

Scope: soccer game page line adjustment behavior for spreads, totals, periods, and selected-line trade ticket propagation.

## Evidence

| Evidence | State captured | Key observations |
| --- | --- | --- |
| `pm-line-01-spread-15-expanded.png` / `.xml` | Spread expanded, Reg. Time selected. | Spread sentence reads `ALG to win by over 1.5 goals`; line pill shows `1.5`; period chips show `Reg. Time`, `1st Half`, `2nd Half`; line rail shows adjacent values; Yes row shows `4.1x` and `25%`; No row shows `1.3x` and `76%`. |
| `pm-line-02-spread-25-selected.png` / `.xml` | After selecting `1st Half`. | Period selected state moves to `1st Half`; line remains `1.5`; odds/probabilities change to Yes `10.0x` / `10%`, No `1.1x` / `91%`. This proves period selection changes market data. |
| `pm-line-03-spread-25-ticket.png` / `.xml` | After using the line rail. | Selected spread rail state changes; Yes row shows `25.0x` / `4%`, No row shows `1.0x` / `97%`; Totals section below remains visible. This proves line/rail state can materially change the displayed market. |
| `pm-line-04-spread-ticket-open.png` / `.xml` | Ticket opened from selected spread state. | Ticket title shows `Switzerland vs Algeria`; selected outcome line shows `Yes - ALG -1.5 1H`; amount starts `$0`; Yes/No toggle is present; odds line shows `Odds 4% | $0 available`; quick amounts and keypad are visible; CTA says `Choose an amount`. |
| `pm-whole-02-game-mid-market-list.png` / `.xml` | Market list with Spread and Totals. | Totals has a dropdown pill for `2.5`, period chips, and Yes/No rows. |

## Reference Pattern

Polymarket does not treat spreads and totals as static rows. The soccer game page uses a compact line-control system:

- A market group header, for example `Spread` or `Totals`.
- A natural-language sentence that embeds the selected team/outcome and line value.
- A line value pill/dropdown.
- Period chips: `Reg. Time`, `1st Half`, `2nd Half`.
- A horizontal rail for adjacent line values when expanded.
- Yes/No or Over/Under rows with odds multipliers and probability buttons.
- Updated odds/probabilities when the period or line changes.
- The selected line and period are carried into the ticket title.

## Required Holiwyn Interpretation

For Holiwyn, adjustable soccer line markets are not a polish item anymore. They are P0 for whole-app trading parity because the selected line changes the instrument being traded.

The next implementation cycle should support at least:

- Spread line and period selection.
- Totals line and period selection.
- Selected line/period in the ticket.
- Order/open order/portfolio/activity persistence of the selected line and period.

Team totals and corners should be added as the same pattern once the base selector is working.
