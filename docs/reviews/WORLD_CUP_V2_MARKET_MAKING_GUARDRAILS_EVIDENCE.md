# World Cup V2 Market-Making Guardrails Evidence

Date: 2026-06-26

Goal: `agent-orchestrator/goals/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_GOAL.md`

## Selected Task

```text
world-cup-market-making-guardrails
```

## Subagent Roles

- Lead Agent: selected the task and kept the loop goal-scoped.
- Bot Engineer Agent: added a focused World Cup market-making guardrail test in `poly-bot`.
- Security/Safety Agent: verified no live bots, real orders, secrets, or real-fund paths were enabled.
- Validation Agent: selected and interpreted bot guardrail, safety, reference liquidity, production risk, and typecheck commands.
- Reviewer Agent: audited scope and allowed merge because the bot PR was test/script only.

## Bot PR

Repository:

```text
Shawn-ee/Poly-bots
```

PR:

```text
https://github.com/Shawn-ee/Poly-bots/pull/2
```

Merged bot commit:

```text
5b2a4c0 Merge pull request #2 from Shawn-ee/agent/world-cup-v2-market-making-guardrails
```

## Files Changed In Bot Repo

- `package.json`
- `scripts/testWorldCupMarketMakingGuardrails.ts`

## Guardrails Tested

The new bot test verifies:

1. default bot policy blocks live placement;
2. default mode is dry-run;
3. bots are disabled by default;
4. live trading is disabled by default;
5. global kill switch is enabled by default;
6. `SYSTEM_LIQUIDITY_DRY_RUN=true` blocks placement even when live flags are otherwise set;
7. World Cup market readiness blocks when per-market exposure cap is reached;
8. World Cup market readiness blocks when open-order cap is reached;
9. desired quote generation keeps prices two ticks worse than the reference book;
10. desired quotes do not cross the local order book;
11. single-order notional cap limits quote size.

## Commands Run

Bot repo:

```text
npx tsx scripts/testWorldCupMarketMakingGuardrails.ts
npm run test:world-cup-market-making-guardrails
npm run bots:safety
npm run test:reference-liquidity
npm run test:production-risk-controls
npm run typecheck
git diff --check
```

Main app repo:

```text
git diff --check
```

## Validation Evidence

Bot validation result:

- World Cup market-making guardrail checks passed.
- Bot safety passed.
- Reference liquidity tests passed.
- Production risk-control checks passed.
- Bot typecheck passed.
- Bot diff check passed.

GitHub status:

- Bot PR was mergeable.
- Bot repo had no GitHub check configured for this PR.
- Local validation passed before merge.

## Safety Review

This cycle did not:

- enable live bots;
- start bot services;
- place real orders;
- enable public trading;
- enable real public funding;
- touch wallet custody or private-key behavior;
- move external funds;
- change app runtime behavior.

The bot test uses deterministic fixtures for an Ecuador vs Germany World Cup spread market. No external sportsbook API or scraper was used.

## Reviewer Decision

Decision: `done`.

Reason:

- the test is focused on World Cup market-making guardrails;
- validation passed;
- the bot PR is test/script only;
- no runtime bot behavior changed;
- blocked areas remain blocked.

## Scorecard Impact

Safe market-making bots:

```text
7/10 -> 9/10
```

Overall score:

```text
79/100 -> 81/100
```

## Next Action

Proceed to:

```text
grouped World Cup UI + order ticket browser/API smoke
```
