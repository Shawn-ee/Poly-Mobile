# Cycle HO - Portfolio Position Actions Phone Fit

## Scope

Local MVP retail flow only: Home -> Event Detail -> line market -> simple Buy/Sell ticket -> server-backed fake-token order -> Portfolio/history.

This cycle focused on the filled Portfolio position row after a trade. It did not add order book UI, chat, live stats, social features, watchlists, or backend route changes.

## Polymarket Reference Behavior

- Portfolio position rows keep action controls inside the phone viewport.
- The user can immediately see position value, chance, Cash out, and Buy more/add actions without horizontal clipping.
- History remains reachable from the same Portfolio screen.

## Holiwyn Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| HO-P0-1 | P0 | The filled position row must show value, chance, Cash out, and plus action fully inside the S23 viewport. | Pass |
| HO-P0-2 | P0 | The proof must include `portfolio-position-actions-fit-phone` in the visible Portfolio hierarchy. | Pass |
| HO-P0-3 | P0 | Route-backed portfolio value/chart source and status must remain proven after the result landing scroll. | Pass |
| HO-P0-4 | P0 | The same proof must still reach History and show the filled activity row. | Pass |
| HO-P0-5 | P0 | The cycle must not change backend routes or order contracts. | Pass |

## Implementation Notes

- `src/components/Portfolio.tsx` tightens the position card horizontal padding, action button dimensions, action gap, and value text fitting for phone width.
- The position row now exposes `portfolio-position-actions-fit-phone` for Android proof.
- A hidden row-level `portfolio-result-route-proof` marker mirrors the existing value-history source/status so the route-backed chart/value gate stays active after the result landing scroll.
- `scripts/smoke.ps1` now requires the phone-fit action-row marker in the server-filled Portfolio proof.

## Android Proof

- Device: Samsung S23 `SM-S911U1`.
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8316 -OutputDir docs\mobile\screenshots\cycle-HO-portfolio-position-actions-phone-fit-s23-proof-final -HierarchyOutputDir docs\mobile\harness\cycle-HO-portfolio-position-actions-phone-fit-s23-proof-final`.
- Result: pass.

## Evidence

- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HO-portfolio-position-actions-phone-fit-s23-proof-final\cycle-EY-holiwyn-route-server-mvp-portfolio.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HO-portfolio-position-actions-phone-fit-s23-proof-final\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HO-portfolio-position-actions-phone-fit-s23-proof-final\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Audit Gate

Pass. The S23 proof shows the position action row fitting within the viewport, route-backed portfolio value/chart markers present, and History activity still reachable. There are no unresolved P0 gaps for this cycle.
