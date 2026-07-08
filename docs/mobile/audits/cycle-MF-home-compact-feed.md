# Cycle MF - Home Compact Feed And Proof Hygiene

## Scope

Local MVP retail betting flow only:

- Home -> Event Detail -> Spread line market -> simple Buy ticket -> fake-token server-backed order -> Portfolio History.
- No order book UI, chat, live stats, social, or backend schema work.

## Inspection Finding

The previous S23 proof was not clean because the Expo developer menu was still visible over the Home page. The proof tap then landed on a Home outcome tile and opened the ticket instead of entering Event Detail. This meant the visible proof folder did not reliably prove the intended Home -> Event Detail path.

The provider/data state remains:

- Regulation Winner is provider-backed from Polymarket for `argentina-vs-egypt`.
- Spread/Totals/Team Total are backend-shaped `contract-fixture` rows because the inspected Polymarket Gamma event did not expose attach-ready line markets.
- The Local MVP path can proceed using those contract-shaped fixtures while the provider-backed line-market gap remains tracked.

## Acceptance Criteria

P0:

- Home screenshot on Samsung S23 must not show the Expo developer menu.
- Home must focus on World Cup matches and show a compact match feed, not a broad discovery/search page.
- Home must expose `home-compact-retail-feed` for harness proof.
- Home must filter out non-match futures from the Local MVP match feed.
- Tapping the match card must enter Event Detail, not accidentally open the ticket.
- Event Detail must show Game Lines and preserve line market selection into the ticket.
- Ticket submit must produce a server-backed fake-token order and Portfolio History row.
- Order book/chat/live stats must remain hidden from the Local MVP path.

P1:

- Home cards should feel closer to a retail sports market list, with less vertical bulk.
- Harness should dismiss transient Expo overlays before official screenshots.

P2:

- Continue reducing visual density differences against Polymarket after the core MVP flow is stable.

## Implementation

Changed:

- `mobile/src/components/Header.tsx`
- `mobile/src/components/HomeScreen.tsx`
- `mobile/src/components/MarketLists.tsx`
- `mobile/src/services/homeEventFeedService.ts`
- `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`

Visible changes:

- Home header, filter row, and match cards are more compact on Samsung S23.
- Home displays only the Local MVP match feed area: World Cup, Matches, and Live/Today filters.
- Futures are no longer treated as matches when the backend omits `eventType`.

Harness changes:

- The proof now dismisses Expo developer-menu overlays before official Home screenshots.
- The Home card tap targets the upper card/title area so it opens Event Detail instead of an outcome ticket.
- Home proof now explicitly fails if Expo developer-menu text is present.

## Android Proof

Device:

- `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`

Proof summary:

- `docs/mobile/harness/cycle-MF-home-compact-feed/cycle-MF-current-mvp-s23-visible-flow.json`

Screenshots:

- `docs/mobile/screenshots/cycle-MF-home-compact-feed/cycle-MF-current-mvp-home.png`
- `docs/mobile/screenshots/cycle-MF-home-compact-feed/cycle-MF-current-mvp-detail-top.png`
- `docs/mobile/screenshots/cycle-MF-home-compact-feed/cycle-MF-current-mvp-lines.png`
- `docs/mobile/screenshots/cycle-MF-home-compact-feed/cycle-MF-current-mvp-ticket-ready.png`
- `docs/mobile/screenshots/cycle-MF-home-compact-feed/cycle-MF-current-mvp-portfolio-history.png`

Result:

- Pass.

Verified assertions:

- Home shows the compact World Cup match feed.
- Event Detail opens from the match card.
- Game Lines render with Regulation Winner, Spread, and Totals.
- Spread `1.5` selection reaches the ticket.
- Swipe-to-buy reaches Portfolio.
- Filled History shows the bought Spread line trade.
- Order book/chat UI remains hidden.

## Remaining Gaps

P0:

- None for this cycle's scope.

P1:

- Real provider-backed Spread/Totals/Team Total rows remain unavailable for the inspected Polymarket event.
- Home still needs future pagination/load-more proof once more than 10 match rows exist in the route.

P2:

- Further visual tuning can continue after the MVP path is stable.
