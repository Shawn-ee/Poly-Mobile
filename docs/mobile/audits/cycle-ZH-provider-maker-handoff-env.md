# Cycle ZH - Provider Maker Handoff Env Self-Load

Generated: 2026-07-13

## Scope

Backend live-runtime proof harness fix for the one-event Spain vs France local internal runtime.

This cycle does not add UI work, order book work, chat, live stats, or new provider quota usage. It fixes a runtime harness blocker: `npm run mobile:provider-maker-handoff` failed from a clean shell unless `DATABASE_URL` was already set by the caller.

## Problem

The provider-to-maker handoff report is part of the phase/completion evidence for live-runtime readiness. It verifies that a bounded live provider refresh for the selected event/market/outcome is followed by a later local shifted maker quote for the same identity.

Before this cycle, running the command directly failed with Prisma `Environment variable not found: DATABASE_URL`.

## Change

- `scripts/report_holiwyn_provider_maker_handoff.ts` now calls `loadLocalEnvForScript(["DATABASE_URL"])` before querying Prisma.
- This matches the repo's other local runtime proof scripts and makes the command self-contained for local operators.

## Proof

Command:

- `npm run mobile:provider-maker-handoff`

Result:

- Pass: true
- Provider source: `the-odds-api`
- Reference source: `sportsbook-odds`
- Event: `odds-api-single-soccer-test` / Spain vs France
- Selected market: `78ea76f1-fc8f-419b-ac21-2554d79093f6`
- Selected outcome: `72c3377d-ae57-4f2b-b75d-0850b40bf5de`
- Provider refresh run: passed, quota protected, stale before refresh, ready after refresh
- Maker quote run after provider refresh: passed, local only, shifted worse than provider, quote route visible
- Provider quota used by this report: false

Evidence:

- `docs/mobile/harness/odds-api-live-runtime/provider-maker-handoff-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json`
- `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`

## Audit Result

P0:

- None. Handoff command now runs from a clean local shell and phase/completion audits pass.

P1:

- This still proves local foreground/runtime handoff, not an installed always-on production maker daemon.
- Provider refresh remains explicit and quota/key gated; cached runtime checks do not spend provider quota.

P2:

- Multi-event provider-to-maker handoff remains future work.
