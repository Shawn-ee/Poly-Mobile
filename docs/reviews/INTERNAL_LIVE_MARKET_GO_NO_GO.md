# Internal Live Market Go/No-Go

Date: 2026-06-24

## Decision

```text
Limited Internal Market Beta Only
Ready with Warnings for controlled operator drills
Not Ready for full internal live market beta
Public Beta Not Ready
```

## Can Run A Controlled Internal Drill?

Yes, with strict limits.

Allowed:

- allowlisted internal users only
- explicit server trading beta enablement
- trading kill switch off only for the drill window
- small test markets
- admin-created sports events/markets
- settlement preview

Not allowed:

- public trading
- anonymous trading
- public funding
- anonymous funding
- live bots
- unauthorized sports provider sync
- automatic settlement
- auto-withdrawal

## Can Launch Full Internal Live Market Beta?

No.

Blockers:

- no deployed event -> order -> portfolio -> preview -> final settlement drill evidence
- no sports void/push/refund settlement path
- no approved live sports provider integration
- final settlement mutates ledger/balances/positions and needs an operator runbook plus controlled drill

## Can Launch Public Beta?

No.

Public beta remains blocked by:

- trading/funding safety gates
- settlement evidence gaps
- provider gaps
- no public compliance/regulatory readiness claim

## Exact Next Action

Proceed to Phase M: update server deployment docs for live market beta gates, migrations, emergency disable, and post-deploy internal drill steps.

Keep internal trading disabled by default:

```text
INTERNAL_TRADING_BETA_ENABLED=false
TRADING_KILL_SWITCH=true
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=false
```

Enable only during an owner-approved allowlisted drill, then disable again.
