# Cycle DT-C Orderbook Re-gate - PM-GAP-075

Status: fail until integrated proof. PM-GAP-075 does not pass in the DT re-gate because the DS integrated evidence does not yet prove every remaining P0 area from the DQ-C Polymarket reference.

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

## Re-gate Decision

Result: Fail until proof.

Reason: DS integrated proof closes several Book surface criteria, but its own proof JSON lists unresolved areas: no before/after Yes/No tab switch, no selector carry-through from Moneyline to Spreads, no Decimalize/equivalent setting proof, no rerun with provider-backed ready depth, and no side-labelled bid/ask row proof strong enough to satisfy DQ-C parity.

PM-GAP-075 can only pass after one integrated DT/DS Android evidence set proves all remaining P0 items below against the DQ-C reference.

## Exact Pass/Fail Checklist

| Re-gate item | Required integrated proof | Current DT re-gate result |
| --- | --- | --- |
| Tab switching | Before/after Android XML or proof JSON showing `Yes` then `No` tab state for the same event and selected market, with side/outcome changed and market identity preserved. | Fail: DS proof shows tabs visible only; switching was not captured. |
| Selector carry-through | Open selector proof showing grouped family choices, then after-selection proof showing selected family, period, line, side/outcome, selector key or market id, and ticket/ladder identity all match the selected row. | Fail: DS proof shows grouped labels, but not Moneyline-to-Spreads or family/period/line carry-through into ladder/ticket. |
| Decimalize/equivalent setting | Settings screenshot/XML showing `Decimalize book` or a documented Holiwyn-equivalent display toggle, plus before/after proof that toggling it does not reset selected market or side. | Fail: not implemented/proven in DS integrated evidence. |
| Provider-backed ready depth | Integrated Android XML/proof JSON from the Book UI showing provider-backed ready depth, not fallback/unavailable-only state; expected fields include source/status, visible levels, Price/Shares/Value, spread, and ready availability. | Fail: DS captured fallback/unavailable labels; provider-backed ready depth was not rerun on this UI. |
| Bid/ask side-labelled proof | Screenshot plus XML/proof JSON identifying ask rows above the spread and bid rows below it, with row side metadata or labels and representative price/share/value rows. | Fail: DS screenshot has a visible ladder, but side-labelled bid/ask metadata is not strong enough. |

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
