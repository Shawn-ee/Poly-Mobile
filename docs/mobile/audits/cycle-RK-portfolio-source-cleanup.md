# Cycle RK - Portfolio Source Label Visual Cleanup

## Scope

Local MVP Portfolio row presentation after a server-filled current-route Team Total order.

Out of scope:

- Order book UI
- Chat
- Live stats
- Backend route/schema work
- Provider line-market breadth

## Acceptance Criteria

P0:

- Current-route server-filled order proof still passes on Samsung S23.
- Portfolio/history visible row keeps retail content: selected outcome, match context, amount, time, and market line.
- Source/debug labels are visually minimized in Portfolio rows.
- Audit metadata remains available in XML/accessibility labels.
- Order, position, and history identity fields remain preserved.

P1:

- Replace contract-fixture line markets with real provider-backed line markets when available.

P2:

- Native Google OAuth callback/session/logout.

## Implementation Notes

- `Portfolio.tsx` adds `rowSourceAuditOnly` and applies it to row-level source pills/notes for open orders, positions, and history.
- Existing source badge/note labels remain mounted for audit metadata but no longer occupy visible row layout.

## Audit Gate Result

Pass.

Device:
Samsung S23 / `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / `SM_S911U1`.

Proof:
`docs/mobile/harness/cycle-RK-portfolio-source-cleanup/cycle-RK-local-mvp-current-route-server-filled-flow-proof.json`

Key evidence:

- `docs/mobile/screenshots/cycle-RK-portfolio-source-cleanup/cycle-RK-holiwyn-route-server-mvp-portfolio-history.png`
- `docs/mobile/harness/cycle-RK-portfolio-source-cleanup/cycle-RK-holiwyn-route-server-mvp-portfolio-history.xml`

## Remaining Gaps

P0:

- None for RK scope.

P1:

- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.

P2:

- Native Google OAuth callback/session/logout.
