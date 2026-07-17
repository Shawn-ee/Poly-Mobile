# Cycle ZCN - Bounded Allowlist Supervisor Audit

Date: 2026-07-17

## Scope

Add a no-quota parent supervisor that consumes the provider-event runtime allowlist, runs eligible events with isolated evidence, and refuses to assign workers to archived catalog records.

## Acceptance Criteria

- P0: only `allowlisted=true` and `runtimeEligible=true` events execute.
- P0: event and iteration counts are bounded from one through three.
- P0: each child receives its selected event slug and matching cached provider proof.
- P0: child evidence is isolated by event slug.
- P0: archived records are reported and skipped.
- P0: the parent never enables provider refresh or spends provider quota.
- P1: support installed unattended ownership and safe concurrent workers.

## Audit Result

Pass for the available local inventory with zero unresolved P0 gaps.

- Provider catalog records: 3.
- Selected runtime owners: 1, `Chapecoense vs. Bahia` (`odds-api-single-soccer-test`).
- Active child result: pass; one maker-seed iteration; lifecycle scheduler enabled; zero provider proof runs.
- Archived skips: `Switzerland vs. Argentina` and `Spain vs. France`, both `archived_catalog_record`.
- Provider refresh enabled: false.
- Provider quota used: false.
- Expo left running: false.
- Child supervisor left running: false.

Evidence: `docs/mobile/harness/odds-api-live-runtime/event-allowlist-supervisor-summary.redacted.json`.

## Remaining Gaps

- P0 for Internal Alpha RC1: import two additional current/upcoming provider events and rerun this command across all three active owners.
- P1: installed unattended runtime ownership.
- P1: event-scoped durable service/heartbeat identity before concurrent workers.
- P2: operator UI for allowlist management.
