# Cycle IM - Portfolio Settings Action

## Scope

Local MVP visible mobile flow: Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

This cycle fixes a visible Portfolio header control. It does not add deposits, withdrawals, location checks, notifications, chat, order book UI, or social features.

## Reference Behavior

The Polymarket-style Portfolio screen has a settings gear in the profile header. A visible control should not be inert. For the current Holiwyn MVP, the gear should open a small account/status sheet rather than a full settings product area.

## Acceptance Criteria

| Criteria | Priority | Result |
| --- | --- | --- |
| Portfolio settings gear is tappable and exposes an open state. | P0 | Pass |
| Tapping the gear opens a visible settings sheet. | P0 | Pass |
| Settings sheet is Local MVP scoped: profile, language, fake-token mode, funding disabled. | P0 | Pass |
| Settings sheet can be closed and does not block Portfolio History. | P0 | Pass |
| Deposit/withdraw, location, notification, social, and order-book work are not introduced. | P0 | Pass |
| No backend route/schema/order logic changes are introduced. | P0 | Pass |
| Full account/settings parity. | P2 | Tracked |

## Implementation Notes

- `src/components/Portfolio.tsx`: adds local `settingsOpen` state, turns the gear into a functional toggle, and renders a compact account settings sheet.
- `scripts/smoke.ps1`: extends the S23 server-filled route proof to tap Portfolio settings, verify the open sheet, close it, and continue to History.

## API/Data Dependencies

No backend/API change. The settings sheet is local presentation over existing state:

- profile display name from Portfolio copy
- locale already passed to Portfolio
- fake-token MVP mode copy
- funding-disabled Local MVP status

The trade path remains:

- `POST /api/orders`
- `GET /api/portfolio`
- `GET /api/portfolio/value-history`
- Portfolio History state from the existing mobile flow

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Result: pass
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8357 -OutputDir docs\mobile\screenshots\cycle-IM-portfolio-settings-action-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-IM-portfolio-settings-action-s23-proof`

Proof artifacts:

- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IM-portfolio-settings-action-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-settings.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IM-portfolio-settings-action-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IM-portfolio-settings-action-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Audit Gate

Pass. P0 gaps for this cycle are closed. Remaining P2 gap: full account/settings parity beyond the Local MVP fake-token betting flow.
