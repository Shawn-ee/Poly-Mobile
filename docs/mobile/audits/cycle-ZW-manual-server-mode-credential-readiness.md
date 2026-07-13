# Cycle ZW - Manual Server Mode Credential Readiness

Date: 2026-07-13

## Scope

Close the internal tester P1 where manual S23 server-mode testing could not reliably generate or detect a local mobile API key from a clean shell.

This cycle does not change mobile UI, import provider markets, spend provider quota, start Expo, start bots, change schemas, or touch settlement.

## Problem

`npm run mobile:manual-testing-env` failed because `scripts/create_mobile_dev_credential.ts` used Prisma before loading `DATABASE_URL`. After that was fixed, the batch credential readiness checker still misread harmless config warnings as the credential dry-run JSON.

## Changes

- `scripts/create_mobile_dev_credential.ts` loads the shared local env side effect before Prisma work.
- `scripts/mobile_credential_readiness.ps1` relaxes PowerShell error handling only around the credential dry-run command, then parses the actual `dryRun` JSON object instead of warning output.
- `src/__tests__/mobile.manual-testing-env.contract.test.ts` verifies both contracts.

## Proof

- `npm run mobile:manual-testing-env`: pass; wrote `.runtime/mobile-manual-testing/server-mode-env.ps1` with token redacted from console output.
- `powershell -ExecutionPolicy Bypass -File scripts\mobile_credential_readiness.ps1 -SummaryPath docs/mobile/harness/batch-internal-readiness-latest/mobile-credential-readiness.json`: pass.
- `npm run mobile:internal-readiness-batch`: pass.
- `npx jest --runInBand src/__tests__/mobile.manual-testing-env.contract.test.ts`: pass.

## Audit Result

Pass.

`docs/mobile/audits/BATCH_INTERNAL_READINESS_GAP_LIST.md` now reports 0 P0 blockers and 7 P1 blockers. The old `manual_server_mode_needs_generated_mobile_api_key` P1 is gone. Remaining P1 blockers are provider breadth and Google OAuth/callback readiness, not the local manual server-mode API key.

## Secret Handling

The generated API token is not committed. It remains in `.runtime/mobile-manual-testing/server-mode-env.ps1`, which is local-only. Committed summaries redact the token and only record source/readiness fields.
