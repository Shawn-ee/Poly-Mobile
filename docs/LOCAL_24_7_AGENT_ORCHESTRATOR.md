# Local 24/7 Agent Orchestrator

The local agent orchestrator is a Linux-friendly runner that coordinates Codex development work through GitHub issues, local branches, validation, pull requests, and run reports.

It lives under `agent-orchestrator/`.

## What It Does

- Reads local configuration from `agent-orchestrator/config.env`.
- Defaults to `DRY_RUN=true`.
- Uses the GitHub CLI to inspect eligible GitHub issues.
- Selects issues with all required labels from `TASK_LABELS`.
- Skips issues with ignored labels from `IGNORE_LABELS`.
- Detects high-risk issue text before Codex runs.
- Generates Codex prompts under `agent-orchestrator/runs/`.
- In real mode only, can run Codex, validation, commits, pushes, PR creation, and issue comments.

## What It Does Not Do

- It does not auto-merge.
- It does not deploy.
- It does not touch `main`.
- It does not print or manage secrets.
- It does not run Codex in dry-run mode.
- It does not process high-risk issues unless `ALLOW_HIGH_RISK=true`.

## Configuration

Copy the example file locally:

```sh
cp agent-orchestrator/config.example.env agent-orchestrator/config.env
```

`agent-orchestrator/config.env` is ignored by git. Keep secrets out of it where possible. The first safe configuration is:

```sh
DRY_RUN=true
ALLOW_HIGH_RISK=false
MAX_TASKS_PER_CYCLE=1
LOOP_INTERVAL_SECONDS=1800
```

Required issue labels default to:

```text
codex-ready,agent-task
```

Ignored labels default to:

```text
human-review,blocked,high-risk,in-progress
```

## Dry-Run Mode

Dry-run mode may inspect local git state, inspect GitHub issues through `gh`, generate intended branch names, generate Codex prompts, and write reports under `agent-orchestrator/runs/`.

Dry-run mode must not create branches, commit, push, open PRs, modify issues, modify labels, run Codex, or modify files outside its report output.

Run one dry-run cycle:

```sh
npm run agent:orchestrator:once
```

Run the loop manually:

```sh
npm run agent:orchestrator:loop
```

Check status:

```sh
npm run agent:orchestrator:status
```

## Real Execution Mode

Real mode is enabled only with:

```sh
DRY_RUN=false
```

In real mode, the orchestrator may create `agent/<issue-number>-<slug>` branches, mark issues in progress, run Codex with the generated prompt, run validation, commit safe changes, push branches, open pull requests into `dev`, and comment on the issue with the PR link and validation summary.

Even in real mode it never auto-merges, never deploys, never touches `main`, and never hides validation failures.

## Validation

After Codex execution in real mode, the orchestrator runs `scripts/agent-validate.sh` when present. If that script is missing, it falls back to:

```sh
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

Validation output is saved in the run directory.

## High-Risk Skip Behavior

The orchestrator scans issue title and body for high-risk keywords such as `prisma`, `schema`, `migration`, `UserBalance`, `LedgerEntry`, `matching`, `settlement`, `deposit`, `withdrawal`, `wallet`, `private key`, `admin auth`, `production`, `deployment`, `bot live trading`, `market maker`, and `liquidity`.

With `ALLOW_HIGH_RISK=false`, matching issues are skipped and a report is written. Codex is not run.

## Quota And Rate Limits

If GitHub or Codex output suggests quota, rate, usage, token, or retry-later limits, the orchestrator writes a quota-wait report and stops the current cycle cleanly. It does not mark the task failed and does not open a failed PR. The task can be retried in a future loop.

## Systemd User Service

The service template is:

```text
agent-orchestrator/systemd/poly-agent-orchestrator.service
```

Install it on the Linux VM after reviewing `WorkingDirectory`:

```sh
mkdir -p ~/.config/systemd/user
cp agent-orchestrator/systemd/poly-agent-orchestrator.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now poly-agent-orchestrator.service
```

View logs:

```sh
journalctl --user -u poly-agent-orchestrator.service -f
```

Stop it:

```sh
systemctl --user stop poly-agent-orchestrator.service
```

Disable it:

```sh
systemctl --user disable poly-agent-orchestrator.service
```

Do not enable or start the service from a PR. Installation is a human operation.

## Safety Controls

- `DRY_RUN=true` by default.
- `ALLOW_HIGH_RISK=false` by default.
- `MAX_TASKS_PER_CYCLE=1` by default.
- High-risk labels are ignored by default.
- Auto-merge is disabled by design.
- Production deploy is forbidden by design.
- `main` is never targeted by the orchestrator.
