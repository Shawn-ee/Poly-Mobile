# Cycle EO-C Route-Backed Lifecycle Breadth Gate - PM-GAP-089

Status: fail until integrated route-backed Android-visible breadth proof. EN passed one selected route-backed provider-depth Spread ask lifecycle; EO is not allowed to pass by repeating only that ask-side Spread path.

## Scope

Feature: PM-GAP-089 route-backed provider-depth lifecycle breadth after EN.

Reference source status:

- Fresh Holiwyn baseline: Cycle EN integrated proof passes one selected route-backed provider-depth Spread `1.5` ask `55c` lifecycle through ticket, fake-token order submit, latest/open order, opened activity, and canceled activity.
- Fresh Holiwyn support: Cycle EL integrated proof shows route-backed provider-depth ask `55c` -> Buy ticket and bid `50c` -> Sell ticket first-hop staging without midpoint/default price reversion.
- Fresh Polymarket reference: partial Cycle EL-C Samsung S23 official app probe covers live page and Book/orderbook context only.
- Stale/reference-only Polymarket support: DQ-C S23 Book/orderbook and location-gated ticket evidence plus AG/AI ticket evidence.
- No fresh EO S23 production Book row -> ticket -> order -> Portfolio/history lifecycle recapture has been collected.

Holiwyn target: one Lead-integrated proof bundle pairing same-cycle Agent A backend or route-shaped evidence with Agent B Holiwyn Android screenshots/XML/proof JSON for the same newly selected identity. The selected identity must materially broaden EN by covering bid-side/Sell and/or another provider-backed market family beyond the EN ask-side Spread path.

Owned evidence paths for this gate:

- Gate: `docs/mobile/audits/cycle-eo-c-route-lifecycle-breadth-gate.md`
- EN selected baseline: `docs/mobile/harness/cycle-EN-A-route-limit-lifecycle/proof.json`, `docs/mobile/harness/cycle-EN-integrated-route-limit-lifecycle/cycle-EN-B-visible-route-limit-lifecycle-proof.json`, `docs/mobile/screenshots/cycle-EN-integrated-route-limit-lifecycle/`, `docs/mobile/harness/cycle-EN-integrated-route-limit-lifecycle/`
- EL first-hop support: `docs/mobile/harness/cycle-EL-integrated-live-depth/`, `docs/mobile/screenshots/cycle-EL-integrated-live-depth/`
- Stale/reference-only support: `docs/mobile/audits/live-football-world-cup-dq-c.md`, `docs/mobile/audits/trade-ticket.md`, `docs/mobile/audits/binary-side.md`

## Audit Principle

EO passes only if the visible Android app proves route-backed lifecycle breadth beyond EN. The same selected identity must be proven in backend or route-shaped evidence and in Holiwyn Android evidence. Backend JSON can support the gate, but Android-visible proof is required for the same selected event, market, provider, side, price, and lifecycle ids.

Material breadth means at least one of:

- Bid-side/Sell lifecycle for a route-backed provider-depth row, including ticket, order, open order, Portfolio/open position where applicable, activity/history, and status transitions.
- Another provider-backed market family beyond the EN Spread ask path, with the same lifecycle coverage.

The selected route-backed snapshot must include, where available:

- Event identity, market family/type, line, period, side/outcome, selected outcome id, selected market id or selector key.
- Provider/source identity, external market id, condition id, token id, route status/source, and depth source.
- Book row side, exact selected limit price, row shares/size, value/total, and ticket action side.
- Ticket amount, order request/response id, open order id, fill/cancel/status ids, Portfolio/history row ids, and fake-token/test-mode labels when non-production.

## Hard Fails

These are P0 failures:

- Proof repeats only EN's selected ask-side Spread path with no bid/Sell lifecycle and no additional provider-backed family.
- Backend proof and Android proof do not refer to the same selected identity, order ids, provider/source fields, side, price, and lifecycle surfaces.
- Ticket price reverts to midpoint, outcome probability, refreshed quote, or default price instead of the selected provider-depth Book row price.
- Selected id, line, outcome, side, provider/source, market id, selector key, condition id, token id, or route depth source changes between Book, ticket, order, Portfolio, activity, or history.
- Portfolio, open order, activity, or history shows fallback/default labels such as event-only, moneyline, first-row, generic team, generic Yes/No, default probability, stale current metadata, or missing provider identity.
- Proof uses arbitrary local UI-only mocks, deterministic fake rows presented as route-backed provider depth, source inspection, smoke logs, unit tests, or backend JSON without matching Android-visible markers.
- Fresh S23 production lifecycle parity is claimed from stale DQ-C/AG/AI evidence, location-gated screens, or Holiwyn-only proof.
- Fake-token/test-mode labeling is missing from non-production Holiwyn order, Portfolio, activity, or history proof.

