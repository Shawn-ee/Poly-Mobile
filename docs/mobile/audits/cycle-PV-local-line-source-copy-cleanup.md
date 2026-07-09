# Cycle PV - Local Line Source Copy Cleanup

Scope:

- Local MVP source-label copy across Home/Live cards, Event Detail Game Lines, Trade Ticket, Portfolio, and Search.
- No backend, order route, provider, schema, chat, orderbook, live stats, social, deposit, or withdrawal work.

Polymarket reference/audit note:

- Polymarket does not show debug-style local fixture labels to retail users.
- Holiwyn still must disclose that Spread/Totals/Team Total pricing is Local MVP contract-fixture data until real provider-backed line markets exist.

Acceptance criteria:

| ID | Priority | Criterion | Evidence |
| --- | --- | --- | --- |
| PV-P0-01 | P0 | App source must not display `Test line - fake USDT`, `Local test pricing`, or `test lines` as tester-facing copy. | Source search and contract tests |
| PV-P0-02 | P0 | Home/Live source readiness still differentiates provider-backed winner from local line markets. | `eventSourceReadiness()` contract tests |
| PV-P0-03 | P0 | Event Detail line rows, Trade Ticket, and Portfolio still preserve machine-readable local source markers for QA. | Accessibility labels with `contract-fixture` / local fake-token markers |
| PV-P0-04 | P0 | No order route, backend schema, provider import, orderbook UI, chat, live stats, or social source is touched. | Git diff |
| PV-P1-01 | P1 | S23 proof should confirm visible local-line copy in the current MVP flow before final manual signoff. | `docs/mobile/harness/cycle-PV-local-line-source-copy-cleanup/cycle-PV-current-mvp-s23-visible-flow.json` |

Audit result:

- P0 status: Pass.
- S23 source-disclosure proof passed on `SM-S911U1`.
- Evidence confirms Event Detail line rows and Trade Ticket display `Local` / `Local line`, while accessibility markers preserve `contract-fixture`, `line-market-local-test-fake-token`, and `ticket-local-test-pricing`.
- P1 remaining: Real provider-backed line markets remain unavailable for the inspected current MVP match.

Evidence:

- Summary: `docs/mobile/harness/cycle-PV-local-line-source-copy-cleanup/cycle-PV-current-mvp-s23-visible-flow.json`
- Home screenshot/XML: `docs/mobile/screenshots/cycle-PV-local-line-source-copy-cleanup/cycle-PV-current-mvp-home.png`, `docs/mobile/harness/cycle-PV-local-line-source-copy-cleanup/cycle-PV-current-mvp-home.xml`
- Lines screenshot/XML: `docs/mobile/screenshots/cycle-PV-local-line-source-copy-cleanup/cycle-PV-current-mvp-lines.png`, `docs/mobile/harness/cycle-PV-local-line-source-copy-cleanup/cycle-PV-current-mvp-lines-settled.xml`
- Ticket screenshot/XML: `docs/mobile/screenshots/cycle-PV-local-line-source-copy-cleanup/cycle-PV-current-mvp-ticket-ready.png`, `docs/mobile/harness/cycle-PV-local-line-source-copy-cleanup/cycle-PV-current-mvp-ticket-ready.xml`
