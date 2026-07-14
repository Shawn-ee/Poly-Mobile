# Cycle ZZ - Live Odds Preflight Regression Guard

## Scope

Add regression coverage for the live-odds preflight behavior fixed in Cycle ZY.

No mobile UI, backend route, schema, provider call, order flow, settlement, or runtime process behavior changed in this cycle.

## Behavior Guarded

- The no-quota preflight must validate the safer secret-wrapper refresh command:
  - `npm run mobile:one-event-live-runtime:provider-secret`
- It must not regress to the older raw provider alias as the expected refresh command.
- If live odds are already ready, preflight should pass without requiring a live refresh action to be present.
- `canRunLiveRefreshNow` should only become true when live odds are not already ready, the preflight passes, a provider key is configured, and no quota-spending loop is running.

## Proof

- Focused test:
  - `npx jest --runInBand src/__tests__/mobile.the-odds-api-single-event.contract.test.ts`

## Current Gaps

- P0: none for the preflight contract.
- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P1: production official-result auto-settlement remains open.
- P2: multi-event provider polling remains future work.
