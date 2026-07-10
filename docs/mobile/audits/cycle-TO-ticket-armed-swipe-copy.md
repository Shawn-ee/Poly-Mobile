# Cycle TO - Trade Ticket Armed Swipe Copy

Status: passed focused tests, typecheck, and Samsung S23 source-disclosure proof.

## Scope

Local MVP retail betting flow: Event Detail line market -> Trade Ticket amount entry -> swipe-to-buy/sell readiness.

This cycle keeps the Polymarket-like full-screen ticket structure already in place and tightens the visible swipe interaction state. When the user drags the swipe control beyond the submit threshold, the ticket now changes its visible instruction from `Swipe to buy/sell` to `Release to buy/sell`, with a higher-contrast helper line. This makes the threshold state understandable before release while preserving the existing backend order submit behavior.

No order book, chat, live stats, social, backend schema, or order-route work was touched.

## Reference Behavior

Polymarket's mobile ticket uses a strong gesture-confirmation model: the user enters an amount, then drags upward into a submit region. The interaction should communicate that the user is not placing the order until the gesture crosses the threshold and is released.

## Acceptance Criteria

| Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| P0 | Swipe remains a real vertical gesture; tapping alone must not submit. | Pass | `mobile/src/components/TradeTicket.tsx`; `mobile/src/__tests__/tradeTicketSwipeMotionContract.test.ts` |
| P0 | Below threshold, release restores the ticket and does not submit. | Pass | `swipe-submit-release-below-threshold-restores` marker and existing gesture release logic. |
| P0 | Above threshold, the visible copy changes to an armed submit state before release. | Pass | `Release to buy`, `Release to sell`, `Release to submit`; focused contract test. |
| P0 | Existing fake-token/server-backed order submit behavior is preserved. | Pass | No backend/order service code changed; existing S23 source-disclosure proof reaches ticket-ready without route regressions. |
| P0 | Event Detail market page stays chart-free for Local MVP. | Pass | `mobile/src/__tests__/eventDetailChartInteractionContract.test.ts`; `mobile/src/__tests__/eventDetailChartStatusCopy.test.ts`. |
| P1 | Full submit/Portfolio proof should be rerun after the next broader Local MVP flow cycle. | Open | This proof intentionally stopped before submit. |

## Files Changed

- `mobile/src/components/TradeTicket.tsx`
- `mobile/src/localization/appCopy.ts`
- `mobile/src/__tests__/tradeTicketSwipeMotionContract.test.ts`

## Android Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Proof summary: `docs/mobile/harness/cycle-TO-ticket-armed-swipe-copy/cycle-TO-current-mvp-s23-visible-flow.json`
- Screenshots:
  - `docs/mobile/screenshots/cycle-TO-ticket-armed-swipe-copy/cycle-TO-current-mvp-home.png`
  - `docs/mobile/screenshots/cycle-TO-ticket-armed-swipe-copy/cycle-TO-current-mvp-lines.png`
  - `docs/mobile/screenshots/cycle-TO-ticket-armed-swipe-copy/cycle-TO-current-mvp-ticket-ready.png`
- XML:
  - `docs/mobile/harness/cycle-TO-ticket-armed-swipe-copy/cycle-TO-current-mvp-ticket-ready.xml`

## Validation

- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/tradeTicketSwipeMotionContract.test.ts mobile/src/__tests__/tradeTicketModeClarityContract.test.ts mobile/src/__tests__/chineseTradeTicketAmountCopy.test.ts mobile/src/__tests__/eventDetailChartInteractionContract.test.ts mobile/src/__tests__/eventDetailChartStatusCopy.test.ts mobile/src/__tests__/googleMobileAuthContract.test.ts mobile/src/__tests__/googleMobileReturnAllowlist.test.ts`
- `npm run typecheck` in `mobile`
- `npx tsc --noEmit --pretty false`
- `powershell -ExecutionPolicy Bypass -File scripts/prove_mobile_current_mvp_s23_visible_flow.ps1 -Device "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp" -Cycle TO -OutputDir "docs\mobile\screenshots\cycle-TO-ticket-armed-swipe-copy" -HierarchyOutputDir "docs\mobile\harness\cycle-TO-ticket-armed-swipe-copy" -SourceDisclosureOnly`

## Remaining Gaps

- P1: source-disclosure proof stops at ticket-ready. The next full Local MVP proof should include submit -> Portfolio/history again.
- P1: real provider-backed spread/totals/team-total current-match lines remain unavailable from Polymarket Gamma; Local MVP line rows remain explicit backend-shaped fixtures.
