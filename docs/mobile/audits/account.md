# Account And Settings Polymarket Audit

Status: Cycle AC P0 pass for focused signed-out More/account shell, settings menu, safe login shell, language/theme rows, and fake-token wallet safety.

## Reference Audit

Reference device: Samsung S23.

Polymarket app/browser: Polymarket mobile web in Chrome. Native app remains location-gated, so the same-cycle reference used mobile web.

Route or URL if available: `https://polymarket.com`, bottom `More` drawer.

Screenshots/UI hierarchy:

- `docs/mobile/reference/screenshots/cycle-AC-polymarket-web-more-menu.png`
- `docs/mobile/reference/screenshots/cycle-AC-polymarket-web-more-menu.xml`

| Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- |
| Tap bottom `More` | Side drawer opens over the current page. It shows Leaderboard, Rewards, APIs, Accuracy, Status, Documentation, Help Center, Terms of Use, language row, social/theme icons, `Log In`, and `Sign Up`. | Drawer is modal-like; current market page remains dimmed behind it. | `cycle-AC-polymarket-web-more-menu.png` |
| Inspect login actions | `Log In` and `Sign Up` are visible account entry actions. | Do not proceed into third-party auth in this audit to avoid personal account exposure. | `cycle-AC-polymarket-web-more-menu.png` |
| Inspect money controls | No deposit/withdraw controls are exposed in the signed-out More drawer. | Account/wallet actions are gated. | `cycle-AC-polymarket-web-more-menu.png` |

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| AC-P0-01 | P0 | Account entry opens a settings/account shell with Polymarket-like More menu rows. | Tablet screenshot/XML | Pass |
| AC-P0-02 | P0 | Login shell has visible `Log In` and `Sign Up` actions and returns cleanly after mock sign-in/sign-out. | Tablet smoke | Pass |
| AC-P0-03 | P0 | Language and theme rows are visible as settings-style controls. | Tablet screenshot/XML | Pass |
| AC-P0-04 | P0 | Deposit/withdraw/EBPay are not active; fake-token balance is clearly labeled and real-money actions remain disabled. | Tablet screenshot/review | Pass |
| AC-P0-05 | P0 | Account/Profile summary data remains available after adding the More-style shell. | Tablet smoke | Pass |
| AC-P1-01 | P1 | Native Polymarket account/settings should be recaptured when location gate is resolved. | Reference audit | Deferred |
| AC-P1-02 | P1 | Menu rows should later navigate to real Holiwyn settings/help pages or be explicitly disabled. | Device smoke | Deferred |

## Holiwyn Proof

Holiwyn device: Samsung tablet.

Holiwyn app mode: Expo Go.

Commands:

- `npm run typecheck`
- `powershell -ExecutionPolicy Bypass -File ./scripts/smoke.ps1 -Deep -AccountLogin -Port 8209 -Device adb-R5GYA13X7NJ-4O0ADU._adb-tls-connect._tcp -ExpoHost 172.16.200.14`

Evidence:

- `docs/mobile/screenshots/cycle-current-holiwyn-account.png`
- `docs/mobile/harness/cycle-current-holiwyn-account.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-account-actions.png`
- `docs/mobile/harness/cycle-current-holiwyn-account-actions.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-account-signed-in.png`
- `docs/mobile/harness/cycle-current-holiwyn-account-signed-in.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-account-signed-out.png`
- `docs/mobile/harness/cycle-current-holiwyn-account-signed-out.xml`

## Audit Gate

Result: Pass for focused Account/settings P0 parity baseline.

Unresolved P0 gaps: 0 for focused signed-out account/settings scope.

Remaining P1/P2 gaps:

- Native Polymarket account/settings remains blocked by location verification.
- Holiwyn menu rows are visible settings rows, but not all rows navigate to deeper pages yet.

Recommended next cycle:

- Continue chart behavior or deeper market-page functionality.
