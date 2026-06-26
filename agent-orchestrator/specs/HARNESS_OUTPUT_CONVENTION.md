# Harness Output Convention

Harness scripts are evidence-producing tools. They do not decide final task status.

Every harness should try to output this structure:

```text
HARNESS_NAME: <name>
TASK_ID: <task id or unknown>
STATUS: PASS | FAIL | BLOCKED | WARN
FAILURE_CATEGORY: <category or none>
SHORT_REASON: <one-line reason>
LOG_PATH: <path or none>
RECOMMENDED_SUBAGENT: <agent or none>
NEXT_VALIDATION_COMMAND: <command or none>
```

## Status Meanings

- `PASS`: harness evidence found no issue for its scoped check.
- `FAIL`: harness found a scoped failure.
- `BLOCKED`: harness could not run because of missing dependency, env, service, or permission.
- `WARN`: harness found risk or incomplete evidence but not a hard fail.

## Failure Categories

Use concrete categories such as:

- `frontend_render`
- `backend_api`
- `trading_engine`
- `ledger_accounting`
- `combo_pricing`
- `settlement`
- `bot_dry_run`
- `deployment_env`
- `route_security`
- `secret_safety`
- `external_dependency`
- `test_infrastructure`

## Important Boundary

Harnesses must not:

- choose product priority;
- generate recursive tasks;
- act as final reviewer;
- silently weaken validation;
- mark the whole task done alone.

The Validation Agent reads harness output and makes the validation decision.
