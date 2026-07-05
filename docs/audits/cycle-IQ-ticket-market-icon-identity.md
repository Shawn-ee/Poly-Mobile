# Cycle IQ - Ticket Market Icon Identity

## Scope

Local MVP visible mobile flow: Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

This cycle improves the Trade Ticket header icon for non-team markets. It does not change backend order logic, deposits, withdrawals, chat, live stats, social features, or order book UI.

## Reference Behavior

The Polymarket ticket header uses a meaningful event/market visual anchor. Holiwyn already inferred team flags for team-specific tickets, but route-backed totals tickets could still show a large generic color block. That looked like a missing asset rather than a deliberate market identity.

## Acceptance Criteria

| Criteria | Priority | Result |
| --- | --- | --- |
| Non-team totals ticket uses a deliberate `%` market icon, not a generic color block. | P0 | Pass |
| Ticket hierarchy exposes `ticket-market-icon-totals` for S23 proof. | P0 | Pass |
| Existing inferred team flag behavior remains intact. | P0 | Pass |
| Amount entry, swipe submit, Portfolio, and History still pass on S23. | P0 | Pass |
| No backend route/schema/order logic changes are introduced. | P0 | Pass |
| Exact production team/market artwork. | P2 | Tracked |

## Implementation Notes

- `src/components/TradeTicket.tsx`: adds `marketIconForTicket`; renders fallback market icons only when no team flag is inferred.
- `scripts/smoke.ps1`: requires `ticket-market-icon` and `ticket-market-icon-totals` in the route-backed totals ticket proof.

## API/Data Dependencies

No backend/API change. Ticket still uses the same:

- selected market/outcome/line/period/provider identity
- amount and payout state
- `POST /api/orders`
- `GET /api/portfolio`
- Portfolio History state

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Result: pass
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8361 -OutputDir docs\mobile\screenshots\cycle-IQ-ticket-market-icon-identity-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-IQ-ticket-market-icon-identity-s23-proof`

Proof artifacts:

- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IQ-ticket-market-icon-identity-s23-proof\cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IQ-ticket-market-icon-identity-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IQ-ticket-market-icon-identity-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Audit Gate

Pass. P0 gaps for this cycle are closed. Remaining P2 gap: exact production team/market artwork.
