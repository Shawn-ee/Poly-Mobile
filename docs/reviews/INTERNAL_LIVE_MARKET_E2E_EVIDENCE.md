# Internal Live Market E2E Evidence

Date: 2026-06-24

## Summary

POLY now has enough merged runtime pieces for a limited, operator-controlled internal live market drill, but it is not ready for a full internal live market beta and is not ready for public beta.

Current classification:

```text
Limited Internal Market Beta Only
Ready with Warnings for controlled operator drills
Public Beta Not Ready
```

The current path can be tested only with explicit gates and allowlists:

1. Browse sports/events.
2. Open sports event detail with grouped markets and props.
3. Search/filter event markets.
4. Open market detail.
5. Use guarded market detail trade ticket.
6. Place internal beta orders only if server/client trading gates are explicitly enabled.
7. View balances, locked funds, open orders, and positions in portfolio.
8. Admin creates/edits event markets and outcomes.
9. Admin previews settlement.

What is still not proven end to end:

- deployed event -> order -> portfolio -> admin preview -> final resolve -> settlement drill
- sports void/push/refund settlement path
- provider-approved live sports data sync
- settlement-grade official results feed
- public trading/funding readiness

## Evidence Sources

- `docs/reviews/LIVE_EVENT_MARKET_GROUPS_UI_EVIDENCE.md`
- `docs/reviews/LIVE_MARKET_TRADE_TICKET_V1_EVIDENCE.md`
- `docs/reviews/INTERNAL_BETA_ORDER_PLACEMENT_EVIDENCE.md`
- `docs/reviews/PORTFOLIO_OPEN_ORDERS_POSITIONS_EVIDENCE.md`
- `docs/reviews/ADMIN_EVENT_MARKET_MANAGEMENT_EVIDENCE.md`
- `docs/reviews/MARKET_RESOLUTION_SETTLEMENT_EVIDENCE.md`
- `docs/reviews/LIVE_SPORTS_PROVIDER_READINESS.md`
- `docs/reviews/LIVE_SPORTS_UX_POLISH_EVIDENCE.md`

## Capability Matrix

| Capability | Current state | Evidence |
| --- | --- | --- |
| Sports browsing | Implemented | Public sports/event routes and route tests |
| Grouped event markets | Implemented | Phase C/D schema and UI evidence |
| Prop-style market metadata | Implemented | group/type/line/unit/period/participant fields |
| Event market search/filter | Implemented | Phase K UI polish |
| Market detail ticket | Implemented, disabled by default | Phase E |
| Internal order placement | Implemented, gated/off by default | Phase F |
| Public trading | Not enabled | Trading flags and allowlist guard |
| Locked funds display | Implemented | Phase G portfolio evidence |
| Open orders display | Implemented | Phase G portfolio evidence |
| Positions display | Implemented from existing positions | Phase G |
| Admin market creation/edit | Implemented | Phase H |
| Admin market pause/close | Implemented through existing status routes | Phase H |
| Settlement preview | Implemented, admin-only/read-only | Phase I |
| Final settlement | Existing high-risk mutating path, not expanded in roadmap | Phase I documents risk |
| Void/push/refund settlement | Not implemented | Phase I blocker |
| Live sports provider sync | Not implemented | Phase J |
| Live bots | Not approved | Safety docs |
| Funding | Controlled internal beta groundwork only | Existing funding reports |
| Withdrawals | Manual request/admin review path exists; no auto-withdrawal | Existing withdrawal/funding reports |

## Actually Run

The following local validations were run during Phases C through K:

- Prisma validate/generate for schema and code phases.
- Targeted Jest tests for grouped schema, grouped UI, trade ticket gating, trading gates, portfolio, admin market management, settlement preview, and UX polish.
- `npx tsc --noEmit --pretty false --incremental false`.
- `npm run test:ci`.
- `npm run build`.
- GitHub Validate on PRs #234 through #242.

## Not Run

The following have not been proven as a single deployed drill:

- allowlisted user places order on owner-controlled server
- order appears in portfolio on server after placement
- admin previews settlement on the same server data
- admin performs final resolve/settlement on server
- balances/positions are reconciled after final settlement
- void/push/refund settlement
- provider outage/stale-data drill
- real funding deposit -> trade -> withdrawal-request path as one live-market drill

## Required Internal Drill

Before claiming broader internal live market beta readiness, run this on an owner-controlled non-public beta server:

1. Keep public trading disabled.
2. Configure only allowlisted internal users.
3. Create one test sports event.
4. Create markets for moneyline, spread, total, and one player prop.
5. Confirm event detail groups and search show all markets.
6. Enable internal trading beta for the allowlisted drill only.
7. Confirm non-allowlisted user is blocked.
8. Place one small BUY order through `POST /api/orders` via market detail ticket.
9. Confirm locked balance and open order display.
10. If matched, confirm position display.
11. Admin runs settlement preview and saves output.
12. Do not run final settlement until the operator accepts the known risk and rollback plan.
13. Disable internal trading immediately after the drill.

## Current Blockers

- No deployed end-to-end live-market drill evidence.
- No sports void/push/refund settlement implementation.
- Final settlement remains ledger/balance/position mutating behavior and needs a focused runbook and drill before routine use.
- No provider-approved live sports data integration.
- No settlement-grade official result source.
- Public trading and public funding must remain disabled.
- Live bots remain unapproved.

## Recommendation

Use the current product only for limited allowlisted internal operator drills.

Do not call it ready for full internal live market beta until:

- the required drill above passes,
- final settlement use is documented and operator-approved,
- void/push/refund gaps are either implemented or explicitly excluded from supported market types,
- server deployment docs include live-market trading gates and emergency disable steps.

Do not launch public beta.
