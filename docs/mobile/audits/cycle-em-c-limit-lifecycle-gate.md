# Cycle EM-C Book-Staged Limit Lifecycle Gate - PM-GAP-087

Status: fail until integrated Android-visible lifecycle proof. This gate defines the audit bar for carrying a Book/orderbook selected limit price from the tapped ladder row into the ticket, order snapshot, open order, Portfolio, activity, and history.

## Scope

Feature: PM-GAP-087 selected Book limit price lifecycle.

Reference source status:

- Fresh/supporting Holiwyn proof: Cycle EL integrated tablet proof shows a route-backed Book ask at 55c/150 shares staging a Buy ticket and a route-backed Book bid at 50c/180 shares staging a Sell ticket without reverting the ticket price line to outcome probability.
- Fresh Polymarket reference: partial Cycle EL-C S23 official Polymarket app probe covers live page, Book/orderbook, ladder, tabs, grouped selector, and selected Book context. It did not produce a fresh Buy/Sell ticket or completed order lifecycle.
- Stale/reference-only Polymarket support: DQ-C S23 Book/orderbook and location-gated ticket evidence plus AG/AI ticket evidence. These can define interaction expectations, but they are not fresh EM proof and do not prove production Polymarket order/Portfolio/history lifecycle.

Holiwyn target: Agent A/B/Lead integrated proof for the same selected Book row through ticket, fake-token order, open order, Portfolio position/open order, activity, and history.

Owned evidence paths for this gate:

- Gate: `docs/mobile/audits/cycle-em-c-limit-lifecycle-gate.md`
- Fresh supporting Holiwyn evidence: `docs/mobile/harness/cycle-EL-integrated-live-depth/cycle-EL-B-visible-live-depth-proof.json`, `docs/mobile/harness/cycle-EL-integrated-live-depth/cycle-EL-A-provider-breadth.json`, `docs/mobile/screenshots/cycle-EL-integrated-live-depth/`, `docs/mobile/harness/cycle-EL-integrated-live-depth/`
- Stale/support-only reference: `docs/mobile/audits/live-football-world-cup-dq-c.md`, `docs/mobile/audits/trade-ticket.md`, `docs/mobile/audits/binary-side.md`

## Audit Principle

A Book-staged limit lifecycle passes only when one selected ladder row can be followed by exact fields across every visible and data surface. Android-visible proof is required. Backend JSON is support only unless paired to the same Android proof and the same selected row identity.

The selected snapshot must include, where available:

- Event identity.
- Market family/type, line, period, side/outcome, selected outcome id, selected market id or selector key.
- Provider/source identity, external market id, condition id, token id.
- Book row side: ask for staged Buy or bid for staged Sell.
- Exact selected limit price in cents/decimal form.
- Selected row shares/size and value/total when available.
- Ticket action side, amount, order id, fill/cancel/status ids when created.
- Fake-token/test-mode labeling for non-production Holiwyn proof.

## Hard Fails

These are P0 failures even if surrounding UI looks correct:

- Ticket price reverts to midpoint, outcome probability, selected-row default odds, or refreshed quote instead of the tapped Book limit price.
- Ticket shows the selected limit price but order request/response/open-order snapshot drops `limitPrice`, `limitSide`, selected row shares/value, selected market id/selector key, provider/source, or selected outcome identity.
- Portfolio, open order, activity, or history renders default/fallback labels such as event-only, first-row, moneyline, generic team, generic Yes/No, fallback market, default probability, or stale current metadata instead of the order-time selected limit snapshot.
- Backend JSON, route proof, source inspection, smoke logs, or unit tests are used to claim pass without Android Holiwyn proof for ticket plus at least one order/open order/Portfolio/activity/history surface.
- Fresh Polymarket parity is claimed from stale DQ-C/AG/AI ticket evidence, from location-gated production screens, or from Holiwyn-only proof without labeling the reference limitation.
- A Book bid stages a Buy ticket or a Book ask stages a Sell ticket without an explicit documented product reason and matching UI labels.
- The visible order lifecycle omits fake-token/test-mode labeling when proof uses Holiwyn fake orders.

## Pass/Fail Criteria

