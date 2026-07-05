# Cycle IZ - Portfolio Range Watermark S23 Fit

## Reference

The user-provided Polymarket Portfolio reference shows a compact range selector beside a subtle brand watermark. Holiwyn already had the same structure, but on Samsung S23 the row was too wide and clipped the watermark on the right edge.

## Acceptance Criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| Portfolio range selector and Holiwyn watermark fit inside the S23 viewport without right-edge clipping. | P0 | Pass |
| The range selector remains visible, tappable, and first-screen friendly. | P0 | Pass |
| Portfolio tabs and first position remain visible after the layout tightening. | P0 | Pass |
| The full Local MVP route-backed trade path still completes on Samsung S23. | P0 | Pass |
| No backend route/schema/order logic changes are introduced for visible layout. | P0 | Pass |
| Exact Polymarket watermark opacity and chart physics. | P2 | Tracked |

## Implementation

- `src/components/Portfolio.tsx` reduces range-row horizontal padding, range-pill width, watermark icon size, and watermark max width.
- `Portfolio` exposes `portfolio-range-watermark-s23-fit` and `portfolio-brand-watermark-no-clip` in the range/watermark row for the Audit Gate.
- `scripts/smoke.ps1` asserts those markers in the route-backed Portfolio position proof and top Portfolio proof.

## Device Proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8385 -OutputDir docs\mobile\screenshots\cycle-IZ-portfolio-range-watermark-s23-fit-proof -HierarchyOutputDir docs\mobile\harness\cycle-IZ-portfolio-range-watermark-s23-fit-proof`.
- Result: pass.
- Key evidence:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IZ-portfolio-range-watermark-s23-fit-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-top.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IZ-portfolio-range-watermark-s23-fit-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IZ-portfolio-range-watermark-s23-fit-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Remaining Gaps

- P2: exact watermark opacity and final chart gesture physics remain to be compared in a later visual parity cycle.
