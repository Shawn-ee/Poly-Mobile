# Cycle HQ - Event Detail Prediction-Only Lower Page

## Scope

Local MVP retail flow only: Event Detail -> line market -> simple Buy/Sell ticket -> server-backed fake-token order -> Portfolio/history.

This cycle removed non-prediction lower-page content from the default Event Detail page. It did not add order book UI, chat, live stats, social features, watchlists, or backend route changes.

## Polymarket Reference Behavior

- The default game page should keep the user focused on market selection and trading.
- Nonessential promotional or cross-event content should not interrupt the Local MVP betting path.
- Selecting a line market should still preserve market/outcome/line identity into the ticket and Portfolio history.

## Holiwyn Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| HQ-P0-1 | P0 | Event Detail must expose a marker that lower non-prediction content is hidden for Local MVP. | Pass |
| HQ-P0-2 | P0 | The route-backed line-market proof must not show `Market Rules`, `View Full Rules`, `More Events`, or unrelated event promos. | Pass |
| HQ-P0-3 | P0 | Totals line-market selection must remain reachable on S23. | Pass |
| HQ-P0-4 | P0 | The same proof must submit the simple ticket and show Portfolio History. | Pass |
| HQ-P0-5 | P0 | The cycle must not change backend routes or order contracts. | Pass |

## Implementation Notes

- `src/components/EventDetail.tsx` removes visible `Market Rules` and `More Events` blocks from the default Local MVP page.
- A hidden marker records the intentional omission: `event-detail-non-prediction-lower-content-hidden-local-mvp`.
- `scripts/smoke.ps1` rejects old lower-page text and adds a fine-scroll scan to reliably find the route-backed Totals row on the S23.

## Android Proof

- Device: Samsung S23 `SM-S911U1`.
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8321 -OutputDir docs\mobile\screenshots\cycle-HQ-event-detail-prediction-only-lower-page-s23-proof-final -HierarchyOutputDir docs\mobile\harness\cycle-HQ-event-detail-prediction-only-lower-page-s23-proof-final`.
- Result: pass.

## Evidence

- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HQ-event-detail-prediction-only-lower-page-s23-proof-final\cycle-EY-holiwyn-route-server-mvp-top.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HQ-event-detail-prediction-only-lower-page-s23-proof-final\cycle-EY-holiwyn-route-server-mvp-line-markets.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HQ-event-detail-prediction-only-lower-page-s23-proof-final\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Audit Gate

Pass. The S23 proof shows prediction-focused line-market content, rejects the old non-MVP lower-page sections, opens the Totals ticket, submits the server-backed fake-token order, and reaches Portfolio History. There are no unresolved P0 gaps for this cycle.
