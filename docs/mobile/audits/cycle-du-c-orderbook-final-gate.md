# Cycle DU-C Orderbook Final Gate - PM-GAP-075

Status: final pre-integration gate prepared by Agent C. PM-GAP-075 remains open until Agent A/B provide integrated Android proof that satisfies every P0 below.

This gate does not certify final parity. It converts the remaining DT evidence gap into exact pass/fail checks Lead can apply after integration.

## Scope

Feature: PM-GAP-075 live football Book/orderbook family and depth selector parity.

Reference source: reused Cycle DQ-C Samsung S23 official Polymarket Android evidence for Canada vs Morocco. No fresh DU-C S23 control was available in this docs worktree, so reference evidence is explicitly reused from DQ-C rather than newly captured.

Holiwyn target: integrated DU Agent A/B Android build after backend and UI work are merged.

Agent C ownership: audit/reference docs, criteria, gap tracker, audit gate report, device proof log, and this focused gate only.

## Evidence Inspected

Reused Polymarket reference evidence from DQ-C:

- `docs/mobile/audits/live-football-world-cup-dq-c.md`
- `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-12-top-book-action.png`
- `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-13-orderbook-market-selector.png`
- `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-14-orderbook-settings.png`
- `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-15-orderbook-depth-scroll.png`
- Matching XML under `docs/mobile/harness/cycle-DQ-C-polymarket-reference/`

Reused Holiwyn progress evidence from DS/DT:

- `docs/mobile/audits/cycle-ds-c-orderbook-audit-gate.md`
- `docs/mobile/audits/cycle-dt-c-orderbook-regate.md`
- `docs/mobile/harness/cycle-DS-integrated-orderbook-ui-proof.json`
- `docs/mobile/harness/cycle-DT-integrated-ready-orderbook-depth-proof.json`
- `docs/mobile/harness/cycle-DT-B-orderbook-interactions/cycle-DT-B-holiwyn-orderbook-proof.json`
- `docs/mobile/screenshots/cycle-DT-B-orderbook-interactions/`
- `docs/mobile/harness/cycle-DT-B-orderbook-interactions/`

Fresh DU-C evidence: none captured by Agent C. This is a gate-definition cycle, not a device-control cycle.

## Current Evidence Call

DT closes these earlier gaps:

- Yes/No switching changes side/outcome while preserving selected market identity.
- A contract-shaped Totals selector path carries into the ticket.
- Ask/bid ladder markers are side-labelled.
- Backend `/api/orderbook/:marketId/book` can return provider-backed `ready` depth with `depthSource=provider-orderbook-depth`, `availability.status=ready`, `providerOrderbookDepth.status=ready`, `marketIdentity.selectorKey`, and 12 Price/Shares/Value rows.

DT does not close these remaining gate areas:

- Provider-backed ready depth is not visible in the same Android Book UI run.
- Spread/period/line selector carry-through is not proven; DT Totals proof still reports `selected-line-none selected-period-none`.
- `Decimalize book` or a documented equivalent setting is not implemented/proven.
- Ticket/identity preservation still needs to be proven for the final selected Spread/period/line path and provider-backed ready depth path in the integrated app.

## DU-C Final Gate Criteria

