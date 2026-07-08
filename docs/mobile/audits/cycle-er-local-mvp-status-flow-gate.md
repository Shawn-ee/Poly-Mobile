# Cycle ER - Local MVP Retail Status Flow Gate

Cycle: ER
Feature: Retail event-detail status surface with orderbook hidden by default.
Date: 2026-07-04

## Scope

Validate the selected local MVP status path:

- Open Holiwyn on Android tablet.
- Confirm chart route state and ticket handoff status are visible in the event detail page.
- Confirm default Book/orderbook controls are hidden.
- Scroll to Game Lines, select a Spread `2.5` line, and confirm the line uses contract-shaped ticket source metadata.

## Acceptance Criteria

P0:

- Event detail exposes `event-detail-chart-route-state`.
- Event detail exposes `event-detail-chart-ticket-handoff-status`.
- No default Book/orderbook entry points are visible.
- Spread and Totals selectors remain reachable without Book.
- Selected Spread `2.5` exposes `ticket-source-deterministic-line-fixture`, `selection-market-family-spread`, and `selection-line-2.5`.

P1:

- Repeat with real provider-backed spread, totals, and team-total route data.
- Prove route-backed loading, stale, unavailable, and suspended states in the retail flow.

P2:

- Improve copy and visual density for non-ready retail statuses.

## Evidence

- Proof JSON: `docs/mobile/harness/cycle-ER-local-mvp-status-flow/cycle-ER-local-mvp-status-flow-proof.json`
- Screenshots: `docs/mobile/screenshots/cycle-ER-local-mvp-status-flow/`
- UI XML: `docs/mobile/harness/cycle-ER-local-mvp-status-flow/`

Validation:

- PowerShell smoke script parser check: pass.
- Samsung tablet proof: pass on `172.16.200.30:41299`.
- Expo launch typecheck during proof: pass.

## Gate Result

Pass for the selected Local MVP retail status journey.

Unresolved P0 gaps: 0 for this selected flow.

Remaining P1/P2 gaps are tracked in `docs/mobile/POLYMARKET_PARITY_GAP_TRACKER.md`.
