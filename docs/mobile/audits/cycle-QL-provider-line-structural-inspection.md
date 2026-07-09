# Cycle QL - Provider Line Structural Inspection

Scope: current Local MVP provider-line readiness and S23 journey proof stability.

## Reference And Criteria

Polymarket-first parity requires real provider data when Polymarket exposes it. For the current `argentina-vs-egypt` mobile MVP match, Holiwyn must not pretend local line fixtures are Polymarket-backed lines. The app may keep contract-shaped Holiwyn line markets only when fresh provider inspection proves attach-ready Polymarket line rows are unavailable.

P0 criteria:

- Inspect the current Home MVP route and live-detail route.
- Inspect Polymarket Gamma for the current provider event slug.
- Scan broad World Cup provider-line candidates.
- Prove whether Regulation Winner is real provider-backed.
- Prove whether Spread/Totals/Team Total are real provider-backed or contract fixtures.
- Run Samsung S23 proof of the visible Local MVP line path after the structural inspection.
- Harden the proof harness if S23 proof fails because of Expo splash/developer-menu timing rather than app behavior.

## Implementation

- Updated `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` with `Wait-UiContains`, so the S23 proof waits for Home content instead of assuming Expo Go leaves splash after a fixed delay.
- Added a second post-load Expo developer-menu dismissal before final Home assertions, preventing overlay text from failing an otherwise valid proof run.
- No mobile UI, backend route, schema, provider import, orderbook UI, chat, live stats, social, deposit, or withdrawal behavior changed.

## Findings

- Current Home route returns one match event, `Argentina vs. Egypt`, and zero futures for `mobileMvpMatches=1`.
- Regulation Winner is provider-backed: 3 Polymarket Gamma markets are attached.
- Line markets remain contract fixtures: Spread, Totals, and Team Totals are available to the Local MVP flow, but none are provider-backed.
- Broad Polymarket Gamma scan found 2,339 World Cup relevant candidates and 0 provider line candidates.

## Audit Gate

Result: Pass for focused structural inspection and S23 proof-harness hardening; not a pass for real provider-backed line parity.

Evidence:

- Current service inspection: `docs/mobile/harness/cycle-QL-provider-line-structural-inspection/cycle-QL-current-state.json`
- Current match line availability: `docs/mobile/harness/cycle-QL-provider-line-structural-inspection/cycle-QL-provider-match-line-availability.json`
- Broad provider line scan: `docs/mobile/harness/cycle-QL-provider-line-structural-inspection/cycle-QL-provider-line-breadth-scan.json`
- S23 proof summary: `docs/mobile/harness/cycle-QL-provider-line-structural-inspection/cycle-QL-current-mvp-s23-visible-flow.json`
- S23 screenshots/XML: `docs/mobile/screenshots/cycle-QL-provider-line-structural-inspection/`, `docs/mobile/harness/cycle-QL-provider-line-structural-inspection/`

Remaining gaps:

- P1: real provider-backed Spread/Totals/Team Total lines remain unavailable.
- P1: if a future Polymarket soccer event exposes line rows, replace contract fixtures through the existing route contract before claiming line parity.
