# Cycle DT-C Orderbook Re-gate - PM-GAP-075

Status: partial after integrated DT proof. PM-GAP-075 still does not pass, but the DT integrated evidence closes several of the DS re-gate failures.

## Inputs Inspected

- DS-C gate: `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md`
- DS integrated proof summary: `docs/mobile/harness/cycle-DS-integrated-orderbook-ui-proof.json`
- DS integrated Android proof: `docs/mobile/screenshots/cycle-DS-integrated-orderbook-ui/`, `docs/mobile/harness/cycle-DS-integrated-orderbook-ui/`
- DS selector/backend contract proof: `docs/mobile/harness/cycle-DS-A-orderbook-selector-contract.json`
- DQ-C reference audit: `docs/mobile/audits/live-football-world-cup-dq-c.md`
- DQ-C Book reference XML/screenshots:
  - `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-12-top-book-action.xml`
  - `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-13-orderbook-market-selector.xml`
  - `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-14-orderbook-settings.xml`
  - `docs/mobile/harness/cycle-DQ-C-polymarket-reference/pm-dq-c-15-orderbook-depth-scroll.xml`
- DT integrated backend proof: `docs/mobile/harness/cycle-DT-integrated-ready-orderbook-depth-proof.json`
- DT tablet interaction proof: `docs/mobile/harness/cycle-DT-B-orderbook-interactions/cycle-DT-B-holiwyn-orderbook-proof.json`
- DT tablet screenshots/XML: `docs/mobile/screenshots/cycle-DT-B-orderbook-interactions/`, `docs/mobile/harness/cycle-DT-B-orderbook-interactions/`

## Re-gate Decision

Result: Partial; fail until remaining proof.

Reason: DT integrated proof closes the before/after Yes/No tab switch, proves a contract-shaped Totals selector/ticket carry-through path, adds side-labelled ladder metadata, and proves the backend Book route can return provider-backed ready depth. It still does not prove provider-backed ready depth in the same visible UI run, still does not prove Spread/period/line selector carry-through, and still does not implement or prove the Decimalize/equivalent Book setting.

PM-GAP-075 can only pass after an integrated Android evidence set proves all remaining items below against the DQ-C reference.

## Exact Pass/Fail Checklist

| Re-gate item | Required integrated proof | Current DT re-gate result |
| --- | --- | --- |
| Tab switching | Before/after Android XML or proof JSON showing `Yes` then `No` tab state for the same event and selected market, with side/outcome changed and market identity preserved. | Pass for DT: `cycle-DT-B-holiwyn-orderbook-proof.json` records `selected-market-mexico-ecuador-winner`, `selected-outcome-mexico selected-side-yes`, then `selected-outcome-ecuador selected-side-no`. |
| Selector carry-through | Open selector proof showing grouped family choices, then after-selection proof showing selected family, period, line, side/outcome, selector key or market id, and ticket/ladder identity all match the selected row. | Partial: DT proves a contract-shaped Totals selection carrying to ticket summary and line text. Spread/period/line carry-through remains unproven because this fixture still reports `selected-line-none selected-period-none`. |
| Decimalize/equivalent setting | Settings screenshot/XML showing `Decimalize book` or a documented Holiwyn-equivalent display toggle, plus before/after proof that toggling it does not reset selected market or side. | Fail: not implemented/proven in DS integrated evidence. |
| Provider-backed ready depth | Integrated Android XML/proof JSON from the Book UI showing provider-backed ready depth, not fallback/unavailable-only state; expected fields include source/status, visible levels, Price/Shares/Value, spread, and ready availability. | Partial: backend integrated proof passes with `depthSource=provider-orderbook-depth`, `availability.status=ready`, `providerOrderbookDepth.status=ready`, and 12 rows. Visible tablet proof still uses fixture/non-ready states, so UI-ready provider depth remains open. |
| Bid/ask side-labelled proof | Screenshot plus XML/proof JSON identifying ask rows above the spread and bid rows below it, with row side metadata or labels and representative price/share/value rows. | Pass for DT: tablet proof records ask markers above spread and bid markers below spread, with Price/Shares/Value columns visible. |

## Already Proven By DS Integrated Evidence

- Dedicated Book surface opens from game detail.
- Event identity is visible on the Book surface.
- `Yes`/`No` tabs are visible.
- Grouped selector labels are visible.
- Ladder columns include Price, Shares, and Value.
- Multiple depth rows and a spread separator are visible.
- Fallback/unavailable non-ready states are labelled.
- A ticket action from the orderbook surface is visible.
- The smoke summary is integrated and points at the DS build artifacts.

## Required Follow-up Evidence

Commit a single integrated proof bundle, preferably under `cycle-DT-C-*` or `cycle-DS-C-*`, containing:

- Android screenshots/XML for Book open, tab switch before/after, selector open, selector after-selection, settings open/toggle, provider-backed ready depth, non-ready state, and ticket action.
- Proof JSON with event identity, market id/selector key, family, period, line, side/outcome, depth source/status, bid row count, ask row count, spread value, representative row values, and settings state before/after.
- Passing smoke/test summary from the integrated build. Historical route-backed Book evidence may support the audit, but it cannot replace this integrated UI proof.
