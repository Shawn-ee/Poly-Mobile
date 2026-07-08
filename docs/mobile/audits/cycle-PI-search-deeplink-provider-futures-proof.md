# Cycle PI - Search Deep-Link Provider Futures Proof

Date: 2026-07-08

## Scope

Close the Cycle PH P1 gap where Samsung S23 Search deep-link proof did not reliably land on the provider-backed Nation of Top Goalscorer Search result surface.

This cycle does not add backend markets, order book UI, chat, live stats, social features, or cosmetic-only UI work.

## Reference / Criteria

Polymarket-backed provider data was already proven for the selected market in Cycle PH. PI focuses on Holiwyn launch/navigation behavior:

- P0: A forced Search launch with a provider-future query must stay on Search after reset.
- P0: The Search screen must show `World Cup: Nation of Top Goalscorer` for `representing Argentina`.
- P0: Tapping the result must open the provider-backed event detail page.
- P0: Event detail must preserve provider market identity for Argentina provider market `2070987`.
- P1: Home/Live stay match-only by product direction; broad futures remain Search/detail surfaces.

## Implementation

Updated `mobile/App.tsx` launch parsing so `forceSearchQuery`, `forceHomeQuery`, and `forceSearch=1` are read before reset scheduling and exempted from the delayed reset that previously returned the app to Home.

Also updated Search/Home query parsing to support the comma-separated proof-link convention already used by existing Samsung launch scripts. This avoids Android shell `&` splitting and keeps forced query state intact.

Added a source contract test at `mobile/src/__tests__/deepLinkResetContract.test.ts` to guard this reset behavior.

## Device Proof

Device:

- Samsung S23 / `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / model `SM-S911U1`

Proof route:

- Expo Go server mode on temporary port `8302`
- Backend LAN target `http://172.16.200.14:3002`
- Launch intent used comma-separated flags:
  - `forceResetState=1`
  - `forceSearch=1`
  - `forceSearchQuery=representing%20Argentina`
  - runtime API key provided through the launch URL and not committed

Evidence:

- `docs/mobile/screenshots/cycle-PI-search-deeplink-provider-futures-proof/cycle-PI-s23-search-argentina-nation.png`
- `docs/mobile/harness/cycle-PI-search-deeplink-provider-futures-proof/cycle-PI-s23-search-argentina-nation.xml`
- `docs/mobile/screenshots/cycle-PI-search-deeplink-provider-futures-proof/cycle-PI-s23-argentina-nation-detail-from-search.png`
- `docs/mobile/harness/cycle-PI-search-deeplink-provider-futures-proof/cycle-PI-s23-argentina-nation-detail-from-search.xml`
- `docs/mobile/harness/cycle-PI-search-deeplink-provider-futures-proof/cycle-PI-summary.json`

## Audit Gate

Result: Pass for PI scope.

Checked:

- S23 Search launch landed on Search, not Home.
- Search XML contained `search-world-cup-markets`.
- Search XML contained `World Cup: Nation of Top Goalscorer`.
- Search XML contained `Argentina`.
- Tapping the Search result opened Event Detail.
- Detail XML contained `event-detail-back`, `World Cup: Nation of Top Goalscorer`, and `selection-provider-market-2070987`.

Unresolved P0 gaps: 0 for PI scope.

Remaining P1:

- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.
- Home/Live remain match-only by product direction; broad futures remain Search/detail surfaces.
