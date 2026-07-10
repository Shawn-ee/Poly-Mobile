# Cycle UN - Event Detail Chinese Source Copy

## Scope

Local MVP Event Detail copy cleanup for the Home/Live -> Event Detail -> line market -> ticket path.

## Reference / Product Direction

The current Local MVP keeps provider/source identity honest through hidden audit markers while the visible tester UI should stay simple and readable. Chinese users must not see mojibake text in the Event Detail source line when line coverage is partially provider-backed.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| UN-P0-01 | P0 | Event Detail partial-provider source copy uses valid Chinese text for `Source`, `Winner: Polymarket. Lines: Holiwyn.`, and `Holiwyn lines.` equivalents. | Pass |
| UN-P0-02 | P0 | Hidden audit markers for `line-source-partial-provider-backed`, provider counts, fixture families, and next provider action remain available. | Pass |
| UN-P0-03 | P0 | No backend, order route, order book UI, chat, live stats, or social feature behavior changes. | Pass |
| UN-P1-01 | P1 | S23 visible Chinese-language Event Detail proof captures the corrected copy. | Pending; no ADB device attached. |

## Implementation Notes

- Replaced mojibake Chinese strings in the partial-provider Event Detail source-copy branch with escaped Chinese literals.
- Added a source-contract guard so the same mojibake sequences are not reintroduced.
- The visible English Local MVP flow is unchanged.

## Validation

Pending final cycle validation.

