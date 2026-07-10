# Cycle UQ - Account Balance Copy Cleanup

## Scope

Local MVP Account/Portfolio balance copy shown through the Portfolio account entry and post-trade account surfaces.

## Product Direction

The app still uses fake-token/local/server test balances internally, but the visible user-facing copy should feel like a retail trading app rather than a debug harness. Proof markers may remain hidden/accessibility-only.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| UQ-P0-01 | P0 | Visible balance label reads `Balance` / `Trading balance`, not `Demo balance`. | Pass |
| UQ-P0-02 | P0 | Visible account helper copy no longer says `Fake-token trading balance for local MVP testing`. | Pass |
| UQ-P0-03 | P0 | Visible funding/login notice no longer says `Fake-token trading is available`. | Pass |
| UQ-P0-04 | P0 | No backend routes, schemas, order logic, order book, chat, live stats, or social features are changed. | Pass |
| UQ-P1-01 | P1 | S23 Account/Portfolio visible proof confirms the cleaner copy. | Pending; no ADB device attached. |

## Implementation Notes

- Updated English and Chinese visible account/balance copy.
- Updated contracts to reject old fake-token/demo wording while preserving test/proof markers in non-visible code paths.

## Validation

Pending final Cycle UQ validation.

