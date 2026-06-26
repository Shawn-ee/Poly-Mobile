# Orchestrator Quality Gates Evidence

Date: 2026-06-26

## Summary

This phase tightens the GitHub-issue orchestrator that exists on clean `dev`.

Implemented:

- Skips recursive `FIX-FIX` style tasks above a configurable depth.
- Skips thin issues that do not provide enough scope for autonomous execution.
- Requires validation or success criteria when `REQUIRE_TASK_QUALITY=true`.
- Requires implementation scope.
- Requires a safety, rollback, forbidden, or out-of-scope boundary.
- Stops selecting an issue after repeated failed orchestrator runs for the same issue.
- Writes the quality-gate config into cycle summaries and `status` output.

## Config

New config keys:

- `MAX_FAILED_RUNS_PER_ISSUE=2`
- `MAX_RECURSIVE_FIX_DEPTH=1`
- `REQUIRE_TASK_QUALITY=true`

## Why This Matters

The previous loop could keep selecting weak or recursive tasks after repeated failures. This change makes the orchestrator prefer owner-quality tasks with:

- clear scope;
- validation or success criteria;
- safety boundary;
- bounded retry behavior.

## Boundary

This does not change product runtime behavior.

This does not change:

- trading;
- ledger math;
- funding;
- withdrawal;
- wallet/private-key behavior;
- settlement;
- bots;
- deployment.

The newer file-queue harness scripts observed in the separate dirty checkout are not present on clean `dev`; those should be landed or parked separately before applying equivalent quality gates there.

## Validation

Required before merge:

- `node agent-orchestrator/src/orchestrator.mjs status`
- `git diff --check`
- `git diff --cached --check`
- `npx tsc --noEmit --pretty false --incremental false`
- `npm run test:ci`
