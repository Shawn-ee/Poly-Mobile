# Cycle QK - Search Source Copy

Scope: Search result source disclosure for the Local MVP flow.

## Reference And Criteria

Polymarket reference uses user-facing provider/product language in market lists and does not expose internal test-source labels to retail users. Holiwyn Search may keep accessibility/source markers for Audit Gate proof, but visible copy and machine-readable labels should avoid `test-lines` wording.

P0 criteria:

- Search results that combine Polymarket provider markets with Holiwyn contract-shaped line markets must show Holiwyn-branded visible wording.
- The Search XML/accessibility source marker must use `source-mixed-provider-holiwyn-lines`, not `source-mixed-provider-test-lines`.
- Contract-fixture-only Search results must use `source-holiwyn-lines`, not `source-test-lines`.
- No backend route, schema, order, chat, live stats, or orderbook UI changes are introduced.
- Samsung S23 proof must show the Search screen with the updated mixed-provider source label.

P1 criteria:

- Chinese Search source text should use Holiwyn Chinese brand wording for line markets.
- Real provider-backed Spread/Totals/Team Total imports remain tracked separately and are not solved by this copy cleanup.

## Implementation

- Updated `mobile/src/components/SearchScreen.tsx` so mixed Search results show `Polymarket N / Holiwyn lines M` in English and `Polymarket N / 利云体育盘口 M` in Chinese.
- Updated Search accessibility/source markers from old `test-lines` labels to Holiwyn-branded labels.
- Added focused Search contract tests proving the old source markers are absent from the Search component.

## Audit Gate

Result: Pass for focused QK scope.

Evidence:

- S23 screenshot: `docs/mobile/screenshots/cycle-QK-search-source-copy/cycle-QK-s23-search-argentina.png`
- S23 XML: `docs/mobile/harness/cycle-QK-search-source-copy/cycle-QK-s23-search-argentina.xml`
- Proof summary: `docs/mobile/harness/cycle-QK-search-source-copy/cycle-QK-search-source-copy-proof.json`

Remaining gaps:

- P1: provider-backed line-market breadth remains incomplete for the current World Cup match set.
- P1: some non-Search Chinese source copy outside this cycle may still need a later pass.
