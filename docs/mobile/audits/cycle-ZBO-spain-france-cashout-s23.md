# Cycle ZBO - Spain vs. France Fresh S23 Cashout Proof

Scope: fresh internal tester mobile trading proof on current `main` for the backend-owned Odds API event, `Spain vs. France`.

This cycle made no source-code changes. It re-proved the real S23 runtime path after clearing Expo Go state and launching a fresh Expo bundle.

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Event: `Spain vs. France`
- Event slug: `odds-api-single-soccer-test`
- Selected market: `Total Goals 2.5`
- Selected outcome: `Over 2.5`
- Proof summary: `docs/mobile/harness/cycle-ZBO-spain-france-cashout-s23/cycle-ZBO-odds-api-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-ZBO-spain-france-cashout-s23/`

## Acceptance Results

| Requirement | Result |
| --- | --- |
| Home shows backend-owned Spain vs. France event | Pass |
| Event detail markets load from backend | Pass |
| Buy flow works | Pass |
| Portfolio position appears | Pass |
| Cash out opens close-position ticket, not buy ticket | Pass |
| Cashout Max uses owned shares only | Pass |
| Cashout ticket hides Yes/No selector | Pass |
| Wallet-sized labels such as `9,000 USDT` / `10,000 USDT` are absent from cashout ticket | Pass |
| Sell submits through backend | Pass |
| Portfolio/history updates after sell | Pass |

## Focused Validation

- Mobile close-position tests: `npx vitest run src/__tests__/positionCloseService.test.ts src/__tests__/cashoutGenericSellOnlyContract.test.ts src/__tests__/portfolioPositionTradeContract.test.ts src/__tests__/orderService.test.ts src/__tests__/api.test.ts` - pass, 50 tests.
- Mobile typecheck: `npm run typecheck` in `mobile/` - pass.
- Backend sell/oversell tests: `npx jest --runInBand src/server/services/__tests__/canonical_order_submission.phase5.test.ts src/server/services/__tests__/phase7_kalshi_model.test.ts` against isolated local `poly_test` database - pass, 36 tests.

## Remaining Gaps

- P0: none for the current internal tester cashout path.
- P1: S23 proof still uses Expo Go. A development build/APK remains the better tester runtime.
- P2: Portfolio and cashout visual polish can continue later, but it does not block local internal tester trading.