| ID | Priority | Criterion | Required integrated proof | Current DU-C status |
| --- | --- | --- | --- | --- |
| OB-DU-C-P0-01 | P0 | Provider-backed ready depth must be visible in the Android Book UI, not only returned by backend JSON. | One integrated Android run showing the Book UI with `orderbook-source` or equivalent provider marker, ready status, event title, selected market identity, Price/Shares/Value columns, visible bid and ask rows, and spread. The same run must include proof JSON tying the visible market id/selector key to backend `depthSource=provider-orderbook-depth` and `providerOrderbookDepth.status=ready`. | Open |
| OB-DU-C-P0-02 | P0 | Backend ready JSON proof must be app-visible; backend proof alone cannot pass. | Android XML/screenshot and proof JSON must reference the same market id or selector key as the backend ready-depth response. If the UI shows fallback, idle, unavailable, or a fixture-only ladder while backend JSON is ready, fail. | Open |
| OB-DU-C-P0-03 | P0 | Spread selector carry-through must preserve family, period, line, side/outcome, and selected market identity through selector, ladder, and ticket. | Before/after Android selector proof for a Spread entry with a non-default line and at least one period marker, plus ladder and ticket XML/proof JSON showing matching family, period, line, side/outcome, market id or selector key, and odds/depth source. | Open |
| OB-DU-C-P0-04 | P0 | Period and line state must not collapse to `none` when the selected reference-equivalent market is a Spread line/period market. | Proof JSON must show non-null/non-`none` line and period fields for the selected Spread path, or a documented backend reason that the exact Polymarket-visible Spread market is unavailable and therefore not eligible for pass. | Open |
| OB-DU-C-P0-05 | P0 | Decimalize/equivalent Book display setting must be present and state-preserving. | Android screenshot/XML of the settings action showing `Decimalize book` or a documented Holiwyn equivalent; before/after proof must show toggling/opening it does not reset event, selected market, selected side, line, period, ready depth status, or ticket identity. | Open |
| OB-DU-C-P0-06 | P0 | Ticket/identity preservation must cover the final integrated path, not only earlier Totals or fixture paths. | After selecting the Spread/period/line and viewing provider-backed ready depth, tapping a ladder row or ticket action must open a ticket whose XML/proof JSON preserves event, family, period, line, side/outcome, market id/selector key, provider/source identity, and row price/side when applicable. | Open |
| OB-DU-C-P0-07 | P0 | Yes/No switching and side-labelled ladder proof must remain intact in the same final evidence bundle. | Proof JSON or XML must keep the DT-passed tab switch and side-labelled ask/bid assertions in the integrated DU run. Regression on these previously closed DT items fails the final gate. | Open until rerun |
| OB-DU-C-P0-08 | P0 | Non-ready states must remain honest and distinct from ready provider depth. | Integrated proof must include at least one loading/stale/unavailable/empty/error state or a documented reason it cannot be triggered, and it must not use non-ready/fallback rows as provider-ready evidence. | Open |
| OB-DU-C-P0-09 | P0 | Evidence must be integrated, Android-visible, and owned by the final integration cycle. | Committed screenshots/XML/proof JSON from the integrated DU build, plus a passing smoke/test summary. Worker-branch-only proof, backend-only proof, or screenshots generated by another agent outside the integrated run are insufficient. | Open |

## Blocking Rules

Block PM-GAP-075 completion if any of these are true:

- The Android UI proof is missing.
- Backend provider-ready JSON exists but the same market id/selector key is not visible in the app run.
- The UI run shows fallback, idle, unavailable, stale, or fixture depth while claiming provider-backed ready depth.
- Spread selector evidence lacks a non-default line or period carry-through.
- The selected line/period/family changes before the ticket opens.
- The Decimalize/equivalent setting is missing or resets selected market state.
- Ticket proof omits provider/source, market id/selector key, line, period, side/outcome, or selected row identity.

## Required Final Evidence Bundle

Preferred DU evidence paths:

- `docs/mobile/screenshots/cycle-DU-integrated-orderbook-final-gate/`
- `docs/mobile/harness/cycle-DU-integrated-orderbook-final-gate/`
- `docs/mobile/harness/cycle-DU-integrated-orderbook-final-gate-proof.json`

The final proof JSON must include:

- Event slug/title and Android device identifier.
- Book action source and selected Book route.
- Selected market id, selector key, family, market type, group key, period, line, side/outcome, and provider/source fields.
- Backend route URL and response fields for `depthSource`, `availability.status`, `providerOrderbookDepth.status`, level count, bid count, ask count, spread, and representative Price/Shares/Value rows.
- UI-visible labels or test IDs proving the same ready source/status and selected identity are rendered in the Android hierarchy.
- Selector before/after state for Spread line and period.
- Settings state for Decimalize/equivalent before/after.
- Ticket state after row/ticket action.
- Non-ready state proof or documented skip reason.
- Pass/fail summary for every `OB-DU-C-*` row.

## Gate Decision

Current result: Fail until integrated proof.

PM-GAP-075 status: Open, not passed.

Agent C will only mark PM-GAP-075 pass after Agent A/B integrated evidence proves the backend provider-ready route is visible in the Android Book UI and the Spread/period/line/settings/ticket identity checks above pass without regression.
