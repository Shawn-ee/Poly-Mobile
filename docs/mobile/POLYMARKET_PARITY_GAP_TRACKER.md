# Polymarket Parity Gap Tracker

Purpose: track every Polymarket parity gap discovered by the new mandatory audit workflow.

Rule: a feature cannot be marked complete while it has unresolved P0 gaps. P1/P2 gaps may remain only when explicit and tracked.

## Status Values

- Open: not implemented or not proven.
- In progress: implementation underway.
- Audit failed: implementation exists but Audit Gate failed it.
- Verified: Audit Gate passed with evidence.
- Deferred: accepted P1/P2 gap for later.

## Current Gate Summary

| Feature | P0 open | P1 open | P2 open | Latest status | Evidence |
| --- | ---: | ---: | ---: | --- | --- |
| Game page | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/game-page.md` |
| Trade ticket | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/trade-ticket.md` |
| Line adjustment | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/line-adjustment.md` |
| Portfolio | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/portfolio.md` |
| Search | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/search.md` |
| Account/settings | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/account.md` |
| Chart behavior | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/chart-behavior.md` |
| Market page | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/market-page.md` |
| Navigation | TBD after new-rule audit | TBD | TBD | Needs same-cycle audit | `docs/mobile/audits/navigation.md` |

## Gap Table

| Gap ID | Feature | Priority | Status | Polymarket behavior | Holiwyn behavior | Recommended fix | Evidence | Cycle introduced | Cycle resolved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PM-GAP-000 | Workflow | P0 | Verified | Features require same-cycle reference audit before completion. | Loop docs now require reference audit, criteria, device proof, and Audit Gate pass. | Use this tracker for all future parity cycles. | `docs/mobile/MOBILE_APP_AUTONOMOUS_DEVELOPMENT_LOOP.md`; `docs/mobile/MOBILE_HARNESS_SPEC.md` | Cycle S | Cycle S |

## Audit Questions For Every Gap

For every UI element or interaction, answer:

1. What does Polymarket show?
2. What happens when the user taps, swipes, or changes it?
3. What state changes?
4. What data changes?
5. What does the ticket, portfolio, or history show afterward?
6. Does Holiwyn match?
7. If not, what exactly is missing?
8. Is the gap P0, P1, or P2?
9. What implementation change is recommended?
