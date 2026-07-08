# Cycle OX - Internal Beta Trading Startup Harness

## Scope

Local MVP retail betting flow support only. This cycle closes the repeated setup gap where provider-backed fake-token trading proof depended on manually starting the backend with the correct internal beta flags and allowlisted users.

No order book UI, chat, live stats, social features, schemas, or cosmetic app UI were touched.

## Acceptance Criteria

| ID | Priority | Criterion | Result | Evidence |
| --- | --- | --- | --- | --- |
| OX-P0-01 | P0 | A repeatable command starts or verifies the local backend with internal trading beta enabled. | Pass | `cycle-OX-internal-beta-backend-start.json` |
| OX-P0-02 | P0 | The helper sets `TRADING_KILL_SWITCH=false` and keeps deposit/withdraw out of scope. | Pass | `scripts/start_holiwyn_internal_beta_backend.ps1` and startup summary notes |
| OX-P0-03 | P0 | The helper includes the system liquidity bot and mobile proof users/admins in the internal trading allowlist. | Pass | Startup summary allowlist fields |
| OX-P0-04 | P0 | The package script can run the helper for repeatable future cycles. | Pass | `cycle-OX-package-script-check.json` |
| OX-P0-05 | P0 | A provider-backed server-mode mobile order still fills after backend startup through the helper. | Pass | `cycle-OX-provider-order-after-startup.json` |
| OX-P0-06 | P0 | Portfolio/history preserve provider identity after the order. | Pass | `cycle-OX-provider-order-after-startup.json` |

## Implementation Notes

- Added `scripts/start_holiwyn_internal_beta_backend.ps1`.
- Added `npm run mobile:internal-beta-backend:start`.
- The helper starts `npm run dev -- -p 3002` with:
  - `INTERNAL_TRADING_BETA_ENABLED=true`
  - `TRADING_KILL_SWITCH=false`
  - `NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=true`
  - `INTERNAL_TRADING_ALLOWLIST_EMAILS=system-liquidity-bot@local.test,holiwyn-mobile-dev@test.local,holiwyn-bot-admin@test.local`
- `scripts/prove_mobile_provider_visible_tradable_flow.ts` now accepts `--cycle=<label>` so reused proof evidence names the active cycle correctly.

## Proof Summary

- Backend startup helper restarted the local server on port `3002` and reported healthy.
- Package script check confirmed the command path can verify the healthy backend.
- Route/mobile-service proof filled a provider-backed fake-token order against the existing local MM quote on:
  - Event: `provider-breadth-world-cup-winner`
  - Market: `Will England win the 2026 FIFA World Cup?`
  - Market id: `49ca30ca-afa9-45ee-8962-1941ad7524fe`
  - Outcome used by proof: `No`

## Audit Result

P0 pass for the internal-beta startup harness scope.

This is not a new visual UI parity pass and does not replace S23 proof for future visible UI changes. It removes the repeated backend startup blocker for later provider-backed ticket/order/portfolio cycles.

## Remaining Gaps

- P1: current-match Spread/Totals/Team Total provider-backed lines remain unavailable.
- P1: broad futures remain Search/detail surfaces while Home/Live intentionally stay match-only.
- P2: source/debug labels should remain useful for testing but less dominant in final tester UI.
