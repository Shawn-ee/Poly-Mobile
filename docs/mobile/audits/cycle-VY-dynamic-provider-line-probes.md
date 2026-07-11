# Cycle VY - Dynamic Provider Line Probes

Date: 2026-07-10

## Scope

Provider/data-contract cycle for the repeated P1 gap: real Polymarket-backed current-match Spread/Totals/Team Total lines.

Included:
- Polymarket Gamma read-only provider scan.
- Dynamic current-match probe generation from Gamma event payloads when available.
- Local Holiwyn fixture-derived probe generation for current shipped MVP matches.
- Contract test for the scan harness.

Excluded:
- Mobile visible UI changes.
- Backend route/schema/order changes.
- Order book, chat, live stats, social features.
- Attaching provider markets automatically.

## Reference Audit

Provider source: Polymarket Gamma `/markets` and `/events`.

The scan checks broad World Cup line queries, tag/event payload markets, event-specific current-match line queries, and exact slug guesses where real `fifwc-...date` event slugs are known.

Cycle VY adds local fixture-derived probes for the current app matches:

- Mexico vs Ecuador
- England vs Congo DR
- Australia vs Egypt

These probes are used for Gamma search queries only. They do not generate exact slug guesses because local fixtures do not carry real Polymarket event dates.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| VY-LINE-P0-01 | P0 | Scanner must preserve the relevance gate and not attach unrelated markets as line markets. | Pass |
| VY-LINE-P0-02 | P0 | Scanner must derive provider-line probes from current app fixtures, not only hardcoded historical probes. | Pass |
| VY-LINE-P0-03 | P0 | If no attach-ready Polymarket line markets are found, the documented state must keep Local MVP line fixtures honest. | Pass |
| VY-LINE-P0-04 | P0 | Cycle must not change visible mobile UI, order logic, schema, order book, chat, or live stats. | Pass |

## Implementation

- Updated `scripts/prove_mobile_provider_line_breadth_scan.ts`.
- Added fixture-derived event probes via `buildLocalFixtureEventProbes()`.
- Added dynamic Gamma-event probe tracking and source counts.
- Added `src/__tests__/mobile.provider-line-breadth-scan.contract.test.ts`.

## Proof

- `npx jest src/__tests__/mobile.provider-line-breadth-scan.contract.test.ts --runInBand` passed.
- `npx tsc --noEmit --pretty false --incremental false` passed.
- Live provider scan passed:
  - `docs/mobile/harness/cycle-VY-dynamic-provider-line-probes/cycle-VY-provider-line-breadth-scan.json`

Key scan results:

- `staticEventSpecificProbeCount=3`
- `localFixtureEventSpecificProbeCount=3`
- `dynamicEventSpecificProbeCount=0`
- `rawSourceHits.eventSpecificSearch=396`
- `providerLineCandidateCount=0`
- `attachReadyProviderLineCandidateCount=0`
- `currentMvpInterpretation=no_attach_ready_world_cup_line_markets_found_keep_local_contract_fixtures_for_mvp`

## Audit Gate

Status: Pass for backend/provider evidence scope.

Unresolved P0: 0 for this provider scan scope.

Remaining P1:
- Real provider-backed Spread/Totals/Team Total current-match lines remain unavailable from the scanned Polymarket Gamma data.
- Contract fixtures remain the honest Local MVP line path until Polymarket exposes attach-ready lines or an approved secondary provider contract is configured.
