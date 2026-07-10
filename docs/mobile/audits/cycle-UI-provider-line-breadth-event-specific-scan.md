# Cycle UI - Provider Line Breadth Event-Specific Scan

Status: backend/provider discovery proof pass; no visible UI change.

## Scope

Strengthen the read-only Polymarket-first provider line scan for the Local MVP line-market gap. This cycle does not attach markets, change order logic, add UI, or weaken relevance gates.

Out of scope: order book UI, chat, live stats, social/watchlist, schema migration, trade ticket changes, and secondary provider integration.

## Problem

Previous breadth scans proved generic World Cup Gamma searches did not expose attach-ready line markets. The scan still lacked event-specific probes for current MVP reference matches, so a repeated question remained: are line markets hiding behind team-specific search phrases or exact Polymarket slug patterns?

## Implementation

- Added current event probes for:
  - `fifwc-arg-egy-2026-07-07`
  - `fifwc-par-fra-2026-07-04`
  - `fifwc-bra-nor-2026-07-05`
- Added event-specific Gamma search queries for spread, handicap, totals, team totals, first half, corners, and correct score.
- Added exact slug guesses for line-family patterns such as spread, handicap, total goals, over/under, team total, team goals, first half, corners, and correct score.
- Added raw source hit counters so deduped result counts do not hide whether a source was queried and returned already-known candidates.

## Proof Result

Output: `docs/mobile/harness/cycle-UI-provider-line-breadth-event-specific-scan/cycle-UI-provider-line-breadth-scan.json`

Key result:

| Metric | Value |
| --- | --- |
| World Cup relevant candidates | 2674 |
| Raw event-specific search hits | 231 |
| Raw exact-slug hits | 0 |
| Raw event-specific line-family hits | 0 |
| Raw exact-slug line-family hits | 0 |
| Provider line candidates | 0 |
| Attach-ready provider line candidates | 0 |

Interpretation: Polymarket Gamma still exposes World Cup match-winner/futures-style markets through these probes, but not attach-ready Spread/Totals/Team Total line-family markets for the checked current MVP reference events.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| UI-P0-01 | P0 | Breadth scan includes event-specific current-match search queries. | Pass |
| UI-P0-02 | P0 | Breadth scan includes exact line slug guesses for current event slugs. | Pass |
| UI-P0-03 | P0 | Scan remains read-only and does not create or attach provider mappings. | Pass |
| UI-P0-04 | P0 | Relevance gate is not weakened; no unrelated line-like result is treated as attach-ready. | Pass |
| UI-P0-05 | P0 | Proof records raw source hit counts and raw line-family hit counts. | Pass |

## Remaining Gaps

- Real provider-backed current-match Spread/Totals/Team Total rows remain P1.
- Local MVP should continue using explicit backend-shaped contract fixtures for line-selector UX until Polymarket exposes line markets or an approved secondary provider contract is configured.

