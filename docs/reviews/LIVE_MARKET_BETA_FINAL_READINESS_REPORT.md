# Live Market Beta Final Readiness Report

Date: 2026-06-24

## Executive Summary

POLY has advanced from controlled internal beta groundwork to a limited live sports market drill capability.

Current final classification:

```text
Limited Internal Market Beta Only
Ready with Warnings for controlled operator drills
Not Ready for full internal live market beta
Public Beta Not Ready
```

The project now supports:

- sports/event browsing
- grouped event markets and prop metadata
- event market search/filter
- market detail trade ticket
- guarded internal beta order placement, disabled by default
- balance, locked funds, open order, and position display
- admin event market management
- admin settlement preview
- live-market server deployment guidance

The project does not yet have:

- deployed end-to-end event -> order -> portfolio -> final settlement drill evidence
- sports void/push/refund settlement path
- approved live sports provider integration
- settlement-grade official result source
- public trading/funding readiness

## Deploy Now?

Yes, current `dev` can be deployed to an owner-controlled Windows/Linux server for a limited internal operator drill, with warnings.

Deploy only with safe defaults:

```text
INTERNAL_TRADING_BETA_ENABLED=false
TRADING_KILL_SWITCH=true
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=false
INTERNAL_FUNDING_BETA_ENABLED=false
FUNDING_KILL_SWITCH=true
ALLOW_AUTO_DEPOSIT_CREDIT=false
```

Do not deploy as public beta.

## Capability Status

| Area | Status | Notes |
| --- | --- | --- |
| Sports browsing | Implemented | Real public route behavior |
| Event detail market groups | Implemented | Main, Spread, Total, Player Props, Team Props, Period Props, Specials, Live |
| Prop model fields | Implemented | line/unit/period/participant/propCategory |
| Market detail ticket | Implemented | Disabled by default unless explicit internal flags |
| Internal order placement | Implemented and gated | Real path exists, off by default |
| Public trading | Not enabled | Must remain disabled |
| Portfolio balances/orders/positions | Implemented | Read-only display |
| Admin market management | Implemented | Admin-only |
| Settlement preview | Implemented | Admin-only/read-only |
| Final settlement | Existing high-risk mutating path | Needs operator drill/runbook before routine use |
| Void/push/refund | Not implemented | Sports prop blocker |
| Live sports provider sync | Not implemented | Manual/admin markets only |
| Funding | Controlled internal funding groundwork | Keep disabled until staged drill |
| Withdrawals | Manual request/review path | No auto-withdrawal |
| Live bots | Not approved | Keep disabled |

## What Is Safe For Internal Beta

Safe with allowlist/operator controls:

- route smoke on public pages
- manual/admin event and market creation
- grouped event market browsing
- display-only event-page outcome preview
- market detail ticket with trading disabled
- settlement preview
- portfolio read-only checks
- controlled internal order drill only after explicit gate enablement

## What Must Remain Disabled

- public trading
- anonymous trading
- public funding
- anonymous funding
- auto-credit until funding Stage 2 drill
- auto-withdrawal
- live bots
- unauthorized provider sync
- automatic market creation
- automatic market resolution
- automatic settlement

## Critical Blockers

- no deployed full live-market drill evidence
- no void/push/refund settlement path for sports markets
- no approved live sports provider integration
- no settlement-grade result source
- final settlement is ledger/balance/position mutating and requires controlled operator use

## Final Recommendation

Proceed with a limited owner-controlled internal drill only.

Do not claim full internal live market beta readiness until the drill is run and documented.

Do not launch public beta.
