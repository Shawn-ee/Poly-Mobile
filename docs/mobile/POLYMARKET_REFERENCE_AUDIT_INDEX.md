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
| Game page | `docs/mobile/audits/game-page.md` | Template ready | Pending next cycle | Pending next cycle | Not run under new rule | Must cover full page, chart, tabs, market groups, ticket, chat, save/share, rules, and lower content. |
| Trade ticket | `docs/mobile/audits/trade-ticket.md` | Template ready | Pending next cycle | Pending next cycle | Not run under new rule | Must cover Buy/Sell, amount entry, odds/probability, payout/cost, line carry-through, submit/confirmation/error states. |
| Line adjustment | `docs/mobile/audits/line-adjustment.md` | Cycle Y P0 pass for focused Spreads/Totals scope | Samsung S23 / Polymarket mobile web | Samsung tablet / Holiwyn Expo Go | Pass | Focused adjustable Spreads/Totals line rail behavior and ticket carry-through. Team totals, corners, halves, and discovered line markets remain tracked. |
| Portfolio | `docs/mobile/audits/portfolio.md` | Template ready | Pending next cycle | Pending next cycle | Not run under new rule | Must cover positions, open orders, cancel, activity/history, sell/close/retrade. |
| Search | `docs/mobile/audits/search.md` | Template ready | Pending next cycle | Pending next cycle | Not run under new rule | Must cover query entry, results, empty/error, market navigation, keyboard/back behavior. |
| Account/settings | `docs/mobile/audits/account.md` | Template ready | Pending next cycle | Pending next cycle | Not run under new rule | Must cover account shell, settings, language, notifications, login entry, disabled production money features. |
| Chart behavior | `docs/mobile/audits/chart-behavior.md` | Template ready | Pending next cycle | Pending next cycle | Not run under new rule | Must cover probability movement, selected outcome state, time ranges, press/tooltip behavior, loading/empty states. |
| Market page | `docs/mobile/audits/market-page.md` | Template ready | Pending next cycle | Pending next cycle | Not run under new rule | Must cover tabs, grouped markets, expand/collapse, nested options, line selectors, liquidity/depth. |
| Event page top shell | `docs/mobile/audits/event-page-top-shell.md` | Cycle U P0 pass for focused scope | Samsung S23 / Polymarket Android app | Samsung tablet / Holiwyn Expo Go | Pass | Focused top action cluster only: Game/Chat tabs, order-book action, share action, overlay dismiss/return. Full market page remains open. |
| Futures market rows | `docs/mobile/audits/futures-market-rows.md` | Cycle V P0 pass for focused scope | Samsung S23 / Polymarket mobile web | Samsung tablet / Holiwyn Expo Go | Pass | Focused World Cup Winner futures outcome rows: flag/name/volume/probability/Buy Yes/Buy No and Buy Yes ticket carry-through. |
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
