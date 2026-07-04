# Cycle EG-C Live Event Visible Provider Gate

Status: fail until same-cycle visible proof. PM-GAP-084 is opened for structural live event detail parity with provider-backed visible behavior.

Audit Gate Agent: Agent C.

## Scope

Feature target:

- The current live event detail must visibly behave like the Polymarket reference across page structure, provider-backed status, chart, Book/orderbook, selector state, and ticket handoff.
- The same selected market, line, period, side/outcome, provider/source, market id or selector key, and status identity must carry through live page context -> chart context -> Book/orderbook -> ticket.
- Stale, refreshing, unavailable, and ready states must be surfaced visibly. Backend-only readiness, hidden proof JSON, compile checks, or source inspection cannot pass this gate.

This EG gate preserves the selected EC/ED/EE/EF passes as regression baselines. It does not reopen those passes unless EG proof regresses their selected paths. EG is stricter because it requires the live event detail surface itself to show provider-backed visible behavior and selected identity continuity in one integrated device proof.

Out of scope for Agent C:

- Editing backend source, mobile source, smoke scripts, proof JSON, screenshots, or generated harness artifacts.
- Claiming production Polymarket order submission, signing, settlement, or wallet parity.
- Claiming a fresh Samsung S23 Polymarket reference capture. Agent C only reuses checked-in S23 reference evidence where current reference-device proof is unavailable.

## Reference Evidence Reused

Agent C did not collect fresh Cycle EG Polymarket or Holiwyn device proof. The Polymarket reference below is stale checked-in S23 official-app evidence, reused only to define the acceptance bar. Lead should replace or supplement it with fresh same-cycle reference evidence if the reference device and location gates are available.

| Reference area | Evidence | EG behavior used |
| --- | --- | --- |
| Official live game page structure | `docs/mobile/audits/live-football-world-cup-dq-c.md`; `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-03-world-cup-game-top.png`; lower-page DQ-C screenshots/XML | Event identity, match context, chart, Game/Chat, grouped markets, rules/lower content, and scroll context. |
| Official chart and line interaction | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-04-chart-press.png`; `pm-dq-c-08-spread-line-dropdown.png`; `pm-dq-c-09-spread-line-25.png`; `pm-dq-c-16-markets-scroll-2.png`; matching XML | Chart interaction is contextual, and line selector changes update family, line, period, side/outcome, odds/probability together. |
| Official Book/orderbook and ticket handoff | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-12-top-book-action.png`; `pm-dq-c-13-orderbook-market-selector.png`; `pm-dq-c-14-orderbook-settings.png`; `pm-dq-c-15-orderbook-depth-scroll.png`; `pm-dq-c-10-spread-ticket.png`; matching XML | Book opens from selected event context, shows selector, Yes/No or bid/ask sides, ladder columns, spread, settings, and selected-context ticket/gated sheet. |
| Holiwyn current baselines | EC/ED/EE/EF integrated gate files and proof summaries | Useful regressions only. They cannot pass EG without a same-cycle live-event visible provider proof bundle. |

## P0 Criteria

All P0 rows must pass before PM-GAP-084 can be verified.

| ID | Priority | Criterion | Required proof | Current EG status |
| --- | --- | --- | --- | --- |
| EG-LV-P0-01 | P0 | Same-cycle Holiwyn Android visible proof must exist for the exact live event detail feature. | Committed screenshots, XML, and proof JSON from an EG integrated Android run. | Fail until proof |
| EG-LV-P0-02 | P0 | Backend-only proof is not sufficient. Provider JSON, route tests, source inspection, compile checks, or smoke logs without visible UI capture cannot pass. | Proof bundle pairs backend/provider fields to visible Android markers in the same selected flow. | Fail until proof |
| EG-LV-P0-03 | P0 | The live event page must visibly expose provider-backed ready, stale, refreshing, and unavailable/empty states honestly. | Android proof showing ready provider source/status and at least one stale/refreshing/unavailable state or a documented same-run reason it cannot be triggered. | Fail until proof |
| EG-LV-P0-04 | P0 | Selected market identity must carry through live page, chart, Book/orderbook, and ticket. | One integrated proof maps event, family/type, line, period, side/outcome, provider/source, market id or selector key, condition/token where available, and visible labels across each surface. | Fail until proof |
| EG-LV-P0-05 | P0 | Chart state must be tied to the selected market/outcome and status, not a generic placeholder. | Chart screenshot/XML/proof showing selected outcome or market context, provider/source/status, and no unintended ticket/book/share/chat/navigation side effect after chart touch. | Fail until proof |
| EG-LV-P0-06 | P0 | Book/orderbook must render provider-backed visible depth for the same selected market identity when claiming ready status. | Android Book proof showing event identity, selected market id or selector key, provider/status markers, Price/Shares/Value rows, bid/ask or Yes/No side labels, spread, and no fallback rows counted as ready. | Fail until proof |
| EG-LV-P0-07 | P0 | Ticket handoff must preserve selected identity from the selected row/line/orderbook action. | Android ticket screenshot/XML/proof showing matching event, family/type, line, period, side/outcome, provider/source, market id or selector key, visible odds/price, and fake-token/test labeling if applicable. | Fail until proof |
| EG-LV-P0-08 | P0 | Stale, refreshing, unavailable, or provider-not-ready states must not silently fall back to moneyline, first visible row, event-only labels, or mock-ready rows. | Proof assertions and visible labels reject fallback/default reconstruction. | Fail until proof |
| EG-LV-P0-09 | P0 | EC/ED/EE/EF regression markers must remain intact but cannot substitute for EG. | Same-build non-regression references or rerun markers for prior selected gates, plus separate EG live-event visible provider proof. | Fail until proof |
| EG-LV-P0-10 | P0 | If stale S23 reference evidence is reused, the gate must state that limitation and cannot call it fresh same-cycle reference proof. | Audit notes name reused DQ-C/S23 evidence as stale/reference-only. | Pass for docs gate |

