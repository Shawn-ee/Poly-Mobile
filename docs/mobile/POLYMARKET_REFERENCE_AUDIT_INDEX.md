# Polymarket Reference Audit Index

Purpose: track every Polymarket reference audit required before Holiwyn can mark a feature, page, button, market behavior, chart, ticket flow, navigation behavior, empty state, or error state complete.

Rule: no same-cycle Polymarket audit means no parity completion claim.

## Device Standard

Reference device:

- Samsung S23 or another Android device running the real Polymarket mobile app/web experience.

Holiwyn proof device:

- Android device running Holiwyn through Expo Go, development build, or APK.
- Emulator is fallback only and must be labeled as fallback evidence.

Brand boundary:

- Match Polymarket's interaction model, information architecture, market behavior, trading flow, and UX quality.
- Keep Holiwyn branding, copy, icons, colors, data, backend, and assets original.
- Do not copy Polymarket logos, trademarks, protected text, proprietary assets, or private API behavior.

## Required Audit Fields

Every focused audit must record:

- Feature/page/function name.
- Cycle ID or branch.
- Reference device.
- Polymarket app/browser and route or URL if available.
- Holiwyn proof device.
- Screenshots and UI hierarchy paths when available.
- User actions: taps, swipes, expansions, collapses, tab switches, chart presses, line changes, ticket opens, amount changes, and settings changes.
- Resulting UI behavior.
- Visible data fields.
- Loading, empty, disabled, and error behavior.
- Animation or transition behavior if relevant.
- Market, line, ticket, portfolio, and history changes.
- All buttons and their effects.
- Gap priority: P0, P1, or P2.
- Recommended implementation changes.

## Audit Register

