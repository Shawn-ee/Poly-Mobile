# Cycle IN - Portfolio Header Dollar Value

## Scope

Local MVP visible mobile flow: Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

This cycle improves the Portfolio account value header only. It does not change order placement, backend accounting, deposits, withdrawals, chat, live stats, social features, or order book UI.

## Reference Behavior

The Polymarket Portfolio reference presents the account value as a dollar portfolio value with a cash amount beside the PnL line. Holiwyn's top Portfolio header previously displayed `10,000 USDT`, which looked more like an internal token ledger than the retail account value.

## Acceptance Criteria

| Criteria | Priority | Result |
| --- | --- | --- |
| Portfolio top account value uses dollar-style display. | P0 | Pass |
| Portfolio PnL and cash line use dollar-style display. | P0 | Pass |
| Ticket/order/position/history rows preserve fake-token USDT identity where already expected. | P0 | Pass |
| Settings gear still opens and closes. | P0 | Pass |
| Full ticket -> order -> Portfolio History path still passes on S23. | P0 | Pass |
| No backend route/schema/order logic changes are introduced. | P0 | Pass |
| Full Portfolio typography/chart/row parity. | P2 | Tracked |

## Implementation Notes

- `src/components/Portfolio.tsx`: added `portfolioHeaderMoney` and uses it for the top portfolio value, PnL, and cash line only.
- `scripts/smoke.ps1`: requires the `portfolio-header-dollar-value` marker in the route-backed S23 Portfolio top proof.

## API/Data Dependencies

No backend/API change. The Portfolio header still uses the same numeric mobile state:

- fake-token `balance`
- position current value
- PnL from positions
- existing `POST /api/orders`
- existing `GET /api/portfolio`
- existing `GET /api/portfolio/value-history`

Only the top account display format changed.

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Result: pass
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8358 -OutputDir docs\mobile\screenshots\cycle-IN-portfolio-header-dollar-value-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-IN-portfolio-header-dollar-value-s23-proof`

Proof artifacts:

- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IN-portfolio-header-dollar-value-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-top.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IN-portfolio-header-dollar-value-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-settings.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IN-portfolio-header-dollar-value-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IN-portfolio-header-dollar-value-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Audit Gate

Pass. P0 gaps for this cycle are closed. Remaining P2 gap: full Portfolio typography/chart/row parity.
