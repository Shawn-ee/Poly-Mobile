# World Cup V2 Internal Test Trade Smoke Evidence

Date: 2026-06-26

Goal: `agent-orchestrator/goals/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_GOAL.md`

## Selected Task

```text
internal test trade smoke
```

## Subagent Roles

- Lead Agent: selected the internal test trade smoke after browser evidence reached 83/100.
- Trading Engine Agent: added focused route-level smoke over the World Cup combo order flow.
- Ledger Agent: verified the existing service test still proves ledger lock behavior.
- Validation Agent: ran targeted route, service, and portfolio tests.
- Reviewer Agent: audited the change as tests/evidence only with no trading enablement.

## Files Changed

- `src/__tests__/combo-orders.route.test.ts`
- `docs/reviews/WORLD_CUP_V2_INTERNAL_TEST_TRADE_SMOKE_EVIDENCE.md`
- `agent-orchestrator/scorecards/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_SCORECARD.md`

## Smoke Coverage

The new route-level smoke verifies:

1. World Cup combo quote can be calculated through `POST /api/combo-orders/quote`;
2. quote does not open the trading write gate;
3. quote does not submit a combo order;
4. disabled internal trading blocks `POST /api/combo-orders` before mutation;
5. allowlisted/internal trading acceptance reaches the submit service;
6. idempotency key is passed to the submit service;
7. the returned combo order is open.

Existing targeted tests run with this smoke verify:

- combo submit creates server-priced legs;
- combo submit creates a `LOCK` ledger entry;
- combo submit reserves user balance;
- insufficient balance blocks before combo or ledger mutation;
- client-supplied leg prices are ignored;
- idempotent retries do not duplicate combo orders;
- portfolio returns sanitized combo orders for the current user only.

## Commands Run

```text
npx jest --runInBand src/__tests__/combo-orders.route.test.ts src/__tests__/combo-orders.service.test.ts src/__tests__/portfolio.open-orders.route.test.ts
```

## Validation Evidence

Result:

```text
3 suites passed
17 tests passed
```

## Safety Review

This cycle did not:

- enable public trading;
- enable anonymous trading;
- enable live bots;
- place real external orders;
- move external funds;
- alter ledger math;
- alter order runtime behavior.

The new smoke uses mocked route/service boundaries and does not mutate a real account.

## Reviewer Decision

Decision: `done`.

Reason:

- the smoke proves the internal test trade boundary;
- quote remains read-only;
- order placement remains server-gated;
- ledger lock behavior is covered by existing service test;
- portfolio display is covered by existing sanitized route test.

## Scorecard Impact

Internal/test trading flow:

```text
7/10 -> 9/10
```

Position tracking, mark value, P/L:

```text
6/10 -> 7/10
```

Overall score:

```text
83/100 -> 85/100
```

## Next Action

Target reached:

```text
85/100 = controlled internal beta candidate
```

Recommended next optional phase:

```text
combo validation risk model v1
```
