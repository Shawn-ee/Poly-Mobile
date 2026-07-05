# Cycle IO - Portfolio First Position Visibility

## Scope

Local MVP visible mobile flow: Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

This cycle improves the post-order Portfolio first viewport. It does not change backend order logic, deposits, withdrawals, chat, live stats, social features, or order book UI.

## Reference Behavior

The Polymarket Portfolio reference shows the account header, chart/range controls, tabs, and a meaningful portion of the first position row in the same phone viewport. Holiwyn's previous S23 proof showed the header improvement, but the position row still started too low and was partly buried near the bottom navigation.

## Acceptance Criteria

| Criteria | Priority | Result |
| --- | --- | --- |
| After a filled route-backed trade, the first Portfolio viewport shows the account header and the first position row. | P0 | Pass |
| The value chart, range selector, and Positions/Orders/History tabs remain visible and usable. | P0 | Pass |
| The position row preserves selected market, line, provider, amount, and action identity. | P0 | Pass |
| Settings gear still opens and closes. | P0 | Pass |
| Full ticket -> order -> Portfolio History path still passes on S23. | P0 | Pass |
| No backend route/schema/order logic changes are introduced. | P0 | Pass |
| Exact native chart curve and final pixel polish. | P2 | Tracked |

## Implementation Notes

- `src/components/Portfolio.tsx`: tightened profile/value/chart/range/tab spacing and added `portfolio-first-position-first-screen-fit` to the position row proof label.
- `scripts/smoke.ps1`: requires the first-screen visibility marker in the S23 server-filled route proof.

## API/Data Dependencies

No backend/API change. The Portfolio page still uses the same:

- account balance and position value
- value-history points
- selected market/line/provider identity
- `POST /api/orders`
- `GET /api/portfolio`
- Portfolio History state

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Result: pass
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8359 -OutputDir docs\mobile\screenshots\cycle-IO-portfolio-first-position-visibility-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-IO-portfolio-first-position-visibility-s23-proof`

Proof artifacts:

- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IO-portfolio-first-position-visibility-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-top.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IO-portfolio-first-position-visibility-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IO-portfolio-first-position-visibility-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Audit Gate

Pass. P0 gaps for this cycle are closed. Remaining P2 gap: exact native Portfolio chart curve and final pixel polish.
