# Cycle EN-C Route-Backed Book-Staged Limit Lifecycle Gate - PM-GAP-088

Status: fail until integrated Android-visible route-backed lifecycle proof. This gate promotes the EM remaining P1 into the EN P0 bar: a provider-depth Book row selected from the live route must carry its exact limit snapshot through ticket, order, Portfolio, activity, and history.

## Scope

Feature: PM-GAP-088 route-backed provider-depth Book-staged limit lifecycle.

Reference source status:

- Fresh Holiwyn support: Cycle EL integrated tablet proof shows route-backed provider-depth Book ask `55c`/`150` shares staging a Buy ticket and bid `50c`/`180` shares staging a Sell ticket without reverting ticket price to outcome probability.
- Fresh Holiwyn lifecycle support: Cycle EM integrated tablet proof passes a selected fake-token Book-staged lifecycle for Spread `1.5` regulation Yes ask `41c` through ticket, submit, latest order, open order, latest activity, and canceled activity.
- Fresh Polymarket reference: partial Cycle EL-C Samsung S23 official app probe covers live page, Book/orderbook, ladder, tabs, grouped selector, and selected Book context only.
- Stale/reference-only Polymarket support: DQ-C S23 Book/orderbook and location-gated ticket evidence plus AG/AI ticket evidence. No fresh S23 production Book row -> ticket -> order -> Portfolio/history lifecycle was collected for EN.

Holiwyn target: one Lead-integrated proof bundle pairing Agent A route-backed backend evidence with Agent B Android screenshots/XML/proof JSON for the same selected provider-depth Book row, order ids, and lifecycle surfaces.

Owned evidence paths for this gate:

- Gate: `docs/mobile/audits/cycle-en-c-route-limit-lifecycle-gate.md`
- Fresh support: `docs/mobile/harness/cycle-EL-integrated-live-depth/`, `docs/mobile/screenshots/cycle-EL-integrated-live-depth/`, `docs/mobile/harness/cycle-EM-integrated-limit-lifecycle/`, `docs/mobile/screenshots/cycle-EM-integrated-limit-lifecycle/`
- Stale/reference-only support: `docs/mobile/audits/live-football-world-cup-dq-c.md`, `docs/mobile/audits/trade-ticket.md`, `docs/mobile/audits/binary-side.md`

## Audit Principle

EN passes only when the visible Android app proves the live route/provider-depth selected Book row is the same object all the way through the lifecycle. Backend JSON can support the gate, but it cannot pass visible parity without Holiwyn Android proof.

The selected route-backed snapshot must include, where available:

- Event identity, market family/type, line, period, side/outcome, selected outcome id, selected market id or selector key.
- Provider/source identity, external market id, condition id, token id, route status/source, and depth source.
- Book row side, exact selected limit price, row shares/size, value/total, and ticket action side.
- Ticket amount, order request/response id, open order id, fill/cancel/status ids, Portfolio/history row ids, and fake-token/test-mode labels when non-production.

## Hard Fails

These are P0 failures:

- Ticket price reverts to midpoint, outcome probability, refreshed quote, or any default price instead of the selected provider-depth Book row price.
- Selected id, line, outcome, side, provider/source, market id, selector key, condition id, token id, or route depth source changes between Book, ticket, order, Portfolio, activity, or history.
- Portfolio, open order, activity, or history shows fallback/default labels such as event-only, moneyline, first-row, generic team, generic Yes/No, default probability, stale current metadata, or missing provider identity.
- Proof uses arbitrary local UI-only mocks, deterministic fake rows presented as route-backed provider depth, source inspection, smoke logs, unit tests, or backend JSON without matching Android-visible markers.
- Fresh S23 production order/reference parity is claimed from stale DQ-C/AG/AI evidence, location-gated screens, or Holiwyn-only proof.
- Fake-token/test-mode labeling is missing from non-production Holiwyn order, Portfolio, activity, or history proof.

## Pass/Fail Criteria

