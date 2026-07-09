# Cycle PT - Portfolio Google Entry Visibility

Status: P0 Audit Gate passed for account-entry discoverability.

## Scope

Make the existing Google login screen discoverable again after the Local MVP Home cleanup removed the Home top-right account button.

This cycle does not change Google OAuth, backend auth routes, profile sync, order routes, provider data, wallet, deposit, withdrawal, order book UI, chat, live stats, or social features.

## Acceptance Criteria

| ID | Priority | Criterion | Evidence |
| --- | --- | --- | --- |
| PT-P0-01 | P0 | Portfolio keeps the existing top-left profile/account entry. | `portfolio-account-entry-top-left` remains in source. |
| PT-P0-02 | P0 | Portfolio exposes an obvious account/settings gear entry. | S23 hierarchy contains `portfolio-account-entry-gear`. |
| PT-P0-03 | P0 | Tapping the gear opens Account. | S23 targeted proof captures Account after gear tap. |
| PT-P0-04 | P0 | Account still exposes Google login. | S23 hierarchy contains `account-login-google`; `AccountScreen` still wires `openGoogleSignIn`. |
| PT-P0-05 | P0 | Backend/order/auth logic is unchanged. | Diff touches only Portfolio UI, focused source contract test, docs, and proof artifacts. |

## Proof

Device:

- Samsung S23: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`

Evidence:

- Summary: `docs/mobile/harness/cycle-PT-portfolio-google-entry-visibility/cycle-PT-portfolio-google-entry-visibility-summary.json`
- Portfolio screenshot: `docs/mobile/screenshots/cycle-PT-portfolio-google-entry-visibility/cycle-PT-portfolio-account-entry.png`
- Account screenshot: `docs/mobile/screenshots/cycle-PT-portfolio-google-entry-visibility/cycle-PT-account-google-entry.png`
- Portfolio XML: `docs/mobile/harness/cycle-PT-portfolio-google-entry-visibility/cycle-PT-portfolio-account-entry.xml`
- Account XML: `docs/mobile/harness/cycle-PT-portfolio-google-entry-visibility/cycle-PT-account-google-entry.xml`

Validation:

- `npm --prefix mobile run typecheck` passed.
- `git diff --check` passed.
- Targeted S23 proof passed.
- Existing broad `smoke.ps1 -AccountLogin` is stale and failed because it still expects old account copy such as `Demo balance` / `Log In`; this did not block the targeted proof.

## Result

Unresolved P0 gaps for this selected feature: `0`.

Remaining P1/P2 gaps:

- P1: Google OAuth itself still needs an end-to-end configured backend auth proof before production auth can be considered complete.
- P2: Update the older broad account-login smoke script so it matches the current Account screen copy and Portfolio entry path.
