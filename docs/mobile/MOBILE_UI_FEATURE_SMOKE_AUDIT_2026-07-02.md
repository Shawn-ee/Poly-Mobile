# Holiwyn Mobile UI Feature Smoke Audit

Date: 2026-07-02
Device: Samsung S23, `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
Target: Holiwyn through Expo Go / Samsung UI automation

## Summary

Holiwyn is usable for the core World Cup trading path: home/futures ticket entry, amount keypad, swipe submit, order confirmation, portfolio update, activity, account summary, search, event detail, props, and live market list all have working proof. The app is now much more reasonable than before the ticket parity fixes.

The remaining issues are mostly polish and QA harness stability, not total feature absence. The most important product issue is that the trade ticket is getting tall again after adding the keypad: some useful rows like balance/fee/slippage can be pushed below the first viewport, and one live-ticket proof failed because it expected `Fake balance` visible immediately.

## Resolution Update

Follow-up Cycle 289 compacted the trade ticket:
- Balance moved into the amount header.
- Slippage moved next to the main order controls.
- Cost, shares, average price, fee, implied odds, payout, and profit now use a compact stats grid.
- Swipe submit remains fixed in the footer.

Follow-up Cycle 291 stabilized Samsung smoke coverage:
- Account preferences launch wait now checks the visible Account/Preferences shell before the scrolled deep assertion checks `Ticket default`.
- `npm run smoke:samsung:tabs` now performs a repeatable Home, Live, Portfolio, Search, and Account sweep on the Samsung S23.
- Home filter and Account preferences focused proofs pass again.

## Smoke Results

| Area | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Typecheck | Pass | `npm run typecheck` during each smoke | No TypeScript errors found. |
| Futures buy order | Pass | `npm run smoke:samsung:future-list-order` | Covers Home/Futures, ticket, keypad, swipe submit, Portfolio, activity, Account summary. |
| Search query | Pass | `smoke.ps1 -Deep -SearchQuery` | Search screen renders, query flow works, result/empty state works. |
| Event detail + props | Pass | `smoke.ps1 -Deep -EventDetailProps` | Match detail renders; game lines/props switch is working. |
| Live summary | Pass | `smoke.ps1 -Deep -LiveSummary` | Live tab/list renders and shows live World Cup markets. |
| Live ticket | Pass after Cycle 289 | `smoke.ps1 -Deep -LiveTicket` | Compact ticket proof now sees balance, fee, slippage, shares, and average price. |
| Live order | Pass after Cycle 289 | `smoke.ps1 -Deep -LiveOrder` | Compact ticket still submits and reaches Portfolio with live order activity. |
| Account preferences route | Pass after Cycle 291 | `npm run smoke:samsung:account-preferences` | Launch wait is stable; scrolled deep assertion still verifies ticket defaults and fake-token mode. |
| All tabs | Pass after Cycle 291 | `npm run smoke:samsung:tabs` | Home, Live, Portfolio, Search, and Account all pass on Samsung. |
| Header actions | Pass | Direct Samsung checks from prior cycle and this pass | `Get 50` and bell now show feedback. |
| Portfolio details | Pass | Direct Samsung proof from Cycle 287 | Position detail toggle opens expanded detail panel. |

## Feature Inventory

### Header

Works:
- Holiwyn brand header is visible.
- Language toggle is present.
- `Get 50` has visible feedback.
- Notification bell has visible feedback.

Still weak:
- Header icons sometimes appear as encoded/private glyphs in UIAutomator dumps. Visual screenshots look acceptable enough for dev, but icon polish should be checked in a production APK.
- `Get 50` is only fake/demo feedback, not a real wallet action. That is correct for current scope.

### Home / Futures

Works:
- Home/Futures markets render.
- World Cup winner futures can open a ticket.
- Ticket can submit a mock/fake-token order.

Still weak:
- Market cards still feel simpler than Polymarket: less dense sports metadata, fewer visual hierarchy cues, less polished media/league presentation.

### Trade Ticket

Works:
- Buy/Sell ticket opens.
- Swipe-up submit is present.
- Final-cost warning is present.
- Numeric keypad is present.
- Preset chips and direct amount entry are present.
- Samsung proof confirms order submit reaches Portfolio.

Still weak:
- No submit completion animation yet.
- The keypad is functional but basic; it does not yet feel as polished as Polymarket's custom keypad.

Recommended next fix:
- Add a stronger submit completion animation and final visual polish pass in an APK/dev-client build.

### Search

Works:
- Search query flow passes.
- Empty/results states render.
- Keyboard-aware behavior and dismiss control were added.

Still weak:
- Manual real-keyboard validation should be repeated in a production/dev build, not only Expo Go, because Expo overlays can interfere.
- Search cards are functional but less polished than Polymarket's sports discovery UI.

### Event Detail / Props

Works:
- Event detail opens.
- Market count/outcome count are visible.
- Game lines and props render.
- Props screen smoke passes.

Still weak:
- Polymarket has a richer ticket/details hierarchy and more sports context.
- Event detail still needs a final UX sweep for spacing, sport-specific data, and live-state density.

### Live

Works:
- Live summary/list renders.
- Live markets are visible.

Still weak:
- Live order flow should be rechecked again in APK/dev-client QA after Expo Go is no longer the main proof surface.

### Portfolio

Works:
- Portfolio shows balance, counts, open positions, recent activity, latest order.
- Position detail toggle opens expanded details.
- Existing Buy/Sell/Close controls remain visible.
- Order flow updates Portfolio.

Still weak:
- A close-position smoke became brittle after adding detail toggles because content shifted vertically.
- Portfolio is more actionable now, but still not as polished as a real trading account: order detail, cancel/close confirmations, history filters, and separate tabs would help.

### Account

Works:
- Direct Account tab evidence shows signed-out state, demo balance, preferences, saved count, portfolio value, open position/order counts.

Still weak:
- Sign-in remains mock/demo only.
- Account may not deserve a full bottom tab later; Polymarket uses fewer bottom tabs.

## Testing Environment Issues

- Expo Go developer menu / element inspector can appear and pollute screenshots or block taps.
- One broad batch smoke run hung on the first home test with no progress output and had to be stopped before Cycle 291.
- Focused smoke commands plus `npm run smoke:samsung:tabs` are now the preferred path.
- Production-like QA should move toward a dev build/APK so testing is less affected by Expo Go overlays.

## Reasonableness Assessment

Reasonable enough to continue development:
- Yes. Core fake-token trading is demonstrably working on Samsung.
- Home/futures, ticket, search, event detail/props, live summary, portfolio, account, and header actions all have at least partial to strong coverage.

Not yet reasonable for a polished beta:
- Ticket layout still needs compaction.
- Live ticket/order needs a focused recheck.
- Account and home deep-link harnesses need cleanup.
- Expo Go is becoming a QA liability.
- Visual polish and icon consistency need a production-device review.

## Recommended Next Goal

Move the same Samsung proof set toward a proper APK/dev-client QA lane:

1. Produce or refresh `mobile/dist/holiwyn-preview.apk`.
2. Run `npm run check:android-apk-artifact`.
3. Run `npm run smoke:samsung:apk`.
4. Repeat the main Samsung smoke family outside Expo Go.
5. Do a final visual polish pass for ticket animation, icon rendering, and sports-card density.
