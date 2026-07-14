# Holiwyn Internal Tester Current State

Generated: 2026-07-14 after Cycle ZAI warm-runtime S23 trading proof.

## Current Verdict

Holiwyn is ready for local internal testing of the one-event fake-token mobile trading flow when the local backend, Expo, and S23 are reachable.

This is not production readiness. It is a local internal tester runtime with backend-owned sportsbook data, fake-token orders, local maker liquidity, and guarded lifecycle/settlement proof.

## Current Event

- Event: Spain vs. France
- Provider source: The Odds API
- Sport key: `soccer_fifa_world_cup`
- Local slug: `odds-api-single-soccer-test`
- Current selected proof market: Total Goals 2.5
- Current visible selected outcome: `Over 2.5`
- Current selected market id: `78ea76f1-fc8f-419b-ac21-2554d79093f6`
- Current selected outcome id: `30fbc915-74ca-4809-a0c4-cd54c3236aa4`

## Runtime Truth

- Market maker: continuous only while the local supervisor is running; latest no-quota proof reseeded local shifted maker liquidity successfully.
- Provider odds refresh: cached/replay by default; live provider refresh is explicit, key-gated, quota-capped, and recorded as durable `ProviderRefreshRun` evidence.
- Latest live provider refresh: Cycle ZAJ refreshed Spain vs. France with bounded quota, spent 13 credits, left 268 requests remaining, and kept the provider secret out of committed artifacts.
- Provider quota: status/audit/readiness commands do not call The Odds API. Only explicit live-provider commands may spend quota.
- Stale handling: mobile routes classify snapshots as `ready`, `refresh_due`, `stale`, or `unavailable`; stale guard can pause stale markets and order placement rejects unavailable markets.
- Lifecycle: open, paused, closed, and settlement mechanics are proven locally. Active-event execution remains guarded until the selected market is `CLOSED` and exact approval evidence matches.
- Settlement: disposable and clone settlement execution are proven; active Spain vs. France settlement has not executed.

## Latest Passing Evidence

- Runtime status: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- Phase audit: `docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json`
- Completion audit: `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`
- S23 proof: `docs/mobile/harness/cycle-ZAI-warm-runtime-s23/cycle-ZAI-warm-runtime-s23-odds-api-s23-visible-flow.json`
- ZAI audit note: `docs/mobile/audits/cycle-ZAI-warm-runtime-s23-flow.md`
- Latest live refresh audit note: `docs/mobile/audits/cycle-ZAJ-live-provider-refresh-display-label-proof.md`

Latest local audit result:

- P0 gaps: none.
- P1 gaps: installed unattended provider/maker/lifecycle service ownership; production official-result auto-settlement.
- P2 gaps: multi-event provider polling and production dashboard/operator UI.

## Commands

Read-only go/no-go checks:

```text
npm run mobile:one-event-runtime-status
npm run mobile:one-event-phase-audit
npm run mobile:live-runtime-completion-audit
```

Preferred ordered audit gate:

```text
npm run mobile:live-runtime-audit-gate
```

Internal tester readiness handoff:

```text
npm run mobile:internal-tester-readiness-gate
```

Start local cached tester runtime without provider quota:

```text
npm run mobile:internal-tester-runtime:cached-start
```

Stop local tester runtime:

```text
npm run mobile:internal-tester-runtime:stop
```

Intentional live provider refresh:

```text
npm run mobile:one-event-live-runtime:provider-secret
```

Use the live provider refresh only when fresh mobile-visible odds are needed. It reads the key from the local process environment or ignored `.runtime/secrets/the-odds-api-key.txt`.

## S23 Manual Flow

1. Open Holiwyn on the S23.
2. Confirm Home shows Spain vs. France.
3. Open the event detail page.
4. Select Total Goals 2.5, `Over 2.5`.
5. Open the Buy ticket and place a fake-token buy.
6. Confirm the Portfolio position appears.
7. Tap Cash out.
8. Confirm the ticket is in close-position mode:
   - no Yes/No selector
   - Max uses owned shares, not wallet cash
   - side is SELL
9. Swipe to sell.
10. Confirm Portfolio and History update.

## Do Not Assume

- Do not assume an installed daemon is running. Current local loops are foreground/background process-manager loops, not production services.
- Do not assume live provider odds are fresh unless a quota-capped live refresh was intentionally run.
- Do not assume official-result auto-settlement will execute on the active event while it is `LIVE`.
- Do not treat older `Over +2.5` proof artifacts as the current tradable outcome when the quote route exposes `Over 2.5`.
