# Cycle HV - Portfolio Position Row Retail Density

## Polymarket Reference Behavior

- Reference Portfolio screenshots show compact position rows: event/status line, small market icon, Yes/No outcome label, cost/to-win/entry summary, current value/chance, and right-side Cash out / add actions.
- The row should be readable on S23 without oversized placeholder art or unnecessary vertical looseness.

## Holiwyn Acceptance Criteria

| Priority | Criterion | Verification |
| --- | --- | --- |
| P0 | Filled position row exposes `portfolio-position-retail-density-fit`. | S23 XML proof. |
| P0 | Cash out and buy-more actions remain visible and tappable after row compaction. | S23 screenshot/XML proof with `portfolio-position-actions-fit-phone`. |
| P0 | Selected market type, line, period, provider source, and provider token remain preserved through Portfolio. | S23 Local MVP filled proof. |
| P0 | Backend order/portfolio routes are unchanged. | Git diff and typecheck. |
| P1 | Full Portfolio header/chart parity remains tracked separately. | Gap tracker. |

## Implementation Notes

- `src/components/Portfolio.tsx` tightens the position row padding, icon size, title/meta size, value row spacing, and action button height.
- `scripts/smoke.ps1` now requires `portfolio-position-retail-density-fit` in the route-backed filled Portfolio proof.

## Audit Gate

- Status: pass.
- Required device: Samsung S23 `SM-S911U1`.
- Proof folder: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HV-portfolio-position-row-retail-density-s23-proof`.
- Harness folder: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HV-portfolio-position-row-retail-density-s23-proof`.
- Result: the filled position row is denser on S23, action buttons remain visible, selected market identity is preserved, and Portfolio History still shows the filled activity.
