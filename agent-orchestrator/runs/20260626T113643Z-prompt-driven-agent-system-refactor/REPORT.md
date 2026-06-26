# Prompt-Driven Agent System Refactor Report

## 1. What Architecture Was Changed

The autonomous engineering system was refactored in documentation, prompts, conventions, and helper launch flow from script-driven orchestration to prompt-driven Lead Agent orchestration.

Old model:

- bash loop scripts act as manager;
- scripts claim/process work;
- harnesses sometimes act as validator brain;
- recursive `FIX` / `FIX-FIX` tasks can be generated;
- Codex workers are treated as executors.

New model:

- Codex Lead Agent owns workflow decisions;
- subagents do scoped specialist work;
- Validation Agent owns validation choices and interpretation;
- Reviewer Agent owns final audit;
- scripts and harnesses produce evidence only.

## 2. Files Created

- `agent-orchestrator/prompts/LEAD_AGENT_OPERATING_PROMPT.md`
- `agent-orchestrator/prompts/subagents/PLANNER_AGENT.md`
- `agent-orchestrator/prompts/subagents/FRONTEND_AGENT.md`
- `agent-orchestrator/prompts/subagents/BACKEND_AGENT.md`
- `agent-orchestrator/prompts/subagents/TRADING_ENGINE_AGENT.md`
- `agent-orchestrator/prompts/subagents/BOT_ENGINEER_AGENT.md`
- `agent-orchestrator/prompts/subagents/DEPLOYMENT_AGENT.md`
- `agent-orchestrator/prompts/subagents/TESTING_HARNESS_AGENT.md`
- `agent-orchestrator/prompts/subagents/SECURITY_SAFETY_AGENT.md`
- `agent-orchestrator/prompts/subagents/VALIDATION_AGENT.md`
- `agent-orchestrator/prompts/subagents/REVIEWER_AGENT.md`
- `agent-orchestrator/prompts/subagents/FAILURE_ANALYZER_AGENT.md`
- `agent-orchestrator/README_LOOP_ENGINEERING.md`
- `agent-orchestrator/specs/HARNESS_OUTPUT_CONVENTION.md`
- `agent-orchestrator/specs/TASK_RESULT_CONVENTION.md`
- `agent-orchestrator/goals/GOAL_INTAKE_TEMPLATE.md`
- `agent-orchestrator/scripts/start_lead_agent.sh`
- `agent-orchestrator/runs/20260626T113643Z-prompt-driven-agent-system-refactor/REPORT.md`

## 3. Files Updated

- `agent-orchestrator/bin/orchestrator-loop.sh`
- `agent-orchestrator/bin/orchestrator-once.sh`
- `agent-orchestrator/bin/orchestrator-status.sh`
- `agent-orchestrator/templates/subagent-task-prompt.md`

## 4. New Lead Agent Workflow

The Lead Agent:

1. reads owner goal, specs, reports, memory, scorecards, and git state;
2. chooses the next highest-value safe task;
3. assigns scoped work to the correct subagent;
4. routes validation to Validation Agent;
5. routes final audit to Reviewer Agent;
6. updates reports, memory, and scorecards;
7. decides `done`, `fix`, `retry`, `blocked`, or `continue`;
8. continues until the target score is reached or no useful safe work remains.

## 5. New Subagent Workflow

Subagent prompts define:

- purpose;
- responsibilities;
- allowed scope;
- forbidden scope;
- inputs to read;
- required outputs;
- evidence required;
- tools/harnesses allowed;
- done criteria;
- hand-back rules.

Worker agents do scoped implementation. They do not decide final validation or final audit.

## 6. How Validation Agent Works

Validation Agent decides:

- what needs validation;
- which tests/harnesses/browser/API/log checks to run;
- whether evidence proves pass/fail/warn/block;
- which subagent owns a failure;
- whether retry is justified;
- whether the task should be marked failed or blocked.

Harness output is evidence, not the final decision.

## 7. How Harnesses Are Used Now

Harnesses are evidence-producing tools. New convention:

- `HARNESS_NAME`
- `TASK_ID`
- `STATUS`
- `FAILURE_CATEGORY`
- `SHORT_REASON`
- `LOG_PATH`
- `RECOMMENDED_SUBAGENT`
- `NEXT_VALIDATION_COMMAND`

Harnesses must not choose product priority, create recursive tasks, act as final reviewer, or weaken validation.

## 8. How Scripts Are Downgraded To Helper Tools

Legacy scripts now include comments stating they are helpers:

- `orchestrator-loop.sh`: legacy helper loop only.
- `orchestrator-once.sh`: helper single cycle only.
- `orchestrator-status.sh`: helper status snapshot only.

The README also explains that old loop scripts are not the recommended primary control plane.

## 9. How To Start The Lead Agent

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

The launcher only starts the Lead Agent and captures logs. It does not pick tasks or validate them.

## 10. How To Give A New Owner Goal

Use:

```text
agent-orchestrator/goals/GOAL_INTAKE_TEMPLATE.md
```

The template asks for:

- north-star goal;
- product/backend/bot/UI scope;
- validation requirements;
- acceptance criteria;
- scorecard target;
- blocked and allowed areas;
- priority order;
- done condition.

## 11. What Was Not Changed

No product feature work was done.

Not changed:

- trading behavior;
- combo settlement behavior;
- funding;
- withdrawal;
- wallet/private-key behavior;
- live bots;
- deployment behavior;
- GitHub workflow files;
- runtime application code.

## 12. Risks

- The clean `dev` branch contains the GitHub-issue orchestrator and legacy helper scripts. It does not contain the newer dirty file-queue scripts observed in the separate main checkout.
- Equivalent prompt-driven constraints should be applied to those file-queue scripts after they are deliberately landed, parked, or cleaned up.
- The launcher assumes `codex` is available on PATH.

## 13. Validation

Lightweight validation only, as requested:

- Prompt file inventory: passed.
- Required file existence check: passed.
- `bash -n agent-orchestrator/scripts/start_lead_agent.sh`: passed.
- `bash -n agent-orchestrator/bin/orchestrator-loop.sh`: passed.
- `bash -n agent-orchestrator/bin/orchestrator-once.sh`: passed.
- `bash -n agent-orchestrator/bin/orchestrator-status.sh`: passed.
- `git diff --check`: passed.

The full product loop was not started.

## 14. Next Recommended Step

Do not restart the old loop.

Next, create a goal file from `GOAL_INTAKE_TEMPLATE.md` for the sportsbook-grade combo risk engine, then start the Lead Agent with `LEAD_AGENT_OPERATING_PROMPT.md`. The Lead Agent should plan and assign the risk-engine work through Planner, Trading Engine, Validation, Security, and Reviewer agents.
