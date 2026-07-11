# Batch Internal Readiness Harness

Date: 2026-07-11

## Scope

This harness consolidates the Local MVP readiness checks that were previously scattered across separate scripts and audit files.

It does not change mobile UI, backend schema, order logic, order book UI, chat, live stats, social features, deposit, or withdraw behavior.

## Command

```powershell
npm run mobile:internal-readiness-batch
```

Default output:

```text
docs/mobile/harness/batch-internal-readiness-latest/internal-readiness-batch-summary.json
```

## What It Checks

- Local backend/Docker/Postgres readiness.
- Mobile credential readiness.
- Current MVP route shape for `mobileMvpMatches=1`.
- Provider-backed Regulation Winner plus contract-shaped line-market state.
- Provider/internal exchange readiness.
- Polymarket World Cup team-match breadth.
- Polymarket provider line-market breadth.

## Gate Behavior

P0 blockers fail the command:

- backend or local database unavailable
- current Local MVP route unavailable or not MVP-ready

Known provider availability gaps are tracked as P1, not P0:

- no usable accepting-order Polymarket World Cup team-match books
- no attach-ready Polymarket World Cup line markets
- provider/internal exchange not local-MM-ready
- manual server mode missing an ambient `EXPO_PUBLIC_API_KEY`

This is intentional. The Local MVP fake-token user flow remains testable with contract-shaped line markets while provider-backed breadth and line parity remain open.

Do not import futures, awards, player props, or non-World-Cup events to make the match breadth numbers look better. The harness should keep those markets as provider diagnostics unless the product scope explicitly changes.

## Manual Server-Mode Prep

When the batch reports `manual_server_mode_needs_generated_mobile_api_key`, prepare the local-only Expo/server-mode environment with:

```powershell
npm run mobile:manual-testing-env
```

This creates a mobile dev credential, funds the local fake-token test account, and writes a local-only `.runtime/mobile-manual-testing/server-mode-env.ps1` file. The committed summary redacts the token; the local env file must not be committed.

Then use the generated summary commands:

```powershell
. .runtime/mobile-manual-testing/server-mode-env.ps1
npm run mobile:internal-beta-backend:start -- -Port 3002
cd mobile
npm run start -- --host lan --port 8081
```

## Why This Exists

The loop should not keep reopening small source-label or one-screen proof cycles just to rediscover the same provider-state facts. This batch harness gives the Lead Agent one current-state command before choosing the next meaningful milestone.
