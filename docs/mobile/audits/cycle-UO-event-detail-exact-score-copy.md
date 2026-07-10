# Cycle UO - Event Detail Exact Score Copy

## Scope

Local MVP Event Detail / Game Lines copy cleanup.

## Reference / Product Direction

Holiwyn should keep the mobile game page readable and simple. The Exact Score section is not the highest-priority line market, but it appears inside the game-page market tabs and should not show Windows/Android mojibake such as `Â¢`.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| UO-P0-01 | P0 | Exact Score price buttons render ASCII `c` cents copy rather than a glyph that can become mojibake on Android proof paths. | Pass |
| UO-P0-02 | P0 | Event Detail source does not contain the `Â¢`/cent mojibake sequence for Exact Score rows. | Pass |
| UO-P0-03 | P0 | No backend, order routes, order book UI, chat, live stats, or social features are changed. | Pass |
| UO-P1-01 | P1 | S23 lower Game Lines / Exact Score visible proof captures the corrected copy. | Pending; no ADB device attached. |

## Implementation Notes

- Replaced Exact Score button text from a cent glyph to ASCII `c`.
- Added a focused source contract guarding the Exact Score copy.

## Validation

Pending final Cycle UO validation.

