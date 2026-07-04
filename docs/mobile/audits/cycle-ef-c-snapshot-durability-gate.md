# Cycle EF-C Snapshot Durability Gate

Status: fail until integrated proof. This gate opens PM-GAP-083 for metadata-drift durability after the EE Book-origin status and snapshot pass.

Audit Gate Agent: Agent C.

## Scope

Feature target:

- After mutable market, outcome, provider, selector, label, freshness, or display metadata changes, backend and Android Portfolio/history surfaces must still render the order-time or fill-time selected Book identity.
- Historical rows must not be reconstructed from current default selector state, current market rows, provider-refresh labels, moneyline fallback, event-only labels, or first visible outcome defaults.
- Fake-token/test order and fill evidence remains acceptable only when explicitly labeled.

This EF gate preserves the EE pass for PM-GAP-082. It does not reopen open/cancel/fill status breadth unless new metadata-drift proof regresses the selected EE identity.

Out of scope for Agent C:

- Editing source, schema, generated screenshots, generated harness artifacts, or proof scripts.
- Claiming production Polymarket signing, settlement, or wallet parity.
- Marking the gate complete before Lead combines Agent A backend durability proof and Agent B Android recapture evidence.

## Evidence Read First

Agent C reviewed the prior EE gate and proof before writing this EF gate:

- `docs/mobile/audits/cycle-ee-c-book-order-status-gate.md`
- `docs/mobile/harness/cycle-EE-integrated-book-order-status/cycle-EE-book-order-status-proof.json`
- `docs/mobile/harness/cycle-EE-A-book-order-status-snapshots.json`
- `docs/mobile/harness/cycle-EE-B-visible-status/cycle-EE-B-visible-status-proof.json`
- `docs/mobile/audits/cycle-ed-c-book-order-portfolio-gate.md`
- `docs/mobile/harness/cycle-ED-A-book-order-portfolio-history.json`

EE proves selected Book-origin status breadth and guarded snapshots for the selected path, but its own P1 debt still required durability checks after metadata changes. EF converts that debt into a blocking gate.

## Polymarket Behavior To Match

- A placed order and fill keep the user's selected Book identity as historical fact: event, market family/type, market id or selector key, line, period, side/outcome, provider/source, provider market/condition/token identity, selected price/side where applicable, amount, order id, fill id, and status.
- Later edits to market labels, outcome labels, selector defaults, provider freshness/source labels, route metadata, display groups, or available current rows must not rewrite historical Portfolio/history identity.
- If the historical row is fake-token/test data, that label must remain explicit after drift and must not be confused with production Polymarket signing or settlement.

## P0 Criteria

All P0 rows must pass before PM-GAP-083 can be verified.

| ID | Priority | Criterion | Required proof | Current EF status |
| --- | --- | --- | --- | --- |
| EF-SD-P0-01 | P0 | Backend proof must create or select a Book-origin fake-token order and fill with a complete order-time/fill-time selected snapshot before drift. | Backend proof JSON showing event, market family/type, market id or selector key, line, period, side/outcome, provider/source, provider market/condition/token identity, amount, order id, fill id, and fake-token/test labels. | Fail until integrated proof |
| EF-SD-P0-02 | P0 | The proof must mutate current market, outcome, selector, and provider metadata after the order/fill exists. | Backend proof JSON listing every drift mutation, including at least labels/default selector/provider freshness or source-display changes, without changing the historical snapshot. | Fail until integrated proof |
| EF-SD-P0-03 | P0 | Backend Portfolio/history/order routes must still return the original Book identity from order-time/fill-time selected snapshots after drift. | Before/after route proof showing historical rows unchanged for selected fields and explicit assertions that no current market/outcome/provider fallback supplied the display identity. | Fail until integrated proof |
| EF-SD-P0-04 | P0 | Android Portfolio and history/activity must render the original selected Book identity after drift. | Android screenshots/XML/proof JSON after drift showing the same Book identity as the pre-drift order/fill snapshot. | Fail until integrated proof |
| EF-SD-P0-05 | P0 | No fallback/default reconstruction may be counted as pass evidence. | Proof assertions must reject moneyline fallback, event-only labels, first-row/default selector identity, stale provider label substitution, missing snapshot fields, and fixture-only display reconstruction. | Fail until integrated proof |
| EF-SD-P0-06 | P0 | Fake-token/test labeling must survive drift in backend and Android evidence. | Backend and Android evidence showing fake-token/test labels on order, position, and history/activity rows after metadata drift. | Fail until integrated proof |
| EF-SD-P0-07 | P0 | Agent A backend evidence and Agent B Android evidence must be integrated by Lead for the same selected identity and same drift scenario. | Lead-integrated bundle pairing backend before/after proof with Android post-drift recapture, including matching order/fill ids or deterministic proof ids. | Fail until integrated proof |

## P1 Criteria

| ID | Priority | Criterion | Required evidence | Current EF status |
| --- | --- | --- | --- | --- |
| EF-SD-P1-01 | P1 | Repeat metadata-drift durability across multiple real provider-backed line families when available. | Backend and Android before/after drift proof for Spread, Totals, halves, and other provider-backed families. | Open |
| EF-SD-P1-02 | P1 | Add a regression that covers provider refresh replacing stale/ready/freshness labels after order creation. | Route proof and Android recapture after provider refresh state changes. | Open |
| EF-SD-P1-03 | P1 | Recapture official Polymarket history behavior if production account/location gates allow completed order/cancel/fill history. | Fresh official-app reference screenshots/XML paired with Holiwyn comparison. | Open |

## P2 Criteria

| ID | Priority | Criterion | Required evidence | Current EF status |
| --- | --- | --- | --- | --- |
| EF-SD-P2-01 | P2 | Historical Portfolio/activity visual treatment should make immutable order identity easy to scan after current metadata changes. | Side-by-side visual review after P0 durability passes. | Open |

## Required Lead Proof

Lead must collect and combine:

- Agent A backend drift proof: create selected Book-origin fake-token order/fill, mutate current market/outcome/provider metadata, then prove backend order/portfolio/history routes still emit order-time/fill-time selected snapshot identity with no fallback reconstruction.
- Agent B Android recapture: after the same drift scenario, Portfolio open order/position/history/activity screenshots/XML/proof JSON still show the original selected Book identity and explicit fake-token/test labels.
- One integrated proof summary that maps backend order/fill ids or deterministic proof ids to Android-visible rows.

Preferred future paths:

- Backend proof JSON: `docs/mobile/harness/cycle-EF-A-snapshot-durability.json`
- Android proof JSON/XML: `docs/mobile/harness/cycle-EF-integrated-snapshot-durability/`
- Android screenshots: `docs/mobile/screenshots/cycle-EF-integrated-snapshot-durability/`

## Blocking Rules

Block EF pass if any of these occur:

- The drift mutation is only described in prose and not proven by backend data.
- Android proof is missing after drift.
- Backend proof is missing before/after route evidence for the same order/fill identity.
- Historical Portfolio/history rows change to new current labels, moneyline, event-only text, default selector rows, or first visible outcome.
- Any required selected identity field is absent and silently reconstructed from current mutable rows.
- Fake-token/test labeling disappears or is implied to be production Polymarket signing/settlement.
- Agent A and Agent B evidence cannot be paired to the same selected identity and drift scenario.

## Audit Gate Decision

Current result: fail until integrated proof.

Tracked gap: PM-GAP-083 is open for Book-origin snapshot durability after mutable metadata drift.

PM-GAP-082 remains verified for the selected EE status breadth path, but it is not sufficient to pass EF until the metadata-drift proof above exists.
