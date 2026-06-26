# World Cup V2 UI + Order Ticket Smoke Evidence

Date: 2026-06-26

Goal: `agent-orchestrator/goals/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_GOAL.md`

## Selected Task

```text
grouped World Cup UI + order ticket browser/API smoke
```

## Subagent Roles

- Lead Agent: selected the browser/API smoke phase after market-making guardrails.
- Frontend Agent: added a focused Playwright smoke for World Cup event and ticket behavior.
- Testing/Harness Agent: used Playwright as the objective browser evidence tool.
- Validation Agent: seeded local data, ran browser smoke, TypeScript, and targeted checks.
- Reviewer Agent: audited the change as test/evidence only with no runtime behavior change.

## Files Changed

- `tests/e2e/world-cup-ui-ticket-smoke.spec.ts`
- `docs/reviews/WORLD_CUP_V2_UI_ORDER_TICKET_SMOKE_EVIDENCE.md`
- `agent-orchestrator/scorecards/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_SCORECARD.md`

## Smoke Coverage

The new Playwright smoke verifies:

1. `/sports/soccer/world-cup` loads;
2. at least one seeded World Cup event is available;
3. opening an event renders `Event markets`;
4. the event page renders `Trade ticket`;
5. the event page renders `Combo slip`;
6. selecting an outcome opens ticket estimate fields;
7. estimated cost and potential payout are visible;
8. changing amount to `25` recalculates visible cost to `$25.00`;
9. event-page submit stays disabled/gated;
10. line-selector buttons are exercised when seeded multi-line data exists;
11. combo controls are exercised when at least two combo-eligible outcomes exist;
12. a screenshot is captured in Playwright `test-results`.

## Commands Run

Local Docker:

```text
docker ps --filter "name=poly_postgres"
```

Local app validation:

```text
npx tsc --noEmit --pretty false --incremental false
npx playwright --version
```

Local database setup:

```text
npx prisma migrate deploy --schema=prisma/schema.prisma
npm run seed:dev
```

Local server:

```text
npm run dev -- -p 3000
```

Browser smoke:

```text
npx playwright test tests/e2e/world-cup-ui-ticket-smoke.spec.ts --project=smoke --reporter=list
```

## Validation Evidence

Result:

```text
1 passed
```

The first run reached the event page and selected an outcome, but failed on a strict locator because both the single ticket and combo ticket include `Estimated cost`. The test was narrowed to the first visible ticket instance and rerun successfully.

Local server cleanup:

```text
port 3000 not listening
```

## Safety Review

This cycle did not:

- enable public trading;
- enable live bots;
- place orders;
- mutate order/ledger/funding/wallet behavior;
- enable public funding;
- expose secrets.

Local seed and migration commands were run against local Docker Postgres only.

## Reviewer Decision

Decision: `done`.

Reason:

- browser smoke passes;
- change is test/evidence only;
- event-page order and combo submission remain gated/disabled unless existing internal beta flags and server gates allow them;
- no runtime product behavior changed.

## Scorecard Impact

World Cup event/match grouping:

```text
9/10 -> 10/10
```

Unified order ticket:

```text
7/10 -> 9/10
```

Harness/tooling availability:

```text
5/10 -> 6/10
```

Overall score:

```text
81/100 -> 83/100
```

## Next Action

Proceed to:

```text
internal test trade smoke
```
