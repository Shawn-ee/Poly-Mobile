# Live Market Beta Go/No-Go

Date: 2026-06-24

## Decision

```text
GO for Limited Internal Market Drill
NO-GO for Full Internal Live Market Beta
NO-GO for Public Beta
```

## Can Deploy Current Dev To Owner Server?

Yes, for owner-controlled internal drill preparation.

Required first deployment mode:

```text
INTERNAL_TRADING_BETA_ENABLED=false
TRADING_KILL_SWITCH=true
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=false
INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
```

## Can Enable Internal Trading?

Only for a short allowlisted drill.

Required drill mode:

```text
INTERNAL_TRADING_BETA_ENABLED=true
TRADING_KILL_SWITCH=false
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=true
```

Required:

- exact `INTERNAL_TRADING_ALLOWLIST_EMAILS`
- small test order size
- admin-created markets
- portfolio verification
- settlement preview
- immediate return to safe defaults

## Can Enable Funding?

Not for live-market beta by default.

Funding remains governed by the controlled internal funding beta stages. Keep first deployment funding disabled and kill-switched.

## Can Enable Auto-Credit?

No, not by default.

Only use auto-credit during the separate funding Stage 2 tiny-deposit drill.

## Can Enable Withdrawals?

Withdrawal requests and admin manual review can be tested only under the existing controlled funding workflow.

Automatic withdrawal broadcast remains no-go.

## Can Resolve/Settle Markets?

Settlement preview is go.

Routine final settlement is no-go until a controlled drill and operator approval are documented.

## Exact Next Action

Deploy current `dev` only with safe defaults, apply migrations, run post-deploy smoke, then run the limited internal drill from `docs/reviews/LIVE_MARKET_BETA_OPERATOR_RUNBOOK.md`.

Do not launch public beta.