| ID | Priority | Criterion | Pass evidence required | Current EM-C status |
| --- | --- | --- | --- | --- |
| EM-LIMIT-P0-01 | P0 | Fresh-vs-stale evidence status must be explicit. | Gate/device/index docs label EL-C S23 as partial fresh for Book context, EL integrated as fresh Holiwyn support, and DQ-C/AG/AI ticket/order context as stale support only. | Pass for docs gate |
| EM-LIMIT-P0-02 | P0 | Book row tap must stage the exact selected limit price into the ticket. | Android screenshot/XML/proof JSON showing the tapped Book row price/side/shares and ticket price line for both ask->Buy and bid->Sell, with no midpoint/outcome probability reversion. | Partial: EL integrated proves selected ticket price for ask 55c and bid 50c; EM lifecycle still requires same-run order/Portfolio continuation |
| EM-LIMIT-P0-03 | P0 | Ticket ready/submit state must preserve selected limit fields through amount entry. | Android proof after amount entry plus proof JSON showing limit price, limit side, shares/value if present, market id/selector key, outcome, provider/source, and ticket action side. | Fail until proof |
| EM-LIMIT-P0-04 | P0 | Order request and order response must snapshot the selected Book limit fields. | Backend support JSON paired with Android submit proof for the same order id and selected row, including limit fields and selected market/provider identity. | Fail until proof |
| EM-LIMIT-P0-05 | P0 | Open order must render the order-time selected limit identity, not fallback/current labels. | Android open-order screenshot/XML plus backend route proof showing exact limit price, side, market/line/period/outcome/provider/source fields. | Fail until proof |
| EM-LIMIT-P0-06 | P0 | Portfolio position/open position must preserve selected limit snapshot when an order fills or partially fills. | Android Portfolio screenshot/XML and backend position proof for the same order/fill ids, with no default probability or current metadata reconstruction. | Fail until proof |
| EM-LIMIT-P0-07 | P0 | Recent activity and history must preserve the same selected limit identity and status. | Android activity/history screenshot/XML plus backend history proof showing order/fill/cancel status, selected limit price/side, and fake-token labels. | Fail until proof |
| EM-LIMIT-P0-08 | P0 | Cancellation/status transitions must not drop limit fields. | Proof for open->cancel/canceled or open->filled status path showing unchanged selected limit snapshot across status changes. | Fail until proof |
| EM-LIMIT-P0-09 | P0 | No backend-only pass is allowed. | Lead proof matrix maps backend order/portfolio/history JSON to visible Android markers for the same ids and selected row. | Fail until proof |
| EM-LIMIT-P0-10 | P0 | No fallback/default labels are allowed anywhere in the lifecycle. | Negative assertions reject midpoint/outcome-probability price, default moneyline/first-row/event-only labels, generic team labels, fallback market labels, missing provider/source, missing selected market id/selector key, and stale metadata substitution. | Fail until proof |
| EM-LIMIT-P1-01 | P1 | Repeat the lifecycle for multiple market families and both sides. | Android/backend proof for Spread plus Totals or Moneyline where provider-backed depth exists, covering ask->Buy and bid->Sell. | Open |
| EM-LIMIT-P1-02 | P1 | Recapture official Polymarket production ticket/order/history behavior when location/trading gates allow. | Fresh S23 production screenshots/XML for Book row -> ticket -> order/open order/history, or a documented blocked state. | Open |
| EM-LIMIT-P1-03 | P1 | Prove immutable durability after provider refresh or metadata drift. | Repeat after current quote/metadata changes and verify historical limit snapshot remains unchanged. | Open |
| EM-LIMIT-P2-01 | P2 | Improve visual scan clarity for limit price/side in open orders, Portfolio, activity, and history. | Side-by-side Android visual QA after P0 lifecycle passes. | Open |

## Required Integrated Proof

Agent A/B/Lead must provide one integrated evidence bundle that includes:

- Android Book proof showing selected ladder row, price, side, shares/value, event, market family/type, line, period, outcome, market id or selector key, provider/source, condition/token when available.
- Android ticket proof before and after amount entry showing the exact selected limit price and side.
- Android order submit/open order/Portfolio/activity/history screenshots and XML for the same selected order id.
- Backend support proof for order request, order response, open order, Portfolio/position, activity/history, and status transition keyed to the same ids.
- Negative assertion summary rejecting midpoint/outcome probability reversion, fallback/default labels, missing limit fields, and backend-only pass.
- Reference-status statement that does not claim Polymarket parity beyond the available Android Holiwyn evidence and the labeled fresh/stale reference support.

## Gate Decision

Current result: fail until integrated lifecycle proof.

Unresolved P0 gaps: 8 implementation proof areas remain open. EM-LIMIT-P0-01 passes for docs disclosure, and EM-LIMIT-P0-02 is partial from fresh EL integrated ticket-price preservation proof, but no same-run order/open order/Portfolio/activity/history lifecycle proof exists for selected Book limit fields.

Next cycle required: yes. Agent A/B/Lead must prove the selected Book limit fields end-to-end before PM-GAP-087 can be verified.
