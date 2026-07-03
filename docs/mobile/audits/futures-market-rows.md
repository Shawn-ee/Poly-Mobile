# Futures Market Rows Polymarket Audit

Status: Cycle V P0 pass for the focused futures outcome-row scope. This does not complete full Market/Event page parity or adjustable line markets.

## Scope

- World Cup futures event/outcome rows.
- Outcome identity, volume, probability, Buy Yes, Buy No controls.
- Safe Buy Yes ticket opening from a futures row.
- Reference recovery path through Polymarket mobile web because the Android app was blocked by location verification.

Out of scope for this focused cycle:

- Full soccer match game-page line markets.
- True binary backend contract for Buy No.
- Native Polymarket signup/trading availability prompts.
- Full chart interaction parity beyond captured time-range behavior.

## Cycle V Reference Audit

Reference device:

- Samsung S23.

Polymarket app/browser:

- Chrome mobile web at Polymarket. The installed Android app showed location verification failure at cycle start.

Route or URL if available:

- `https://polymarket.com/sports/soccer`
- `https://polymarket.com/event/world-cup-winner`

Screenshots/UI hierarchy:

- `docs/mobile/reference/screenshots/cycle-V-polymarket-current.png`
- `docs/mobile/reference/screenshots/cycle-V-polymarket-current.xml`
- `docs/mobile/reference/screenshots/cycle-V-polymarket-web-soccer.png`
- `docs/mobile/reference/screenshots/cycle-V-polymarket-web-soccer.xml`
- `docs/mobile/reference/screenshots/cycle-V-polymarket-web-world-cup-winner-top.png`
- `docs/mobile/reference/screenshots/cycle-V-polymarket-web-world-cup-winner-top.xml`
- `docs/mobile/reference/screenshots/cycle-V-polymarket-web-world-cup-winner-markets-1.png`
- `docs/mobile/reference/screenshots/cycle-V-polymarket-web-world-cup-winner-markets-1.xml`
- `docs/mobile/reference/screenshots/cycle-V-polymarket-web-world-cup-winner-1d.png`
- `docs/mobile/reference/screenshots/cycle-V-polymarket-web-world-cup-winner-1d.xml`
- `docs/mobile/reference/screenshots/cycle-V-polymarket-web-world-cup-winner-markets-2.png`
- `docs/mobile/reference/screenshots/cycle-V-polymarket-web-world-cup-winner-markets-2.xml`

## Reference Behavior

| Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- |
| Open mobile web sports soccer page | World Cup/Soccer feed appears with World Cup Winner and soccer cards. Outcome buttons on feed can open trading/signup gating prompts. | Browser route changes to Polymarket mobile web; feed category state is World Cup/Soccer. | `cycle-V-polymarket-web-soccer.png` |
| Open World Cup Winner event | Event page shows title, image, link/bookmark controls, multi-outcome chart, and time range controls. | Route changes to `/event/world-cup-winner`. | `cycle-V-polymarket-web-world-cup-winner-top.png` |
| Tap chart time range | Time range control can be selected; chart remains in event context. | Active range changes visually. | `cycle-V-polymarket-web-world-cup-winner-1d.png` |
| Scroll to outcome rows | Outcome rows show country flag, outcome name, outcome volume, large probability, Buy Yes price, and Buy No price. | Scroll position moves below chart into repeated outcome rows. | `cycle-V-polymarket-web-world-cup-winner-markets-1.png`; `cycle-V-polymarket-web-world-cup-winner-markets-2.png` |
| Attempt trading action in US view-only web | Polymarket shows view-only/download-app gating. | Trading is blocked in browser, but the visible row behavior and price controls are still auditable. | `cycle-V-polymarket-web-event-card-open.png`; `cycle-V-polymarket-web-after-prompts.png` |

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| FMR-P0-01 | P0 | Futures rows show outcome identity with flag/visual marker, outcome name, and outcome-specific volume. | Tablet screenshot/XML. | Pass |
| FMR-P0-02 | P0 | Futures rows show large outcome probability separate from the trade buttons. | Tablet screenshot/XML. | Pass |
| FMR-P0-03 | P0 | Futures rows show separate Buy Yes and Buy No controls with price-like cent labels. | Tablet screenshot/XML. | Pass |
| FMR-P0-04 | P0 | Buy Yes opens the existing Holiwyn ticket with the selected future outcome preserved. | Tablet smoke proof. | Pass |
| FMR-P0-05 | P0 | The futures row proof is based on same-cycle Polymarket reference evidence. | Audit file and reference paths. | Pass |
| FMR-P1-01 | P1 | Buy No uses a true binary NO share contract rather than the current sell/no-side approximation. | Future backend/mobile contract test. | Deferred |
| FMR-P1-02 | P1 | Holiwyn futures include all top Polymarket outcomes visible in reference, including England. | Data/content audit. | Deferred |
| FMR-P2-01 | P2 | Pixel-level spacing, sticky header, and chart/time-range transitions match Polymarket more closely. | Future side-by-side visual audit. | Deferred |

## Holiwyn Implementation

Frontend components touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `FutureList()` row rendering.
- `futureOutcomeVolume()` local display helper.
- `futureOutcomeFlags` local display helper.
- Futures smoke assertions and tablet wrapper forwarding.

State transitions:

- Tapping `future-outcome-world-cup-winner-france` opens the ticket with `market=world-cup-winner`, `outcome=france`, and buy side.
- Tapping `future-outcome-no-world-cup-winner-france` opens the same outcome with sell/no-side approximation until a true binary NO contract exists.

Backend/API involvement:

- No new backend route is called by this cycle.
- The displayed row fields are derived from existing future market/outcome mock or hydrated event data.
- Future backend work should expose outcome-level volume and true binary yes/no pricing.

## Holiwyn Proof

Holiwyn device:

- Samsung tablet running Holiwyn through Expo Go.

Proof commands:

- `npm run typecheck`
- `powershell -ExecutionPolicy Bypass -File ./scripts/smoke.ps1 -Deep -FutureCardStats -Port 8191 -Device "adb-R5GYA13X7NJ-4O0ADU._adb-tls-connect._tcp" -ExpoHost "172.16.200.14"`
- `powershell -ExecutionPolicy Bypass -File ./scripts/smoke.ps1 -Deep -FutureListTrade -Port 8192 -Device "adb-R5GYA13X7NJ-4O0ADU._adb-tls-connect._tcp" -ExpoHost "172.16.200.14"`

Holiwyn evidence:

- `docs/mobile/screenshots/cycle-current-holiwyn-future-card-stats.png`
- `docs/mobile/harness/cycle-current-holiwyn-future-card-stats.xml`
- `docs/mobile/harness/cycle-current-holiwyn-future-list-trade-list.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-future-list-ticket.png`
- `docs/mobile/harness/cycle-current-holiwyn-future-list-ticket.xml`

## Audit Gate

Result:

- Pass for the Cycle V focused futures market-row scope.

Unresolved P0 gaps:

- 0 for this focused scope.

Remaining P1/P2 gaps:

- Buy No needs a true binary backend/mobile contract.
- Outcome catalog needs richer live backend content, including England in this captured reference set.
- Full World Cup event page chart/sticky-header parity remains later work.

Recommended next cycle:

- Continue Market/Event page parity with either chart time-range behavior or true adjustable line markets, depending on the next reachable Polymarket reference page.
