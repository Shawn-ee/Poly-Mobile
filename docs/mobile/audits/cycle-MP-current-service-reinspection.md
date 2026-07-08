# Cycle MP - Current Service Reinspection

## Scope

Full local MVP service inspection before continuing the next development loop.

This cycle does not work on order book UI, chat, live stats, social features, backend schema, or visual polish.

## Why

The user reported that the current service does not appear ready for the mobile app: Regulation Winner looked questionable, and Spread markets did not appear to be retrieved from Polymarket.

## Inspection Result

Pass for service-state inspection.

- Backend health was reachable on `http://127.0.0.1:3002`.
- S23 was reachable as `SM-S911U1`.
- Home route returns two World Cup match events and no futures when `mobileMvpMatches=1`.
- Both inspected events expose provider-backed Regulation Winner markets.
- Both inspected events expose Spread/Totals/Team Total as backend-shaped `contract-fixture` line markets.
- Polymarket Gamma returns only three match-winner markets for each inspected provider event, and zero line markets.

## Evidence

- Route inspection: `docs/mobile/harness/cycle-MP-current-state-reinspection/cycle-MP-current-state-reinspection.json`.
- Argentina vs Egypt Gamma/route inspection: `docs/mobile/harness/cycle-MP-current-state-reinspection/cycle-MP-provider-match-line-availability-argentina-egypt.json`.
- Switzerland vs Colombia Gamma/route inspection: `docs/mobile/harness/cycle-MP-current-state-reinspection/cycle-MP-provider-match-line-availability-switzerland-colombia.json`.

## Adjusted Path

- Continue the Local MVP retail betting loop.
- Use provider-backed Regulation Winner as the real Polymarket-backed market path.
- Keep Spread/Totals/Team Total available for local MVP as explicit `Local` contract fixtures.
- Do not claim Polymarket-backed line-market parity until Gamma/CLOB exposes attach-ready line markets or another approved provider is configured.
- The next meaningful cycle should prove a provider-backed Regulation Winner ticket/order/Portfolio path on S23, because current S23 harness coverage is centered on the Local Spread line path.

## Audit Gate

Result: Pass for inspection scope.

Remaining P1:

- Real provider-backed Spread/Totals/Team Total line markets are unavailable for both inspected events.
