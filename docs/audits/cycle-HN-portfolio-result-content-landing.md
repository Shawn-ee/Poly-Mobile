# Cycle HN - Portfolio Result Content Landing

## Scope

Local MVP retail flow only: Home -> Event Detail -> line market -> simple Buy/Sell ticket -> server-backed fake-token order -> Portfolio/history.

This cycle focused on the post-trade Portfolio landing point. It did not add order book UI, chat, live stats, social features, watchlists, or backend route changes.

## Polymarket Reference Behavior

- After a completed trade, Polymarket makes the result content visible in Portfolio instead of requiring the user to search through account header content first.
- The Positions tab shows a compact position row with event context, side/outcome, entry/cost/value, and action buttons.
- The History tab shows a compact completed trade row with action, market context, amount, and timestamp.

## Holiwyn Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| HN-P0-1 | P0 | After a server-backed filled order, Portfolio must expose a result-landing marker and show a filled position row on the first proof screenshot. | Pass |
| HN-P0-2 | P0 | History must show the completed activity row after the proof taps the History tab. | Pass |
| HN-P0-3 | P0 | The cycle must not change order routes or backend contracts. | Pass |
| HN-P0-4 | P0 | Order book UI must remain hidden from the default Local MVP path. | Pass |
| HN-P2-1 | P2 | Exact Polymarket Portfolio header/chart spacing and animation polish. | Tracked |

## Implementation Notes

- `src/components/Portfolio.tsx` now keeps a `ScrollView` ref and scrolls to the Portfolio tab content when a latest order has visible position, open-order, or activity results.
- `scripts/smoke.ps1` now expects `portfolio-result-content-landing` in the server-filled Portfolio proof.
- No backend route, schema, request, or response contract changed.

## Android Proof

- Device: Samsung S23 `SM-S911U1`.
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8313 -OutputDir docs\mobile\screenshots\cycle-HN-portfolio-result-content-landing-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-HN-portfolio-result-content-landing-s23-proof`.
- Result: pass.

## Evidence

- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HN-portfolio-result-content-landing-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HN-portfolio-result-content-landing-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HN-portfolio-result-content-landing-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Audit Gate

Pass. The S23 proof shows the filled position row directly in Portfolio and the completed activity row directly in History. There are no unresolved P0 gaps for this cycle.
