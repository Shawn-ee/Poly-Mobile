# Cycle RU - Current-Match Provider Line Readiness

## Scope

Local MVP provider/data-contract readiness for the current soccer Event Detail page:

- Current event: `argentina-vs-egypt`
- Provider event slug: `fifwc-arg-egy-2026-07-07`
- User path protected: Home -> Event Detail -> line market -> Trade Ticket -> server-backed fake-token order -> Portfolio History

No order book UI, chat, live stats, social, deposit, withdraw, schema migration, or visual redesign work was touched.

## Polymarket Reference Audit

Polymarket Gamma exact event returned three match-winner markets:

- `fifwc-arg-egy-2026-07-07-arg`
- `fifwc-arg-egy-2026-07-07-draw`
- `fifwc-arg-egy-2026-07-07-egy`

Line-family market count from the exact event was `0` for spread, total goals, team totals, corners, halves, and correct score.

Team-aware broad searches and exact slug guesses for Argentina/Egypt returned no attach-ready line-market candidates.

Evidence:

- `docs/mobile/harness/cycle-RU-provider-line-current-match/cycle-RU-provider-line-source-probe.json`
- `docs/mobile/harness/cycle-RU-provider-line-current-match/cycle-RU-provider-line-market-availability.json`
- `docs/mobile/harness/cycle-RU-provider-line-current-match/cycle-RU-provider-match-line-availability.json`

## Acceptance Criteria

P0:

- Provider line proof must target the current Local MVP match, not stale hardcoded teams.
- Proof scripts must accept current/future `--providerEventSlug`, `--homeTeam`, and `--awayTeam` inputs.
- The current Holiwyn route must honestly label provider-backed Regulation Winner and contract-fixture line markets.
- S23 visible proof must still pass the Local MVP order flow.

P1:

- Replace current contract-fixture Spread/Totals/Team Total rows if Polymarket exposes attach-ready line markets.

## Audit Gate Result

P0 result: PASS.

Backend/provider proof:

- Polymarket Gamma exact event market count: `3`.
- Exact event line-family market count: `0`.
- Holiwyn route market count: `7`.
- Holiwyn route provider-backed market count: `3`.
- Holiwyn route contract-fixture market count: `4`.
- Holiwyn route source summary: Regulation Winner `provider-backed`, line markets `contract-fixture`.

Android proof:

- Device: Samsung S23 `SM-S911U1`.
- Summary: `docs/mobile/harness/cycle-RU-provider-line-current-match/cycle-RU-current-mvp-s23-visible-flow.json`.
- Result: PASS.

Remaining gaps:

- P1: real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.
