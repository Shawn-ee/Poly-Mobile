# Cycle TW - Provider Line Source Reprobe

Status: provider proof pass for current-source honesty; provider-backed line parity remains open.

## Scope

This cycle rechecks the remaining Local MVP provider gap with fresh Polymarket-first evidence:

- Current MVP event: `argentina-vs-egypt`
- Polymarket Gamma event: `fifwc-arg-egy-2026-07-07`
- Target line families: Spread, Totals, Team Totals, first-half, corners
- Surfaces checked: exact Gamma event, exact slug guesses, broad Gamma market search, Holiwyn live-detail route source summary

No mobile UI, backend schema, order route, order book UI, chat, live stats, social, deposit, or withdrawal work was touched.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Fresh provider proof must not invent line markets when Polymarket Gamma does not expose them. | Pass |
| P0 | Current MVP route must clearly distinguish provider-backed Regulation Winner from fixture-only line markets. | Pass |
| P0 | Route must list expected line families and must not silently omit Local MVP line coverage. | Pass |
| P1 | Broad World Cup Gamma scan should be rerun before deciding whether provider-backed line parity can progress. | Pass |
| P1 | If attach-ready provider line candidates remain zero, the gap must stay open rather than be marked complete. | Pass |

## Proof Summary

| Proof | Result | Key Result |
| --- | --- | --- |
| `cycle-TW-provider-line-source-probe.json` | Pass | Exact event has 3 match-winner candidates, 0 exact line candidates, 0 attach-ready broad target line candidates. |
| `cycle-TW-provider-line-breadth-scan.json` | Pass | 2,674 World Cup-relevant Gamma candidates, 0 provider line candidates, 0 attach-ready provider line candidates. |
| `cycle-TW-provider-match-line-availability.json` | Pass | Holiwyn route reports 3 real Polymarket Regulation Winner markets and 4 contract-fixture line markets across Spread/Totals/Team Total. |

## API/Data Dependencies

| Feature | Route/source | Contract |
| --- | --- | --- |
| Current MVP Event Detail source summary | `GET /api/mobile/events/argentina-vs-egypt/live-detail` | Returns `marketSourceSummary.regulationWinner.status=provider-backed` and `marketSourceSummary.lineMarkets.status=contract-fixture`. |
| Polymarket exact event discovery | Gamma `/events?slug=fifwc-arg-egy-2026-07-07` | Returns only match-winner markets for the current MVP match. |
| Polymarket line candidate search | Gamma `/markets?search`, `/markets?slug` | Returns no attach-ready Spread/Totals/Team Total candidates for the current MVP match. |

## Audit Result

P0 pass for source honesty and route disclosure. P1 remains open for actual provider-backed line-market parity.

Current product decision:

- Continue Local MVP with explicit backend-shaped contract fixtures for Spread/Totals/Team Total.
- Do not label those fixture rows as Polymarket-backed.
- Do not block the Home -> Event Detail -> line ticket -> fake-token order -> Portfolio/history flow on missing Polymarket line markets.
- If real Polymarket line markets appear later, attach/review them before replacing fixtures.
- If a secondary provider is approved, define/review that provider contract before marking line rows provider-backed.

## Remaining Gaps

| Gap | Priority | Status | Note |
| --- | --- | --- | --- |
| Real provider-backed Spread/Totals/Team Total current-match line markets | P1 | Open | Polymarket Gamma still exposes none for `fifwc-arg-egy-2026-07-07`. |
| Secondary line provider contract | P1 | Open | Required if Holiwyn wants real line odds before Polymarket exposes attach-ready line markets. |
| Android visible proof for any future provider-backed line replacement | P0 for that future cycle | Pending | Not applicable until a real provider-backed line source exists. |
