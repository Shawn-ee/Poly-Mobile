# Cycle PX - Account Login Focus Cleanup

Scope:

- Focus the Account screen on Local MVP account/login information.
- Remove disabled non-MVP menu rows from the visible Account page.
- Keep Google login visible and keep Portfolio as the account entry point.
- No backend, schema, provider, orderbook, chat, live stats, social, deposit, or withdrawal work.

Reference/product audit:

- The Local MVP priority is the retail betting path and a minimal account/profile entry.
- Disabled rows such as Leaderboard, Rewards, APIs, Accuracy, and Help do not support the current Home -> Event Detail -> ticket -> Portfolio/history path.
- The prior S23 proof confirmed Google login exists, but the screen was visually crowded by disabled rows.

Acceptance criteria:

| ID | Priority | Criterion | Evidence |
| --- | --- | --- | --- |
| PX-P0-01 | P0 | Account screen keeps `account-login-google` visible for signed-out users. | S23 proof and `accountAuthContract.test.ts` |
| PX-P0-02 | P0 | Account screen no longer renders disabled non-MVP menu rows such as Leaderboard, Rewards, APIs, or `MVP disabled`. | Contract test and S23 XML |
| PX-P0-03 | P0 | Language, demo balance, ticket default, portfolio summary, and trading mode remain visible. | Contract test and S23 XML |
| PX-P0-04 | P0 | Backend routes, schema, provider, order logic, orderbook UI, chat, live stats, social, deposit, and withdraw are untouched. | Git diff |

Audit result:

- P0 status: Pass.
- S23 proof: `docs/mobile/harness/cycle-PX-account-login-focus-cleanup/cycle-PX-account-login-focus-s23-proof.json`.
- S23 screenshots: `docs/mobile/screenshots/cycle-PX-account-login-focus-cleanup/cycle-PX-account-initial.png`, `docs/mobile/screenshots/cycle-PX-account-login-focus-cleanup/cycle-PX-account-lower.png`.
- S23 XML: `docs/mobile/harness/cycle-PX-account-login-focus-cleanup/cycle-PX-account-initial.xml`, `docs/mobile/harness/cycle-PX-account-login-focus-cleanup/cycle-PX-account-lower.xml`.
- Validation: mobile typecheck passed; mobile API/contract tests passed; source guard confirmed disabled Account menu strings are absent from `AccountScreen`.
- P1 remaining: full authenticated Google callback/session proof after backend auth environment is configured.