| ID | Priority | Criterion | Pass evidence required | Current EN-C status |
| --- | --- | --- | --- | --- |
| EN-ROUTE-LIMIT-P0-01 | P0 | Fresh/stale/reference-only evidence status must be explicit. | Gate/device/index/report docs label EL and EM Holiwyn support as fresh, EL-C S23 Book context as partial fresh, and DQ-C/AG/AI ticket/order context as stale/reference-only. | Pass for docs gate |
| EN-ROUTE-LIMIT-P0-02 | P0 | The selected Book row must be route-backed provider depth, not local UI-only data. | Backend route proof and Android Book XML/proof JSON show matching route status/source, depth source, provider/source, market id or selector key, row side, price, shares, and value. | Fail until proof |
| EN-ROUTE-LIMIT-P0-03 | P0 | Tapping the route-backed ask/bid row must stage the exact limit price and side into the ticket. | Android proof for ask->Buy and bid->Sell, or documented same-run unavailability for one side, with no midpoint/outcome probability reversion. | Partial support from EL only; fail for EN lifecycle |
| EN-ROUTE-LIMIT-P0-04 | P0 | Ticket amount/ready/submit state must preserve the route-backed selected snapshot. | Android ticket proof after amount entry plus proof JSON showing price, side, row shares/value, market/outcome/line/period/provider/source, route depth source, and fake-token label. | Fail until proof |
| EN-ROUTE-LIMIT-P0-05 | P0 | Order request and response must snapshot the selected route-backed Book limit fields. | Backend order JSON paired with Android submit proof for the same order id and selected Book row. | Fail until proof |
| EN-ROUTE-LIMIT-P0-06 | P0 | Open order must render the order-time route-backed limit snapshot. | Android open-order screenshot/XML plus backend route proof showing unchanged limit price/side and selected market/provider identity. | Fail until proof |
| EN-ROUTE-LIMIT-P0-07 | P0 | Portfolio/open position must preserve the same selected snapshot when filled or partially filled. | Android Portfolio screenshot/XML plus backend position proof for the same order/fill ids, with no fallback/default/current metadata reconstruction. | Fail until proof |
| EN-ROUTE-LIMIT-P0-08 | P0 | Activity/history must preserve selected limit identity and status transitions. | Android activity/history proof plus backend history proof showing order/fill/cancel status, selected price/side, selected market/provider fields, and fake-token labels. | Fail until proof |
| EN-ROUTE-LIMIT-P0-09 | P0 | Selected identity must not drift across surfaces. | Lead matrix maps Book -> ticket -> order -> open order -> Portfolio -> activity/history by order id plus event, market id/selector key, outcome id, line, period, side, provider/source, condition/token, price, shares/value. | Fail until proof |
| EN-ROUTE-LIMIT-P0-10 | P0 | No backend-only or UI-mock pass is allowed. | Negative assertions reject backend-only pass, arbitrary local UI-only mocks, deterministic fake provider-depth rows, default labels, stale-as-ready, and route-unreachable fallback behavior. | Fail until proof |
| EN-ROUTE-LIMIT-P1-01 | P1 | Recapture fresh official S23 production order lifecycle when allowed. | Fresh Samsung S23 official-app screenshots/XML for Book row -> ticket -> production order/open order/history, or documented blocked state. | Open |
| EN-ROUTE-LIMIT-P1-02 | P1 | Repeat across multiple market families and both sides. | Route-backed Android/backend proof for Spread plus at least one other available family, covering ask->Buy and bid->Sell. | Open |
| EN-ROUTE-LIMIT-P1-03 | P1 | Prove durable DB snapshots after refresh/metadata drift. | Database-backed selection snapshots remain unchanged after provider refresh, metadata drift, cancel/fill, and app relaunch. | Open |
| EN-ROUTE-LIMIT-P2-01 | P2 | Polish lifecycle labels and visual scan clarity. | Side-by-side visual QA after P0 passes, especially order/Portfolio/history price, side, provider, and status labels. | Open |

## Gate Decision

Current result: fail until integrated route-backed Android-visible lifecycle proof.

Unresolved P0 gaps: 9 implementation proof rows remain open. EN-ROUTE-LIMIT-P0-01 passes for evidence disclosure, and EN-ROUTE-LIMIT-P0-03 has partial first-hop support from EL, but no same-run route-backed proof carries selected provider-depth Book limit fields through order, open order, Portfolio, activity, and history.

Next cycle required: yes. Lead must require Agent A/B integrated proof for the same route-backed selected Book row before final EN pass.
