# World Cup Tradable Internal Beta V2 Goal

## North-Star Goal

Build POLY into an internally tradable World Cup prediction-market platform.

Target state: controlled internal beta candidate where allowlisted internal users can browse World Cup matches, view related contracts under one match, build and submit internal/test trades and combos, track positions and P/L, and validate the system through agent-driven review and harness evidence.

Use Robinhood and Polymarket only as behavioral/product references. Do not copy proprietary UI, branding, assets, exact text, colors, trade dress, or private implementation.

## Product Scope

The system should support:

- World Cup event/match grouping.
- Related contracts under one match.
- Unified order ticket.
- Compact game-market display.
- Internal/test trading flow.
- Position tracking.
- Mark value and P/L.
- Combo validation and risk model.
- Early cash-out estimate.
- Settlement readiness.
- Agent-driven validation and review.

## Backend Scope

In scope:

- World Cup event/market read models.
- Order ticket recalculation.
- Internal/test order flow.
- Internal/test position mutation.
- Internal/test settlement mutation.
- Combo validation and risk model.
- Combo quote and submit revalidation.
- Early cash-out estimate model.
- Reference price sync.
- Two-tick-worse pricing.
- Admin/backend support needed for internal beta.
- Non-destructive migrations if justified by Planner, Validation, and Reviewer agents.

Out of scope unless explicitly re-authorized:

- Real wallet custody.
- Real public deposits.
- Real withdrawals.
- Real external fund movement.
- Destructive migrations.

## Bot Scope

In scope:

- Bot inventory verification.
- Bot inventory cleanup.
- Reference sync dry-run.
- Safe market-making bot logic.
- Market-making guardrails.
- Bot live-mode code paths only while production live trading with real funds remains disabled.
- Bot dry-run checks and evidence.

Out of scope:

- Actually enabling production live bots with real funds.
- Printing, requesting, inventing, or committing secrets.
- Unauthorized scraping.

## UI Scope

In scope:

- World Cup event list and match detail UX.
- Related contracts grouped under one match.
- Unified order ticket.
- Combo ticket UX.
- Position, mark value, P/L, and settled/voided combo history display.
- Internal beta disabled/enabled states.
- Admin UI/backend if needed for internal beta workflows.

Do not copy Robinhood or Polymarket proprietary UI, branding, assets, text, colors, or exact layouts.

## Validation Requirements

Validation is agent-driven.

Validation Agent should choose and interpret checks including:

- targeted unit/integration tests;
- `npm run test:ci`;
- TypeScript;
- Prisma validate/generate when backend/schema touched;
- build when UI/routes touched;
- Playwright or browser smoke when UI flows touched;
- API smoke checks for quote/order/portfolio/admin settlement paths;
- route security checks;
- bot dry-run checks;
- reference sync checks;
- pricing checks;
- market-making guardrail checks;
- log inspection;
- harness output using `agent-orchestrator/specs/HARNESS_OUTPUT_CONVENTION.md`.

Harness output is evidence only. Validation Agent decides pass/fail/warn/block.

## Acceptance Criteria

Controlled internal beta candidate requires evidence for:

- World Cup grouped event UI works.
- Related contracts under one match are usable.
- Unified order ticket recalculates from backend.
- Internal/test trade smoke works with safety gates.
- Positions and mark value/P&L are displayed truthfully.
- Reference sync dry-run works or is clearly blocked with provider requirements.
- Two-tick-worse pricing is tested.
- Market-making bots have dry-run guardrails and inventory cleanup evidence.
- Combo validation/risk model blocks unsafe combos and caps risk.
- Early cash-out estimate exists or is blocked with evidence.
- Settlement readiness is documented and tested for internal/test flows.
- Reviewer Agent accepts diff scope, validation evidence, and safety posture.

## Scorecard Target

Initial target:

```text
85/100 = controlled internal beta candidate
```

The Lead Agent should read existing scorecards/reports and update or create the current scorecard before implementation begins.

## Blocked Areas

Still blocked unless explicitly scoped as safe test mode:

- real wallet custody;
- private keys;
- real public deposits;
- real withdrawals;
- real-money ledger movement;
- destructive migrations;
- actually enabling production live bots with real funds;
- any code path that moves real external funds.

Never print, invent, request, or commit real secrets. Use placeholders only.

## Allowed Areas

Allowed without owner approval:

- World Cup UI/product structure;
- backend event/market/order logic;
- internal test trading;
- internal/test position mutation;
- internal/test settlement mutation;
- reference sync;
- price derivation;
- market-making bot logic;
- bot live-mode code paths as long as real production live trading is not enabled;
- admin UI/backend;
- OAuth/session code;
- production deployment scripts;
- non-destructive migrations;
- tests/harnesses/docs.

## Priority Order

First execution order:

1. Read existing World Cup specs and scorecard.
2. Audit current state.
3. Create fresh task batch.
4. Prioritize:
   - bot inventory verification;
   - reference sync dry-run;
   - two-tick pricing tests;
   - market-making bot guardrails;
   - World Cup grouped event UI;
   - order ticket recalculation;
   - internal test trade smoke;
   - combo validation model;
   - cash-out estimate model.
5. Do not start live production trading.
6. Do not touch real wallet/private-key/deposit/withdrawal behavior.
7. Write a report and stop after goal creation and task planning.

## What Counts As Done

For this immediate goal-intake step:

- goal file exists;
- current scorecard status is summarized from available evidence;
- first task batch is proposed;
- recommended first Lead Agent run is documented;
- initial harness/tool list is documented;
- blocked areas are explicit;
- no product implementation has started.

For the later full V2 execution:

- scorecard reaches at least 85/100;
- Reviewer Agent accepts validation and safety evidence;
- all blocked areas remain blocked unless separately approved;
- Lead Agent writes final readiness report.

## Notes

The Lead Agent should manage workflow. Scripts and harnesses are helper tools only.

Start from:

- `agent-orchestrator/prompts/LEAD_AGENT_OPERATING_PROMPT.md`
- `agent-orchestrator/README_LOOP_ENGINEERING.md`
- `agent-orchestrator/specs/HARNESS_OUTPUT_CONVENTION.md`
- `agent-orchestrator/specs/TASK_RESULT_CONVENTION.md`

Recommended evidence docs to read first:

- `docs/reviews/POLYMARKET_STYLE_WORLD_CUP_STRUCTURE_AUDIT.md`
- `docs/reviews/WORLD_CUP_EVENT_MARKET_STRUCTURE_EVIDENCE.md`
- `docs/reviews/WORLD_CUP_COMBO_TICKET_EVIDENCE.md`
- `docs/reviews/WORLD_CUP_REAL_COMBO_ORDER_EVIDENCE.md`
- `docs/reviews/COMBO_SETTLEMENT_RESOLUTION_EVIDENCE.md`
- `docs/reviews/LIVE_MARKET_BETA_CONTINUATION_PROMPT.md`
- `docs/reviews/LIVE_MARKET_BETA_FINAL_READINESS_REPORT.md`
- `docs/reviews/LIVE_MARKET_BETA_GO_NO_GO.md`
- `docs/reviews/LIVE_MARKET_BETA_BLOCKERS.md`
