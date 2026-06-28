# Deposit Address API and UI Evidence

Date: 2026-06-19

Branch: `agent/beta-deposit-address-api-ui`

## Executive Summary

Phase 4 adds controlled internal funding beta evidence for the deposit address API and wallet UI entry point.

This PR keeps the deposit address flow allowlisted and guarded. It does not change private-key encryption, wallet generation, deposit monitor auto-credit, ledger math, withdrawal behavior, schema, migrations, package files, workflows, deployment, or secrets.

## API Evidence

Reviewed routes:

- `GET /api/deposits/address`
- `GET /api/deposits`

Existing and added test evidence verifies:

- anonymous users are blocked before wallet generation.
- non-allowlisted users are blocked before wallet generation or deposit history listing.
- allowlisted users receive a response containing only public deposit address metadata.
- `FUNDING_KILL_SWITCH` blocks deposit address generation.
- unsafe deposit configuration blocks deposit address generation.
- deposit address responses omit `privateKey`, `encryptedPrivateKey`, `seed`, and `mnemonic`.
- deposit history responses omit private wallet material even if mocked data contains synthetic secret markers.
- production unsafe-config responses do not echo env names or values.

## UI Evidence

Reviewed surface:

- `/wallet`
- `TransferCryptoModal`

The wallet page now exposes a small controlled internal beta deposit card that opens the existing guarded transfer modal.

The UI copy states:

- funding is controlled internal beta only.
- users must send only the supported token on the supported chain after the guarded modal shows the assigned address.
- unsupported assets or networks may be lost or delayed.
- anonymous and non-allowlisted users remain blocked by the API.
- the modal never displays private keys, encrypted private keys, seed phrases, mnemonics, or environment values.

The modal fetches deposit address and history through guarded APIs using credentials. It does not receive private key material from the route.

## Security Review

SecurityAgent result: Pass for this focused scope.

Private-key exposure:

- No raw private key is returned by the API.
- No encrypted private key is returned by the API.
- No seed or mnemonic is returned by the API.
- QR code, when shown, uses only the public deposit address returned by the guarded API.

Access control:

- Anonymous users are blocked.
- Non-allowlisted users are blocked.
- Allowlisted users still require `INTERNAL_FUNDING_BETA_ENABLED=true`.
- Kill switch remains authoritative for deposit address generation.

## Ledger and Auto-Credit Impact

No ledger, balance, deposit auto-credit, duplicate-credit, withdrawal hold, withdrawal release, withdrawal completion, or admin payout behavior changed.

## Runtime Impact

Runtime UI behavior changed: the wallet page now offers an entry point to the existing guarded deposit modal.

Runtime funding behavior changed: No.

Because the UI entry point is funding-adjacent, this PR should remain human-reviewed unless reviewers decide the change is display-only enough to merge after CI.

## Validation Scope

Required validation:

- `git diff --check`
- `git diff --cached --check`
- targeted funding route tests
- Prisma generate
- Prisma validate
- TypeScript
- `npm run test:ci`

## Remaining Risks

- This is local mocked evidence, not a live chain deposit test.
- Env-backed allowlisting may need schema-backed funding profiles before larger internal cohorts.
- Deposit auto-credit idempotency remains Phase 5.
- Withdrawal hold/release/complete remains Phase 6.

## Recommended Next Phase

After Phase 4 is reviewed, start Phase 5:

`funding(beta): harden confirmed deposit auto-credit flow`

Phase 5 must prove duplicate-safe ledger-backed auto-credit before any real internal funding deployment claim.
