# World Cup Tradable Internal Beta V2 Goal Planning Report

## Goal File Created

Created:

```text
agent-orchestrator/goals/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_GOAL.md
```

The goal is formatted from `agent-orchestrator/goals/GOAL_INTAKE_TEMPLATE.md` and is intended for the prompt-driven Lead Agent system.

## Current Scorecard Status

Current status based on existing evidence docs and current merged work:

- World Cup grouped event/match structure: partially implemented.
- Related contracts under one match: implemented for current World Cup-style read model, still needs refreshed audit before next work.
- Unified order ticket: implemented enough for internal flow, needs current smoke.
- Combo quote/server calculation: implemented.
- Combo settlement/admin resolve/void/push: implemented for internal/test admin path.
- Portfolio combo visibility: implemented for open/settled/voided combos.
- Reference sync dry-run: needs fresh verification.
- Two-tick-worse pricing: needs tests/evidence.
- Market-making bot guardrails: needs inventory and dry-run verification.
- Combo validation/risk model: basic validation exists; sportsbook-grade risk model not complete.
- Early cash-out estimate: not complete or not freshly evidenced.
- Public beta: not ready.
- Controlled internal beta candidate target: not yet scored at 85/100 until the new Lead Agent performs fresh audit and scorecard update.

Provisional classification:

```text
Below 85/100 until fresh audit, bot/reference/pricing/cash-out evidence, and risk model planning are completed.
```

## First Task Batch

Recommended first task batch for Lead Agent planning:

1. `world-cup-current-state-audit`
   - Assigned agents: Planner Agent, Reviewer Agent.
   - Output: current scorecard and blocker list.

2. `bot-inventory-verification`
   - Assigned agents: Bot Engineer Agent, Security/Safety Agent, Validation Agent.
   - Goal: verify bot state, inventory cleanup needs, dry-run/live boundary.

3. `reference-sync-dry-run-evidence`
   - Assigned agents: Bot Engineer Agent, Backend Agent, Validation Agent.
   - Goal: prove provider/reference sync can run safely without secrets or scraping, or document blocker.

4. `two-tick-worse-pricing-tests`
   - Assigned agents: Trading Engine Agent, Testing/Harness Agent, Validation Agent.
   - Goal: deterministic pricing tests and evidence.

5. `market-making-bot-guardrails`
   - Assigned agents: Bot Engineer Agent, Security/Safety Agent, Validation Agent.
   - Goal: dry-run guardrails, kill switches, inventory caps, no live trading.

6. `world-cup-grouped-event-ui-smoke`
   - Assigned agents: Frontend Agent, Validation Agent.
   - Goal: browser/API smoke for current grouped UI and order ticket recalculation.

7. `internal-test-trade-smoke`
   - Assigned agents: Trading Engine Agent, Backend Agent, Validation Agent, Security/Safety Agent.
   - Goal: internal/test trade path evidence without public trading.

8. `combo-validation-risk-model-v1-plan`
   - Assigned agents: Trading Engine Agent, Planner Agent, Security/Safety Agent.
   - Goal: define sportsbook-grade risk engine v1 before implementation.

9. `cash-out-estimate-model-plan`
   - Assigned agents: Trading Engine Agent, Backend Agent, Validation Agent.
   - Goal: define early cash-out estimate model and evidence path.

## Recommended First Lead Agent Run

Start the Lead Agent with:

PowerShell:

```powershell
codex exec --full-auto (Get-Content agent-orchestrator/prompts/LEAD_AGENT_OPERATING_PROMPT.md -Raw)
```

Git Bash:

```bash
codex exec --full-auto "$(cat agent-orchestrator/prompts/LEAD_AGENT_OPERATING_PROMPT.md)"
```

Initial Lead Agent instruction:

```text
Read agent-orchestrator/goals/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_GOAL.md.
Read the recommended evidence docs in that goal file.
Do not implement product features yet.
Produce a current scorecard and fresh task batch for reaching 85/100 controlled internal beta candidate.
Scripts and harnesses are helper tools only.
```

## Harnesses To Use First

The Lead Agent should first verify which harnesses exist in its checkout. Known useful harness categories from prior work:

- bot inventory check;
- bot safety check;
- reference sync check;
- two-tick pricing check;
- market-making bot check;
- World Cup market structure check;
- World Cup order ticket check;
- internal beta trading check;
- combo check;
- cash-out check;
- route security check;
- deployment check only if deployment docs/scripts are touched.

If a harness is absent in the clean checkout, Validation Agent should classify that as missing evidence/tooling and assign Testing/Harness Agent rather than treating the harness name as final truth.

## Blocked Areas

Still blocked:

- real wallet custody;
- private keys;
- real public deposits;
- real withdrawals;
- real-money ledger movement;
- destructive migrations;
- actually enabling production live bots with real funds;
- any code path that moves real external funds.

## Notes

No product implementation was started in this step.

The full loop was not started.
