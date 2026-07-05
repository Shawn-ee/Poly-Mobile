# Cycle HT - Portfolio History Retail Row

## Scope

Portfolio History row shown after the Local MVP server-backed fake-token filled order. No backend, order book, chat, live stats, social, deposit, or withdrawal work.

## Reference Behavior

- Polymarket History rows are compact and scan-friendly.
- The left side uses an outcome/team/market icon.
- The main text separates action, side/outcome, event, and market details.
- Amount and time are right-aligned.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| HT-P0-1 | P0 | S23 History row exposes `portfolio-history-retail-row-parity`. | Passed |
| HT-P0-2 | P0 | Row shows compact action, Yes/No pill, and readable outcome without truncating `Over 2.5 RT`. | Passed |
| HT-P0-3 | P0 | Long provider event names are shortened for the visible row. | Passed |
| HT-P0-4 | P0 | Market type/line appears as a separate subtitle. | Passed |
| HT-P0-5 | P0 | Server-backed filled order still reaches Portfolio History with selected provider/line identity preserved. | Passed |

## Proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HT-portfolio-history-retail-row-s23-proof-final\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`.
- Summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HT-portfolio-history-retail-row-s23-proof-final\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`.

## Remaining Gaps

- P1: Portfolio header/chart spacing and first-screen composition still need broader Polymarket parity work.
