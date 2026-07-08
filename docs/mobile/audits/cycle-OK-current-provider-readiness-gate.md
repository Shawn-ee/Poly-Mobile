# Cycle OK - Current Provider Readiness Gate

## Scope

Inspect the current Local MVP service state before opening more UI work.

This cycle answers the service-readiness concern directly:

- Home currently returns `Argentina vs. Egypt` as the only match event.
- Regulation Winner is Polymarket-backed.
- Spread/Totals/Team Total are still local-test `contract-fixture` markets.
- Polymarket Gamma for the current provider event exposes no attach-ready line markets.

This cycle does not add orderbook UI, chat, live stats, social features, backend schema changes, or new provider attachments.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| OK-P0-01 | P0 | Current Home route returns match events only and no futures/outrights for `mobileMvpMatches=1`. | Pass |
| OK-P0-02 | P0 | Current selected match has provider-backed Regulation Winner markets. | Pass |
| OK-P0-03 | P0 | Current selected match exposes line markets only as contract fixtures when provider line markets are absent. | Pass |
| OK-P0-04 | P0 | Polymarket Gamma event for the selected match has real winner markets and zero line markets. | Pass |
| OK-P0-05 | P0 | Discovery guard rejects wrong-family line attachments instead of attaching winner/draw markets as spreads/totals. | Pass |
| OK-P0-06 | P0 | S23 visible proof shows the mixed-source/fake-token line disclosure and keeps orderbook/chat hidden. | Pass |

## Evidence

- Current-state route proof: `docs/mobile/harness/cycle-OK-current-provider-readiness-gate/cycle-OK-current-state-inspection.json`.
- Provider line availability proof: `docs/mobile/harness/cycle-OK-current-provider-readiness-gate/cycle-OK-provider-match-line-availability.json`.
- Provider discovery guard: `docs/mobile/harness/cycle-OK-current-provider-readiness-gate/cycle-OK-provider-discovery-guard.json`.
- S23 proof summary: `docs/mobile/harness/cycle-OK-current-provider-readiness-gate/cycle-OK-current-mvp-s23-visible-flow.json`.
- S23 screenshots: `docs/mobile/screenshots/cycle-OK-current-provider-readiness-gate/`.
- S23 XML: `docs/mobile/harness/cycle-OK-current-provider-readiness-gate/`.

Validation:

- Root TypeScript passed.
- Mobile TypeScript passed.
- Provider/current-state proof scripts passed.
- S23 source/readiness proof passed on Samsung S23.
- Broad configured server Vitest suite was attempted and failed because the shared local database hit parallel reset deadlocks and follow-on foreign key failures. That suite failure is not caused by this cycle's script-default change, but it is recorded as a validation limitation.

## Decision

Pass for current provider readiness inspection.

Adjusted path:

- Do not block the Local MVP on missing Optic Odds or missing Polymarket line markets.
- Use Regulation Winner as the real Polymarket-backed MVP market path.
- Keep Spread/Totals/Team Total as clearly disclosed local-test fake-token fixture lines until a provider exposes attach-ready line rows.
- Do not weaken the relevance gate to force line-market attachment.
- Next useful work should either improve the visible Local MVP user journey or implement a real provider-backed line-market source when one exists.
