# Cycle DW-C Book Selector / Ticket Audit Gate

Status: pending Agent A/B evidence. This is a focused audit gate for the next visible Book selector/ticket parity behavior after Cycle DV verified the same-market provider-ready Book UI path for PM-GAP-075.

Do not treat this document as a fresh Samsung S23 reference capture. DW-C reuses the Cycle DQ-C Samsung S23 Polymarket reference evidence and the Cycle DV Holiwyn proof artifacts already committed in the repo.

## Scope

Feature target: next visible/provider Book parity behavior after the focused provider-ready Book UI path:

- Grouped Book selector behavior and selected-market preservation.
- Family/period/line/outcome identity preservation across selector, ladder, row/ticket action, and ticket.
- Honest ready vs non-ready state proof from Agent A provider work and Agent B visible UI work.
- Android screenshot/XML evidence as the audit source of truth for visible UI behavior.

Out of scope for this doc:

- Editing central trackers or final audit reports.
- Re-opening the already verified Cycle DV same-market provider-ready Book UI path unless DW evidence shows a regression.
- Backend-only certification of visible UI parity.

## Reference Evidence

Reused Cycle DQ-C official Polymarket Android reference:

- Reference audit: `docs/mobile/audits/live-football-world-cup-dq-c.md`
- Reference screenshots folder: `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/`
- Reference XML folder: `docs/mobile/harness/cycle-DQ-C-polymarket-reference/`

DQ-C paths relevant to DW-C:

| Area | Screenshot | XML | Reference behavior |
| --- | --- | --- | --- |
| Book action | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-12-top-book-action.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-12-top-book-action.xml` | Top Book action opens a dedicated `Order Book` page with event identity, Yes/No tabs, market selector, Price/Shares/Value columns, ask/bid rows, and spread. |
| Market selector | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-13-orderbook-market-selector.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-13-orderbook-market-selector.xml` | Selector is grouped by family, including Moneyline choices and Spreads choices such as `CAN -2.5` and `CAN -2.5 1H`. |
| Settings | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-14-orderbook-settings.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-14-orderbook-settings.xml` | Gear opens a display setting with `Decimalize book`. |
| Depth scroll | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-15-orderbook-depth-scroll.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-15-orderbook-depth-scroll.xml` | Additional drag preserves the same ladder context; multiple asks, spread, and bids remain visible. |
| Ticket transition | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-10-spread-ticket.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-10-spread-ticket.xml` | Tapping a selected spread outcome dims the page and begins opening the ticket sheet. |
| Ticket settled state | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-11-ticket-sheet-settled.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-11-ticket-sheet-settled.xml` | Production reference is location-gated with `Location verification failed`; no amount entry/swipe confirmation was reachable in DQ-C. |
| Broader market breadth | `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-16-markets-scroll-2.png` | `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-16-markets-scroll-2.xml` | Lower page includes Totals and `1st Half Winner`, useful for broader selector breadth criteria. |

## Holiwyn Evidence Baseline And DW Requirements

Cycle DV proof already available and reusable as the prior baseline:

- Backend provider line proof: `docs/mobile/harness/cycle-DV-provider-line-orderbook-depth-proof.json`
- Tablet UI proof summary: `docs/mobile/harness/cycle-DV-provider-line-orderbook/cycle-DV-provider-line-orderbook-proof.json`
- Tablet screenshots: `docs/mobile/screenshots/cycle-DV-provider-line-orderbook/`
- Tablet XML: `docs/mobile/harness/cycle-DV-provider-line-orderbook/`

DV established the focused same-market provider-ready path:

- Same visible market id as backend provider-ready route: `d08da13e-80b8-4452-9067-f91d08f6fba4`.
- Selector key `spreads:first-half:1.5`, selected family `Spreads`, market type `spread`, line `1.5`, period `first-half`.
- Visible UI ready markers: `orderbook-source-orderbook-route`, `orderbook-status-ready`, and `orderbook-availability-ready`.
- Cents/Decimal display toggle did not reset selected market/selector/line/period.
- Ticket proof preserved `Japan -1.5` with provider/source/token markers.

Required new DW evidence from Agent B visible UI:

- Android screenshots/XML for Book open, selector open, selector selection before/after, depth scroll after selection, row or ticket action, ticket open, settings open if touched, and at least one non-ready visible state.
- Proof JSON or smoke summary tying visible labels/test IDs to event, selected market id, selector key, family, period, line, side/outcome, row identity, ticket identity, depth source/status, and ready/non-ready state.
- Evidence must be produced from the integrated DW build/run, not only from a worker branch or a backend route.

Required new DW evidence from Agent A provider/non-ready proof:

- Provider proof for the selected market(s) Agent B renders, including ready and non-ready status where applicable.
- Explicit non-ready proof for loading, empty, stale, unavailable, delayed, suspended, or error behavior, with the UI expected to label or disable honestly.
- A mapping between provider route identity and UI-visible market identity when a ready state is claimed.

Preferred DW artifact paths:

- `docs/mobile/screenshots/cycle-DW-B-book-selector-ticket/`
- `docs/mobile/harness/cycle-DW-B-book-selector-ticket/`
- `docs/mobile/harness/cycle-DW-B-book-selector-ticket-proof.json`
- `docs/mobile/harness/cycle-DW-A-book-selector-provider-state-proof.json`

## P0 Audit Criteria