| Feature | Focused audit file | Status | Last reference device | Last Holiwyn device | Latest gate result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Live event detail | `docs/mobile/audits/live-event-detail.md` | Cycle AN structural live-detail pass with backend-shaped fixture data; real backend parity remains open | Samsung S23 / logged-in Polymarket Android experience | Samsung tablet / Holiwyn Expo Go | Pass for focused UI/fixture scope | Covers live World Cup list/detail observations, location gate exclusion, live score/chart/chat/outcome buttons, grouped live markets, and live ticket identity. |
| Live event detail DN super round | `docs/mobile/audits/live-event-detail-super-round-dm.md` | Cycle DM evidence audit and DN criteria ready | Samsung S23 / Polymarket Android XML plus Gamma/CLOB provider artifacts | Samsung tablet / Holiwyn Expo Go XML/screenshots from Cycles DK-DM | Criteria pass for match-winner/chart/depth/ticket identity; line-family provider parity remains P1 open | Focused criteria for chart, line selectors, orderbook/depth, Buy/Sell ticket, stale/unavailable states, and provider identity carry-through. Uses existing artifacts only; no fresh device control by Agent C. |
| Game page | `docs/mobile/audits/game-page.md` | Cycle AM focused pass for logged-in World Cup game page Player Props unavailable state after Cycle AJ/AL game-page baseline | Samsung S23 / logged-in Polymarket Android app | Samsung tablet / Holiwyn Expo Go | Pass | Covers Live tab entry, game top, chart tap, group toggle, scrolled Game Lines, compact header, sticky Game Lines/Player Props rail, Player Props unavailable state, ticket, chat, share/book, rules, and lower-page proof. |
| Trade ticket | `docs/mobile/audits/trade-ticket.md` | Cycle AI P0 pass for focused logged-in/tall ticket-surface behavior | Samsung S23 / logged-in Polymarket Android app and mobile web | Samsung tablet / Holiwyn Expo Go | Pass | Focused ticket first view, amount-to-win state, functional settings/details toggle, selected outcome carry-through, logged-in World Cup market page, tall location-verification sheet, and Holiwyn tall swipe-ready fake-token ticket surface. |
| Binary side ticket | `docs/mobile/audits/binary-side.md` | Cycle AH P0 pass for focused futures Buy No contract identity | Samsung S23 / Polymarket Android app and mobile web | Samsung tablet / Holiwyn Expo Go | Pass | Buy No is now a buy action with explicit No contract identity. Native full-page/swipe confirmation parity remains P1 follow-up. |
| Line adjustment | `docs/mobile/audits/line-adjustment.md` | Cycle Y P0 pass for focused Spreads/Totals scope | Samsung S23 / Polymarket mobile web | Samsung tablet / Holiwyn Expo Go | Pass | Focused adjustable Spreads/Totals line rail behavior and ticket carry-through. Team totals, corners, halves, and discovered line markets remain tracked. |
| Portfolio | `docs/mobile/audits/portfolio.md` | Cycle AA P0 pass for focused fake-token scope | Samsung S23 / Polymarket Android app and mobile web | Samsung tablet / Holiwyn Expo Go | Pass | Polymarket reference was location/view-only gated; Holiwyn fake-token Portfolio passed order-to-portfolio, open-order display, activity, and cancel proof. |
| Search | `docs/mobile/audits/search.md` | Cycle AB P0 pass for focused Search/Explore scope | Samsung S23 / Polymarket Android app and mobile web | Samsung tablet / Holiwyn Expo Go | Pass | Native reference was location-gated, so mobile web Search/Explore drove criteria; Holiwyn now has dense results, floating Filter, filter panel, sort, typed query support, and result navigation proof. |
| Account/settings | `docs/mobile/audits/account.md` | Cycle AC P0 pass for focused signed-out account/settings scope | Samsung S23 / Polymarket mobile web | Samsung tablet / Holiwyn Expo Go | Pass | Mobile web More drawer drove criteria; Holiwyn now has More-style settings rows, Log In/Sign Up shell, language/theme rows, fake-token balance safety, and mock login/logout proof. |
| Chart behavior | `docs/mobile/audits/chart-behavior.md` | Cycle AD P0 pass for focused chart behavior | Samsung S23 / Polymarket mobile web | Samsung tablet / Holiwyn Expo Go | Pass | Focused chart pass covers live/variable chart context, selected chart point, tap-to-tooltip equivalent, chart filters, and data-contract documentation. Backend history and direct World Cup native recapture remain tracked P1/P2. |
| Market page | `docs/mobile/audits/market-page.md` | Cycle AE P0 pass for focused market-page body switch and grouped market behavior | Samsung S23 / Polymarket mobile web | Samsung tablet / Holiwyn Expo Go | Pass | Focused pass covers Market/Live stats body switch, Game Lines/Exact Score/Halves reference, line rails, grouped cards, and row-ticket identity. Backend live stats and visual/sticky polish remain tracked. |
| Event page top shell | `docs/mobile/audits/event-page-top-shell.md` | Cycle U P0 pass for focused scope | Samsung S23 / Polymarket Android app | Samsung tablet / Holiwyn Expo Go | Pass | Focused top action cluster only: Game/Chat tabs, order-book action, share action, overlay dismiss/return. Full market page remains open. |
| Futures market rows | `docs/mobile/audits/futures-market-rows.md` | Cycle AK focused pass for logged-in futures catalog expansion | Samsung S23 / logged-in Polymarket Android experience | Samsung tablet / Holiwyn Expo Go | Pass | Covers World Cup Winner collapsed France/Argentina/Spain rows, `18 more` affordance, expanded fallback catalog, and expanded-row England ticket carry-through. |
| Futures chart range | `docs/mobile/audits/futures-chart-range.md` | Cycle W P0 pass for focused scope | Samsung S23 / Polymarket mobile web | Samsung tablet / Holiwyn Expo Go | Pass | Focused World Cup Winner chart legend, range controls, and range state taps. |
| Match market tabs/cards | `docs/mobile/audits/match-market-tabs-cards.md` | Cycle X P0 pass for focused scope | Samsung S23 / Polymarket mobile web | Samsung tablet / Holiwyn Expo Go | Pass | Focused match page market tabs, Team to Advance card, inline Order Book/Graph/About controls, Exact Score tab, and Halves tab. |
| Navigation | `docs/mobile/audits/navigation.md` | Cycle T P0 pass | Samsung S23 / Polymarket Android app | Samsung tablet / Holiwyn Expo Go | Pass | Reference shows four bottom tabs: Home, Live, Portfolio, Search; Holiwyn now matches primary bottom nav and keeps Account reachable through a header control. |

## Existing Historical Reference Files

These files remain useful background, but future completion claims must use the new same-cycle audit gate:

- `docs/mobile/POLYMARKET_GAME_PAGE_REFERENCE_AUDIT.md`
- `docs/mobile/POLYMARKET_LINE_ADJUSTMENT_REFERENCE_AUDIT.md`
- `docs/mobile/POLYMARKET_WHOLE_APP_REFERENCE_AUDIT.md`
- `docs/mobile/MOBILE_ANDROID_UX_PARITY_AUDIT_2026-07-02.md`
- `docs/mobile/MOBILE_UI_FEATURE_SMOKE_AUDIT_2026-07-02.md`
