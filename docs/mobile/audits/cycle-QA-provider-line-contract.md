# Cycle QA - Provider Line Contract Action Fields

Status: P0 pass for focused provider-line readiness contract. Not complete for real provider-backed line-market parity.

Scope:

- Local MVP Event Detail provider-line readiness contract.
- Backend/mobile route fields that identify which line families are real provider-backed and which are Local MVP contract fixtures.
- Samsung S23 proof that mobile consumes the new fields without adding noisy tester-facing debug labels.
- No orderbook UI, chat, live stats, social, wallet, deposit, withdrawal, schema migration, or order route changes.

Reference/provider observation:

- Polymarket Gamma for `fifwc-arg-egy-2026-07-07` returned 3 real match-winner markets.
- The same provider event returned 0 attach-ready line markets for Spread, Totals, or Team Total.
- Holiwyn's current Local MVP line markets are therefore contract fixtures, not real Polymarket-backed line markets.

Holiwyn acceptance criteria:

| Priority | Criterion | Evidence |
| --- | --- | --- |
| P0 | Live Event Detail route must report provider-backed line-family names separately from contract-fixture line-family names. | Backend/provider proof JSON. |
| P0 | Live Event Detail route must include a machine-readable `nextProviderAction` when line markets are not provider-backed. | Backend/provider proof JSON and route contract tests. |
| P0 | Mobile types and fixtures must consume the same contract shape, not an ad hoc UI-only structure. | Typecheck and mobile adapter tests. |
| P0 | Samsung S23 proof must show the Event Detail screen still opens and carries the new provider-line markers in XML/accessibility evidence. | S23 screenshot, XML, and proof summary. |
| P0 | The visible tester UI must not become dominated by debug/source labels. | S23 screenshot review. |
| P1 | Real provider-backed Spread/Totals/Team Total markets should be discovered/imported when Polymarket or an approved line provider exposes attach-ready markets. | Future provider milestone. |
| P1 | Provider-backed line identities must be preserved through ticket, order, portfolio, and history once real line markets exist. | Future lifecycle proof. |

Implementation notes:

- `buildMobileMarketSourceSummary()` now returns `providerBackedFamilies`, `contractFixtureFamilies`, and `nextProviderAction` under `marketSourceSummary.lineMarkets.providerAvailability`.
- `EventDetail` includes hidden audit/accessibility markers for provider family names, fixture family names, and next provider action.
- `mobile/src/types.ts` and deterministic mobile fixtures now mirror the route shape.
- Existing visible copy remains calm and user-facing; this cycle does not add debug-heavy labels to the tester UI.

Audit Gate:

- Pass for the focused actionability/data-contract scope.
- P0 failed: 0.
- Remaining P1: actual provider-backed line-market breadth is still open.
- The running backend HTTP process on port 3002 was not restarted from this worktree during proof, so HTTP route proof may not expose the new fields until the service is restarted. The backend/provider proof uses the branch route handler directly.

Evidence:

- Backend/provider proof: `docs/mobile/harness/cycle-QA-provider-line-contract/cycle-QA-provider-match-line-availability.json`
- S23 proof summary: `docs/mobile/harness/cycle-QA-provider-line-contract/cycle-QA-s23-proof-summary.json`
- S23 screenshot: `docs/mobile/screenshots/cycle-QA-provider-line-contract/cycle-QA-s23-event-detail-provider-line-contract.png`
- S23 XML: `docs/mobile/harness/cycle-QA-provider-line-contract/cycle-QA-s23-event-detail-provider-line-contract.xml`
