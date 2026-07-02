# Holiwyn Android UX Parity Audit

Date: 2026-07-02
Device: Samsung S23, `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
Apps checked: Holiwyn `com.holiwyn.mobile`, Polymarket `com.polymarket.android`

## Result

Holiwyn is installable and launches, but it is not yet close enough to Polymarket quality in the core trading UX. The biggest gap is the order ticket: Polymarket uses a purpose-built trading keypad and a swipe-up submit gesture; Holiwyn uses a long scroll form with a plain submit button that is partly covered by the Android navigation bar and did not submit during the tap test.

## Cycle Progress

### Cycle 285 - Ticket submit repair

Status: verified on Samsung S23.

- Replaced the plain bottom submit button with a sticky bottom swipe-up submit rail.
- Added "Swipe up to buy/sell" and "Final cost may vary." copy in English and Chinese.
- Kept `place-mock-order` automation identity on the submit rail so harnesses can still prove order placement.
- Compact ticket now keeps key quote metrics nearer the amount input and keeps the submit rail above the Android navigation area.
- Updated the Samsung future-list order proof to verify ticket rail, submit, Portfolio order placement, recent activity, and Account ticket default state.

Verification:

- `npm run typecheck`
- `npm run smoke:samsung:future-list-order`

Remaining: custom keypad/completion animation, search keyboard coverage, top action feedback, and portfolio row/action polish.

### Cycle 286 - Search and header feedback

Status: verified on Samsung S23.

- Added keyboard-aware Search scroll behavior, drag-to-dismiss, return-key dismissal, and a visible keyboard-dismiss control while the search field is focused.
- Added extra focused bottom padding so result cards can scroll above the keyboard area.
- Added visible feedback for `Get 50` and notification taps without enabling real deposit/withdraw behavior.

Verification:

- `npm run typecheck`
- Samsung search proof via `smoke.ps1 -Deep -SearchQuery`
- Direct Samsung UI checks for `header-action-feedback` after `Get 50` and notification taps.

Remaining: portfolio row/action polish, custom keypad/completion animation, and final parity sweep.

## Critical Fixes

| Priority | Area | Finding | Evidence | Recommendation |
| --- | --- | --- | --- | --- |
| P0 | Order ticket | Submit button is pinned behind/under the Android navigation bar area. A tap on the visible submit area did not submit. | `docs/mobile/audits/holiwyn_audit_ticket_bottom.png`, `docs/mobile/audits/holiwyn_audit_after_submit_tap.png` | Move submit control above safe-area bottom inset, add persistent sticky footer, and verify tap target is not overlapped by system navigation. |
| P0 | Order ticket | No Polymarket-like swipe-to-submit. Polymarket changes from disabled "Choose an amount" to a large bottom "Swipe to buy" affordance after amount entry. | `docs/mobile/audits/polymarket_audit_ticket.png`, `docs/mobile/audits/polymarket_audit_ticket_amount.png` | Replace plain submit with guarded swipe-up/drag submit, including disabled state, final cost warning, and completion animation. |
| P0 | Order ticket | Holiwyn ticket is a long form requiring scrolling before submit; Polymarket keeps amount entry and submit interaction in one focused screen. | `docs/mobile/audits/holiwyn_audit_ticket.png` | Redesign ticket as a compact trade surface: outcome header, Buy/Sell, amount, quick chips, quote/fees, and submit footer without hiding key controls. |
| P1 | Search | Search works, but keyboard covers bottom navigation and much of the result card until manually dismissed. | `docs/mobile/audits/holiwyn_audit_search_france.png` | Add keyboard-aware layout, auto-scroll result card above keyboard, and clear/close affordance that does not block navigation. |
| P1 | Top actions | `Get 50` and bell taps showed no visible feedback during this pass. | `docs/mobile/audits/holiwyn_audit_claim50.png`, `docs/mobile/audits/holiwyn_audit_bell.png` | Add toast/sheet/state change for claim and notifications, or hide unfinished buttons. |
| P1 | Portfolio | Portfolio is mostly static summaries; several visible cards are non-clickable, so it feels less like a trading account than Polymarket's actionable portfolio. | `docs/mobile/audits/holiwyn_audit_portfolio.xml` | Make positions/orders/activity rows tappable, add order detail/cancel/close flows, and show clear empty/loading/error states. |

## Polymarket Reference Notes

Observed Polymarket patterns:

- Home has dense sports navigation, real World Cup visual media, live badges, and a focused four-tab bottom nav: Home, Live, Portfolio, Search.
- Market cards are compact, score/event focused, and use strong price buttons near the bottom edge.
- Ticket opens as a dedicated full-screen trading surface with:
  - close button and market header,
  - Yes/No segmented control,
  - large amount display,
  - quick amount chips,
  - custom numeric keypad,
  - odds and availability line,
  - disabled "Choose an amount" state,
  - enabled "Swipe to buy" state with upward chevron and "Final cost may vary."

Holiwyn should use these as interaction references only. Do not copy Polymarket brand, art, exact copy, or assets.

## Holiwyn Working Items

- APK installs and launches.
- Home, Live, Portfolio, Search, Account tabs render and switch.
- Language toggle works visually: Chinese to English changed visible labels and the toggle label changed to Chinese.
- Search query `france` returned one matching market.
- Search result opened the France vs Argentina event detail.
- Tapping a visible outcome opened a trade ticket.

## Holiwyn Weak Or Broken Items

- Order submit P0 was repaired in Cycle 285 and verified through Samsung Portfolio order placement.
- Ticket footer P0 was repaired in Cycle 285 with a sticky submit rail above Android navigation.
- Ticket now has swipe-submit and final-cost caution; confirmation motion is still missing.
- Amount entry is still a normal text field with preset buttons, not a trading keypad.
- Search keyboard coverage was improved in Cycle 286 with dismiss controls and keyboard-aware padding; final manual keyboard QA remains useful.
- Header action feedback was repaired in Cycle 286 for `Get 50` and notifications.
- Bottom nav has five tabs while Polymarket uses four; Account may be better as a profile entry or portfolio sub-area later.
- Some icons render as generic/emoji-like symbols rather than a polished icon system.
- Accessibility/UIAutomator text is usable after fresh dumps, but earlier captures showed encoding noise; keep an eye on Chinese accessibility labels during automated testing.

## Evidence Files

Holiwyn:

- `docs/mobile/audits/holiwyn_audit_home_pull.png`
- `docs/mobile/audits/holiwyn_audit_live.png`
- `docs/mobile/audits/holiwyn_audit_portfolio.png`
- `docs/mobile/audits/holiwyn_audit_search_france.png`
- `docs/mobile/audits/holiwyn_audit_account.png`
- `docs/mobile/audits/holiwyn_audit_event_or_searchtap.png`
- `docs/mobile/audits/holiwyn_audit_ticket.png`
- `docs/mobile/audits/holiwyn_audit_ticket_bottom.png`
- `docs/mobile/audits/holiwyn_audit_after_submit_tap.png`
- `docs/mobile/audits/holiwyn_audit_language_toggle.png`
- `docs/mobile/audits/holiwyn_audit_claim50.png`
- `docs/mobile/audits/holiwyn_audit_bell.png`

Polymarket:

- `docs/mobile/audits/polymarket_audit_home.png`
- `docs/mobile/audits/polymarket_audit_ticket.png`
- `docs/mobile/audits/polymarket_audit_ticket_amount.png`

## Recommended Next Goal

Run a focused "Holiwyn Trading UX Parity" goal:

1. Rebuild the order ticket around a Polymarket-like dedicated trading surface.
2. Add swipe-up-to-submit with a disabled state until amount is valid.
3. Fix safe-area/footer overlap.
4. Add keyboard-aware search behavior.
5. Add visible feedback for `Get 50`, notifications, and saved/star actions.
6. Rerun the Samsung audit until all P0/P1 findings above are resolved.
