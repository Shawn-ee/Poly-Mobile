# Cycle PL - Current Match Line Provider Gate

Date: 2026-07-08

## Scope

Re-audit the repeated P1 gap for current-match provider-backed line markets:

- Spread
- Totals
- Team Totals

This cycle intentionally does not attach fake provider identity to line markets. It proves the current backend/provider truth and keeps the relevance gate strict.

Out of scope:

- Order book UI
- Chat
- Live stats
- Social features
- Cosmetic UI work
- Backend schema changes

## Findings

Current MVP match:

- `Argentina vs. Egypt`
- Slug: `argentina-vs-egypt`
- Provider event slug: `fifwc-arg-egy-2026-07-07`

Polymarket Gamma currently exposes:

- 3 match-winner markets
- 0 Spread markets
- 0 Totals markets
- 0 Team Total markets

Holiwyn current route exposes:

- 3 Polymarket-backed Regulation Winner markets
- 4 contract-fixture line markets
- Line families: Spread, Totals, Team Totals

Discovery guard result:

- Match-winner candidates remain attach-ready.
- Line targets found 0 attach-ready provider candidates.
- Line targets rejected wrong-family match-winner candidates instead of attaching unsafe provider identity.

## Device Proof

Device:

- Samsung S23 / `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / model `SM-S911U1`

Visible proof:

- Opened the current match detail page.
- Confirmed Argentina/Egypt detail is visible.
- Scrolled to line-market sections.
- Confirmed Spread, Totals, and Team Totals are visible.
- Confirmed the app still exposes honest source wording for the local fixture/fake-token line flow.

Evidence:

- `docs/mobile/harness/cycle-PL-current-match-line-provider-gate/cycle-PL-current-state-inspection.json`
- `docs/mobile/harness/cycle-PL-current-match-line-provider-gate/cycle-PL-provider-match-line-availability.json`
- `docs/mobile/harness/cycle-PL-current-match-line-provider-gate/cycle-PL-provider-discovery-guard.json`
- `docs/mobile/harness/cycle-PL-current-match-line-provider-gate/cycle-PL-s23-summary.json`
- `docs/mobile/screenshots/cycle-PL-current-match-line-provider-gate/cycle-PL-s23-current-match-detail-top.png`
- `docs/mobile/screenshots/cycle-PL-current-match-line-provider-gate/cycle-PL-s23-current-match-lines.png`

## Audit Gate

Result: Pass for PL provider-line honesty gate.

Unresolved P0 gaps: 0 for the honesty/source gate.

Remaining P1:

- Real provider-backed current-match Spread/Totals/Team Total markets remain unavailable.
- Keep Local MVP line markets as contract fixtures until Polymarket Gamma/CLOB or another approved provider exposes attach-ready line rows.
- Do not attach match-winner candidates to line markets.
