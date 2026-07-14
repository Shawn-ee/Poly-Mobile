# Cycle ZX - Current Runtime Operator Handoff

## Scope

Refresh the live-runtime handoff evidence from current `main` without changing mobile UI, backend routes, schema, provider ingestion, or settlement behavior.

This cycle is intentionally no-quota and read-only. It checks the currently running local runtime and updates documentation so internal testers can distinguish:

- cached tester readiness
- live mobile odds freshness
- local foreground/background process continuity
- installed service ownership
- active-event settlement safety

## Commands

- `npm run mobile:one-event-runtime-status`
- `npm run mobile:local-runtime-launch-profile`
- `npm run mobile:internal-tester-operator-snapshot`

## Current Event

- Event: `Spain vs. France`
- Local slug: `odds-api-single-soccer-test`
- Provider source: The Odds API sportsbook bridge
- Selected proof market: `Spain vs. France: Total Goals 2.5`
- Selected proof outcome: `Over +2.5`

## Current Runtime Result

- Backend health: pass on `http://127.0.0.1:3002`.
- Cached internal tester readiness: pass.
- Current runtime mode: warm no-quota runtime.
- Supervisor loop: running.
- Result poller loop: running.
- Provider quota-spending loop: not running.
- Installed OS service: not installed.
- Live mobile odds freshness: not fresh under the 90-second mobile route threshold.
- Provider proof freshness: still inside the 24-hour proof window.

## Operator Meaning

Internal testers can continue cached fake-token trading without spending provider quota. If the tester specifically needs mobile-visible live odds to be fresh under the route freshness threshold, run the explicit provider-refresh command:

```powershell
npm run mobile:one-event-live-runtime:provider-secret
```

That command requires the provider key in the local environment or ignored `.runtime/secrets/the-odds-api-key.txt` and remains quota-capped by the existing proof wrapper.

## Settlement Safety

The active tester event has trusted-result evidence and settlement readiness proof, but execution is still intentionally blocked while the selected market is `LIVE`. Settlement execution requires:

- market status `CLOSED`
- exact local approval match
- exact confirmation phrase

No active-event settlement execution happened in this cycle.

## Gaps

- P0: none for cached local internal tester trading.
- P1: mobile-visible live odds need an explicit provider-refresh command when the 90-second route freshness window matters.
- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P1: production official-result auto-settlement remains open.
- P2: multi-event provider polling and production operator UI remain future work.
