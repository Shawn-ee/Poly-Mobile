# Prompt-Driven Agent Engineering System

## Wrong Model

The old model treated scripts as the manager:

- bash loop controls Codex;
- loop scripts choose task flow;
- harnesses behave like the validator brain;
- failure scripts generate recursive `FIX` / `FIX-FIX` tasks;
- Codex workers are treated like dumb executors.

That model can become idle, recursive, or confused.

## Correct Model

The correct POLY engineering system is prompt-driven:

```text
OWNER GOAL
  -> CODEX LEAD AGENT
    -> Planner Agent
    -> Worker Agents
    -> Validation Agent
    -> Reviewer Agent
    -> Memory / scorecard / report updates
    -> next loop decision by Lead Agent
```

Agents own decisions. Scripts and harnesses produce evidence.

## Roles

- Lead Agent: manager and workflow owner.
- Planner Agent: breaks goals into safe, ordered tasks.
- Frontend Agent: UI and browser experience.
- Backend Agent: APIs, services, read/write models.
- Trading Engine Agent: orders, combos, risk, settlement, ledger-sensitive internal logic.
- Bot Engineer Agent: bot, reference sync, market making, supervisor, dry-run logic.
- Deployment Agent: runbooks, smoke, rollback, deployment evidence.
- Testing/Harness Agent: tests and harness evidence.
- Security/Safety Agent: secrets, auth, allowlists, kill switches, forbidden areas.
- Validation Agent: chooses and interprets validation.
- Reviewer Agent: final diff and safety audit.
- Failure Analyzer Agent: root-cause analysis without recursive task churn.

## Folder Structure

- `agent-orchestrator/prompts/LEAD_AGENT_OPERATING_PROMPT.md`: main Lead Agent brain.
- `agent-orchestrator/prompts/subagents/`: subagent operating prompts.
- `agent-orchestrator/specs/HARNESS_OUTPUT_CONVENTION.md`: structured harness evidence format.
- `agent-orchestrator/specs/TASK_RESULT_CONVENTION.md`: task cycle report format.
- `agent-orchestrator/goals/GOAL_INTAKE_TEMPLATE.md`: owner goal intake template.
- `agent-orchestrator/runs/`: timestamped run reports.
- `agent-orchestrator/bin/`: legacy helper scripts.
- `agent-orchestrator/scripts/start_lead_agent.sh`: Lead Agent launcher helper.

## Starting The Lead Agent

Preferred start is a Codex Lead Agent session using the main prompt.

PowerShell:

```powershell
codex exec --full-auto (Get-Content agent-orchestrator/prompts/LEAD_AGENT_OPERATING_PROMPT.md -Raw)
```

Git Bash:

```bash
codex exec --full-auto "$(cat agent-orchestrator/prompts/LEAD_AGENT_OPERATING_PROMPT.md)"
```

Helper launcher:

```bash
bash agent-orchestrator/scripts/start_lead_agent.sh
```

The launcher creates a timestamped run folder and starts Codex. It does not choose tasks, validate, review, or decide next steps.

## Giving A New Goal

Create a goal file from:

```text
agent-orchestrator/goals/GOAL_INTAKE_TEMPLATE.md
```

The Lead Agent reads the goal, specs, reports, scorecards, memory, and current git state. It then plans and assigns work.

## Reports, Memory, And Scorecards

Every meaningful task cycle should produce a report using:

```text
agent-orchestrator/specs/TASK_RESULT_CONVENTION.md
```

Reports should include:

- task id;
- goal reference;
- assigned subagent;
- files changed;
- commands run;
- validation evidence;
- reviewer decision;
- scorecard impact;
- memory updates;
- follow-up tasks;
- final state.

## Validation Flow

Validation Agent owns validation decisions.

Harnesses, tests, Playwright, API smoke checks, log inspection, and build commands are tools. Their output is evidence. The Validation Agent decides whether that evidence proves pass, fail, warning, or block.

Validation failures go back to the Lead Agent. The Lead Agent may assign Failure Analyzer Agent and then one scoped fix to the correct worker.

## Old Loop Scripts

The old scripts are helpers only:

- `agent-orchestrator/bin/orchestrator-loop.sh`
- `agent-orchestrator/bin/orchestrator-once.sh`
- `agent-orchestrator/bin/orchestrator-status.sh`

Use them for legacy issue polling, status, or evidence collection only. They are no longer the recommended primary orchestrator and should not be treated as the product manager, validator, reviewer, or architect.

## When To Use Old Scripts

Use old scripts only when the Lead Agent explicitly requests:

- a status snapshot;
- a legacy issue poll;
- a helper loop for a constrained batch;
- evidence collection.

Do not use old scripts to decide product priority or final task state.

## Stop Rules

The Lead Agent stops when:

- target score or acceptance criteria is reached;
- no useful safe work remains;
- work is blocked by forbidden category;
- an external dependency or secret is missing;
- the owner asks to pause.

The system does not stop merely because one task completed.
