# Holiwyn Admin Command Center

Cycle: ADMIN-CC Phase 1

## Structure

- `/admin` is the unified read-only command-center overview.
- `/admin/events` preserves the existing market operations console for event/market creation, edit, pause/close, and resolve workflows.
- `/admin/system` is the Runtime Services monitor.
- Existing operational pages remain reachable: `/admin/bots`, `/admin/agents`, `/admin/reference-markets`, `/admin/mobile-provider-mapping`, deposits, withdrawals, and market invariants.

## Status Contract

The command center reads `GET /api/admin/command-center`, which is guarded by the existing `requireAdmin()` pattern. The route composes DB-backed and admin-safe status from:

- backend and Postgres health
- runtime service heartbeat/run rows
- bot monitor summary
- provider snapshot, provider refresh run, and market-maker quote run rows
- settlement review and operator audit counts
- redacted local live-runtime status outside production

Status rows include `status`, `lastUpdated`, `blocker`, `nextAction`, and local/production flags where relevant.

## Local vs Production

Local-only means the evidence comes from local/internal tester runtime, proof artifacts, foreground workers, or local process state. It must not be treated as an installed production daemon.

Production safe means the row is safe to rely on in production without local-only assumptions. In Phase 1, production runtime ownership, installed provider polling, installed market-maker service ownership, and production settlement operator UI remain blocked/planned.

## Read-Only Boundary

The command-center overview and runtime-services page do not add start/stop/settlement execution controls. Existing active controls remain only where they already existed, mainly the Events & Markets console and existing admin market/withdrawal routes.

The command-center API never returns secret values, provider API keys, or exact settlement confirmation strings. Environment variables are shown only as present/missing.

## Future Work

- Production runtime service ownership with durable health, retries, and alerting.
- Production operator UI for settlement review, approval, dry-run, and execution.
- Dedicated provider data freshness monitoring across more than the local one-event proof path.
- Full audit log page backed by `OperatorAuditEvent` and other canonical events.
- User/wallet risk dashboard and trading-risk rollups.
