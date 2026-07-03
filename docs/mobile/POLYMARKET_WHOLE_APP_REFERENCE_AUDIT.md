# Polymarket Whole-App Mobile Reference Audit

Date: 2026-07-03

Milestone: Whole-App Polymarket Mobile Parity Audit and Implementation Plan

Reference device: Samsung Galaxy S23, `SM-S911U1`, `1080x2340`, density `480`, ADB target `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.

Holiwyn comparison device: Samsung tablet, `SM-X526C`, `1440x2304`, density override `240`, ADB target `adb-R5GYA13X7NJ-4O0ADU._adb-tls-connect._tcp`.

## Evidence Set

Reference screenshots and XML are stored under:

- `docs/mobile/screenshots/whole-app-reference/`
- `docs/mobile/harness/whole-app-reference/`

Current Holiwyn tablet comparison evidence is stored under:

- `docs/mobile/screenshots/whole-app-holiwyn/`
- `docs/mobile/harness/whole-app-holiwyn/`

## Audit Findings

| Area | Polymarket action | Observed Polymarket behavior | Holiwyn current equivalent | Gap | Priority | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Home/discovery | Open app home. | Dark mobile shell with Polymarket brand, top `Get $50`, notification, horizontal sport/category rail, bottom nav, trending cards, live rows, and category carousel. | Holiwyn has brand, language, `Get 50`, notification, categories, World Cup winner card, search, filters, game cards, bottom nav. | Holiwyn is functionally close but visually less phone-native on tablet; cards are larger and more dashboard-like than Polymarket. Needs phone-first density audit and closer category carousel/card treatment. | P1 | `pm-whole-06-home-discovery.png`, `holiwyn-tablet-02-home.png` |
| World Cup category | Tap World Cup top category. | Dedicated category page has sport rail, Games/Futures tabs, hero card for World Cup stage, live/final/today sections, compact match rows. | Holiwyn World Cup is integrated into home with Games/Futures tabs and search filters. | Needs stricter World Cup category route/state matching, including hero stage card and compact final/today rows. | P1 | `pm-whole-10-world-cup-category.png`, `holiwyn-tablet-02-home.png` |
| Search | Tap Search bottom nav. | Large search input, category chips, live row cards, league sections, futures. | Holiwyn search has search input, result count, filter chips, sort chips, result cards. | Core behavior exists. Visual parity gap remains: Polymarket search is category-first with wider sport chips and mixed horizontal cards; Holiwyn is list-first. | P1 | `pm-whole-08-search-tab.png`, `holiwyn-tablet-03-search-or-account.png` |
| Live tab | Tap Live bottom nav. | Bottom nav shows live count badge; live page contains currently live markets and sports cards. | Holiwyn has a Live bottom tab and live cards in home/search. | Needs a reference-driven live page audit and tablet proof for Holiwyn Live tab. | P1 | `pm-whole-09-live-tab.png`, existing Holiwyn tab shell evidence |
| Portfolio | Tap Portfolio bottom nav while logged out. | Login/signup screen with Polymarket art, Google/Apple auth buttons, terms/privacy text, settings gear. | Holiwyn Portfolio shows fake balance, open positions, orders, recent activity, closed trades, empty position state. | Intended product difference: Holiwyn permits fake-token portfolio without real auth. Still needs P0 portfolio state proof after mock trade/open order and P1 unauth/account state criteria. | P0 | `pm-whole-07-portfolio-tab.png`, `holiwyn-tablet-04-portfolio-or-middle-tab.png` |
| Account/settings | Tap profile/settings area. | Settings gear available in portfolio/login and order book. Full settings not captured in this pass. | Holiwyn has Account tab and language toggle. | Needs later account/settings reference pass. Keep as tracked P1 until whole-app polish cycle. | P1 | `pm-whole-07-portfolio-tab.png`, Holiwyn account smoke evidence from prior cycles |
| Game page header | Open soccer game. | Back, Game/Chat segmented control with count badge, book/order/rules icon, share icon, team flags/probabilities, centered date/time. | Holiwyn game page has back, Game/Chat, badge, book, share, team flags/probabilities, centered score/time. | Core P0 mostly present. Visual gap: tablet landscape spacing differs from phone reference; share/book semantics need whole-app classification. | P0 | `pm-whole-01-current.png`, `holiwyn-tablet-01-game-page.png` |
| Chart | Scroll/interact near game chart. | Reference shows compact probability chart on game page. Prior user observation: pressing chart can expose odds movement. | Holiwyn chart renders two traces and filter chips. | P0: chart must remain non-static and filterable. P1: press/hold tooltip and odds-at-time behavior still unproven in Holiwyn and needs a dedicated smoke. | P0/P1 | `pm-whole-01-current.png`, `holiwyn-tablet-01-game-page.png` |
| Chat tab | Tap Chat in game page. | Full chat page keeps scoreboard/header, message feed, username colors, trade badges, typing indicator, input placeholder, quick reaction icons, sticky bottom team buttons. | Holiwyn previously implemented chat state; current tablet pass did not recapture it. | P0 for game page remains implemented by prior evidence, but whole-app tracker needs fresh tablet chat smoke. | P0 | `pm-whole-03-game-chat-tab.png`, prior `cycle-current-holiwyn-event-detail-chat*.png` |
| Order book | Tap book icon from game page. | Full `Order Book` screen with back, title, event subtitle, settings, Yes/No tabs, market selector, columns for price/shares/value, ask stack, spread footer. | Holiwyn book control currently shows a watchlist/save notice in prior P0 game-page proof, not a full order book. | New whole-app P0 gap: game-page book icon should open an order book or a clearly equivalent market-depth screen. | P0 | `pm-whole-04-share-sheet.png` |
| Share | Tap share icon. | Native/app share behavior not cleanly captured in this pass because the order book tap was captured instead. | Holiwyn has a dismissible share panel from prior proof. | Need fresh reference capture and tablet proof. Track as P1 because it does not block trading flow. | P1 | Reference missing; prior Holiwyn share proof |
| Market groups | Scroll game page. | Polymarket shows winner, Spread, Totals, periods, line controls, odds, probability buttons, expandable sections. | Holiwyn shows Regulation Time Winner, Spread, Totals, 1st Half Winner and more. | Core groups exist, but whole-app P0 now requires dynamic line adjustment, selected-line propagation, and richer group data proof. | P0 | `pm-whole-02-game-mid-market-list.png`, `holiwyn-tablet-01-game-page.png` |
| Trade ticket | Tap a probability button. | Bottom sheet opens with close, event/outcome title, selected line and period, filter/settings icon, large amount display, Yes/No toggle, odds/available, quick amounts, keypad, disabled submit prompt. | Holiwyn has similar numeric ticket from prior game-page proof. | P0: must prove selected line and period are carried into ticket after line adjustment on tablet. | P0 | `pm-line-04-spread-ticket-open.png`, prior `cycle-current-holiwyn-event-detail-ticket.png` |
| Line adjustment | Change spread period/line controls. | Period chips and line rail update displayed odds/probabilities; ticket title reflects selected line and period. | Holiwyn shows line pill and period chips, but data-changing behavior is not proven. | New highest-priority P0. See line adjustment audit and criteria. | P0 | `pm-line-01-spread-15-expanded.png`, `pm-line-02-spread-25-selected.png`, `pm-line-04-spread-ticket-open.png` |
| Saved/watchlist | Tap star/save controls. | Home/category cards include saved/star controls; game has book/save-like top control. | Holiwyn cards show star controls and prior game-page notice. | Needs whole-app saved-state smoke: save from card, search saved filter, persistence, unsave. | P1 | `pm-whole-10-world-cup-category.png`, `holiwyn-tablet-02-home.png` |
| Notifications | Top bell. | Polymarket home shows notification button; live tab has badge. | Holiwyn has bell button. | Needs tapped notification empty state or sheet proof. | P1 | `pm-whole-06-home-discovery.png`, `holiwyn-tablet-02-home.png` |
| Empty/loading/error | Visit logged-out portfolio and empty Holiwyn portfolio. | Polymarket portfolio requests login. | Holiwyn portfolio shows fake-balance empty positions. | Holiwyn needs standardized empty/loading/error criteria across pages. | P1 | `pm-whole-07-portfolio-tab.png`, `holiwyn-tablet-04-portfolio-or-middle-tab.png` |

## Audit Decision

The app should not advance to random implementation. The next implementation cycles must start from the P0 rows in `docs/mobile/WHOLE_APP_PARITY_GAP_TRACKER.md`, beginning with line adjustment and order-book/ticket propagation because those are core trading behaviors.
