# Cycle OB - Current MVP Server Cancel History Proof

Date: 2026-07-08

Scope:

- Continue the Local MVP retail flow after Cycle OA.
- Prove the visible server-backed cancel lifecycle on Samsung S23:
  Home -> Event Detail -> Spread line -> Trade Ticket -> server fake-token order -> Portfolio open order -> Cancel -> Portfolio History canceled activity.

Acceptance criteria:

| ID | Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- | --- |
| OB-P0-01 | P0 | Current service inspection selects the current MVP event and preserves the honest mixed data state. | Pass | `docs/mobile/harness/cycle-OB-current-mvp-home-server-cancel/cycle-OB-current-mvp-state-inspection.json` |
| OB-P0-02 | P0 | S23 proof opens Home and Event Detail for `Argentina vs. Egypt`, with chart and Game Lines visible. | Pass | `docs/mobile/screenshots/cycle-OB-current-mvp-home-server-cancel/cycle-OB-current-mvp-home-server-cancel-detail-top.png` |
| OB-P0-03 | P0 | S23 proof opens a Spread ticket with line, period, source, and token identity preserved. | Pass | `docs/mobile/screenshots/cycle-OB-current-mvp-home-server-cancel/cycle-OB-current-mvp-home-server-cancel-spread-ticket-ready.png` |
| OB-P0-04 | P0 | S23 proof submits a server-backed fake-token order and shows it under Portfolio Orders. | Pass | `docs/mobile/screenshots/cycle-OB-current-mvp-home-server-cancel/cycle-OB-current-mvp-home-server-cancel-portfolio.png` |
| OB-P0-05 | P0 | Tapping Cancel removes the open order and lands the user on Portfolio History with a canceled activity row. | Pass | `docs/mobile/screenshots/cycle-OB-current-mvp-home-server-cancel/cycle-OB-current-mvp-home-server-cancel-portfolio-canceled.png` |
| OB-P0-06 | P0 | The canceled row preserves market type, line, period, source, and provider token identity. | Pass | `docs/mobile/harness/cycle-OB-current-mvp-home-server-cancel/cycle-OB-current-mvp-home-server-cancel-portfolio-canceled.xml` |

Implementation notes:

- `Portfolio` now switches to the History tab when the latest activity is a cancellation and no open orders remain.
- `mobile/scripts/local-mvp-home-route-server-cancel-proof.ps1` now targets the current MVP event via `inspect_mobile_mvp_current_state.ts`.
- `mobile/scripts/smoke.ps1` now records Cycle OB proof names and checks current History row markers instead of retired EL-A/legacy activity labels.

Audit result:

- Gate status: Pass for Local MVP server cancel/history visibility on Samsung S23.
- Remaining P1: Spread/Totals/Team Total remain `contract-fixture` line markets until a real attach-ready provider line source exists.
- Remaining P1: production liquidity/fill/cashout hardening remains separate from this open-order cancel proof.
