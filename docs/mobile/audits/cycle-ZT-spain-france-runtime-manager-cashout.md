# Cycle ZT - Spain vs. France Runtime Manager Cashout Proof

Date: 2026-07-13

Scope: current `main` internal tester flow for the backend-owned Odds API event, Spain vs. France. This cycle did not add market/UI features. It fixed the runtime manager's S23 readiness detection and reran the real-device cashout proof from a clean Expo Go launch.

## Runtime Manager Fix

- File touched: `scripts/manage_holiwyn_internal_tester_runtime.ps1`.
- The manager's ADB helper was treating successful Windows `adb` calls as failed when `Start-Process` returned no exit code even though stderr was empty.
- The helper now treats a no-exit-code/no-stderr ADB result as successful.
- The manager now passes ADB arguments explicitly, extracts the actual connected S23 serial from `adb devices -l`, and includes redacted S23 diagnostic fields in the runtime summary.

Proof:

- `docs/mobile/harness/odds-api-live-runtime/zt-runtime-manager-status-s23-connected.redacted.json`
- S23 detected as `172.16.200.27:44029`, model `SM_S911U1`.
- Backend health: ok.
- Postgres: `poly_postgres` healthy.
- Supervisor/result-poller: running.
- Quota-spending provider loop: not running.

## S23 Trading Proof

Proof command:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/prove_mobile_odds_api_s23_visible_flow.ps1 -Device 172.16.200.27:44029 -Cycle ZT -OutputDir docs\mobile\screenshots\cycle-ZT-spain-france-cashout-runtime-manager -HierarchyOutputDir docs\mobile\harness\cycle-ZT-spain-france-cashout-runtime-manager
```

Summary:

- `docs/mobile/harness/cycle-ZT-spain-france-cashout-runtime-manager/cycle-ZT-odds-api-s23-visible-flow.json`

Key screenshots/XML:

- Home: `docs/mobile/screenshots/cycle-ZT-spain-france-cashout-runtime-manager/cycle-ZT-home.png`
- Event detail: `docs/mobile/screenshots/cycle-ZT-spain-france-cashout-runtime-manager/cycle-ZT-detail-top.png`
- Line market: `docs/mobile/screenshots/cycle-ZT-spain-france-cashout-runtime-manager/cycle-ZT-line-market.png`
- Buy ticket: `docs/mobile/screenshots/cycle-ZT-spain-france-cashout-runtime-manager/cycle-ZT-ticket-ready.png`
- Portfolio after buy: `docs/mobile/screenshots/cycle-ZT-spain-france-cashout-runtime-manager/cycle-ZT-after-submit.png`
- Cashout Max: `docs/mobile/screenshots/cycle-ZT-spain-france-cashout-runtime-manager/cycle-ZT-cashout-ticket-ready.png`
- Cashout Max XML: `docs/mobile/harness/cycle-ZT-spain-france-cashout-runtime-manager/cycle-ZT-cashout-ticket-ready.xml`
- Portfolio History: `docs/mobile/screenshots/cycle-ZT-spain-france-cashout-runtime-manager/cycle-ZT-portfolio-history.png`

Passing assertions:

- Home shows Spain vs. France from backend-owned sportsbook data.
- Event detail loads game lines from backend data.
- Order book and chat remain hidden.
- Ticket preserves sportsbook market identity: totals, line `2.5`, Over.
- Buy submits and reaches Portfolio.
- Portfolio preserves line/provider identity.
- Cash out opens close-position mode.
- Cashout Max uses owned shares only.
- Cashout ticket hides the generic Yes/No selector.
- Cashout SELL submits.
- Portfolio History shows the sell activity.

## Gaps

- P0: none for the tested Spain vs. France internal tester path.
- P1: provider snapshot is cached/no-quota during this runtime; live Odds API refresh requires explicit key/approval.
- P1: runtime control is local foreground/background process management, not an installed unattended service.
- P2: broader multi-event production process supervision remains future work.