## P1 Criteria

| ID | Priority | Criterion | Required evidence | Current EG status |
| --- | --- | --- | --- | --- |
| EG-LV-P1-01 | P1 | Repeat the integrated visible provider proof across multiple real provider-backed line families. | Android proof for Spread, Totals, halves, and other visible families when available. | Open |
| EG-LV-P1-02 | P1 | Recapture fresh official Polymarket S23 reference evidence for the same live event and interaction chain when access/location allows. | Same-cycle S23 screenshots/XML for live page, chart, Book, selector, and ticket/gated sheet. | Open |
| EG-LV-P1-03 | P1 | Prove provider refresh changing stale -> refreshing -> ready without losing selected market identity. | Android-visible refresh lifecycle plus backend proof for the same selected identity. | Open |

## P2 Criteria

| ID | Priority | Criterion | Required evidence | Current EG status |
| --- | --- | --- | --- | --- |
| EG-LV-P2-01 | P2 | Polish live-page density, chart touch feel, orderbook row styling, and status messaging after P0 identity/status proof passes. | Side-by-side visual review against fresh or reused Polymarket reference. | Open |

## Required Lead Proof

Lead must collect and combine:

- Fresh EG Holiwyn Android screenshots/XML/proof JSON for the live event detail route, chart touch/context, Book/orderbook, selected line/market state, ticket handoff, and visible status labels.
- Backend/provider proof only as support, paired to the same visible market id or selector key and selected outcome shown on Android.
- A proof matrix that maps the same selected event, family/type, line, period, side/outcome, provider/source, market id or selector key, and status through live page -> chart -> Book/orderbook -> ticket.
- At least one visible non-ready state, or a clear same-run reason why stale/refreshing/unavailable cannot be triggered. Backend-only stale/ready JSON is not enough.

Preferred future paths:

- Android screenshots: `docs/mobile/screenshots/cycle-EG-integrated-live-event-visible-provider/`
- Android XML/proof JSON: `docs/mobile/harness/cycle-EG-integrated-live-event-visible-provider/`
- Backend support proof: `docs/mobile/harness/cycle-EG-A-live-event-visible-provider.json`

## Blocking Rules

Block EG pass if any of these occur:

- Visible Android screenshots/XML/proof JSON are missing.
- The evidence is only backend JSON, route tests, compile checks, smoke logs, or source inspection.
- Selected market, line, period, side/outcome, provider/source, market id or selector key, or status identity changes between chart, Book/orderbook, and ticket without an explicit user action and visible explanation.
- Chart proof is generic or decoupled from the selected outcome/market.
- Book/orderbook ready status is claimed from fallback rows, first-row/default market reconstruction, event-only labels, or backend proof not tied to Android-visible markers.
- Ticket proof opens a generic/default ticket instead of preserving the selected line/market/outcome identity.
- Stale, refreshing, unavailable, or ready status is hidden, ambiguous, or silently converted to ready.
- Reused DQ-C/S23 reference evidence is described as fresh Cycle EG reference evidence.

## Audit Gate Decision

Current result: fail until same-cycle integrated proof.

Unresolved EG P0 gaps: EG-LV-P0-01 through EG-LV-P0-09 remain open. EG-LV-P0-10 passes only for the docs gate because this file explicitly labels reused S23 evidence as stale/reference-only.

Tracked gap: PM-GAP-084 is opened for structural live event detail parity and provider-backed visible behavior.

PM-GAP-080, PM-GAP-081, PM-GAP-082, and PM-GAP-083 remain verified for their selected prior gates, but none of them can substitute for EG visible live-event provider proof.
