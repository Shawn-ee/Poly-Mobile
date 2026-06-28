# Subagent Task Prompt

## Role

{{SUBAGENT_ROLE}}

## Issue

Number: {{ISSUE_NUMBER}}

Title: {{ISSUE_TITLE}}

Body:

{{ISSUE_BODY}}

## Branch

Create and work only on:

```text
{{BRANCH_NAME}}
```

Target PR branch:

```text
{{TARGET_BRANCH}}
```

## Required Docs

Read and follow:

- `docs/AGENT_OPERATING_SYSTEM.md`
- `docs/SUBAGENT_OPERATING_MODEL.md`
- `docs/SUBAGENT_ROLES.md`
- `docs/SUBAGENT_TASK_ROUTING.md`
- `docs/HIGH_RISK_AREAS.md`
- `docs/LEDGER_AND_WALLET_RULES.md`

## Allowed Files

{{ALLOWED_FILES}}

## Forbidden Files

{{FORBIDDEN_FILES}}

## Risk

Risk level: {{RISK_LEVEL}}

Human review required: {{HUMAN_REVIEW_REQUIRED}}

## Validation Commands

{{VALIDATION_COMMANDS}}

## Safety Rules

- Do not deploy.
- Do not merge.
- Do not push to `main`.
- Do not auto-merge.
- Do not expose secrets.
- Do not modify production secrets.
- Do not expand scope beyond this issue.
- Stop if the task touches high-risk areas not explicitly allowed.

## Required Output

Open one PR into `{{TARGET_BRANCH}}` and include a report using `agent-orchestrator/templates/subagent-report-template.md`.

## Architecture Boundary

The Codex Lead Agent owns planning, validation interpretation, review routing, memory updates, and next-step decisions. Scripts and harnesses are helper tools only. Do not create recursive `FIX-*` or `FIX-FIX-*` tasks. If validation fails, report the concrete root cause and hand back to the Lead Agent.