## Pass/Fail Criteria

| ID | Priority | Criterion | Pass evidence required | Current EO-C status |
| --- | --- | --- | --- | --- |
| EO-BREADTH-P0-01 | P0 | Fresh/stale/reference-only evidence status must be explicit. | Gate/device/index/report docs label EN as fresh Holiwyn baseline, EL as fresh first-hop support, EL-C S23 as partial fresh Book context, and DQ-C/AG/AI as stale/reference-only. | Pass for docs gate |
| EO-BREADTH-P0-02 | P0 | Same-cycle backend or route-shaped proof must exist for the newly selected breadth identity. | Backend/route proof shows route status/source, depth source, provider/source, market id or selector key, row side, price, shares/value, lifecycle ids, and no fallback rows. | Fail until proof |
| EO-BREADTH-P0-03 | P0 | Holiwyn Android proof must exist for the same selected identity. | Android screenshots/XML/proof JSON show the same event, family/type, line, period, side/outcome, provider/source, market id or selector key, row price/side, order ids, and lifecycle surfaces as backend/route proof. | Fail until proof |
| EO-BREADTH-P0-04 | P0 | EO must materially broaden EN. | Proof covers bid-side/Sell lifecycle and/or another provider-backed market family beyond EN's selected ask-side Spread lifecycle. | Fail until proof |
| EO-BREADTH-P0-05 | P0 | Repeating only EN's ask-side Spread path cannot pass. | Lead matrix explicitly compares EO selected identity against EN selected ask-side Spread baseline and proves at least one new side/family. | Fail until proof |
| EO-BREADTH-P0-06 | P0 | Ticket amount/ready/submit state must preserve the selected breadth snapshot. | Android ticket proof after amount entry plus proof JSON showing selected price, side, row shares/value, market/outcome/line/period/provider/source, route depth source, and fake-token label when applicable. | Fail until proof |
| EO-BREADTH-P0-07 | P0 | Order/open order/Portfolio/activity/history must render the order-time selected breadth snapshot. | Backend route proof paired with Android proof for the same order/fill/cancel/status ids, with unchanged limit price/side and selected market/provider identity. | Fail until proof |
| EO-BREADTH-P0-08 | P0 | Selected identity must not drift across surfaces. | Lead matrix maps Book -> ticket -> order -> open order -> Portfolio -> activity/history by order id plus event, market id/selector key, outcome id, line, period, side, provider/source, condition/token, price, and shares/value. | Fail until proof |
| EO-BREADTH-P0-09 | P0 | No backend-only, UI-mock, fake provider-depth, fallback-label, or stale-as-fresh pass is allowed. | Negative assertions reject backend-only pass, arbitrary local UI-only mocks, fake provider-depth rows, midpoint/default price reversion, fallback Portfolio/history labels, id/provider drift, and stale evidence described as fresh. | Fail until proof |
| EO-BREADTH-P1-01 | P1 | Recapture fresh official S23 production order lifecycle when allowed. | Fresh Samsung S23 official-app Book row -> ticket -> production order/open order/history proof, or documented blocked state. | Open |
| EO-BREADTH-P1-02 | P1 | Continue breadth across more provider-backed families and both sides. | Route-backed Android/backend proof for Spread plus multiple additional available families, covering ask->Buy and bid->Sell. | Open |
| EO-BREADTH-P1-03 | P1 | Capture production HTTP order route proof. | HTTP route proof for order submit/open/cancel/history paired to the Android-visible selected identity and lifecycle ids. | Open |
| EO-BREADTH-P1-04 | P1 | Add first-class immutable selection snapshots. | Database-backed selection snapshots survive provider refresh, metadata drift, cancel/fill, and app relaunch without fallback reconstruction. | Open |
| EO-BREADTH-P2-01 | P2 | Polish lifecycle labels and visual scan clarity. | Side-by-side visual QA after P0 breadth proof passes, especially side, family, provider, price, and status labels. | Open |

## Gate Decision

Current result: fail until integrated route-backed Android-visible breadth proof.

Unresolved P0 gaps: 8 implementation proof rows remain open. EO-BREADTH-P0-01 passes for evidence disclosure, but EO has no same-cycle backend/route-shaped plus Holiwyn Android proof for a new selected breadth identity.

Next cycle required: yes. Lead must require a same-selected-identity backend/route plus Android bundle that broadens EN by bid/Sell lifecycle and/or another provider-backed market family before final EO pass.
