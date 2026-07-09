# Cycle QI - Account Google Status Visibility

Gate status: Pass for focused Account auth visibility.

Scope:

- Portfolio -> Account Google auth entry/status.
- Keep Local MVP retail flow untouched.
- No orderbook UI, chat, live stats, social, deposit, withdrawal, backend schema, provider, or order-route work.

Reference/product audit:

- The current Local MVP keeps account entry inside Portfolio instead of Home.
- A Google auth action/status should remain visible from Account so testers do not think login disappeared.
- Signed-out state should expose an actionable Google entry.
- Signed-in/profile-loaded state should expose a connected Google status instead of hiding the auth area.

Acceptance criteria:

| ID | Priority | Criterion | Evidence |
| --- | --- | --- | --- |
| QI-P0-01 | P0 | Signed-out Account shows `Continue with Google` with `account-login-google`. | S23 XML `cycle-QI-account-signed-out-google.xml` |
| QI-P0-02 | P0 | Signed-in/profile-loaded Account shows `Google connected` with `account-login-google-connected`. | S23 XML `cycle-QI-account-google-connected.xml` |
| QI-P0-03 | P0 | Account does not restore local-only phone/email login or sign-out controls. | `accountAuthContract.test.ts` |
| QI-P0-04 | P0 | Backend/order/provider/schema code remains untouched. | Git diff |
| QI-P1-01 | P1 | Real Google OAuth callback/session/logout is proven on mobile. | Open |

Implementation:

- `mobile/src/components/AccountScreen.tsx` renders a persistent auth card.
- Signed-out state keeps the existing Google button and `openGoogleSignIn()` behavior.
- Signed-in state renders a non-actionable Google connected status row.
- `mobile/scripts/smoke.ps1` Account assertions now match the current MVP Account contract instead of removed mock phone/email/login rows.

Validation:

- `npm run typecheck --prefix mobile` - pass.
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/accountAuthContract.test.ts mobile/src/__tests__/accountStaticRowsContract.test.ts` - pass.
- Samsung S23 signed-out proof - pass.
- Samsung S23 signed-in connected proof - pass.

Evidence:

- Summary: `docs/mobile/harness/cycle-QI-account-google-status/cycle-QI-account-google-status-proof.json`
- Signed-out screenshot: `docs/mobile/screenshots/cycle-QI-account-google-status/cycle-QI-account-signed-out-google.png`
- Signed-out XML: `docs/mobile/harness/cycle-QI-account-google-status/cycle-QI-account-signed-out-google.xml`
- Signed-in screenshot: `docs/mobile/screenshots/cycle-QI-account-google-status/cycle-QI-account-google-connected.png`
- Signed-in XML: `docs/mobile/harness/cycle-QI-account-google-status/cycle-QI-account-google-connected.xml`
- Restored signed-out screenshot: `docs/mobile/screenshots/cycle-QI-account-google-status/cycle-QI-account-restored-google.png`
- Restored signed-out XML: `docs/mobile/harness/cycle-QI-account-google-status/cycle-QI-account-restored-google.xml`

Audit result:

- P0 failed: 0.
- P1 open: real Google OAuth callback/session/logout proof.