| ID | Priority | Criterion | Required evidence | Current DW-C status |
| --- | --- | --- | --- | --- |
| OB-DW-C-P0-01 | P0 | Book selector must be grouped and selectable, not a flat label-only control. | Android screenshot/XML of the opened selector showing family group labels and selectable rows; proof JSON must identify selector keys or market ids per row. | Pending Agent B evidence |
| OB-DW-C-P0-02 | P0 | Selecting a family/period/line must update the active Book market while preserving event identity. | Before/after selector proof showing event title unchanged and selected family, period, line, selector key, and market id updated to the chosen row. | Pending Agent B evidence |
| OB-DW-C-P0-03 | P0 | Selected market family, period, line, and outcome must carry from selector into the ladder. | Android XML/proof JSON from the ladder after selection showing the same family, period, line, selector key/market id, and active Yes/No or outcome side. | Pending Agent B evidence |
| OB-DW-C-P0-04 | P0 | Row/ticket identity must preserve the selected market and row, not fall back to the original/default market. | Ticket screenshot/XML plus proof JSON after tapping a row or ticket action showing event, market id, selector key, family, period, line, side/outcome, row price/side when applicable, and provider/source markers. | Pending Agent B evidence |
| OB-DW-C-P0-05 | P0 | Ticket proof must be honest about what the reference supports. DQ-C only proves location-gated ticket open/settled state, not production amount entry or swipe confirmation. | Holiwyn may prove fake-token amount entry as app behavior, but this gate must distinguish it from official Polymarket production parity. | Pending Agent B evidence |
| OB-DW-C-P0-06 | P0 | Ready state claims must be provider-backed and UI-visible for the same market identity. | Agent A provider route proof plus Agent B Android XML/proof JSON referencing the same market id or selector key and visible ready/source/status labels. | Pending Agent A/B evidence |
| OB-DW-C-P0-07 | P0 | Non-ready states must be honest and must not masquerade as provider-ready depth. | Android screenshot/XML and provider proof for at least one non-ready state with explicit unavailable/loading/stale/error/empty/suspended/delayed labeling or disabled action state. | Pending Agent A/B evidence |
| OB-DW-C-P0-08 | P0 | Android screenshots and XML are required for visible UI pass. | Committed Android screenshot/XML for each claimed visible behavior, plus proof JSON or smoke summary. | Pending Agent B evidence |
| OB-DW-C-P0-09 | P0 | Backend-only proof cannot pass visible Book selector/ticket parity. | Any backend/provider proof must be paired with Android-visible evidence for the same selected market and state. | Pending Agent A/B evidence |
| OB-DW-C-P0-10 | P0 | Depth scroll must preserve selected market identity and row/ticket availability. | Android screenshot/XML before and after depth scroll showing the same selected market context, ladder columns, ask/bid sides, spread, and no selector reset. | Pending Agent B evidence |

## P1 / P2 Criteria

| ID | Priority | Criterion | Required evidence | Current DW-C status |
| --- | --- | --- | --- | --- |
| OB-DW-C-P1-01 | P1 | Selector breadth should cover every visible family/period exposed by the event, not only the one DV provider-ready Spread. | Android selector proof for Moneyline, Spreads, Totals, halves, and other available families when present in the fixture/provider data. | Pending |
| OB-DW-C-P1-02 | P1 | Full settings sheet parity should move beyond the current Cents/Decimal equivalent when the app exposes richer display settings. | Screenshot/XML and before/after proof for each visible Book setting, including state preservation after toggles. | Pending |
| OB-DW-C-P1-03 | P1 | Ticket row action should preserve price, side, shares/value context, and selected market into any amount/order path Holiwyn supports. | Ticket XML/proof JSON showing selected row price/side and market identity after amount entry or order-ready state. | Pending |
| OB-DW-C-P1-04 | P1 | Non-ready provider states should be recaptured in the same DW harness as the ready selector/ticket flow. | Integrated ready and non-ready evidence bundle, rather than relying only on older DU/DV fallback documentation. | Pending |
| OB-DW-C-P2-01 | P2 | Visual density should approximate the DQ-C reference after P0 structure passes. | Side-by-side review of phone-size Android screenshots for row height, columns, bars, spacing, and selector density. | Pending |
| OB-DW-C-P2-02 | P2 | Native transitions should feel close to reference: selector opening, settings opening, depth scroll, ticket sheet open, and back/close behavior. | Screen recording or sequential screenshots/XML proving transitions do not reset selected context. | Pending |

## Blocking Rules

Block DW-C pass if any of these occur:

- Selector proof is missing, flat, or label-only.
- Selection changes visible text but not market id/selector key/family/period/line.
- Ladder or ticket reverts to the default market after a selector choice.
- Ticket identity omits selected market id/selector key, period, line, side/outcome, or provider/source identity when available.
- A backend/provider ready response is claimed without Android UI proof for the same market identity.
- A non-ready/fallback/unavailable UI is presented as provider-ready depth.
- Android screenshots/XML are missing for any visible behavior claimed as passed.
- Fresh S23 reference is claimed without newly captured S23 artifacts.

## Gate Decision

Current result: pending Agent A/B evidence.

DW-C does not pass yet. Cycle DV remains the baseline pass for the focused same-market provider-ready Book UI path, while this DW gate waits for new integrated evidence proving grouped selector selection, selected family/period/line/outcome preservation, row/ticket identity preservation, honest ready and non-ready states, Android screenshot/XML proof, and no backend-only pass for visible UI.
