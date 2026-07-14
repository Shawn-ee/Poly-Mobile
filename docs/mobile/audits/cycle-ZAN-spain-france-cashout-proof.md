# Cycle ZAN - Spain vs. France Cashout S23 Proof

Scope: current `main` internal tester mobile trading flow for the backend-owned Odds API event, `Spain vs. France`.

This cycle did not add product UI or backend trading logic. It fixed proof/runtime harness reliability so the real S23 proof could run from a clean Expo Go launch:

- Expo Go delayed developer/onboarding sheet is dismissed during the wait loop.
- Expo deep link launches are quoted safely and can use ADB reverse through `127.0.0.1`.
- Cashout counterparty cleanup tolerates proof orders that become filled/noncancelable between lookup and cleanup.
- Event Detail cashout source-contract test now reflects the current server-estimate-first close-position path.

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB device: `172.16.200.27:44029`
- Expo proof host: `127.0.0.1:8289` through ADB reverse
- Proof summary: `docs/mobile/harness/cycle-ZAN-spain-france-cashout-proof/cycle-ZAN-odds-api-s23-visible-flow.json`
- Backend sell-safety proof: `docs/mobile/harness/cycle-ZAN-spain-france-cashout-proof/cycle-ZAN-cashout-route-sell-safety.json`
- Screenshots: `docs/mobile/screenshots/cycle-ZAN-spain-france-cashout-proof/`

## Acceptance Results

| Requirement | Result |
| --- | --- |
| Home shows backend-owned Spain vs. France event | Pass |
| Event detail markets load from backend | Pass |
| Buy flow works | Pass |
| Portfolio position appears | Pass |
| Cash out opens close-position ticket, not buy ticket | Pass |
| Cashout Max uses owned shares only | Pass |
| Cashout ticket hides Yes/No selector | Pass |
| Sell submits through backend | Pass |
| Portfolio/history updates after sell | Pass |
| Backend rejects no-position sell | Pass |
| Backend rejects oversell | Pass |

## Remaining Gaps

- P0: none for this internal tester cashout path.
- P1: phone proof still depends on Expo Go; a dev build/APK would make repeated proof startup less brittle.
- P2: cashout copy and Portfolio visual polish can be improved later, but they do not block local internal tester trading.
