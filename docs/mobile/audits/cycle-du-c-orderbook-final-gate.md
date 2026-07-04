# Cycle DU-C Orderbook Final Gate - PM-GAP-075

Status: integrated DU evidence reviewed by Lead. PM-GAP-075 remains open because backend provider-ready depth and visible Android Book proof are still separate evidence bundles.

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

Fresh DU-C evidence: none captured by Agent C. This was a gate-definition cycle, not a device-control cycle.

Integrated DU evidence added after Agent A/B merge:

- Backend provider line proof: `docs/mobile/harness/cycle-DU-integrated-provider-line-orderbook-depth-proof.json`
- Tablet UI proof: `docs/mobile/harness/cycle-DU-B-orderbook-settings/cycle-DU-B-holiwyn-orderbook-proof.json`
- Tablet screenshots/XML: `docs/mobile/screenshots/cycle-DU-B-orderbook-settings/`, `docs/mobile/harness/cycle-DU-B-orderbook-settings/`
- Integrated checks: mobile typecheck passed; focused mobile tests passed; backend Book/provider tests passed; `npm --prefix mobile run smoke:tablet:du-b-orderbook-settings` passed.

## Current Evidence Call

DT closes these earlier gaps:

- Yes/No switching changes side/outcome while preserving selected market identity.
- A contract-shaped Totals selector path carries into the ticket.
- Ask/bid ladder markers are side-labelled.
- Backend `/api/orderbook/:marketId/book` can return provider-backed `ready` depth with `depthSource=provider-orderbook-depth`, `availability.status=ready`, `providerOrderbookDepth.status=ready`, `marketIdentity.selectorKey`, and 12 Price/Shares/Value rows.

DT did not close these remaining gate areas:

- Provider-backed ready depth is not visible in the same Android Book UI run.
- Spread/period/line selector carry-through is not proven; DT Totals proof still reports `selected-line-none selected-period-none`.
- `Decimalize book` or a documented equivalent setting is not implemented/proven.
- Ticket/identity preservation still needs to be proven for the final selected Spread/period/line path and provider-backed ready depth path in the integrated app.

DU closes these additional areas:

- Backend route proof returns provider-backed ready first-half Spread depth with `selectorKey=spreads:first-half:1.5`, `period=first-half`, `line=1.5`, outcome ids, side-labelled levels, and Price/Shares/Value rows.
- Android tablet proof shows a state-preserving Cents/Decimal Book display toggle.
- Android tablet proof shows Spread `1.5` regulation and Totals `2.5` regulation selector carry-through into ladder context and ticket.
- Yes/No switching and side-labelled ladder assertions remain intact.

DU still does not close the final provider-ready visible UI requirement: the backend provider-ready market is not the same app-visible market/selector key rendered in the tablet Book proof.

## DU-C Final Gate Criteria

| ID | Priority | Criterion | Required integrated proof | Current DU-C status |
| --- | --- | --- | --- | --- |
| OB-DU-C-P0-01 | P0 | Provider-backed ready depth must be visible in the Android Book UI, not only returned by backend JSON. | One integrated Android run showing the Book UI with `orderbook-source` or equivalent provider marker, ready status, event title, selected market identity, Price/Shares/Value columns, visible bid and ask rows, and spread. The same run must include proof JSON tying the visible market id/selector key to backend `depthSource=provider-orderbook-depth` and `providerOrderbookDepth.status=ready`. | Open |
| OB-DU-C-P0-02 | P0 | Backend ready JSON proof must be app-visible; backend proof alone cannot pass. | Android XML/screenshot and proof JSON must reference the same market id or selector key as the backend ready-depth response. If the UI shows fallback, idle, unavailable, or a fixture-only ladder while backend JSON is ready, fail. | Open |
| OB-DU-C-P0-03 | P0 | Spread selector carry-through must preserve family, period, line, side/outcome, and selected market identity through selector, ladder, and ticket. | Before/after Android selector proof for a Spread entry with a non-default line and at least one period marker, plus ladder and ticket XML/proof JSON showing matching family, period, line, side/outcome, market id or selector key, and odds/depth source. | Passed for deterministic backend-shaped fixture data; must rerun against provider-ready backend market before final pass |
| OB-DU-C-P0-04 | P0 | Period and line state must not collapse to `none` when the selected reference-equivalent market is a Spread line/period market. | Proof JSON must show non-null/non-`none` line and period fields for the selected Spread path, or a documented backend reason that the exact Polymarket-visible Spread market is unavailable and therefore not eligible for pass. | Passed for fixture UI and backend route independently; still needs same-market integrated proof |
| OB-DU-C-P0-05 | P0 | Decimalize/equivalent Book display setting must be present and state-preserving. | Android screenshot/XML of the settings action showing `Decimalize book` or a documented Holiwyn equivalent; before/after proof must show toggling/opening it does not reset event, selected market, selected side, line, period, ready depth status, or ticket identity. | Passed as Cents/Decimal equivalent toggle in DU-B tablet proof |
| OB-DU-C-P0-06 | P0 | Ticket/identity preservation must cover the final integrated path, not only earlier Totals or fixture paths. | After selecting the Spread/period/line and viewing provider-backed ready depth, tapping a ladder row or ticket action must open a ticket whose XML/proof JSON preserves event, family, period, line, side/outcome, market id/selector key, provider/source identity, and row price/side when applicable. | Passed for fixture Spread ticket; open for provider-ready backend market |
| OB-DU-C-P0-07 | P0 | Yes/No switching and side-labelled ladder proof must remain intact in the same final evidence bundle. | Proof JSON or XML must keep the DT-passed tab switch and side-labelled ask/bid assertions in the integrated DU run. Regression on these previously closed DT items fails the final gate. | Passed in DU-B tablet proof |
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

Current result: Partial; fail until same-market provider-ready Android proof.

PM-GAP-075 status: Open, not passed.

The next cycle should make the DU-A provider-ready first-half Spread market render in the Book UI and prove the app-visible selector key/market id matches the backend ready-depth response. Only then can Agent C consider PM-GAP-075 for pass.
