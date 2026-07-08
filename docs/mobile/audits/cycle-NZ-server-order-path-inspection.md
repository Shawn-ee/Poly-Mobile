# Cycle NZ - Server Order Path Inspection

## Scope

Inspect whether the current Local MVP service can support the required retail flow:

Home -> Event Detail -> line market -> fake-token server order -> Portfolio/history.

No app/backend source code changed in this cycle.

## Findings

The service is more ready than the visible proof harness suggested.

- `/api/events` exposes current MVP event `Argentina vs. Egypt`.
- Regulation Winner is provider-backed by Polymarket.
- Spread/Totals/Team Total are contract fixtures, explicitly disclosed.
- The route proof selected `Egypt +1.5`.
- POST `/api/orders` filled successfully against seeded proof liquidity.
- `/api/portfolio` returned the filled position.
- `/api/portfolio/history` returned the recent trade.
- Selection identity was preserved through order, position, and history.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| NZ-P0-01 | P0 | Home route exposes an MVP-ready current event. | Pass |
| NZ-P0-02 | P0 | Event Detail route exposes a tradable line market with stable selection identity. | Pass |
| NZ-P0-03 | P0 | Server fake-token order can be placed and matched. | Pass |
| NZ-P0-04 | P0 | Portfolio/history preserve market/outcome/line/source/token identity. | Pass |
| NZ-P0-05 | P0 | S23 visible proof completes the same journey. | Fail |

## Evidence

- `docs/mobile/harness/cycle-NZ-server-order-path-inspection/cycle-NZ-home-to-portfolio-route-journey.json`
- `docs/mobile/harness/cycle-NZ-server-order-path-inspection/cycle-current-holiwyn-home.xml`
- `docs/mobile/harness/cycle-NZ-server-order-path-inspection/cycle-current-holiwyn-expo-menu.xml`

## Audit Gate

Partial.

Backend/service route readiness passed. Android visible order proof did not pass because the existing smoke harness still expects `EL-A Provider Breadth World Cup Live`, while the current app feed shows `Argentina vs. Egypt`.

## Next Required Work

Update the S23 full-order proof harness to target the current Local MVP feed, then rerun:

- Home
- Event Detail
- line market
- Trade Ticket
- swipe submit
- Portfolio
- history

Do not mark the full visible order journey complete until that Android proof passes.
